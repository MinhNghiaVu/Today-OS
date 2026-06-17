import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getFocusSessionsToday } from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;
	if (!user) redirect(303, '/login');

	const sessions = await getFocusSessionsToday(locals.supabase, user.id);
	return { sessions };
};

export const actions: Actions = {
	complete: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const durationSeconds = parseInt(form.get('duration_seconds') as string, 10);
		const type = form.get('type') as string;

		if (!durationSeconds || !['focus', 'break'].includes(type)) {
			return fail(400, { error: 'Invalid session data' });
		}

		const { error } = await locals.supabase.from('focus_sessions').insert({
			user_id: user.id,
			duration_seconds: durationSeconds,
			type
		});

		if (error) return fail(500, { error: error.message });
	}
};