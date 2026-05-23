import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getTodos } from '$lib/db';
import {
	addTodoAction,
	removeTodoAction,
	toggleTodoAction,
	updateTodoAction
} from '$lib/server/todo-actions';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;
	if (!user) redirect(303, '/login');

	const todos = await getTodos(locals.supabase, user.id);
	return { todos };
};

export const actions: Actions = {
	add: async ({ locals, request }) => {
		return addTodoAction({ request, supabase: locals.supabase, userId: locals.user?.id });
	},

	toggle: async ({ locals, request }) => {
		return toggleTodoAction({ request, supabase: locals.supabase, userId: locals.user?.id });
	},

	update: async ({ locals, request }) => {
		return updateTodoAction({ request, supabase: locals.supabase, userId: locals.user?.id });
	},

	remove: async ({ locals, request }) => {
		return removeTodoAction({ request, supabase: locals.supabase, userId: locals.user?.id });
	}
};
