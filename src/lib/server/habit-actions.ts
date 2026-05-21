import { fail } from '@sveltejs/kit';
import type { AppDbClient } from '$lib/server/neon-client';
import { parseLocalizedNumber } from '$lib/utils/number';

type HabitActionInput = {
	request: Request;
	supabase: AppDbClient;
	userId: string | undefined;
};

export async function logHabitToday({ request, supabase, userId }: HabitActionInput) {
	if (!userId) return fail(401);

	const form = await request.formData();
	const habit_id = form.get('habit_id') as string;
	const value = parseLocalizedNumber(form.get('value'));

	if (!habit_id || isNaN(value) || value <= 0) return fail(400, { error: 'Invalid log' });

	const { data: habit, error: habitError } = await supabase
		.from('habit_definitions')
		.select('id')
		.eq('id', habit_id)
		.eq('user_id', userId)
		.single();

	if (habitError || !habit) return fail(404, { error: 'Habit not found' });

	const today = new Date().toISOString().slice(0, 10);
	const { error } = await supabase
		.from('habit_logs')
		.insert({ user_id: userId, habit_id, date: today, value });

	if (error) return fail(500, { error: error.message });
}

export async function updateHabitLog({ request, supabase, userId }: HabitActionInput) {
	if (!userId) return fail(401);

	const form = await request.formData();
	const id = form.get('id') as string;
	const value = parseLocalizedNumber(form.get('value'));

	if (!id || isNaN(value) || value <= 0) return fail(400, { error: 'Invalid log value' });

	const { error } = await supabase
		.from('habit_logs')
		.update({ value })
		.eq('id', id)
		.eq('user_id', userId);

	if (error) return fail(500, { error: error.message });
}

export async function removeHabitLog({ request, supabase, userId }: HabitActionInput) {
	if (!userId) return fail(401);

	const form = await request.formData();
	const id = form.get('id') as string;

	if (!id) return fail(400, { error: 'Missing log' });

	const { error } = await supabase
		.from('habit_logs')
		.delete()
		.eq('id', id)
		.eq('user_id', userId);

	if (error) return fail(500, { error: error.message });
}
