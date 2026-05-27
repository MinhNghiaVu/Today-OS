import type { Todo, TodoPriority, TodoStatus } from '$lib/types';
import { getActionData } from '$lib/utils/optimistic';

export type TodoView = Todo & { ui_id?: string };

export interface TodoStats {
	all: number;
	pending: number;
	done: number;
}

export interface TodoReconcileOptions {
	pendingIds?: Set<string>;
	pendingAddedIds?: Set<string>;
	pendingRemovedIds?: Set<string>;
}

export const TODO_OPTIMISTIC_ID_PREFIX = 'optimistic-todo-';

export const TODO_PRIORITY_OPTIONS: { value: TodoPriority | ''; label: string }[] = [
	{ value: '', label: 'No priority' },
	{ value: 'high', label: 'High' },
	{ value: 'medium', label: 'Medium' },
	{ value: 'low', label: 'Low' }
];

export const TODO_PRIORITY_LABELS: Record<TodoPriority, string> = {
	high: 'High',
	medium: 'Med',
	low: 'Low'
};

const PRIORITY_RANK: Record<TodoPriority, number> = { high: 0, medium: 1, low: 2 };

export function isTodoPriority(value: unknown): value is TodoPriority {
	return value === 'high' || value === 'medium' || value === 'low';
}

export function isTodoStatus(value: unknown): value is TodoStatus {
	return value === 'pending' || value === 'done';
}

export function dateInputValue(value: unknown): string {
	if (!value) return '';
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	const text = String(value);
	if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
	const date = new Date(text);
	return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export function formatShortDate(value: unknown): string {
	const input = dateInputValue(value);
	if (!input) return '';
	const [year, month, day] = input.split('-');
	return `${day}/${month}/${year.slice(2)}`;
}

export function normalizeTodoPriority(value: FormDataEntryValue | null): TodoPriority | undefined {
	const text = String(value ?? '');
	return isTodoPriority(text) ? text : undefined;
}

export function sortTodos<T extends Todo>(todos: T[]): T[] {
	return [...todos].sort((a, b) => {
		if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
		const priorityDiff = (PRIORITY_RANK[a.priority as TodoPriority] ?? 3) - (PRIORITY_RANK[b.priority as TodoPriority] ?? 3);
		if (priorityDiff !== 0) return priorityDiff;
		return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
	});
}

export function getTodoStats(todos: Pick<Todo, 'status'>[]): TodoStats {
	return {
		all: todos.length,
		pending: todos.filter((todo) => todo.status === 'pending').length,
		done: todos.filter((todo) => todo.status === 'done').length
	};
}

export function isOptimisticTodo(todo: Pick<Todo, 'id'>): boolean {
	return todo.id.startsWith(TODO_OPTIMISTIC_ID_PREFIX);
}

export function createOptimisticTodo(options: {
	title: string;
	dueDate?: string | null;
	priority?: TodoPriority | null;
	sequence: number;
	now?: string;
}): TodoView {
	const now = options.now ?? new Date().toISOString();
	const id = `${TODO_OPTIMISTIC_ID_PREFIX}${Date.now()}-${options.sequence}`;

	return {
		id,
		ui_id: id,
		user_id: 'optimistic',
		title: options.title,
		status: 'pending',
		due_date: options.dueDate ?? undefined,
		priority: options.priority ?? undefined,
		created_at: now
	};
}

function sameTodoIntent(a: TodoView, b: Todo): boolean {
	return (
		isOptimisticTodo(a) &&
		a.title === b.title &&
		dateInputValue(a.due_date) === dateInputValue(b.due_date) &&
		(a.priority ?? null) === (b.priority ?? null) &&
		a.status === b.status
	);
}

export function reconcileTodos(
	serverTodos: Todo[],
	currentTodos: TodoView[],
	options: TodoReconcileOptions = {}
): TodoView[] {
	const claimedOptimisticIds = new Set<string>();
	const pendingIds = options.pendingIds ?? new Set<string>();
	const pendingAddedIds = options.pendingAddedIds ?? new Set<string>();
	const pendingRemovedIds = options.pendingRemovedIds ?? new Set<string>();
	const currentById = new Map(currentTodos.map((todo) => [todo.id, todo]));

	const reconciled = serverTodos.flatMap((serverTodo) => {
		if (pendingRemovedIds.has(serverTodo.id)) return [];

		const existing = currentById.get(serverTodo.id);
		if (existing && pendingIds.has(existing.id)) return [existing];
		if (existing?.ui_id) return [{ ...serverTodo, ui_id: existing.ui_id }];

		const optimisticMatch = currentTodos.find(
			(todo) => !claimedOptimisticIds.has(todo.id) && sameTodoIntent(todo, serverTodo)
		);
		if (optimisticMatch?.ui_id) {
			claimedOptimisticIds.add(optimisticMatch.id);
			return [{ ...serverTodo, ui_id: optimisticMatch.ui_id }];
		}

		return [serverTodo];
	});

	const reconciledIds = new Set(reconciled.map((todo) => todo.id));
	for (const todo of currentTodos) {
		if (pendingAddedIds.has(todo.id) && !reconciledIds.has(todo.id)) reconciled.push(todo);
	}

	return reconciled;
}

export function applyTodoToggle(todos: TodoView[], todo: TodoView): TodoView[] {
	const nowDone = todo.status !== 'done';

	return todos.map((item) =>
		item.id === todo.id
			? {
					...item,
					status: nowDone ? 'done' : 'pending',
					completed_at: nowDone ? new Date().toISOString() : undefined
				}
			: item
	);
}

export function applyTodoUpdate(todos: TodoView[], todo: TodoView, formData: FormData): TodoView[] {
	const title = String(formData.get('title') ?? '').trim();
	if (!title) return todos;

	const patch: Partial<TodoView> = { title };
	if (formData.has('description')) {
		patch.description = String(formData.get('description') ?? '').trim() || undefined;
	}
	if (formData.has('due_date')) {
		patch.due_date = String(formData.get('due_date') ?? '') || undefined;
	}
	if (formData.has('priority')) {
		patch.priority = normalizeTodoPriority(formData.get('priority'));
	}

	return todos.map((item) => (item.id === todo.id ? { ...item, ...patch } : item));
}

export function applyTodoRemove(todos: TodoView[], todo: TodoView): TodoView[] {
	return todos.filter((item) => item.id !== todo.id);
}

export function replaceTodoWithServer(todos: TodoView[], currentId: string, serverTodo: Todo): TodoView[] {
	let replaced = false;
	const next = todos.map((item) => {
		if (item.id !== currentId && item.ui_id !== currentId) return item;
		replaced = true;
		return { ...serverTodo, ui_id: item.ui_id ?? item.id };
	});

	return replaced ? next : [...next, serverTodo];
}

export function getTodoActionTodo(result: unknown): Todo | null {
	const todo = getActionData(result)?.todo;
	return todo && typeof todo === 'object' && 'id' in todo ? (todo as Todo) : null;
}

export function getTodoActionError(result: unknown, fallback = "Couldn't save task."): string {
	if (!result || typeof result !== 'object') return fallback;
	const data = 'data' in result ? (result as { data?: unknown }).data : undefined;
	if (data && typeof data === 'object' && 'error' in data) {
		const error = (data as { error?: unknown }).error;
		if (typeof error === 'string' && error) return error;
	}
	const error = 'error' in result ? (result as { error?: unknown }).error : undefined;
	if (error instanceof Error) return error.message;
	if (typeof error === 'string' && error) return error;
	return fallback;
}
