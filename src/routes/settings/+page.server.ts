import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;
	if (!user) redirect(303, '/login');

	const { data } = await locals.supabase
		.from('users')
		.select('email, preferences')
		.eq('id', user.id)
		.single();

	const [todos, habits, habitLogs, notes] = await Promise.all([
		locals.supabase.from('todos').select('*').eq('user_id', user.id),
		locals.supabase.from('habit_definitions').select('*').eq('user_id', user.id),
		locals.supabase.from('habit_logs').select('*').eq('user_id', user.id),
		locals.supabase.from('notes').select('*').eq('user_id', user.id)
	]);

	return {
		email: data?.email ?? user.email ?? '',
		preferences: data?.preferences ?? { theme: 'dark', accentIndex: 0 },
		exportData: {
			todos: todos.data ?? [],
			habits: habits.data ?? [],
			habitLogs: habitLogs.data ?? [],
			notes: notes.data ?? []
		}
	};
};

export const actions: Actions = {
	setTheme: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const theme = form.get('theme') as 'dark' | 'light';

		const { data: current } = await locals.supabase
			.from('users')
			.select('preferences')
			.eq('id', user.id)
			.single();

		const prefs = { ...(current?.preferences ?? {}), theme };
		await locals.supabase.from('users').update({ preferences: prefs }).eq('id', user.id);
	},

	setAccent: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const accentIndex = parseInt(form.get('accentIndex') as string);

		const { data: current } = await locals.supabase
			.from('users')
			.select('preferences')
			.eq('id', user.id)
			.single();

		const prefs = { ...(current?.preferences ?? {}), accentIndex };
		await locals.supabase.from('users').update({ preferences: prefs }).eq('id', user.id);
	},

	clearData: async ({ locals }) => {
		const { user } = locals;
		if (!user) return fail(401);

		await Promise.all([
			locals.supabase.from('todos').delete().eq('user_id', user.id),
			locals.supabase.from('habit_logs').delete().eq('user_id', user.id),
			locals.supabase.from('habit_definitions').delete().eq('user_id', user.id),
			locals.supabase.from('notes').delete().eq('user_id', user.id)
		]);
	}
};
