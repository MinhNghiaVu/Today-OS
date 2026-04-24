import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');

	if (!code) error(400, 'No authorization code');

	const { error: exchangeError } = await locals.supabase.auth.exchangeCodeForSession(code);

	if (exchangeError) error(400, exchangeError.message);

	redirect(303, '/today');
};
