import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const PUBLIC_PATHS = ['/login', '/auth'];
const THEMES = new Set(['dark', 'light']);

export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
	const { session, user } = locals;

	const isPublic = PUBLIC_PATHS.some((p) => url.pathname.startsWith(p));

	if (!user && !isPublic) {
		redirect(303, '/login');
	}

	let preferences: { theme: 'dark' | 'light'; accentIndex: number } = {
		theme: 'dark',
		accentIndex: 0
	};
	const cookieTheme = cookies.get('theme');
	const cookieAccentIndex = Number(cookies.get('accentIndex'));
	const hasCookiePreferences = THEMES.has(cookieTheme ?? '') && Number.isInteger(cookieAccentIndex);

	if (hasCookiePreferences) {
		preferences = {
			theme: cookieTheme as 'dark' | 'light',
			accentIndex: cookieAccentIndex
		};
	} else if (user) {
		const { data } = await locals.supabase
			.from('users')
			.select('preferences')
			.eq('id', user.id)
			.single();

		if (data?.preferences) preferences = data.preferences;
	}

	cookies.set('theme', preferences.theme, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
	cookies.set('accentIndex', String(preferences.accentIndex), {
		path: '/',
		maxAge: 60 * 60 * 24 * 365,
		sameSite: 'lax'
	});

	return { session, user, preferences };
};
