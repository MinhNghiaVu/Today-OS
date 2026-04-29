import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getCalendarMonthActivity,
	getTodosForDate,
	getHabitTotalsForDate,
	getNotesForDate
} from '$lib/db';

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

	let dayData: {
		todos: Awaited<ReturnType<typeof getTodosForDate>>;
		habits: Awaited<ReturnType<typeof getHabitTotalsForDate>>;
		notes: Awaited<ReturnType<typeof getNotesForDate>>;
	} | null = null;

	if (dateParam) {
		const [todos, habits, notes] = await Promise.all([
			getTodosForDate(supabase, user.id, dateParam),
			getHabitTotalsForDate(supabase, user.id, dateParam),
			getNotesForDate(supabase, user.id, dateParam)
		]);
		dayData = { todos, habits, notes };
	}

	return {
		year,
		month,
		selectedDate: dateParam,
		activity,
		dayData,
		today: now.toISOString().slice(0, 10)
	};
};
