import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getTodos } from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;
	if (!user) redirect(303, '/login');

	const todos = await getTodos(locals.supabase, user.id);
	return { todos };
};

export const actions: Actions = {
	add: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const title = (form.get('title') as string)?.trim();
		const due_date = (form.get('due_date') as string) || null;
		const priority = (form.get('priority') as string) || null;

		if (!title) return fail(400, { error: 'Title required' });

		const { error } = await locals.supabase.from('todos').insert({
			user_id: user.id,
			title,
			due_date,
			priority
		});

		if (error) return fail(500, { error: error.message });
	},

	toggle: async ({ locals, request }) => {
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

	update: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const id = form.get('id') as string;
		const title = (form.get('title') as string)?.trim();
		const description = (form.get('description') as string)?.trim() || null;
		const due_date = (form.get('due_date') as string) || null;
		const priority = (form.get('priority') as string) || null;

		if (!id || !title) return fail(400, { error: 'Missing fields' });

		const { error } = await locals.supabase
			.from('todos')
			.update({ title, description, due_date, priority })
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
			.from('todos')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
	}
};
