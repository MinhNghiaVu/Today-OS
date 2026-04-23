<script lang="ts">
	import { todos } from '$lib/stores';
	import type { Todo, TodoPriority, TodoStatus } from '$lib/types';

	type Filter = 'all' | TodoStatus;

	const priorityOpts: { value: TodoPriority | ''; label: string }[] = [
		{ value: '', label: 'No priority' },
		{ value: 'high', label: 'High' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'low', label: 'Low' }
	];

	const priorityLabels: Record<TodoPriority, string> = { high: 'High', medium: 'Med', low: 'Low' };

	let filter: Filter = 'all';

	// Add form
	let newTitle = '';
	let newDueDate = '';
	let newPriority: TodoPriority | '' = '';

	function addTodo() {
		const t = newTitle.trim();
		if (!t) return;
		todos.add(t, {
			due_date: newDueDate || undefined,
			priority: newPriority || undefined
		});
		newTitle = '';
		newDueDate = '';
		newPriority = '';
	}

	// Edit state
	let editingId: string | null = null;
	let editTitle = '';
	let editDescription = '';
	let editDueDate = '';
	let editPriority: TodoPriority | '' = '';

	function startEdit(todo: Todo) {
		editingId = todo.id;
		editTitle = todo.title;
		editDescription = todo.description ?? '';
		editDueDate = todo.due_date ?? '';
		editPriority = todo.priority ?? '';
	}

	function saveEdit() {
		if (!editingId || !editTitle.trim()) return;
		todos.update(editingId, {
			title: editTitle.trim(),
			description: editDescription.trim() || undefined,
			due_date: editDueDate || undefined,
			priority: editPriority || undefined
		});
		editingId = null;
	}

	function cancelEdit() {
		editingId = null;
	}

	function confirmDelete(todo: Todo) {
		if (confirm(`Delete "${todo.title}"?`)) {
			todos.remove(todo.id);
			if (editingId === todo.id) editingId = null;
		}
	}

	$: filtered = $todos.filter((t) => filter === 'all' || t.status === filter).sort((a, b) => {
		if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
		const rank: Record<string, number> = { high: 0, medium: 1, low: 2 };
		const pa = rank[a.priority ?? ''] ?? 3;
		const pb = rank[b.priority ?? ''] ?? 3;
		return pa - pb;
	});

	$: counts = {
		all: $todos.length,
		pending: $todos.filter((t) => t.status === 'pending').length,
		done: $todos.filter((t) => t.status === 'done').length
	};
</script>

<div class="page">
	<div class="header">
		<h1>Todos</h1>
		<span class="total-badge">{counts.pending} pending</span>
	</div>

	<!-- Add form -->
	<form class="add-form" on:submit|preventDefault={addTodo}>
		<div class="add-main">
			<input
				class="add-title"
				bind:value={newTitle}
				placeholder="Add a task…"
				autocomplete="off"
			/>
		</div>
		<div class="add-meta">
			<input type="date" class="meta-input" bind:value={newDueDate} title="Due date" />
			<select class="meta-input" bind:value={newPriority}>
				{#each priorityOpts as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
			<button type="submit" class="btn-primary" disabled={!newTitle.trim()}>Add</button>
		</div>
	</form>

	<!-- Filter tabs -->
	<div class="filter-tabs">
		{#each (['all', 'pending', 'done'] as Filter[]) as tab}
			<button
				class="tab"
				class:active={filter === tab}
				on:click={() => (filter = tab)}
			>
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
						<form class="edit-form" on:submit|preventDefault={saveEdit}>
							<input class="edit-title" bind:value={editTitle} placeholder="Title" required />
							<textarea
								class="edit-desc"
								bind:value={editDescription}
								placeholder="Description (optional)"
								rows="2"
							></textarea>
							<div class="edit-meta">
								<input type="date" class="meta-input" bind:value={editDueDate} title="Due date" />
								<select class="meta-input" bind:value={editPriority}>
									{#each priorityOpts as opt}
										<option value={opt.value}>{opt.label}</option>
									{/each}
								</select>
							</div>
							<div class="edit-actions">
								<button type="submit" class="btn-primary">Save</button>
								<button type="button" class="btn-ghost" on:click={cancelEdit}>Cancel</button>
							</div>
						</form>
					{:else}
						<!-- Normal row -->
						<button
							class="check"
							class:checked={todo.status === 'done'}
							on:click={() => todos.toggle(todo.id)}
							aria-label="toggle"
						>
							{#if todo.status === 'done'}✓{/if}
						</button>
						<div class="todo-body">
							<div class="todo-top">
								<span class="todo-title">{todo.title}</span>
								{#if todo.priority}
									<span class="priority-badge priority-{todo.priority}">{priorityLabels[todo.priority]}</span>
								{/if}
								{#if todo.due_date}
									<span class="due-date" class:overdue={todo.status === 'pending' && todo.due_date < new Date().toISOString().slice(0, 10)}>
										{todo.due_date}
									</span>
								{/if}
							</div>
							{#if todo.description}
								<p class="todo-desc">{todo.description}</p>
							{/if}
						</div>
						<div class="actions">
							<button class="act-btn" on:click={() => startEdit(todo)} title="Edit">✎</button>
							<button class="act-btn danger" on:click={() => confirmDelete(todo)} title="Delete">✕</button>
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

	/* Add form */
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

	/* Filter tabs */
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

	/* Todo list */
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
		align-items: flex-start;
		gap: 10px;
		padding: 10px 12px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		transition: border-color 0.1s;
	}

	.todo-list li:hover {
		border-color: var(--accent);
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
		margin-top: 2px;
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

	/* Priority badges */
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

	/* Actions */
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

	/* Edit form */
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

	/* Shared buttons */
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

	.btn-primary:disabled {
		opacity: 0.4;
		cursor: default;
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
</style>
