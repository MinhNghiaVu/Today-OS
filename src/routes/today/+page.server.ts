import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getTodosToday, getHabitSummariesToday, getNotesForDate } from '$lib/db';
import { getEventsForDate, type CalendarEvent } from '$lib/google-calendar';
import { logHabitToday, removeHabitLog, updateHabitLog } from '$lib/server/habit-actions';
import {
	addTodoAction,
	removeTodoAction,
	toggleTodoAction,
	updateTodoAction
} from '$lib/server/todo-actions';

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
		const today = new Date().toISOString().slice(0, 10);
		return addTodoAction({
			request,
			supabase: locals.supabase,
			userId: locals.user?.id,
			defaultDueDate: today
		});
	},

	toggleTodo: async ({ locals, request }) => {
		return toggleTodoAction({ request, supabase: locals.supabase, userId: locals.user?.id });
	},

	updateTodo: async ({ locals, request }) => {
		return updateTodoAction({ request, supabase: locals.supabase, userId: locals.user?.id });
	},

	removeTodo: async ({ locals, request }) => {
		return removeTodoAction({ request, supabase: locals.supabase, userId: locals.user?.id });
	},

	logHabit: async ({ locals, request }) => {
		return logHabitToday({ request, supabase: locals.supabase, userId: locals.user?.id });
	},

	updateHabitLog: async ({ locals, request }) => {
		return updateHabitLog({ request, supabase: locals.supabase, userId: locals.user?.id });
	},

	removeHabitLog: async ({ locals, request }) => {
		return removeHabitLog({ request, supabase: locals.supabase, userId: locals.user?.id });
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
