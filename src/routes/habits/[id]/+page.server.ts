import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getHabits, getHabitLogEntriesForRange, getHabitLogsForRange } from '$lib/db';
import { parseLocalizedNumber } from '$lib/utils/number';

function todayString(): string {
	return new Date().toISOString().slice(0, 10);
}

function daysAgoString(days: number): string {
	const date = new Date();
	date.setDate(date.getDate() - days);
	return date.toISOString().slice(0, 10);
}

function isDateInVisibleRange(date: string): boolean {
	const startDate = daysAgoString(29);
	const endDate = todayString();
	return date >= startDate && date <= endDate;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const { supabase, user } = locals;
	if (!user) throw error(401, 'Unauthorized');

	const habits = await getHabits(supabase, user.id);
	const habit = habits.find((h) => h.id === params.id);
	if (!habit) throw error(404, 'Habit not found');

	const now = new Date();
	const todayStr = now.toISOString().slice(0, 10);

	const d7Start = new Date(now);
	d7Start.setDate(d7Start.getDate() - 6);
	const d30Start = new Date(now);
	d30Start.setDate(d30Start.getDate() - 29);

	const [logs7, logs30, logEntries] = await Promise.all([
		getHabitLogsForRange(supabase, user.id, params.id, d7Start.toISOString().slice(0, 10), todayStr),
		getHabitLogsForRange(supabase, user.id, params.id, d30Start.toISOString().slice(0, 10), todayStr),
		getHabitLogEntriesForRange(supabase, user.id, params.id, d30Start.toISOString().slice(0, 10), todayStr)
	]);

	return { habit, logs7, logs30, logEntries };
};

export const actions: Actions = {
	addLog: async ({ locals, params, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const date = form.get('date') as string;
		const value = parseLocalizedNumber(form.get('value'));

		if (!date || isNaN(value) || value <= 0) return fail(400, { error: 'Invalid log' });
		if (!isDateInVisibleRange(date)) {
			return fail(400, { error: 'Choose a date from the last 30 days' });
		}

		const { data: habit, error: habitError } = await locals.supabase
			.from('habit_definitions')
			.select('id')
			.eq('id', params.id)
			.eq('user_id', user.id)
			.single();

		if (habitError || !habit) return fail(404, { error: 'Habit not found' });

		const { error } = await locals.supabase
			.from('habit_logs')
			.insert({ user_id: user.id, habit_id: params.id, date, value });

		if (error) return fail(500, { error: error.message });
	},

	updateLog: async ({ locals, params, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const id = form.get('id') as string;
		const date = form.get('date') as string;
		const value = parseLocalizedNumber(form.get('value'));

		if (!id || !date || isNaN(value) || value <= 0) return fail(400, { error: 'Invalid log' });
		if (!isDateInVisibleRange(date)) {
			return fail(400, { error: 'Choose a date from the last 30 days' });
		}

		const { error } = await locals.supabase
			.from('habit_logs')
			.update({ date, value })
			.eq('id', id)
			.eq('habit_id', params.id)
			.eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
	},

	removeLog: async ({ locals, params, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const id = form.get('id') as string;

		if (!id) return fail(400, { error: 'Missing log' });

		const { error } = await locals.supabase
			.from('habit_logs')
			.delete()
			.eq('id', id)
			.eq('habit_id', params.id)
			.eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
	}
};
