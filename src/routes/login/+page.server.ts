import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { applyAuthCookies, authPost } from '$lib/server/neon-auth';

async function authErrorMessage(response: Response, fallback: string) {
	const json = await response.clone().json().catch(() => null);
	return json?.error?.message ?? json?.error ?? json?.message ?? fallback;
}

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.session) redirect(303, '/today');
};

export const actions: Actions = {
	googleLogin: async ({ cookies, request, url }) => {
		const response = await authPost('sign-in/social', {
			provider: 'google',
			callbackURL: '/today',
			scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar.readonly']
		}, url.origin, request.headers.get('cookie'));
		applyAuthCookies(cookies, response.headers);

		const location = response.headers.get('location');
		const json = await response.clone().json().catch(() => null);
		if (!response.ok && !location && !json?.url) {
			return fail(500, { error: json?.error?.message ?? json?.error ?? json?.message ?? 'Could not start Google sign-in.' });
		}
		redirect(303, location ?? json?.url ?? '/today');
	},

	signIn: async ({ cookies, request, url }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim();
		const password = String(formData.get('password') ?? '');

		if (!email || !password) return fail(400, { error: 'Email and password are required.' });

		const response = await authPost('sign-in/email', { email, password }, url.origin, null);
		applyAuthCookies(cookies, response.headers);

		if (!response.ok) {
			return fail(401, { error: await authErrorMessage(response, 'Invalid email or password.') });
		}

		redirect(303, '/today');
	},

	signUp: async ({ cookies, request, url }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim();
		const password = String(formData.get('password') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');

		if (!email || !password || !confirmPassword) return fail(400, { error: 'Email, password, and confirm password are required.' });
		if (password.length < 8) return fail(400, { error: 'Password must be at least 8 characters.' });
		if (password !== confirmPassword) return fail(400, { error: 'Passwords do not match.' });

		const response = await authPost('sign-up/email', { email, password, name: email }, url.origin, null);
		applyAuthCookies(cookies, response.headers);

		if (!response.ok) {
			return fail(400, { error: await authErrorMessage(response, 'Could not create account.') });
		}

		return { success: true, message: 'Account created. You can sign in now.' };
	}
};
