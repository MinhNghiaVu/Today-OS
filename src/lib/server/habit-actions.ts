import { fail } from '@sveltejs/kit';
import type { AppDbClient } from '$lib/server/neon-client';
import { parseLocalizedNumber } from '$lib/utils/number';

type HabitActionInput = {
	request: Request;
	supabase: AppDbClient;
	userId: string | undefined;
};

function today(): string {
	return new Date().toISOString().slice(0, 10);
}

function readDate(value: FormDataEntryValue | null): string {
	const raw = typeof value === 'string' ? value : '';
	return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : today();
}

export async function logHabit({ request, supabase, userId }: HabitActionInput) {
	if (!userId) return fail(401);

	const form = await request.formData();
	const habit_id = form.get('habit_id') as string;
	const value = parseLocalizedNumber(form.get('value'));
	const date = readDate(form.get('date'));

	if (!habit_id || isNaN(value) || value <= 0) return fail(400, { error: 'Invalid log' });

	const { data: habit, error: habitError } = await supabase
		.from('habit_definitions')
		.select('id')
		.eq('id', habit_id)
		.eq('user_id', userId)
		.single();

	if (habitError || !habit) return fail(404, { error: 'Habit not found' });

	const { data, error } = await supabase
		.from('habit_logs')
		.insert({ user_id: userId, habit_id, date, value })
		.select('*')
		.single();

	if (error) return fail(500, { error: error.message });
	return { ok: true, log: data };
}

export async function updateHabitLog({ request, supabase, userId }: HabitActionInput) {
	if (!userId) return fail(401);

	const form = await request.formData();
	const id = form.get('id') as string;
	const value = parseLocalizedNumber(form.get('value'));

	if (!id || isNaN(value) || value <= 0) return fail(400, { error: 'Invalid log value' });

	const { data, error } = await supabase
		.from('habit_logs')
		.update({ value })
		.eq('id', id)
		.eq('user_id', userId)
		.select('*')
		.single();

	if (error) return fail(500, { error: error.message });
	return { ok: true, log: data };
}

export async function removeHabitLog({ request, supabase, userId }: HabitActionInput) {
	if (!userId) return fail(401);

	const form = await request.formData();
	const id = form.get('id') as string;

	if (!id) return fail(400, { error: 'Missing log' });

	const { data, error } = await supabase
		.from('habit_logs')
		.delete()
		.eq('id', id)
		.eq('user_id', userId)
		.select('id, habit_id, value')
		.single();

	if (error) return fail(500, { error: error.message });
	return { ok: true, log: data ?? { id } };
}
