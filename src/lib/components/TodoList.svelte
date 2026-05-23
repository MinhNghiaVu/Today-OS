<script lang="ts">
	import { CheckCircle2, ClipboardList } from 'lucide-svelte';
	import SegmentedControl from '$lib/components/SegmentedControl.svelte';
	import TodoAddForm from '$lib/components/TodoAddForm.svelte';
	import TodoRow from '$lib/components/TodoRow.svelte';
	import type { Todo } from '$lib/types';
	import {
		TODO_PRIORITY_LABELS,
		TODO_PRIORITY_OPTIONS,
		applyTodoRemove,
		applyTodoToggle,
		applyTodoUpdate,
		createOptimisticTodo,
		getTodoStats,
		isOptimisticTodo,
		normalizeTodoPriority,
		reconcileTodos,
		sortTodos,
		type TodoStats,
		type TodoView
	} from '$lib/utils/todos';

	export let todos: Todo[] = [];
	export let today = new Date().toISOString().slice(0, 10);
	export let addAction: string;
	export let toggleAction: string;
	export let updateAction: string;
	export let removeAction: string;
	export let compact = false;
	export let showFilters = false;
	export let showDueDate = true;
	export let showDescription = true;
	export let emptyTitle = 'No tasks yet';
	export let emptyDescription = 'Add your first task using the form above.';
	export let emptyMode: 'center' | 'inline' = 'center';
	export let stats: TodoStats = getTodoStats(todos);

	let filter = 'all';
	let draftTodos: TodoView[] = todos;
	let lastTodos = todos;
	let optimisticTodoSeq = 0;
	let editingId: string | null = null;
	let errorMessage: string | null = null;

	$: if (todos !== lastTodos) {
		draftTodos = reconcileTodos(todos, draftTodos);
		lastTodos = todos;
		if (editingId && !draftTodos.some((todo) => todo.id === editingId)) editingId = null;
	}

	$: sortedTodos = sortTodos(draftTodos);
	$: visibleTodos = sortedTodos.filter((todo) => filter === 'all' || todo.status === filter);
	$: stats = getTodoStats(draftTodos);
	$: filterTabs = [
		{ value: 'all', label: `All ${stats.all}` },
		{ value: 'pending', label: `Pending ${stats.pending}` },
		{ value: 'done', label: `Done ${stats.done}` }
	];

	function setError(message: string | null) {
		errorMessage = message;
	}

	function addTodo(formData: FormData): () => void {
		const title = String(formData.get('title') ?? '').trim();
		const dueDate = String(formData.get('due_date') ?? '') || (compact ? today : null);
		const priority = normalizeTodoPriority(formData.get('priority')) ?? null;
		const optimistic = title
			? createOptimisticTodo({
					title,
					dueDate,
					priority,
					sequence: ++optimisticTodoSeq
				})
			: null;

		if (optimistic) draftTodos = [...draftTodos, optimistic];
		return () => {
			if (optimistic) draftTodos = draftTodos.filter((todo) => todo.id !== optimistic.id);
		};
	}

	function toggleTodo(todo: TodoView): () => void {
		const previous = draftTodos;
		draftTodos = applyTodoToggle(draftTodos, todo);
		return () => (draftTodos = previous);
	}

	function updateTodo(todo: TodoView, formData: FormData): () => void {
		const previous = draftTodos;
		draftTodos = applyTodoUpdate(draftTodos, todo, formData);
		return () => (draftTodos = previous);
	}

	function removeTodo(todo: TodoView): () => void {
		const previous = draftTodos;
		draftTodos = applyTodoRemove(draftTodos, todo);
		return () => (draftTodos = previous);
	}
</script>

<div class="todo-list-shell" class:compact>
	<TodoAddForm
		action={addAction}
		{today}
		priorityOptions={TODO_PRIORITY_OPTIONS}
		{compact}
		onAdd={addTodo}
		onError={setError}
	/>

	{#if showFilters}
		<SegmentedControl options={filterTabs} bind:value={filter} />
	{/if}

	{#if errorMessage}
		<div class="todo-error" role="alert">{errorMessage}</div>
	{/if}

	{#if visibleTodos.length === 0}
		<div class="empty-state" class:inline={emptyMode === 'inline'}>
			{#if emptyMode === 'inline'}
				<CheckCircle2 class="empty-icon" size={22} strokeWidth={1.8} aria-hidden="true" />
			{:else}
				<div class="empty-icon center-icon">
					<ClipboardList size={40} strokeWidth={1.5} />
				</div>
			{/if}
			<div>
				<p>{showFilters && filter === 'done' ? 'Nothing done yet' : showFilters && filter === 'pending' ? 'All clear' : emptyTitle}</p>
				<span>
					{showFilters && filter === 'done'
						? 'Complete a task to see it here.'
						: showFilters && filter === 'pending'
							? 'No pending tasks right now.'
							: emptyDescription}
				</span>
			</div>
		</div>
	{:else}
		<ul class="todo-list" class:compact>
			{#each visibleTodos as todo (todo.ui_id ?? todo.id)}
				<TodoRow
					{todo}
					{today}
					priorityOptions={TODO_PRIORITY_OPTIONS}
					priorityLabels={TODO_PRIORITY_LABELS}
					editing={editingId === todo.id}
					busy={isOptimisticTodo(todo)}
					{showDueDate}
					{showDescription}
					{toggleAction}
					{updateAction}
					{removeAction}
					setEditing={(id) => (editingId = id)}
					onToggle={toggleTodo}
					onUpdate={updateTodo}
					onRemove={removeTodo}
					onError={setError}
				/>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.todo-list-shell {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 12px;
	}

	.todo-list-shell.compact {
		gap: 10px;
	}

	.todo-error {
		border-radius: var(--radius-md);
		background: var(--danger-soft);
		color: var(--danger);
		padding: 10px 12px;
		font-size: 13px;
		line-height: 1.4;
	}

	.todo-list {
		display: flex;
		list-style: none;
		margin: 0;
		padding: 0;
		flex-direction: column;
		gap: 4px;
	}

	.todo-list.compact {
		gap: 2px;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 48px 24px;
		gap: 8px;
	}

	.empty-state.inline {
		flex-direction: row;
		align-items: center;
		text-align: left;
		gap: 12px;
		padding: 18px;
		border-radius: var(--radius-lg);
		background: var(--surface-2);
		color: var(--text-secondary);
	}

	.empty-icon {
		display: flex;
		flex-shrink: 0;
		color: var(--text-tertiary);
	}

	.center-icon {
		margin-bottom: 8px;
	}

	.empty-state p {
		margin: 0;
		color: var(--text-primary);
		font-size: 17px;
		font-weight: 600;
		line-height: 1.3;
	}

	.empty-state.inline p {
		font-size: 14px;
		font-weight: 500;
	}

	.empty-state span {
		display: block;
		max-width: 300px;
		margin-top: 1px;
		color: var(--text-secondary);
		font-size: 14px;
		line-height: 1.45;
	}

	.empty-state.inline span {
		color: var(--text-tertiary);
		font-size: 13px;
	}

	@media (max-width: 560px) {
		.todo-list-shell {
			gap: 10px;
		}

		.empty-state {
			padding: 36px 16px;
		}

		.empty-state.inline {
			padding: 14px;
		}
	}
</style>
