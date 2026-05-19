import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const COOKIE_PREFIX = '__Secure-neon-auth';

export interface AuthUser {
	id: string;
	email?: string;
}

export interface AuthSession {
	user?: AuthUser;
	token?: string;
}

function authBaseUrl() {
	const baseUrl = env.NEON_AUTH_BASE_URL ?? env.VITE_NEON_AUTH_URL;
	if (!baseUrl) throw new Error('NEON_AUTH_BASE_URL or VITE_NEON_AUTH_URL is not configured.');
	return baseUrl.replace(/\/$/, '');
}

function authServiceOrigin() {
	return new URL(authBaseUrl()).origin;
}

function neonCookieHeader(cookieHeader: string | null) {
	if (!cookieHeader) return '';
	return cookieHeader
		.split(';')
		.map((cookie) => cookie.trim())
		.filter((cookie) => cookie.startsWith(COOKIE_PREFIX))
		.join('; ');
}

function setNeonCookieHeader(headers: Headers, cookieHeader: string | null) {
	const cookies = neonCookieHeader(cookieHeader);
	if (cookies) headers.set('cookie', cookies);
}

function getSetCookie(headers: Headers) {
	const withGetter = headers as Headers & { getSetCookie?: () => string[] };
	const values = withGetter.getSetCookie?.();
	if (values?.length) return values;
	const single = headers.get('set-cookie');
	return single ? [single] : [];
}

function decodeCookieValue(value: string) {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

function parseSetCookie(header: string) {
	const [nameValue, ...attrs] = header.split(';').map((part) => part.trim());
	const separator = nameValue.indexOf('=');
	if (separator === -1) return null;
	const name = nameValue.slice(0, separator);
	const value = decodeCookieValue(nameValue.slice(separator + 1));
	const options: Parameters<Cookies['set']>[2] = {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'strict'
	};

	for (const attr of attrs) {
		const [rawKey, ...rawValue] = attr.split('=');
		const key = rawKey.toLowerCase();
		const attrValue = rawValue.join('=');
		if (key === 'path' && attrValue) options.path = attrValue;
		if (key === 'max-age' && attrValue) options.maxAge = Number(attrValue);
		if (key === 'expires' && attrValue) options.expires = new Date(attrValue);
		if (key === 'samesite' && attrValue) {
			const sameSite = attrValue.toLowerCase();
			if (sameSite === 'lax' || sameSite === 'strict' || sameSite === 'none') options.sameSite = sameSite;
		}
		if (key === 'httponly') options.httpOnly = true;
		if (key === 'secure') options.secure = true;
	}

	return { name, value, options };
}

export function applyAuthCookies(cookies: Cookies, headers: Headers) {
	for (const header of getSetCookie(headers)) {
		const parsed = parseSetCookie(header);
		if (parsed && parsed.name.startsWith(COOKIE_PREFIX)) {
			cookies.set(parsed.name, parsed.value, parsed.options);
		}
	}
}

export async function proxyAuthRequest(request: Request, path: string) {
	const upstream = new URL(`${authBaseUrl()}/${path}`);
	upstream.search = new URL(request.url).search;

	const headers = new Headers();
	for (const header of ['user-agent', 'authorization', 'referer', 'content-type']) {
		const value = request.headers.get(header);
		if (value) headers.set(header, value);
	}
	headers.set(
		'origin',
		request.headers.get('origin') ?? request.headers.get('referer')?.split('/').slice(0, 3).join('/') ?? new URL(request.url).origin
	);
	setNeonCookieHeader(headers, request.headers.get('cookie'));
	headers.set('x-neon-auth-middleware', 'true');

	const response = await fetch(upstream, {
		method: request.method,
		headers,
		body: request.body ? await request.text() : undefined,
		redirect: 'manual'
	});

	const responseHeaders = new Headers();
	for (const header of ['content-type', 'location', 'set-auth-jwt', 'set-auth-token']) {
		const value = response.headers.get(header);
		if (value) responseHeaders.set(header, value);
	}
	for (const header of getSetCookie(response.headers)) responseHeaders.append('set-cookie', header);

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: responseHeaders
	});
}

export async function fetchSession(cookieHeader: string | null, origin: string) {
	const headers = new Headers({
		'x-neon-auth-middleware': 'true'
	});
	setNeonCookieHeader(headers, cookieHeader);

	const response = await fetch(`${authBaseUrl()}/get-session`, {
		method: 'GET',
		headers
	});
	const json = response.ok ? await response.json().catch(() => null) : null;
	const session = json?.session ?? null;
	const user = json?.user ?? session?.user ?? null;
	return {
		session,
		user: user?.id ? { id: String(user.id), email: user.email ? String(user.email) : undefined } : null,
		headers: response.headers
	};
}

export async function authPost(path: string, body: Record<string, unknown>, origin: string, cookieHeader: string | null) {
	const headers = new Headers({
		'content-type': 'application/json',
		origin: authServiceOrigin(),
		'x-neon-auth-middleware': 'true'
	});
	setNeonCookieHeader(headers, cookieHeader);

	return fetch(`${authBaseUrl()}/${path}`, {
		method: 'POST',
		headers,
		body: JSON.stringify(body),
		redirect: 'manual'
	});
}

export async function authErrorMessage(response: Response, fallback: string) {
	const json = await response.clone().json().catch(() => null);
	return json?.error?.message ?? json?.error ?? json?.message ?? fallback;
}

export function logAuthFailure(path: string, origin: string, status: number, message: string) {
	console.warn('Neon Auth request failed', {
		path,
		appOrigin: origin,
		status,
		message
	});
}
