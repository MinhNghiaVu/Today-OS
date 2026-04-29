import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const PUBLIC_PATHS = ['/login', '/auth'];

export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
	const { session, user } = locals;

	const isPublic = PUBLIC_PATHS.some((p) => url.pathname.startsWith(p));

	if (!session && !isPublic) {
		redirect(303, '/login');
	}

	let preferences: { theme: 'dark' | 'light'; accentIndex: number } = {
		theme: 'dark',
		accentIndex: 0
	};

	if (user) {
		const { data } = await locals.supabase
			.from('users')
			.select('preferences')
			.eq('id', user.id)
			.single();

		if (data?.preferences) preferences = data.preferences;
	}

	cookies.set('theme', preferences.theme, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });

	return { session, user, preferences };
};
