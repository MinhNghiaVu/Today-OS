<script lang="ts">
	import { ClipboardList } from 'lucide-svelte';
	import SegmentedControl from '$lib/components/SegmentedControl.svelte';
	import TodoAddForm from '$lib/components/TodoAddForm.svelte';
	import TodoRow from '$lib/components/TodoRow.svelte';
	import type { PageData } from './$types';
	import type { Todo, TodoPriority, TodoStatus } from '$lib/types';

	export let data: PageData;

	type Filter = 'all' | TodoStatus;
	type TodoView = Todo & { ui_id?: string };

	const priorityOpts: { value: TodoPriority | ''; label: string }[] = [
		{ value: '', label: 'No priority' },
		{ value: 'high', label: 'High' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'low', label: 'Low' }
	];

	const priorityLabels: Record<TodoPriority, string> = { high: 'High', medium: 'Med', low: 'Low' };

	let filter: Filter = 'all';
	let todos: TodoView[] = data.todos;
	let lastTodosData = data.todos;
	let optimisticTodoSeq = 0;
	$: filterTabs = [
		{ value: 'all', label: `All ${counts.all}` },
		{ value: 'pending', label: `Pending ${counts.pending}` },
		{ value: 'done', label: `Done ${counts.done}` }
	];
	let editingId: string | null = null;

	$: if (data.todos !== lastTodosData) {
		todos = reconcileTodos(data.todos, todos);
		lastTodosData = data.todos;
	}
	$: filtered = todos
		.filter((t) => filter === 'all' || t.status === filter)
		.sort((a, b) => {
			if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
			const rank: Record<string, number> = { high: 0, medium: 1, low: 2 };
			return (rank[a.priority ?? ''] ?? 3) - (rank[b.priority ?? ''] ?? 3);
		});

	$: counts = {
		all: todos.length,
		pending: todos.filter((t) => t.status === 'pending').length,
		done: todos.filter((t) => t.status === 'done').length
	};

	const todayStr = new Date().toISOString().slice(0, 10);

	function dateInputValue(value: unknown): string {
		if (!value) return '';
		if (value instanceof Date) return value.toISOString().slice(0, 10);
		const text = String(value);
		if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
		const date = new Date(text);
		return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
	}

	function makeOptimisticTodo(
		title: string,
		dueDate: string | null,
		priority: TodoPriority | null
	): TodoView {
		const now = new Date().toISOString();
		optimisticTodoSeq += 1;
		const id = `optimistic-todo-${Date.now()}-${optimisticTodoSeq}`;
		return {
			id,
			ui_id: id,
			user_id: 'optimistic',
			title,
			status: 'pending',
			due_date: dueDate ?? undefined,
			priority: priority ?? undefined,
			created_at: now
		};
	}

	function sameTodoIntent(a: TodoView, b: Todo): boolean {
		return (
			a.id.startsWith('optimistic-todo-') &&
			a.title === b.title &&
			dateInputValue(a.due_date) === dateInputValue(b.due_date) &&
			(a.priority ?? null) === (b.priority ?? null) &&
			a.status === b.status
		);
	}

	function reconcileTodos(serverTodos: Todo[], currentTodos: TodoView[]): TodoView[] {
		const claimedOptimisticIds = new Set<string>();
		return serverTodos.map((serverTodo) => {
			const existing = currentTodos.find((todo) => todo.id === serverTodo.id);
			if (existing?.ui_id) return { ...serverTodo, ui_id: existing.ui_id };

			const optimisticMatch = currentTodos.find(
				(todo) => !claimedOptimisticIds.has(todo.id) && sameTodoIntent(todo, serverTodo)
			);
			if (optimisticMatch?.ui_id) {
				claimedOptimisticIds.add(optimisticMatch.id);
				return { ...serverTodo, ui_id: optimisticMatch.ui_id };
			}

			return serverTodo;
		});
	}

	function addTodo(formData: FormData): () => void {
		const title = String(formData.get('title') ?? '').trim();
		const dueDate = String(formData.get('due_date') ?? '') || null;
		const priority = (String(formData.get('priority') ?? '') || null) as TodoPriority | null;
		const optimistic = title ? makeOptimisticTodo(title, dueDate, priority) : null;
		if (optimistic) todos = [...todos, optimistic];
		return () => {
			if (optimistic) todos = todos.filter((todo) => todo.id !== optimistic.id);
		};
	}

	function toggleTodo(todo: TodoView): () => void {
		const previous = todos;
		const nowDone = todo.status !== 'done';
		todos = todos.map((item) =>
			item.id === todo.id
				? {
						...item,
						status: nowDone ? 'done' : 'pending',
						completed_at: nowDone ? new Date().toISOString() : undefined
					}
				: item
		);
		return () => (todos = previous);
	}

	function updateTodo(todo: TodoView, formData: FormData): () => void {
		const previous = todos;
		const title = String(formData.get('title') ?? '').trim();
		const description = String(formData.get('description') ?? '').trim() || undefined;
		const dueDate = String(formData.get('due_date') ?? '') || undefined;
		const priority = (String(formData.get('priority') ?? '') || undefined) as TodoPriority | undefined;
		if (title) {
			todos = todos.map((item) =>
				item.id === todo.id ? { ...item, title, description, due_date: dueDate, priority } : item
			);
		}
		return () => (todos = previous);
	}

	function removeTodo(todo: TodoView): () => void {
		const previous = todos;
		todos = todos.filter((item) => item.id !== todo.id);
		return () => (todos = previous);
	}
</script>

<div class="page">
	<header class="page-header">
		<h1>Todos</h1>
		<span class="total-badge">{counts.pending} pending</span>
	</header>

	<TodoAddForm action="?/add" today={todayStr} priorityOptions={priorityOpts} onAdd={addTodo} />

	<!-- Filter tabs -->
	<SegmentedControl options={filterTabs} bind:value={filter} />

	<!-- Todo list -->
	{#if filtered.length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<ClipboardList size={40} strokeWidth={1.5} />
			</div>
			<p class="empty-title">
				{filter === 'done' ? 'Nothing done yet' : filter === 'pending' ? 'All clear' : 'No tasks yet'}
			</p>
			<p class="empty-desc">
				{filter === 'done'
					? 'Complete a task to see it here.'
					: filter === 'pending'
					? 'No pending tasks right now.'
					: 'Add your first task using the form above.'}
			</p>
		</div>
	{:else}
		<ul class="todo-list">
			{#each filtered as todo (todo.ui_id ?? todo.id)}
				<TodoRow
					{todo}
					today={todayStr}
					priorityOptions={priorityOpts}
					{priorityLabels}
					editing={editingId === todo.id}
					toggleAction="?/toggle"
					updateAction="?/update"
					removeAction="?/remove"
					setEditing={(id) => (editingId = id)}
					onToggle={toggleTodo}
					onUpdate={updateTodo}
					onRemove={removeTodo}
				/>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding: 32px 24px;
	}

	.page-header {
		display: flex;
		align-items: baseline;
		gap: 12px;
	}

	h1 {
		margin: 0;
		font-size: 24px;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--text-primary);
	}

	.total-badge {
		font-size: 13px;
		color: var(--text-secondary);
	}

	.todo-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 48px 24px;
		gap: 8px;
	}

	.empty-icon {
		color: var(--text-tertiary);
		margin-bottom: 8px;
		display: flex;
	}

	.empty-title {
		margin: 0;
		font-size: 17px;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.3;
	}

	.empty-desc {
		margin: 0;
		font-size: 14px;
		color: var(--text-secondary);
		max-width: 280px;
	}

	@media (max-width: 560px) {
		.page {
			padding: 28px 16px;
		}
	}
</style>
