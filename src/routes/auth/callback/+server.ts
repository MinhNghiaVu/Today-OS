import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');

	if (!code) error(400, 'No authorization code');

	const { data, error: exchangeError } = await locals.supabase.auth.exchangeCodeForSession(code);

	if (exchangeError) error(400, exchangeError.message);

	const { session } = data;
	if (session?.provider_token && session.user) {
		const expiry = new Date(Date.now() + 55 * 60 * 1000).toISOString();
		await locals.supabase
			.from('users')
			.update({
				google_access_token: session.provider_token,
				...(session.provider_refresh_token
					? { google_refresh_token: session.provider_refresh_token }
					: {}),
				google_token_expiry: expiry
			})
			.eq('id', session.user.id);
	}

	redirect(303, '/today');
};
