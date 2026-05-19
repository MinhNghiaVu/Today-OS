import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { applyAuthCookies, authPost } from '$lib/server/neon-auth';

export const POST: RequestHandler = async ({ cookies, request, url }) => {
	const response = await authPost('sign-out', {}, url.origin, request.headers.get('cookie'));
	applyAuthCookies(cookies, response.headers);
	redirect(303, '/login');
};
