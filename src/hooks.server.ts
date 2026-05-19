import type { Handle } from '@sveltejs/kit';
import { applyAuthCookies, fetchSession } from '$lib/server/neon-auth';
import { createDbClient, ensureUser } from '$lib/server/neon-client';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createDbClient();

	const { session, user, headers } = await fetchSession(
		event.request.headers.get('cookie'),
		event.url.origin
	);

	applyAuthCookies(event.cookies, headers);

	event.locals.user = user;
	event.locals.session = session;

	if (user) await ensureUser(user);

	return resolve(event);
};
