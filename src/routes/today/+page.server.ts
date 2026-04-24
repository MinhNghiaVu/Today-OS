import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getTodosToday, getHabitTotalsToday } from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;
	if (!user) redirect(303, '/login');

	const [todosToday, habitTotals] = await Promise.all([
		getTodosToday(locals.supabase, user.id),
		getHabitTotalsToday(locals.supabase, user.id)
	]);

	return { todosToday, habitTotals };
};

export const actions: Actions = {
	addTodo: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const title = (form.get('title') as string)?.trim();
		if (!title) return fail(400, { error: 'Title required' });

		const today = new Date().toISOString().slice(0, 10);
		const { error } = await locals.supabase
			.from('todos')
			.insert({ user_id: user.id, title, due_date: today });

		if (error) return fail(500, { error: error.message });
	},

	toggleTodo: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const id = form.get('id') as string;
		const currentStatus = form.get('status') as string;

		const nowDone = currentStatus !== 'done';
		const { error } = await locals.supabase
			.from('todos')
			.update({
				status: nowDone ? 'done' : 'pending',
				completed_at: nowDone ? new Date().toISOString() : null
			})
			.eq('id', id)
			.eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
	},

	removeTodo: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const id = form.get('id') as string;

		const { error } = await locals.supabase
			.from('todos')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
	},

	logHabit: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const habit_id = form.get('habit_id') as string;
		const valueRaw = form.get('value') as string;
		const value = parseFloat(valueRaw);

		if (!habit_id || isNaN(value) || value <= 0) return fail(400, { error: 'Invalid log' });

		const today = new Date().toISOString().slice(0, 10);
		const { error } = await locals.supabase
			.from('habit_logs')
			.insert({ user_id: user.id, habit_id, date: today, value });

		if (error) return fail(500, { error: error.message });
	}
};
