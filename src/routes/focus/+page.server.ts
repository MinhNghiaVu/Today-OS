import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getFocusSessionHistory, getFocusSessionsToday } from '$lib/db';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { user } = locals;
	if (!user) redirect(303, '/login');

	const [sessions, history] = await Promise.all([
		getFocusSessionsToday(locals.supabase, user.id),
		getFocusSessionHistory(locals.supabase, user.id, 14)
	]);

	// If a todo_id is in the URL, fetch the todo title
	const todoId = url.searchParams.get('todo');
	let focusedTodo: { id: string; title: string } | null = null;
	if (todoId) {
		const { data } = await locals.supabase
			.from('todos')
			.select('id, title')
			.eq('id', todoId)
			.eq('user_id', user.id)
			.single();
		if (data) focusedTodo = data;
	}

	return { sessions, history, focusedTodo };
};

export const actions: Actions = {
	complete: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const durationSeconds = parseInt(form.get('duration_seconds') as string, 10);
		const type = form.get('type') as string;
		const todoId = (form.get('todo_id') as string) || null;

		if (!durationSeconds || !['focus', 'break'].includes(type)) {
			return fail(400, { error: 'Invalid session data' });
		}

		const { error } = await locals.supabase.from('focus_sessions').insert({
			user_id: user.id,
			duration_seconds: durationSeconds,
			type,
			todo_id: todoId
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