<script lang="ts">
	import { CheckCircle2, ClipboardList } from 'lucide-svelte';
	import SegmentedControl from '$lib/components/SegmentedControl.svelte';
	import TodoAddForm from '$lib/components/TodoAddForm.svelte';
	import TodoRow from '$lib/components/TodoRow.svelte';
	import type { Todo } from '$lib/types';
	import type { OptimisticMutation } from '$lib/utils/optimistic';
	import {
		TODO_PRIORITY_LABELS,
		TODO_PRIORITY_OPTIONS,
		applyTodoRemove,
		applyTodoToggle,
		applyTodoUpdate,
		createOptimisticTodo,
		getTodoActionTodo,
		getTodoStats,
		isOptimisticTodo,
		normalizeTodoPriority,
		reconcileTodos,
		replaceTodoWithServer,
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
	let pendingTodoIds = new Set<string>();
	let pendingAddedTodoIds = new Set<string>();
	let pendingRemovedTodoIds = new Set<string>();

	$: if (todos !== lastTodos) {
		draftTodos = reconcileTodos(todos, draftTodos, {
			pendingIds: pendingTodoIds,
			pendingAddedIds: pendingAddedTodoIds,
			pendingRemovedIds: pendingRemovedTodoIds
		});
		lastTodos = todos;
		if (editingId && !draftTodos.some((todo) => todo.id === editingId)) editingId = null;
	}

	$: sortedTodos = sortTodos(draftTodos);
	$: visibleTodos = sortedTodos.filter((todo) => filter === 'all' || todo.status === filter);
	$: stats = getTodoStats(draftTodos);
	$: filterTabs = [
		{ value: 'all', label: `All (${stats.all})` },
		{ value: 'pending', label: `Pending (${stats.pending})` },
		{ value: 'done', label: `Done (${stats.done})` }
	];

	function setError(message: string | null) {
		errorMessage = message;
	}

	function addPending(id: string, added = false) {
		pendingTodoIds = new Set(pendingTodoIds).add(id);
		if (added) pendingAddedTodoIds = new Set(pendingAddedTodoIds).add(id);
	}

	function addPendingRemove(id: string) {
		pendingTodoIds = new Set(pendingTodoIds).add(id);
		pendingRemovedTodoIds = new Set(pendingRemovedTodoIds).add(id);
	}

	function clearPending(id: string) {
		const nextPending = new Set(pendingTodoIds);
		const nextAdded = new Set(pendingAddedTodoIds);
		const nextRemoved = new Set(pendingRemovedTodoIds);
		nextPending.delete(id);
		nextAdded.delete(id);
		nextRemoved.delete(id);
		pendingTodoIds = nextPending;
		pendingAddedTodoIds = nextAdded;
		pendingRemovedTodoIds = nextRemoved;
	}

	function replacePendingId(previousId: string, nextId: string, added = false) {
		clearPending(previousId);
		pendingTodoIds = new Set(pendingTodoIds).add(nextId);
		if (added) pendingAddedTodoIds = new Set(pendingAddedTodoIds).add(nextId);
	}

	function addTodo(formData: FormData): OptimisticMutation {
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

		if (!optimistic) {
			return { rollback: () => {} };
		}

		addPending(optimistic.id, true);
		draftTodos = [...draftTodos, optimistic];
		return {
			rollback: () => {
				draftTodos = draftTodos.filter((todo) => todo.id !== optimistic.id);
				clearPending(optimistic.id);
			},
			reconcile: (result) => {
				const serverTodo = getTodoActionTodo(result);
				if (!serverTodo) return;
				draftTodos = replaceTodoWithServer(draftTodos, optimistic.id, serverTodo);
				replacePendingId(optimistic.id, serverTodo.id, true);
			},
			settle: () => {
				const serverTodo = draftTodos.find((todo) => todo.ui_id === optimistic.id);
				clearPending(serverTodo?.id ?? optimistic.id);
			}
		};
	}

	function toggleTodo(todo: TodoView): OptimisticMutation {
		const previous = draftTodos;
		addPending(todo.id);
		draftTodos = applyTodoToggle(draftTodos, todo);
		return {
			rollback: () => {
				draftTodos = previous;
				clearPending(todo.id);
			},
			reconcile: (result) => {
				const serverTodo = getTodoActionTodo(result);
				if (serverTodo) draftTodos = replaceTodoWithServer(draftTodos, todo.id, serverTodo);
			},
			settle: () => clearPending(todo.id)
		};
	}

	function updateTodo(todo: TodoView, formData: FormData): OptimisticMutation {
		const previous = draftTodos;
		addPending(todo.id);
		draftTodos = applyTodoUpdate(draftTodos, todo, formData);
		return {
			rollback: () => {
				draftTodos = previous;
				clearPending(todo.id);
			},
			reconcile: (result) => {
				const serverTodo = getTodoActionTodo(result);
				if (serverTodo) draftTodos = replaceTodoWithServer(draftTodos, todo.id, serverTodo);
			},
			settle: () => clearPending(todo.id)
		};
	}

	function removeTodo(todo: TodoView): OptimisticMutation {
		const previous = draftTodos;
		addPendingRemove(todo.id);
		draftTodos = applyTodoRemove(draftTodos, todo);
		return {
			rollback: () => {
				draftTodos = previous;
				clearPending(todo.id);
			},
			reconcile: () => {},
			settle: () => clearPending(todo.id)
		};
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
