import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getNotes } from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;
	if (!user) redirect(303, '/login');

	const notes = await getNotes(locals.supabase, user.id);
	return { notes };
};

export const actions: Actions = {
	add: async ({ locals }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const { data, error } = await locals.supabase
			.from('notes')
			.insert({ user_id: user.id, title: 'Untitled', content: '' })
			.select('id')
			.single();

		if (error) return fail(500, { error: error.message });
		return { newId: data.id };
	},

	update: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const id = form.get('id') as string;
		const title = (form.get('title') as string) ?? '';
		const content = (form.get('content') as string) ?? '';

		if (!id) return fail(400, { error: 'Missing id' });

		const { error } = await locals.supabase
			.from('notes')
			.update({ title, content, updated_at: new Date().toISOString() })
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
			.from('notes')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
		return { deleted: id };
	}
};
