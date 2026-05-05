import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookies) => {
				cookies.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: options.path ?? '/' });
				});
			}
		}
	});

	const {
		data: { session }
	} = await event.locals.supabase.auth.getSession();

	const { data: claimsResult } = session ? await event.locals.supabase.auth.getClaims() : { data: null };
	const claims = claimsResult?.claims;
	const user = claims?.sub
		? {
				id: claims.sub,
				email: typeof claims.email === 'string' ? claims.email : session?.user.email
			}
		: null;

	event.locals.user = user;
	event.locals.session = session;

	return resolve(event);
};
