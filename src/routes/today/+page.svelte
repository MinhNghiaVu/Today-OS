<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import type { TodoPriority } from '$lib/types';

	export let data: PageData;

	const dateLabel = new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric'
	});

	const todayStr = new Date().toISOString().slice(0, 10);

	const priorityOpts: { value: TodoPriority | ''; label: string }[] = [
		{ value: '', label: 'No priority' },
		{ value: 'high', label: 'High' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'low', label: 'Low' }
	];

	const priorityLabels: Record<TodoPriority, string> = { high: 'High', medium: 'Med', low: 'Low' };

	let newTodo = '';
	let editingId: string | null = null;
	let activeHabitId: string | null = null;
	let logAmount = '';

	function openLog(id: string) {
		activeHabitId = id;
		logAmount = '';
	}
</script>

<div class="page">
	<h1>{dateLabel}</h1>

	<!-- Todos -->
	<section>
		<h2>Todos</h2>

		<form
			method="POST"
			action="?/addTodo"
			class="add-row"
			use:enhance={() => {
				const t = newTodo;
				newTodo = '';
				return async ({ update }) => {
					newTodo = t && false ? t : '';
					await update();
				};
			}}
		>
			<input bind:value={newTodo} name="title" placeholder="Add a task…" autocomplete="off" />
			<button type="submit">Add</button>
		</form>

		<ul class="todo-list">
			{#each data.todosToday as todo (todo.id)}
				<li class:done={todo.status === 'done'}>
					{#if editingId === todo.id}
						<form
							method="POST"
							action="?/updateTodo"
							class="edit-form"
							use:enhance={() => async ({ result, update }) => {
								if (result.type === 'success') editingId = null;
								await update();
							}}
						>
							<input type="hidden" name="id" value={todo.id} />
							<input class="edit-title" name="title" value={todo.title} required />
							<div class="edit-meta">
								<input type="date" class="meta-input" name="due_date" value={todo.due_date ?? todayStr} />
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
						<form method="POST" action="?/toggleTodo" use:enhance>
							<input type="hidden" name="id" value={todo.id} />
							<input type="hidden" name="status" value={todo.status} />
							<button type="submit" class="check" class:checked={todo.status === 'done'} aria-label="toggle">
								{#if todo.status === 'done'}✓{/if}
							</button>
						</form>
						<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
						<div class="todo-body" on:click={() => (editingId = todo.id)}>
							<span class="todo-title">{todo.title}</span>
							{#if todo.priority}
								<span class="p-badge p-{todo.priority}">{priorityLabels[todo.priority]}</span>
							{/if}
						</div>
						<div class="actions">
							<form method="POST" action="?/removeTodo" use:enhance>
								<input type="hidden" name="id" value={todo.id} />
								<button type="submit" class="del" aria-label="delete">×</button>
							</form>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	</section>

	<!-- Habits -->
	<section>
		<h2>Habits</h2>

		<div class="habits-box">
		<ul class="habit-list">
			{#each data.habitTotals as habit (habit.id)}
				<li>
					<div class="habit-info">
						<span class="habit-name">{habit.name}</span>
						<div class="habit-right">
							<span class="habit-count">
								{habit.total}{habit.daily_goal !== null ? ` / ${habit.daily_goal}` : ''} {habit.unit}
							</span>
							<button class="log-btn" on:click={() => openLog(habit.id)} aria-label="log">+</button>
						</div>
					</div>
					<div class="bar-track">
						<div
							class="bar-fill"
							class:bar-met={habit.type === 'min_goal' && habit.daily_goal !== null && habit.total >= habit.daily_goal}
							class:bar-warn={habit.type === 'max_goal' && habit.daily_goal !== null && habit.total > habit.daily_goal}
							style="
								width: {habit.daily_goal ? Math.min(100, (habit.total / habit.daily_goal) * 100) : 100}%;
								background: {habit.color};
							"
						></div>
					</div>
					{#if activeHabitId === habit.id}
						<form
							method="POST"
							action="?/logHabit"
							class="log-row"
							use:enhance={() => {
								logAmount = '';
								activeHabitId = null;
								return async ({ update }) => update();
							}}
						>
							<input type="hidden" name="habit_id" value={habit.id} />
							<input
								type="number"
								name="value"
								min="0"
								step="any"
								bind:value={logAmount}
								placeholder="Amount…"
						/>
							<button type="submit">Log</button>
							<button type="button" on:click={() => (activeHabitId = null)}>Cancel</button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
		</div>
	</section>
</div>

<style>
	.page {
		max-width: 560px;
		display: flex;
		flex-direction: column;
		gap: 40px;
	}

	h1 {
		margin: 0;
		font-size: 24px;
		font-weight: 600;
	}

	h2 {
		margin: 0 0 16px;
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}

	section {
		display: flex;
		flex-direction: column;
	}

	/* Todos */
	.add-row {
		display: flex;
		gap: 8px;
		margin-bottom: 12px;
	}

	.add-row input {
		flex: 1;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 8px 12px;
		color: var(--text);
		font-size: 14px;
		outline: none;
	}

	.add-row input:focus {
		border-color: var(--accent);
	}

	.add-row button {
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 6px;
		padding: 8px 16px;
		font-size: 14px;
		cursor: pointer;
	}

	.add-row button:hover {
		background: var(--accent-hover);
	}

	.todo-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.todo-list li {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		border-radius: 8px;
		transition: background 0.15s;
	}

	.todo-list li:hover {
		background: var(--surface);
	}

	.todo-list li.done {
		opacity: 0.5;
	}

	.todo-list li.done .todo-title {
		text-decoration: line-through;
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
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		min-width: 0;
	}

	.todo-title {
		font-size: 14px;
	}

	.p-badge {
		font-size: 11px;
		font-weight: 500;
		padding: 1px 6px;
		border-radius: 999px;
		flex-shrink: 0;
	}

	.p-high { background: #ef444420; color: #ef4444; }
	.p-medium { background: #f59e0b20; color: #f59e0b; }
	.p-low { background: #3b82f620; color: #3b82f6; }

	.actions {
		display: flex;
		gap: 4px;
		opacity: 0;
		transition: opacity 0.1s;
		flex-shrink: 0;
	}

	.actions form { display: contents; }

	.todo-list li:hover .actions {
		opacity: 1;
	}

	.del {
		background: transparent;
		border: none;
		color: var(--muted);
		font-size: 18px;
		cursor: pointer;
		line-height: 1;
		padding: 0 2px;
	}

	.del:hover { color: #ef4444; }

	.edit-form {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 4px 0;
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

	.edit-meta {
		display: flex;
		gap: 8px;
	}

	.meta-input {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 5px 8px;
		color: var(--text);
		font-size: 13px;
		outline: none;
	}

	.meta-input:focus { border-color: var(--accent); }

	.edit-actions {
		display: flex;
		gap: 8px;
	}

	.btn-primary {
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 6px;
		padding: 6px 14px;
		font-size: 13px;
		cursor: pointer;
	}

	.btn-primary:hover { background: var(--accent-hover); }

	.btn-ghost {
		background: var(--border);
		color: var(--text);
		border: none;
		border-radius: 6px;
		padding: 6px 14px;
		font-size: 13px;
		cursor: pointer;
	}

	/* Habits */
	.habits-box {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 10px;
		overflow: hidden;
	}

	.habit-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.habit-list li {
		padding: 14px 16px;
	}

	.habit-list li + li {
		border-top: 1px solid var(--border);
	}

	.habit-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 6px;
		font-size: 14px;
	}

	.habit-right {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.habit-count {
		color: var(--muted);
		font-size: 13px;
	}

	.log-btn {
		width: 22px;
		height: 22px;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: transparent;
		color: var(--accent);
		font-size: 16px;
		line-height: 1;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.1s;
	}

	li:hover .log-btn {
		opacity: 1;
	}

	.log-row {
		display: flex;
		gap: 6px;
		margin-top: 8px;
	}

	.log-row input {
		flex: 1;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 6px 10px;
		color: var(--text);
		font-size: 13px;
		outline: none;
	}

	.log-row input:focus {
		border-color: var(--accent);
	}

	.log-row button {
		border: none;
		border-radius: 6px;
		padding: 6px 12px;
		font-size: 13px;
		cursor: pointer;
	}

	.log-row button[type='submit'] {
		background: var(--accent);
		color: #fff;
	}

	.log-row button[type='button'] {
		background: var(--border);
		color: var(--text);
	}

	.bar-track {
		height: 6px;
		background: var(--border);
		border-radius: 999px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		border-radius: 999px;
		transition: width 0.3s ease, background 0.3s ease;
	}

	.bar-fill.bar-met {
		filter: brightness(1.2);
	}

	.bar-fill.bar-warn {
		background: #ef4444 !important;
	}
</style>
