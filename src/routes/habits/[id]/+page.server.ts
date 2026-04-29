import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getHabits, getHabitLogsForRange } from '$lib/db';

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

	const [logs7, logs30] = await Promise.all([
		getHabitLogsForRange(supabase, user.id, params.id, d7Start.toISOString().slice(0, 10), todayStr),
		getHabitLogsForRange(supabase, user.id, params.id, d30Start.toISOString().slice(0, 10), todayStr)
	]);

	return { habit, logs7, logs30 };
};
