import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getHabits } from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;
	if (!user) redirect(303, '/login');

	const habits = await getHabits(locals.supabase, user.id);
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
		const current = form.get('is_active') === 'true';

		const { error } = await locals.supabase
			.from('habit_definitions')
			.update({ is_active: !current })
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
