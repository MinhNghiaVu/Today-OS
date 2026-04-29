import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.session) redirect(303, '/today');
};

export const actions: Actions = {
	login: async ({ locals, url }) => {
		const redirectTo = `${url.origin}/auth/callback`;

		const { data, error } = await locals.supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo,
				scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
				queryParams: { access_type: 'offline', prompt: 'consent' }
			}
		});

		if (error) return fail(500, { error: error.message });

		redirect(303, data.url);
	}
};
