<script lang="ts">
	import { enhance } from '$app/forms';
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
	let editingId: string | null = null;

	$: filtered = data.todos
		.filter((t) => filter === 'all' || t.status === filter)
		.sort((a, b) => {
			if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
			const rank: Record<string, number> = { high: 0, medium: 1, low: 2 };
			return (rank[a.priority ?? ''] ?? 3) - (rank[b.priority ?? ''] ?? 3);
		});

	$: counts = {
		all: data.todos.length,
		pending: data.todos.filter((t) => t.status === 'pending').length,
		done: data.todos.filter((t) => t.status === 'done').length
	};

	const todayStr = new Date().toISOString().slice(0, 10);
</script>

<div class="page">
	<div class="header">
		<h1>Todos</h1>
		<span class="total-badge">{counts.pending} pending</span>
	</div>

	<!-- Add form -->
	<form
		method="POST"
		action="?/add"
		class="add-form"
		use:enhance={() => async ({ update }) => update()}
	>
		<div class="add-main">
			<input class="add-title" name="title" placeholder="Add a task…" autocomplete="off" required />
		</div>
		<div class="add-meta">
			<input type="date" class="meta-input" name="due_date" value={todayStr} />
			<select class="meta-input" name="priority">
				{#each priorityOpts as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
			<button type="submit" class="btn-primary">Add</button>
		</div>
	</form>

	<!-- Filter tabs -->
	<div class="filter-tabs">
		{#each (['all', 'pending', 'done'] as Filter[]) as tab}
			<button class="tab" class:active={filter === tab} on:click={() => (filter = tab)}>
				{tab.charAt(0).toUpperCase() + tab.slice(1)}
				<span class="tab-count">{counts[tab]}</span>
			</button>
		{/each}
	</div>

	<!-- Todo list -->
	{#if filtered.length === 0}
		<p class="empty">No tasks here.</p>
	{:else}
		<ul class="todo-list">
			{#each filtered as todo (todo.id)}
				<li class:done={todo.status === 'done'}>
					{#if editingId === todo.id}
						<!-- Inline edit form -->
						<form
							method="POST"
							action="?/update"
							class="edit-form"
							use:enhance={() => async ({ result, update }) => {
								if (result.type === 'success') editingId = null;
								await update();
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
									value={todo.due_date ?? ''}
								/>
								<select class="meta-input" name="priority">
									{#each priorityOpts as opt}
										<option value={opt.value} selected={todo.priority === opt.value || (!todo.priority && opt.value === '')}>{opt.label}</option>
									{/each}
								</select>
							</div>
							<div class="edit-actions">
								<button type="submit" class="btn-primary">Save</button>
								<button type="button" class="btn-ghost" on:click={() => (editingId = null)}>Cancel</button>
							</div>
						</form>
					{:else}
						<!-- Normal row -->
						<form method="POST" action="?/toggle" use:enhance>
							<input type="hidden" name="id" value={todo.id} />
							<input type="hidden" name="status" value={todo.status} />
							<button
								type="submit"
								class="check"
								class:checked={todo.status === 'done'}
								aria-label="toggle"
							>
								{#if todo.status === 'done'}✓{/if}
							</button>
						</form>
						<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
						<div class="todo-body" on:click={() => (editingId = todo.id)}>
							<div class="todo-top">
								<span class="todo-title">{todo.title}</span>
								{#if todo.priority}
									<span class="priority-badge priority-{todo.priority}">{priorityLabels[todo.priority]}</span>
								{/if}
								{#if todo.due_date}
									<span
										class="due-date"
										class:overdue={todo.status === 'pending' && todo.due_date < todayStr}
									>
										{todo.due_date}
									</span>
								{/if}
							</div>
							{#if todo.description}
								<p class="todo-desc">{todo.description}</p>
							{/if}
						</div>
						<div class="actions">
							<form method="POST" action="?/remove" use:enhance={({ cancel }) => {
								if (!confirm(`Delete "${todo.title}"?`)) cancel();
								return async ({ update }) => update();
							}}>
								<input type="hidden" name="id" value={todo.id} />
								<button type="submit" class="act-btn danger" title="Delete" aria-label="delete">✕</button>
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
		max-width: 600px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.header {
		display: flex;
		align-items: baseline;
		gap: 12px;
	}

	h1 {
		margin: 0;
		font-size: 24px;
		font-weight: 600;
	}

	.total-badge {
		font-size: 13px;
		color: var(--muted);
	}

	.add-form {
		display: flex;
		flex-direction: column;
		gap: 8px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 12px;
	}

	.add-title {
		width: 100%;
		background: transparent;
		border: none;
		color: var(--text);
		font-size: 15px;
		outline: none;
		padding: 4px 0;
	}

	.add-title::placeholder {
		color: var(--muted);
	}

	.add-meta {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.meta-input {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 6px 10px;
		color: var(--text);
		font-size: 13px;
		outline: none;
	}

	.meta-input:focus {
		border-color: var(--accent);
	}

	.filter-tabs {
		display: flex;
		gap: 4px;
	}

	.tab {
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 6px 14px;
		font-size: 13px;
		color: var(--muted);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 6px;
		transition: background 0.1s, color 0.1s;
	}

	.tab:hover {
		background: var(--border);
		color: var(--text);
	}

	.tab.active {
		background: var(--accent);
		color: #fff;
		border-color: var(--accent);
	}

	.tab-count {
		font-size: 11px;
		opacity: 0.75;
	}

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
		gap: 10px;
		padding: 10px 12px;
		border-radius: 8px;
		transition: background 0.15s;
	}

	.todo-list li:hover {
		background: var(--surface);
	}

	.todo-list li.done {
		opacity: 0.55;
	}

	.check {
		width: 20px;
		height: 20px;
		border: 1.5px solid var(--border);
		border-radius: 50%;
		background: transparent;
		color: #fff;
		font-size: 11px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background 0.1s, border-color 0.1s;
	}

	.check.checked {
		background: var(--accent);
		border-color: var(--accent);
	}

	.check:hover:not(.checked) {
		border-color: var(--accent);
	}

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
		font-weight: 450;
	}

	li.done .todo-title {
		text-decoration: line-through;
	}

	.todo-desc {
		margin: 0;
		font-size: 12px;
		color: var(--muted);
		line-height: 1.4;
	}

	.priority-badge {
		font-size: 11px;
		font-weight: 500;
		padding: 1px 6px;
		border-radius: 999px;
	}

	.priority-high { background: #ef444420; color: #ef4444; }
	.priority-medium { background: #f59e0b20; color: #f59e0b; }
	.priority-low { background: #3b82f620; color: #3b82f6; }

	.due-date {
		font-size: 12px;
		color: var(--muted);
	}

	.due-date.overdue {
		color: #ef4444;
	}

	.actions {
		display: flex;
		gap: 4px;
		opacity: 0;
		transition: opacity 0.1s;
		flex-shrink: 0;
	}

	.todo-list li:hover .actions {
		opacity: 1;
	}

	.act-btn {
		width: 26px;
		height: 26px;
		border: 1px solid var(--border);
		border-radius: 5px;
		background: transparent;
		color: var(--muted);
		font-size: 13px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.1s, border-color 0.1s;
	}

	.act-btn:hover {
		color: var(--text);
		border-color: var(--text);
	}

	.act-btn.danger:hover {
		color: #ef4444;
		border-color: #ef4444;
	}

	.edit-form {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.edit-title {
		background: var(--bg);
		border: 1px solid var(--accent);
		border-radius: 6px;
		padding: 6px 10px;
		color: var(--text);
		font-size: 14px;
		outline: none;
		width: 100%;
	}

	.edit-desc {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 6px 10px;
		color: var(--text);
		font-size: 13px;
		outline: none;
		resize: vertical;
		width: 100%;
		font-family: inherit;
	}

	.edit-desc:focus {
		border-color: var(--accent);
	}

	.edit-meta {
		display: flex;
		gap: 8px;
	}

	.edit-actions {
		display: flex;
		gap: 8px;
	}

	.btn-primary {
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 6px;
		padding: 7px 16px;
		font-size: 13px;
		cursor: pointer;
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.btn-ghost {
		background: var(--border);
		color: var(--text);
		border: none;
		border-radius: 6px;
		padding: 7px 16px;
		font-size: 13px;
		cursor: pointer;
	}

	.empty {
		color: var(--muted);
		font-size: 14px;
		margin: 0;
	}

	.actions form {
		display: contents;
	}
</style>
