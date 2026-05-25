import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getCalendarMonthActivity,
	getTodosForDate,
	getHabitSummariesForDate,
	getNotesForDate
} from '$lib/db';
import { getEventsForDate } from '$lib/google-calendar';
import { logHabit, removeHabitLog, updateHabitLog } from '$lib/server/habit-actions';
import {
	addTodoAction,
	removeTodoAction,
	toggleTodoAction,
	updateTodoAction
} from '$lib/server/todo-actions';
import type { CalendarDayData, CalendarEvent } from '$lib/types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { supabase, user } = locals;
	if (!user) throw error(401, 'Unauthorized');

	const now = new Date();
	const yearParam = url.searchParams.get('year');
	const monthParam = url.searchParams.get('month');
	const dateParam = url.searchParams.get('date');

	const year = yearParam ? parseInt(yearParam) : now.getFullYear();
	const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1;

	const [activity] = await Promise.all([
		getCalendarMonthActivity(supabase, user.id, year, month)
	]);

	const tokenRow = await supabase
		.from('users')
		.select('google_access_token, google_token_expiry')
		.eq('id', user.id)
		.single();

	const gcToken = tokenRow.data?.google_access_token ?? null;
	const gcExpiry = tokenRow.data?.google_token_expiry ?? null;
	const gcConnected = gcToken !== null && !(gcExpiry && new Date(gcExpiry) < new Date());

	let dayData: CalendarDayData | null = null;

	if (dateParam) {
		const [todos, habits, notes, gcEvents] = await Promise.all([
			getTodosForDate(supabase, user.id, dateParam),
			getHabitSummariesForDate(supabase, user.id, dateParam),
			getNotesForDate(supabase, user.id, dateParam),
			gcConnected ? getEventsForDate(gcToken!, dateParam).catch(() => []) : Promise.resolve([] as CalendarEvent[])
		]);
		dayData = { todos, habits, notes, gcEvents };
	}

	return {
		year,
		month,
		selectedDate: dateParam,
		activity,
		dayData,
		gcConnected,
		today: now.toISOString().slice(0, 10)
	};
};

export const actions: Actions = {
	addTodo: async ({ locals, request, url }) => {
		const defaultDueDate = url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
		return addTodoAction({
			request,
			supabase: locals.supabase,
			userId: locals.user?.id,
			defaultDueDate
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
		return logHabit({ request, supabase: locals.supabase, userId: locals.user?.id });
	},

	updateHabitLog: async ({ locals, request }) => {
		return updateHabitLog({ request, supabase: locals.supabase, userId: locals.user?.id });
	},

	removeHabitLog: async ({ locals, request }) => {
		return removeHabitLog({ request, supabase: locals.supabase, userId: locals.user?.id });
	}
};
