import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { applyAuthCookies, authErrorMessage, authPost, logAuthFailure } from '$lib/server/neon-auth';

const PASSWORD_REQUIREMENTS = [
	{ test: (password: string) => password.length >= 8, message: 'Password must be at least 8 characters.' },
	{ test: (password: string) => /[A-Z]/.test(password), message: 'Password must include at least one capital letter.' },
	{ test: (password: string) => /\d/.test(password), message: 'Password must include at least one number.' },
	{ test: (password: string) => /[^A-Za-z0-9]/.test(password), message: 'Password must include at least one special character.' }
];

function passwordError(password: string) {
	return PASSWORD_REQUIREMENTS.find((requirement) => !requirement.test(password))?.message ?? null;
}

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.session) redirect(303, '/today');
};

export const actions: Actions = {
	googleLogin: async ({ cookies, request, url }) => {
		const response = await authPost('sign-in/social', {
			provider: 'google',
			callbackURL: `${url.origin}/today`,
			scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar.readonly']
		}, url.origin, request.headers.get('cookie'));
		applyAuthCookies(cookies, response.headers);

		const location = response.headers.get('location');
		const json = await response.clone().json().catch(() => null);
		if (!response.ok && !location && !json?.url) {
			const message = json?.error?.message ?? json?.error ?? json?.message ?? 'Could not start Google sign-in.';
			logAuthFailure('sign-in/social', url.origin, response.status, message);
			return fail(500, { error: message });
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
			const message = await authErrorMessage(response, 'Invalid email or password.');
			logAuthFailure('sign-in/email', url.origin, response.status, message);
			return fail(401, { error: message });
		}

		redirect(303, '/today');
	},

	signUp: async ({ cookies, request, url }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim();
		const password = String(formData.get('password') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');

		if (!email || !password || !confirmPassword) return fail(400, { error: 'Email, password, and confirm password are required.' });
		const invalidPassword = passwordError(password);
		if (invalidPassword) return fail(400, { error: invalidPassword });
		if (password !== confirmPassword) return fail(400, { error: 'Passwords do not match.' });

		const response = await authPost('sign-up/email', { email, password, name: email }, url.origin, null);
		applyAuthCookies(cookies, response.headers);

		if (!response.ok) {
			const message = await authErrorMessage(response, 'Could not create account.');
			logAuthFailure('sign-up/email', url.origin, response.status, message);
			return fail(400, { error: message });
		}

		return { success: true, message: 'Account created. You can sign in now.' };
	}
};
