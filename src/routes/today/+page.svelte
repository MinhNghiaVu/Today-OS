<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { cubicOut, cubicIn } from 'svelte/easing';
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
	<header class="page-header">
		<h1>{dateLabel}</h1>
	</header>

	<!-- Todos -->
	<section>
		<h2 class="section-label">Todos</h2>

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
			<input
				bind:value={newTodo}
				name="title"
				placeholder="Add a task…"
				autocomplete="off"
				aria-label="New task"
			/>
			<button type="submit" class="btn-primary">Add</button>
		</form>

		<ul class="todo-list">
			{#each data.todosToday as todo (todo.id)}
				<li
					class:done={todo.status === 'done'}
					in:fly={{ y: -8, duration: 220, easing: cubicOut }}
					out:fly={{ y: 4, duration: 160, easing: cubicIn }}
					animate:flip={{ duration: 220, easing: cubicOut }}
				>
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
							<input class="edit-title" name="title" value={todo.title} required aria-label="Edit task title" />
							<div class="edit-meta">
								<input type="date" class="meta-input" name="due_date" value={todo.due_date ?? todayStr} />
								<select class="meta-input" name="priority">
									{#each priorityOpts as opt}
										<option value={opt.value} selected={todo.priority === opt.value || (!todo.priority && opt.value === '')}>{opt.label}</option>
									{/each}
								</select>
							</div>
							<div class="edit-actions">
								<button type="submit" class="btn-primary-sm">Save</button>
								<button type="button" class="btn-ghost-sm" on:click={() => (editingId = null)}>Cancel</button>
							</div>
						</form>
					{:else}
						<form method="POST" action="?/toggleTodo" use:enhance>
							<input type="hidden" name="id" value={todo.id} />
							<input type="hidden" name="status" value={todo.status} />
							<button type="submit" class="check" class:checked={todo.status === 'done'} aria-label="Toggle done">
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
								<button type="submit" class="del" aria-label="Delete task">×</button>
							</form>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	</section>

	<!-- Habits -->
	<section>
		<h2 class="section-label">Habits</h2>

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
								<button class="log-btn" on:click={() => openLog(habit.id)} aria-label="Log {habit.name}">+</button>
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
								in:fly={{ y: -6, duration: 180, easing: cubicOut }}
								out:fly={{ y: -4, duration: 140, easing: cubicIn }}
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
									aria-label="Log amount"
								/>
								<button type="submit" class="btn-primary-sm">Log</button>
								<button type="button" class="btn-ghost-sm" on:click={() => (activeHabitId = null)}>Cancel</button>
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

	/* Page header */
	.page-header {
		margin-bottom: -8px;
	}

	h1 {
		margin: 0;
		font-size: 24px;
		font-weight: 600;
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	.section-label {
		margin: 0 0 12px;
		font-size: 11px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-tertiary);
	}

	section {
		display: flex;
		flex-direction: column;
	}

	/* Todos */
	.add-row {
		display: flex;
		gap: 8px;
		margin-bottom: 8px;
	}

	.add-row input {
		flex: 1;
		background: var(--surface-2);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		padding: 0 12px;
		height: 36px;
		color: var(--text-primary);
		font-size: 14px;
		font-family: inherit;
		outline: none;
		transition: border-color 120ms var(--ease-out);
	}

	.add-row input::placeholder {
		color: var(--text-tertiary);
	}

	.add-row input:hover {
		border-color: var(--border-strong);
	}

	.add-row input:focus {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.btn-primary {
		background: var(--accent);
		color: var(--text-on-accent);
		border: none;
		border-radius: var(--radius-md);
		padding: 0 16px;
		height: 36px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: background 120ms var(--ease-out), transform 120ms var(--ease-out);
	}

	.btn-primary:hover {
		background: var(--accent-hover);
	}

	.btn-primary:active {
		background: var(--accent-pressed);
		transform: translateY(1px);
	}

	.btn-primary:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
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
		border-radius: var(--radius-md);
		transition: background 120ms var(--ease-out);
	}

	.todo-list li:hover {
		background: var(--surface-2);
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
		border: 1.5px solid var(--border-strong);
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--text-on-accent);
		font-size: 11px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background 120ms var(--ease-out), border-color 120ms var(--ease-out);
	}

	.check.checked {
		background: var(--accent);
		border-color: var(--accent);
	}

	.check:hover:not(.checked) {
		border-color: var(--accent);
	}

	.check:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
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
		color: var(--text-primary);
	}

	/* Priority badges — semantic tokens */
	.p-badge {
		font-size: 11px;
		font-weight: 500;
		padding: 1px 6px;
		border-radius: var(--radius-full);
		flex-shrink: 0;
	}

	.p-high   { background: var(--danger-soft);  color: var(--danger); }
	.p-medium { background: var(--warning-soft); color: var(--warning); }
	.p-low    { background: var(--info-soft);    color: var(--info); }

	.actions {
		display: flex;
		gap: 4px;
		opacity: 0;
		transition: opacity 120ms var(--ease-out);
		flex-shrink: 0;
	}

	.actions form { display: contents; }

	.todo-list li:hover .actions {
		opacity: 1;
	}

	.del {
		background: transparent;
		border: none;
		color: var(--text-tertiary);
		font-size: 18px;
		cursor: pointer;
		line-height: 1;
		padding: 0 2px;
		transition: color 120ms var(--ease-out);
	}

	.del:hover { color: var(--danger); }

	.edit-form {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 4px 0;
	}

	.edit-title {
		background: var(--surface-2);
		border: 1px solid var(--accent);
		border-radius: var(--radius-md);
		padding: 0 10px;
		height: 36px;
		color: var(--text-primary);
		font-size: 14px;
		font-family: inherit;
		outline: none;
		width: 100%;
	}

	.edit-title:focus {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.edit-meta {
		display: flex;
		gap: 8px;
	}

	.meta-input {
		background: var(--surface-2);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		padding: 0 8px;
		height: 32px;
		color: var(--text-primary);
		font-size: 13px;
		font-family: inherit;
		outline: none;
		transition: border-color 120ms var(--ease-out);
	}

	.meta-input:focus {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.edit-actions {
		display: flex;
		gap: 8px;
	}

	.btn-primary-sm {
		background: var(--accent);
		color: var(--text-on-accent);
		border: none;
		border-radius: var(--radius-md);
		padding: 0 14px;
		height: 28px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background 120ms var(--ease-out), transform 120ms var(--ease-out);
	}

	.btn-primary-sm:hover { background: var(--accent-hover); }
	.btn-primary-sm:active { background: var(--accent-pressed); transform: translateY(1px); }

	.btn-ghost-sm {
		background: var(--surface-2);
		color: var(--text-primary);
		border: none;
		border-radius: var(--radius-md);
		padding: 0 14px;
		height: 28px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background 120ms var(--ease-out);
	}

	.btn-ghost-sm:hover { background: var(--surface-3); }

	/* Habits */
	.habits-box {
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
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
		border-top: 1px solid var(--border-subtle);
	}

	.habit-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.habit-name {
		font-size: 14px;
		color: var(--text-primary);
	}

	.habit-right {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.habit-count {
		color: var(--text-secondary);
		font-size: 13px;
	}

	.log-btn {
		width: 24px;
		height: 24px;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--accent);
		font-size: 16px;
		line-height: 1;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 120ms var(--ease-out), background 120ms var(--ease-out);
	}

	li:hover .log-btn {
		opacity: 1;
	}

	.log-btn:hover {
		background: var(--accent-soft);
	}

	.log-btn:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
		opacity: 1;
	}

	.log-row {
		display: flex;
		gap: 6px;
		margin-top: 8px;
	}

	.log-row input {
		flex: 1;
		background: var(--surface-2);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		padding: 0 10px;
		height: 32px;
		color: var(--text-primary);
		font-size: 13px;
		font-family: inherit;
		outline: none;
		transition: border-color 120ms var(--ease-out);
	}

	.log-row input:hover {
		border-color: var(--border-strong);
	}

	.log-row input:focus {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.bar-track {
		height: 5px;
		background: var(--surface-3);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		border-radius: var(--radius-full);
		transition: width 300ms var(--ease-out);
	}

	.bar-fill.bar-met {
		filter: brightness(1.2);
	}

	.bar-fill.bar-warn {
		background: var(--danger) !important;
	}
</style>
