<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { cubicOut, cubicIn } from 'svelte/easing';
	import { ClipboardList } from 'lucide-svelte';
	import Select from '$lib/components/Select.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl.svelte';
	import type { PageData } from './$types';
	import type { Todo, TodoPriority, TodoStatus } from '$lib/types';

	export let data: PageData;

	type Filter = 'all' | TodoStatus;

	const priorityOpts: { value: TodoPriority | ''; label: string }[] = [
		{ value: '', label: 'No priority' },
		{ value: 'high', label: 'High' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'low', label: 'Low' }
	];

	const priorityLabels: Record<TodoPriority, string> = { high: 'High', medium: 'Med', low: 'Low' };

	let filter: Filter = 'all';
	let todos: Todo[] = data.todos;
	let optimisticTodoSeq = 0;
	$: filterTabs = [
		{ value: 'all', label: `All ${counts.all}` },
		{ value: 'pending', label: `Pending ${counts.pending}` },
		{ value: 'done', label: `Done ${counts.done}` }
	];
	let editingId: string | null = null;

	$: if (data.todos) todos = data.todos;
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

	function formatShortDate(value: unknown): string {
		const input = dateInputValue(value);
		if (!input) return '';
		const [year, month, day] = input.split('-');
		return `${day}/${month}/${year.slice(2)}`;
	}

	function makeOptimisticTodo(
		title: string,
		dueDate: string | null,
		priority: TodoPriority | null
	): Todo {
		const now = new Date().toISOString();
		optimisticTodoSeq += 1;
		return {
			id: `optimistic-todo-${Date.now()}-${optimisticTodoSeq}`,
			user_id: 'optimistic',
			title,
			status: 'pending',
			due_date: dueDate ?? undefined,
			priority: priority ?? undefined,
			created_at: now
		};
	}
</script>

<div class="page">
	<header class="page-header">
		<h1>Todos</h1>
		<span class="total-badge">{counts.pending} pending</span>
	</header>

	<!-- Add form: title input standalone, meta row separate per §8.2 -->
	<form
		method="POST"
		action="?/add"
		class="add-form"
		use:enhance={({ formData, formElement }) => {
			const title = String(formData.get('title') ?? '').trim();
			const dueDate = String(formData.get('due_date') ?? '') || null;
			const priority = (String(formData.get('priority') ?? '') || null) as TodoPriority | null;
			const optimistic = title ? makeOptimisticTodo(title, dueDate, priority) : null;
			if (optimistic) todos = [...todos, optimistic];
			formElement.reset();
			return async ({ result }) => {
				if (result.type === 'failure' || result.type === 'error') {
					if (optimistic) todos = todos.filter((todo) => todo.id !== optimistic.id);
				}
			};
		}}
	>
		<input
			class="add-title"
			name="title"
			placeholder="Add a task…"
			autocomplete="off"
			required
		/>
		<div class="add-meta">
			<input type="date" class="meta-input" name="due_date" value={todayStr} />
			<Select name="priority" options={priorityOpts} />
			<button type="submit" class="btn-primary">Add</button>
		</div>
	</form>

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
			{#each filtered as todo (todo.id)}
				<li
					class:done={todo.status === 'done'}
					in:fly={{ y: -8, duration: 220, easing: cubicOut }}
					out:fly={{ y: 4, duration: 160, easing: cubicIn }}
					animate:flip={{ duration: 220, easing: cubicOut }}
				>
					{#if editingId === todo.id}
						<form
							method="POST"
							action="?/update"
							class="edit-form"
							use:enhance={({ formData }) => {
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
								return async ({ result }) => {
									if (result.type === 'success') editingId = null;
									if (result.type === 'failure' || result.type === 'error') {
										todos = previous;
									}
								};
							}}
						>
							<input type="hidden" name="id" value={todo.id} />
							<input
								class="edit-title"
								name="title"
								value={todo.title}
								placeholder="Title"
								required
							/>
							<textarea
								class="edit-desc"
								name="description"
								placeholder="Description (optional)"
								rows="2">{todo.description ?? ''}</textarea
							>
							<div class="edit-meta">
								<input
									type="date"
									class="meta-input"
									name="due_date"
									value={dateInputValue(todo.due_date)}
								/>
								<Select name="priority" options={priorityOpts} value={todo.priority ?? ''} />
							</div>
							<div class="edit-actions">
								<button type="submit" class="btn-primary">Save</button>
								<button type="button" class="btn-ghost" on:click={() => (editingId = null)}
									>Cancel</button
								>
							</div>
						</form>
					{:else}
						<form
							method="POST"
							action="?/toggle"
							use:enhance={() => {
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
								return async ({ result }) => {
									if (result.type === 'failure' || result.type === 'error') {
										todos = previous;
									}
								};
							}}
						>
							<input type="hidden" name="id" value={todo.id} />
							<input type="hidden" name="status" value={todo.status} />
							<button
								type="submit"
								class="check"
								class:checked={todo.status === 'done'}
								aria-label={todo.status === 'done' ? 'Mark pending' : 'Mark done'}
							>
								{#if todo.status === 'done'}✓{/if}
							</button>
						</form>
						<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
						<div class="todo-body" on:click={() => (editingId = todo.id)}>
							<div class="todo-top">
								<span class="todo-title">{todo.title}</span>
								{#if todo.priority}
									<span class="priority-badge priority-{todo.priority}"
										>{priorityLabels[todo.priority]}</span
									>
								{/if}
								{#if todo.due_date}
									<span
										class="due-date"
										class:overdue={todo.status === 'pending' && dateInputValue(todo.due_date) < todayStr}
									>
										{formatShortDate(todo.due_date)}
									</span>
								{/if}
							</div>
							{#if todo.description}
								<p class="todo-desc">{todo.description}</p>
							{/if}
						</div>
						<div class="actions">
							<form
								method="POST"
								action="?/remove"
								use:enhance={({ cancel }) => {
									if (!confirm(`Delete "${todo.title}"?`)) {
										cancel();
										return;
									}
									const previous = todos;
									todos = todos.filter((item) => item.id !== todo.id);
									return async ({ result }) => {
										if (result.type === 'failure' || result.type === 'error') {
											todos = previous;
										}
									};
								}}
							>
								<input type="hidden" name="id" value={todo.id} />
								<button type="submit" class="act-btn danger" title="Delete" aria-label="delete"
									>✕</button
								>
							</form>
						</div>
					{/if}
				</li>
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

	/* ── Header ── */
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

	/* ── Add form ── */
	.add-form {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.add-title {
		width: 100%;
		height: 36px;
		background: var(--surface-2);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: 14px;
		font-family: inherit;
		padding: 0 12px;
		outline: none;
		transition: border-color 120ms var(--ease-out);
	}

	.add-title::placeholder {
		color: var(--text-tertiary);
	}

	.add-title:hover {
		border-color: var(--border-strong);
	}

	.add-title:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.add-meta {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.meta-input {
		height: 36px;
		background: var(--surface-2);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		padding: 0 10px;
		color: var(--text-primary);
		font-size: 13px;
		font-family: inherit;
		outline: none;
		transition: border-color 120ms var(--ease-out);
	}

	.meta-input:hover {
		border-color: var(--border-strong);
	}

	.meta-input:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	/* ── Todo list ── */
	.todo-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.todo-list li {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		border-radius: var(--radius-md);
		transition: background-color 120ms var(--ease-out);
	}

	.todo-list li:hover {
		background: var(--surface-2);
	}

	.todo-list li.done {
		opacity: 0.5;
	}

	/* ── Checkbox ── */
	.check {
		width: 20px;
		height: 20px;
		border: 1.5px solid var(--border-default);
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--text-on-accent);
		font-size: 11px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition:
			background-color 120ms var(--ease-out),
			border-color 120ms var(--ease-out);
	}

	.check.checked {
		background: var(--accent);
		border-color: var(--accent);
	}

	.check:hover:not(.checked) {
		border-color: var(--accent);
	}

	/* ── Todo row body ── */
	.todo-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
		cursor: pointer;
	}

	.todo-top {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.todo-title {
		font-size: 14px;
		font-weight: 500;
		color: var(--text-primary);
	}

	li.done .todo-title {
		text-decoration: line-through;
		color: var(--text-secondary);
	}

	.todo-desc {
		margin: 0;
		font-size: 13px;
		color: var(--text-secondary);
		line-height: 1.4;
	}

	/* ── Priority badges ── */
	.priority-badge {
		font-size: 12px;
		font-weight: 500;
		padding: 1px 6px;
		border-radius: var(--radius-full);
	}

	.priority-high   { background: var(--danger-soft);  color: var(--danger);  }
	.priority-medium { background: var(--warning-soft); color: var(--warning); }
	.priority-low    { background: var(--info-soft);    color: var(--info);    }

	.due-date {
		font-size: 12px;
		color: var(--text-secondary);
	}

	.due-date.overdue {
		color: var(--danger);
	}

	/* ── Row actions ── */
	.actions {
		display: flex;
		gap: 4px;
		opacity: 0;
		transition: opacity 120ms var(--ease-out);
		flex-shrink: 0;
	}

	.todo-list li:hover .actions {
		opacity: 1;
	}

	.act-btn {
		width: 28px;
		height: 28px;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-tertiary);
		font-size: 12px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			color 120ms var(--ease-out),
			border-color 120ms var(--ease-out);
	}

	.act-btn:hover {
		color: var(--text-primary);
		border-color: var(--border-strong);
	}

	.act-btn.danger:hover {
		color: var(--danger);
		border-color: var(--danger);
	}

	/* ── Inline edit form ── */
	.edit-form {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.edit-title {
		width: 100%;
		height: 36px;
		background: var(--surface-2);
		border: 1px solid var(--accent);
		border-radius: var(--radius-md);
		padding: 0 10px;
		color: var(--text-primary);
		font-size: 14px;
		font-family: inherit;
		outline: none;
	}

	.edit-desc {
		width: 100%;
		background: var(--surface-2);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		padding: 8px 10px;
		color: var(--text-primary);
		font-size: 13px;
		font-family: inherit;
		outline: none;
		resize: vertical;
		min-height: 64px;
	}

	.edit-desc:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.edit-meta {
		display: flex;
		gap: 8px;
	}

	.edit-actions {
		display: flex;
		gap: 8px;
	}

	/* ── Buttons ── */
	.btn-primary {
		height: 36px;
		padding: 0 16px;
		background: var(--accent);
		color: var(--text-on-accent);
		border: none;
		border-radius: var(--radius-md);
		font-size: 13px;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		white-space: nowrap;
		transition:
			background-color 120ms var(--ease-out),
			transform 120ms var(--ease-out);
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.btn-primary:active:not(:disabled) {
		background: var(--accent-pressed);
		transform: translateY(1px);
	}

	.btn-ghost {
		height: 36px;
		padding: 0 16px;
		background: var(--surface-2);
		color: var(--text-primary);
		border: none;
		border-radius: var(--radius-md);
		font-size: 13px;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		transition: background-color 120ms var(--ease-out);
	}

	.btn-ghost:hover {
		background: var(--surface-3);
	}

	/* ── Empty state ── */
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

	/* ── Utility ── */
	.actions form {
		display: contents;
	}

	@media (max-width: 560px) {
		.page {
			padding: 28px 16px;
		}

		.add-meta,
		.edit-meta {
			display: grid;
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}

		.add-meta .btn-primary {
			grid-column: 1 / -1;
			width: 100%;
		}

		.actions {
			opacity: 1;
		}

		.todo-list li {
			align-items: flex-start;
			padding-inline: 8px;
		}
	}
</style>
