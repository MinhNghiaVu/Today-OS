import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getTodosToday, getHabitSummariesToday, getNotesForDate } from '$lib/db';
import { getEventsForDate, type CalendarEvent } from '$lib/google-calendar';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;
	if (!user) redirect(303, '/login');

	const today = new Date().toISOString().slice(0, 10);

	const [todosToday, habitTotals, notesToday, tokenRow] = await Promise.all([
		getTodosToday(locals.supabase, user.id),
		getHabitSummariesToday(locals.supabase, user.id),
		getNotesForDate(locals.supabase, user.id, today),
		locals.supabase
			.from('users')
			.select('google_access_token, google_token_expiry')
			.eq('id', user.id)
			.single()
	]);

	const token = tokenRow.data?.google_access_token ?? null;
	const expiry = tokenRow.data?.google_token_expiry ?? null;

	let calendarState: 'ok' | 'disconnected' | 'expired' = 'disconnected';
	if (token) {
		calendarState = expiry && new Date(expiry) < new Date() ? 'expired' : 'ok';
	}

	const calendarEvents: Promise<CalendarEvent[]> =
		calendarState === 'ok'
			? getEventsForDate(token!, today).catch(() => [])
			: Promise.resolve([]);

	return { todosToday, habitTotals, notesToday, calendarState, calendarEvents };
};

export const actions: Actions = {
	addTodo: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const title = (form.get('title') as string)?.trim();
		if (!title) return fail(400, { error: 'Title required' });

		const today = new Date().toISOString().slice(0, 10);
		const { error } = await locals.supabase
			.from('todos')
			.insert({ user_id: user.id, title, due_date: today });

		if (error) return fail(500, { error: error.message });
	},

	toggleTodo: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const id = form.get('id') as string;
		const currentStatus = form.get('status') as string;

		const nowDone = currentStatus !== 'done';
		const { error } = await locals.supabase
			.from('todos')
			.update({
				status: nowDone ? 'done' : 'pending',
				completed_at: nowDone ? new Date().toISOString() : null
			})
			.eq('id', id)
			.eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
	},

	updateTodo: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const id = form.get('id') as string;
		const title = (form.get('title') as string)?.trim();
		const due_date = (form.get('due_date') as string) || null;
		const priority = (form.get('priority') as string) || null;

		if (!id || !title) return fail(400, { error: 'Missing fields' });

		const { error } = await locals.supabase
			.from('todos')
			.update({ title, due_date, priority })
			.eq('id', id)
			.eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
	},

	removeTodo: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const id = form.get('id') as string;

		const { error } = await locals.supabase
			.from('todos')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
	},

	logHabit: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const habit_id = form.get('habit_id') as string;
		const valueRaw = form.get('value') as string;
		const value = parseFloat(valueRaw);

		if (!habit_id || isNaN(value) || value <= 0) return fail(400, { error: 'Invalid log' });

		const { data: habit, error: habitError } = await locals.supabase
			.from('habit_definitions')
			.select('id')
			.eq('id', habit_id)
			.eq('user_id', user.id)
			.single();

		if (habitError || !habit) return fail(404, { error: 'Habit not found' });

		const today = new Date().toISOString().slice(0, 10);
		const { error } = await locals.supabase
			.from('habit_logs')
			.insert({ user_id: user.id, habit_id, date: today, value });

		if (error) return fail(500, { error: error.message });
	},

	updateHabitLog: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const id = form.get('id') as string;
		const valueRaw = form.get('value') as string;
		const value = parseFloat(valueRaw);

		if (!id || isNaN(value) || value <= 0) return fail(400, { error: 'Invalid log value' });

		const { error } = await locals.supabase
			.from('habit_logs')
			.update({ value })
			.eq('id', id)
			.eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
	},

	removeHabitLog: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const id = form.get('id') as string;

		if (!id) return fail(400, { error: 'Missing log' });

		const { error } = await locals.supabase
			.from('habit_logs')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
	},

	addNote: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const content = (form.get('content') as string)?.trim();

		if (!content) return fail(400, { error: 'Write something first' });

		const today = new Date().toISOString().slice(0, 10);
		const firstLine = content.split('\n').find(Boolean)?.trim() ?? 'Quick note';
		const title = firstLine.length > 60 ? `${firstLine.slice(0, 57)}...` : firstLine;

		const { error } = await locals.supabase
			.from('notes')
			.insert({ user_id: user.id, title, content, date: today, type: 'note' });

		if (error) return fail(500, { error: error.message });
	}
};
