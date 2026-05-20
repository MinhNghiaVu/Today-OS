import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getHabitSummariesToday } from '$lib/db';
import { query } from '$lib/server/neon-client';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;
	if (!user) redirect(303, '/login');

	const habits = await getHabitSummariesToday(locals.supabase, user.id, { includeInactive: true });
	return { habits };
};

export const actions: Actions = {
	add: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const name = (form.get('name') as string)?.trim();
		const unit = (form.get('unit') as string)?.trim();
		const type = form.get('type') as string;
		const goalRaw = form.get('daily_goal') as string;
		const daily_goal = goalRaw ? parseFloat(goalRaw) : null;
		const color = (form.get('color') as string) || '#6366f1';
		const is_active = form.get('is_active') === 'true';

		if (!name || !unit) return fail(400, { error: 'Name and unit required' });

		const { error } = await locals.supabase
			.from('habit_definitions')
			.insert({ user_id: user.id, name, unit, type, daily_goal, color, is_active });

		if (error) return fail(500, { error: error.message });
	},

	update: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const id = form.get('id') as string;
		const name = (form.get('name') as string)?.trim();
		const unit = (form.get('unit') as string)?.trim();
		const type = form.get('type') as string;
		const goalRaw = form.get('daily_goal') as string;
		const daily_goal = goalRaw ? parseFloat(goalRaw) : null;
		const color = form.get('color') as string;
		const is_active = form.get('is_active') === 'true';

		if (!id || !name || !unit) return fail(400, { error: 'Missing fields' });

		const { error } = await locals.supabase
			.from('habit_definitions')
			.update({ name, unit, type, daily_goal, color, is_active })
			.eq('id', id)
			.eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
	},

	toggleActive: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const id = form.get('id') as string;
		if (!id) return fail(400, { error: 'Missing habit' });

		try {
			await query(
				`update "habit_definitions"
				 set "is_active" = not "is_active"
				 where "id" = cast($1 as uuid) and "user_id" = $2`,
				[id, user.id]
			);
		} catch (error) {
			return fail(500, { error: error instanceof Error ? error.message : String(error) });
		}
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

	remove: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const id = form.get('id') as string;

		const { error } = await locals.supabase
			.from('habit_definitions')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
	}
};
