import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.session) redirect(303, '/today');
};

export const actions: Actions = {
	googleLogin: async ({ locals, url }) => {
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
	},

	signIn: async ({ locals, request }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim();
		const password = String(formData.get('password') ?? '');

		if (!email || !password) return fail(400, { error: 'Email and password are required.' });

		const { error } = await locals.supabase.auth.signInWithPassword({ email, password });

		if (error) return fail(401, { error: error.message });

		redirect(303, '/today');
	},

	signUp: async ({ locals, request }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim();
		const password = String(formData.get('password') ?? '');

		if (!email || !password) return fail(400, { error: 'Email and password are required.' });
		if (password.length < 8) return fail(400, { error: 'Password must be at least 8 characters.' });

		const { error } = await locals.supabase.auth.signUp({ email, password });

		if (error) return fail(400, { error: error.message });

		return { success: true, message: 'Check your email to confirm your account.' };
	}
};
