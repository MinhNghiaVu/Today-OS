import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getFocusSessionHistory, getFocusSessionsToday } from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;
	if (!user) redirect(303, '/login');

	const [sessions, history] = await Promise.all([
		getFocusSessionsToday(locals.supabase, user.id),
		getFocusSessionHistory(locals.supabase, user.id, 14)
	]);

	return { sessions, history };
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
	},

	saveNotes: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const notes = String(form.get('notes') ?? '').trim() || null;

		if (!id) return fail(400, { error: 'Missing session id' });

		const { error } = await locals.supabase
			.from('focus_sessions')
			.update({ notes })
			.eq('id', id)
			.eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
		return { ok: true };
	}
};