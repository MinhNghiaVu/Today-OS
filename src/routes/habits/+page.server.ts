import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getHabitSummariesToday } from '$lib/db';
import { logHabitToday, removeHabitLog, updateHabitLog } from '$lib/server/habit-actions';
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
		return logHabitToday({ request, supabase: locals.supabase, userId: locals.user?.id });
	},

	updateHabitLog: async ({ locals, request }) => {
		return updateHabitLog({ request, supabase: locals.supabase, userId: locals.user?.id });
	},

	removeHabitLog: async ({ locals, request }) => {
		return removeHabitLog({ request, supabase: locals.supabase, userId: locals.user?.id });
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
