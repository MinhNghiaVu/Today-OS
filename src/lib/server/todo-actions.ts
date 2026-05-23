import { fail } from '@sveltejs/kit';
import type { AppDbClient } from '$lib/server/neon-client';
import { TODO_OPTIMISTIC_ID_PREFIX, isTodoPriority, isTodoStatus } from '$lib/utils/todos';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface TodoActionContext {
	request: Request;
	supabase: AppDbClient;
	userId?: string | null;
	defaultDueDate?: string | null;
}

function errorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error && error.message) return error.message;
	return fallback;
}

function validateTodoId(id: string) {
	if (UUID_RE.test(id)) return null;
	return fail(400, {
		error: id.startsWith(TODO_OPTIMISTIC_ID_PREFIX)
			? 'Task is still syncing. Try again in a moment.'
			: 'Invalid task id.'
	});
}

function readDate(value: FormDataEntryValue | null, fallback: string | null = null) {
	const date = String(value ?? '') || fallback;
	if (!date) return null;
	return DATE_RE.test(date) ? date : undefined;
}

function readPriority(value: FormDataEntryValue | null) {
	const priority = String(value ?? '');
	if (!priority) return null;
	return isTodoPriority(priority) ? priority : undefined;
}

export async function addTodoAction({ request, supabase, userId, defaultDueDate = null }: TodoActionContext) {
	if (!userId) return fail(401, { error: 'Sign in to add tasks.' });

	const form = await request.formData();
	const title = String(form.get('title') ?? '').trim();
	const due_date = readDate(form.get('due_date'), defaultDueDate);
	const priority = readPriority(form.get('priority'));

	if (!title) return fail(400, { error: 'Title required' });
	if (due_date === undefined) return fail(400, { error: 'Choose a valid due date.' });
	if (priority === undefined) return fail(400, { error: 'Choose a valid priority.' });

	const { error } = await supabase.from('todos').insert({
		user_id: userId,
		title,
		due_date,
		priority
	});

	if (error) return fail(500, { error: errorMessage(error, "Couldn't add task.") });
	return { ok: true };
}

export async function toggleTodoAction({ request, supabase, userId }: TodoActionContext) {
	if (!userId) return fail(401, { error: 'Sign in to update tasks.' });

	const form = await request.formData();
	const id = String(form.get('id') ?? '');
	const currentStatus = String(form.get('status') ?? '');
	const idFailure = validateTodoId(id);
	if (idFailure) return idFailure;
	if (!isTodoStatus(currentStatus)) return fail(400, { error: 'Invalid task status.' });

	const nowDone = currentStatus !== 'done';
	const { error } = await supabase
		.from('todos')
		.update({
			status: nowDone ? 'done' : 'pending',
			completed_at: nowDone ? new Date().toISOString() : null
		})
		.eq('id', id)
		.eq('user_id', userId);

	if (error) return fail(500, { error: errorMessage(error, "Couldn't update task.") });
	return { ok: true };
}

export async function updateTodoAction({ request, supabase, userId }: TodoActionContext) {
	if (!userId) return fail(401, { error: 'Sign in to update tasks.' });

	const form = await request.formData();
	const id = String(form.get('id') ?? '');
	const title = String(form.get('title') ?? '').trim();
	const due_date = readDate(form.get('due_date'));
	const priority = readPriority(form.get('priority'));
	const idFailure = validateTodoId(id);
	if (idFailure) return idFailure;
	if (!title) return fail(400, { error: 'Title required' });
	if (due_date === undefined) return fail(400, { error: 'Choose a valid due date.' });
	if (priority === undefined) return fail(400, { error: 'Choose a valid priority.' });

	const patch: Record<string, unknown> = { title, due_date, priority };
	if (form.has('description')) {
		patch.description = String(form.get('description') ?? '').trim() || null;
	}

	const { error } = await supabase.from('todos').update(patch).eq('id', id).eq('user_id', userId);

	if (error) return fail(500, { error: errorMessage(error, "Couldn't save task.") });
	return { ok: true };
}

export async function removeTodoAction({ request, supabase, userId }: TodoActionContext) {
	if (!userId) return fail(401, { error: 'Sign in to delete tasks.' });

	const form = await request.formData();
	const id = String(form.get('id') ?? '');
	const idFailure = validateTodoId(id);
	if (idFailure) return idFailure;

	const { error } = await supabase.from('todos').delete().eq('id', id).eq('user_id', userId);

	if (error) return fail(500, { error: errorMessage(error, "Couldn't delete task.") });
	return { ok: true };
}
