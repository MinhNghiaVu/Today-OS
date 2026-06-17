import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getFocusSessionHistory, getFocusSessionsToday } from '$lib/db';
import { noteTitleFromContent } from '$lib/utils/capture';

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

		if (!notes) {
			const { error } = await locals.supabase
				.from('focus_sessions')
				.update({ notes: null, note_id: null })
				.eq('id', id)
				.eq('user_id', user.id);
			if (error) return fail(500, { error: error.message });
			return { ok: true };
		}

		const today = new Date().toISOString().slice(0, 10);
		const title = noteTitleFromContent(notes);

		// Check if a note already exists for this session
		const { data: session } = await locals.supabase
			.from('focus_sessions')
			.select('note_id')
			.eq('id', id)
			.eq('user_id', user.id)
			.single();

		let noteId: string;

		if (session?.note_id) {
			// Update existing note
			const { error: noteError } = await locals.supabase
				.from('notes')
				.update({ title, content: notes, updated_at: new Date().toISOString() })
				.eq('id', session.note_id)
				.eq('user_id', user.id);
			if (noteError) return fail(500, { error: noteError.message });
			noteId = session.note_id;
		} else {
			// Create a Note row
			const { data: note, error: noteError } = await locals.supabase
				.from('notes')
				.insert({ user_id: user.id, title, content: notes, date: today, type: 'note' })
				.select('id')
				.single();
			if (noteError) return fail(500, { error: noteError.message });
			noteId = note.id;
		}

		// Update the focus session with notes text + link to the note
		const { error } = await locals.supabase
			.from('focus_sessions')
			.update({ notes, note_id: noteId })
			.eq('id', id)
			.eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
		return { ok: true };
	}
};