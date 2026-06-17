import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getTodosToday, getHabitSummariesToday, getNotesForDate } from '$lib/db';
import { getEventsForDate } from '$lib/google-calendar';
import { getGoogleCalendarAccessToken } from '$lib/server/google-calendar-auth';
import { logHabit, removeHabitLog, updateHabitLog } from '$lib/server/habit-actions';
import { noteTitleFromContent } from '$lib/utils/capture';
import {
	addTodoAction,
	removeTodoAction,
	toggleTodoAction,
	updateTodoAction
} from '$lib/server/todo-actions';
import type { CalendarEvent } from '$lib/types';

export const load: PageServerLoad = async ({ locals, request, url }) => {
	const { user } = locals;
	if (!user) redirect(303, '/login');

	const today = new Date().toISOString().slice(0, 10);

	const [todosToday, habitTotals, notesToday, calendarAuth] = await Promise.all([
		getTodosToday(locals.supabase, user.id),
		getHabitSummariesToday(locals.supabase, user.id),
		getNotesForDate(locals.supabase, user.id, today),
		getGoogleCalendarAccessToken({
			cookieHeader: request.headers.get('cookie'),
			origin: url.origin,
			userId: user.id
		})
	]);

	const calendarEvents: Promise<CalendarEvent[]> =
		calendarAuth.state === 'ok'
			? getEventsForDate(calendarAuth.accessToken!, today)
			: Promise.resolve([]);

	return { todosToday, habitTotals, notesToday, calendarState: calendarAuth.state, calendarEvents };
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

	toggleFocus: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const focused = String(form.get('today_focus') ?? '') === 'true';

		const { data: existing } = await locals.supabase
			.from('todos')
			.select('id')
			.eq('user_id', user.id)
			.eq('today_focus', true);

		const currentCount = (existing ?? []).length;
		if (focused && currentCount >= 3) return fail(400, { error: 'Max 3 daily priorities.' });

		const nextOrder = focused ? (currentCount + 1) : null;

		const { error } = await locals.supabase
			.from('todos')
			.update({ today_focus: focused, focus_order: focused ? nextOrder : null })
			.eq('id', id)
			.eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
		return { ok: true };
	},

	reorderFocus: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);
		const form = await request.formData();
		const ids = (String(form.get('ids') ?? '')).split(',').filter(Boolean);
		if (ids.length === 0) return fail(400);

		for (let i = 0; i < ids.length; i++) {
			await locals.supabase
				.from('todos')
				.update({ focus_order: i + 1 })
				.eq('id', ids[i])
				.eq('user_id', user.id);
		}
		return { ok: true };
	},

	deferToTomorrow: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');

		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		const tomorrowStr = tomorrow.toISOString().slice(0, 10);

		const { error } = await locals.supabase
			.from('todos')
			.update({ due_date: tomorrowStr, today_focus: false, focus_order: null })
			.eq('id', id)
			.eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
		return { ok: true };
	},

	shutdownToday: async ({ locals }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		const tomorrowStr = tomorrow.toISOString().slice(0, 10);

		const { error } = await locals.supabase
			.from('todos')
			.update({ due_date: tomorrowStr, today_focus: false, focus_order: null })
			.eq('user_id', user.id)
			.eq('status', 'pending')
			.eq('due_date', new Date().toISOString().slice(0, 10));

		if (error) return fail(500, { error: error.message });
		return { ok: true };
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
		const title = noteTitleFromContent(content);

		const { data, error } = await locals.supabase
			.from('notes')
			.insert({ user_id: user.id, title, content, date: today, type: 'note' })
			.select('*')
			.single();

		if (error) return fail(500, { error: error.message });
		return { ok: true, note: data };
	},

	addJob: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const company = (form.get('company') as string)?.trim();
		const role = (form.get('role') as string)?.trim() || null;

		if (!company) return fail(400, { error: 'Company name required' });

		const { error } = await locals.supabase.from('jobs').insert({
			user_id: user.id,
			company,
			role,
			status: 'pending'
		});

		if (error) return fail(500, { error: error.message });
		return { ok: true };
	}
};
