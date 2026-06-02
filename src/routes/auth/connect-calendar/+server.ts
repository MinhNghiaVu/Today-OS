import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { beginGoogleCalendarLink } from '$lib/server/google-calendar-auth';
import { applyAuthCookies, logAuthFailure } from '$lib/server/neon-auth';

export const GET: RequestHandler = async ({ cookies, locals, request, url }) => {
	if (!locals.user) redirect(303, '/login');

	const response = await beginGoogleCalendarLink({
		cookieHeader: request.headers.get('cookie'),
		origin: url.origin
	});
	applyAuthCookies(cookies, response.headers);

	const location = response.headers.get('location');
	const json = await response.clone().json().catch(() => null);
	if (!response.ok && !location && !json?.url) {
		const message = json?.error?.message ?? json?.error ?? json?.message ?? 'Could not connect Google Calendar.';
		logAuthFailure('link-social', url.origin, response.status, message);
	}
	redirect(303, location ?? json?.url ?? '/today');
};
