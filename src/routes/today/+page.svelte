<script lang="ts">
	import { todos, todosToday, habitTotalsToday, habitLogs } from '$lib/stores';

	const dateLabel = new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric'
	});

	const todayStr = new Date().toISOString().slice(0, 10);

	let newTodo = '';

	function addTodo() {
		const t = newTodo.trim();
		if (t) {
			todos.add(t, { due_date: todayStr });
			newTodo = '';
		}
	}

	// Habit log drawer
	let activeHabitId: string | null = null;
	let logAmount = '';

	function openLog(id: string) {
		activeHabitId = id;
		logAmount = '';
	}

	function submitLog(habitId: string) {
		const n = parseFloat(logAmount);
		if (n > 0) {
			habitLogs.log(habitId, n);
		}
		activeHabitId = null;
		logAmount = '';
	}
</script>

<div class="page">
	<h1>{dateLabel}</h1>

	<section>
		<h2>Todos</h2>

		<form on:submit|preventDefault={addTodo} class="add-row">
			<input bind:value={newTodo} placeholder="Add a task…" />
			<button type="submit">Add</button>
		</form>

		<ul class="todo-list">
			{#each $todosToday as todo (todo.id)}
				<li class:done={todo.status === 'done'}>
					<button class="check" on:click={() => todos.toggle(todo.id)} aria-label="toggle">
						{#if todo.status === 'done'}✓{:else}&nbsp;{/if}
					</button>
					<span class="todo-title">{todo.title}</span>
					{#if todo.priority}
						<span class="p-badge p-{todo.priority}">{todo.priority[0].toUpperCase()}</span>
					{/if}
					<button class="del" on:click={() => todos.remove(todo.id)} aria-label="delete">×</button>
				</li>
			{/each}
		</ul>
	</section>

	<section>
		<h2>Habits</h2>

		<ul class="habit-list">
			{#each $habitTotalsToday as habit (habit.id)}
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
						<form class="log-row" on:submit|preventDefault={() => submitLog(habit.id)}>
							<input
								type="number"
								min="0"
								step="any"
								bind:value={logAmount}
								placeholder="Amount…"
								autofocus
							/>
							<button type="submit">Log</button>
							<button type="button" on:click={() => (activeHabitId = null)}>Cancel</button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
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
		gap: 4px;
	}

	.todo-list li {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 6px;
	}

	.todo-list li.done span {
		text-decoration: line-through;
		color: var(--muted);
	}

	.check {
		width: 20px;
		height: 20px;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: transparent;
		color: var(--accent);
		font-size: 12px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.todo-list li.done .check {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}

	.todo-title {
		flex: 1;
		font-size: 14px;
	}

	.p-badge {
		font-size: 10px;
		font-weight: 600;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.p-high { background: #ef444420; color: #ef4444; }
	.p-medium { background: #f59e0b20; color: #f59e0b; }
	.p-low { background: #3b82f620; color: #3b82f6; }

	.del {
		background: transparent;
		border: none;
		color: var(--muted);
		font-size: 18px;
		cursor: pointer;
		line-height: 1;
		padding: 0 2px;
		opacity: 0;
		transition: opacity 0.1s;
	}

	.todo-list li:hover .del {
		opacity: 1;
	}

	/* Habits */
	.habit-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
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
