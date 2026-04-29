import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) redirect(303, '/login');

	const redirectTo = `${url.origin}/auth/callback`;
	const { data, error } = await locals.supabase.auth.signInWithOAuth({
		provider: 'google',
		options: {
			redirectTo,
			scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
			queryParams: { access_type: 'offline', prompt: 'consent' }
		}
	});

	if (error) redirect(303, '/today');
	redirect(303, data.url);
};
