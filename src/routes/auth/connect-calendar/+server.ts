import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { applyAuthCookies, authPost } from '$lib/server/neon-auth';

export const GET: RequestHandler = async ({ cookies, locals, request, url }) => {
	if (!locals.user) redirect(303, '/login');

	const response = await authPost('sign-in/social', {
		provider: 'google',
		callbackURL: '/today',
		scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar.readonly']
	}, url.origin, request.headers.get('cookie'));
	applyAuthCookies(cookies, response.headers);

	const location = response.headers.get('location');
	const json = await response.clone().json().catch(() => null);
	redirect(303, location ?? json?.url ?? '/today');
};
