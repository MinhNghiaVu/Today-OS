<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { cubicIn, cubicOut } from 'svelte/easing';
	import {
		Activity,
		CalendarDays,
		CheckCircle2,
		ChevronRight,
		Clock3,
		Droplets,
		FileText,
		Pencil,
		Plus,
		Target,
		Trash2
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { HabitType, TodoPriority } from '$lib/types';

	export let data: PageData;

	const dateLabel = new Date().toLocaleDateString('en-AU', {
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

	const priorityLabels: Record<TodoPriority, string> = {
		high: 'High',
		medium: 'Med',
		low: 'Low'
	};

	let newTodo = '';
	let noteContent = '';
	let editingId: string | null = null;
	let activeHabitId: string | null = null;
	let logAmount = '';
	let editingLogId: string | null = null;
	let editingLogValue = '';

	$: pendingTodos = data.todosToday.filter((todo) => todo.status === 'pending');
	$: doneTodos = data.todosToday.filter((todo) => todo.status === 'done');
	$: habitsOnTrack = data.habitTotals.filter(isHabitOnTrack);
	$: notesPreview = data.notesToday.slice(0, 3);

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function formatNoteTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function openLog(id: string) {
		activeHabitId = id;
		logAmount = '';
	}

	function startEditLog(id: string, value: number) {
		editingLogId = id;
		editingLogValue = String(value);
	}

	function formatLogTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('en-AU', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function isHabitOnTrack(habit: {
		type: HabitType;
		total: number;
		daily_goal: number | null;
	}): boolean {
		if (habit.type === 'info_only') return habit.total > 0;
		if (habit.daily_goal === null) return habit.total > 0;
		if (habit.type === 'min_goal') return habit.total >= habit.daily_goal;
		return habit.total > 0 && habit.total <= habit.daily_goal;
	}

	function habitStatus(habit: {
		type: HabitType;
		total: number;
		daily_goal: number | null;
		unit: string;
	}): string {
		if (habit.type === 'info_only' || habit.daily_goal === null) {
			return habit.total > 0 ? `${habit.total} ${habit.unit} logged` : 'No log yet';
		}

		if (habit.type === 'min_goal') {
			const remaining = Math.max(0, habit.daily_goal - habit.total);
			return remaining === 0 ? 'Goal met' : `${remaining} ${habit.unit} left`;
		}

		const remaining = habit.daily_goal - habit.total;
		if (remaining < 0) return `${Math.abs(remaining)} ${habit.unit} over`;
		return `${remaining} ${habit.unit} room`;
	}

	function barWidth(habit: { daily_goal: number | null; total: number }): number {
		if (!habit.daily_goal) return habit.total > 0 ? 100 : 0;
		return Math.min(100, (habit.total / habit.daily_goal) * 100);
	}

	function formattedTotal(total: number): string {
		return Number.isInteger(total) ? String(total) : total.toFixed(1);
	}
</script>

<div class="page">
	<div class="page-inner">
		<header class="hero">
			<div>
				<p class="eyebrow">Today</p>
				<h1>{dateLabel}</h1>
			</div>
			<div class="hero-stats" aria-label="Today summary">
				<div class="hero-stat">
					<span class="stat-value">{pendingTodos.length}</span>
					<span class="stat-label">todo{pendingTodos.length === 1 ? '' : 's'} left</span>
				</div>
				<div class="hero-stat">
					<span class="stat-value">{habitsOnTrack.length}/{data.habitTotals.length}</span>
					<span class="stat-label">habits on track</span>
				</div>
				<div class="hero-stat">
					<span class="stat-value">{data.notesToday.length}</span>
					<span class="stat-label">note{data.notesToday.length === 1 ? '' : 's'}</span>
				</div>
			</div>
		</header>

		<div class="daily-layout">
			<main class="primary-column">
				<section class="panel focus-panel">
					<div class="panel-heading">
						<div>
							<p class="section-label">Focus</p>
							<h2>Things to do today</h2>
						</div>
						<span class="muted">{doneTodos.length} done</span>
					</div>

					<form
						method="POST"
						action="?/addTodo"
						class="quick-add"
						use:enhance={() => {
							newTodo = '';
							return async ({ update }) => update();
						}}
					>
						<input
							bind:value={newTodo}
							name="title"
							placeholder="Add the next thing..."
							autocomplete="off"
							aria-label="New task"
						/>
						<button type="submit" class="icon-button primary" aria-label="Add task">
							<Plus size={17} strokeWidth={2.2} />
						</button>
					</form>

					{#if data.todosToday.length === 0}
						<div class="empty-state">
							<CheckCircle2 class="empty-icon" size={22} strokeWidth={1.8} aria-hidden="true" />
							<div>
								<p>No tasks for today.</p>
								<span>Add anything you want out of your head.</span>
							</div>
						</div>
					{:else}
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
												<button type="submit" class="small-button primary-fill">Save</button>
												<button type="button" class="small-button" on:click={() => (editingId = null)}>Cancel</button>
											</div>
										</form>
									{:else}
										<form method="POST" action="?/toggleTodo" use:enhance>
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
										<button type="button" class="todo-body" on:click={() => (editingId = todo.id)}>
											<span class="todo-title">{todo.title}</span>
											{#if todo.priority}
												<span class="priority-badge priority-{todo.priority}">{priorityLabels[todo.priority]}</span>
											{/if}
										</button>
										<form method="POST" action="?/removeTodo" use:enhance>
											<input type="hidden" name="id" value={todo.id} />
											<button type="submit" class="delete-button" aria-label="Delete task">×</button>
										</form>
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
				</section>

				<section class="panel">
					<div class="panel-heading">
						<div>
							<p class="section-label">Daily habits</p>
							<h2>Water, calories, and consistency</h2>
						</div>
						<a href="/habits" class="panel-link">
							Manage
							<ChevronRight size={14} strokeWidth={2} />
						</a>
					</div>

					{#if data.habitTotals.length === 0}
						<div class="empty-state">
							<Activity class="empty-icon" size={22} strokeWidth={1.8} aria-hidden="true" />
							<div>
								<p>No active habits yet.</p>
								<span>Create habits for water, calories, sleep, or anything worth tracking.</span>
							</div>
						</div>
					{:else}
						<ul class="habit-list">
							{#each data.habitTotals as habit (habit.id)}
								<li>
									<div class="habit-main">
										<div class="habit-icon" style="color: {habit.color}">
											{#if habit.name.toLowerCase().includes('water')}
												<Droplets size={17} strokeWidth={2} aria-hidden="true" />
											{:else}
												<Target size={17} strokeWidth={2} aria-hidden="true" />
											{/if}
										</div>
										<div class="habit-copy">
											<div class="habit-title-row">
												<span class="habit-name">{habit.name}</span>
												<span class:good={isHabitOnTrack(habit)} class:warn={habit.type === 'max_goal' && habit.daily_goal !== null && habit.total > habit.daily_goal} class="habit-state">
													{habitStatus(habit)}
												</span>
											</div>
											<div class="bar-track">
												<div
													class="bar-fill"
													class:bar-met={isHabitOnTrack(habit)}
													class:bar-warn={habit.type === 'max_goal' && habit.daily_goal !== null && habit.total > habit.daily_goal}
													style="width: {barWidth(habit)}%; background: {habit.color};"
												></div>
											</div>
											<div class="habit-meta">
												<span>{habit.total}{habit.daily_goal !== null ? ` / ${habit.daily_goal}` : ''} {habit.unit}</span>
												<span>{habit.daily_goal === null ? `${habit.daysLogged}/7 days logged` : `${habit.daysMet}/7 days on goal`}</span>
											</div>
										</div>
										<button class="small-square" on:click={() => openLog(habit.id)} aria-label="Log {habit.name}">
											<Plus size={16} strokeWidth={2.2} />
										</button>
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
												placeholder={`Amount in ${habit.unit}`}
												aria-label="Log amount"
											/>
											<button type="submit" class="small-button primary-fill">Log</button>
											<button type="button" class="small-button" on:click={() => (activeHabitId = null)}>Cancel</button>
										</form>
									{/if}

									{#if habit.todayLogs.length > 0}
										<ul class="habit-log-list" aria-label="{habit.name} logs">
											{#each habit.todayLogs as log (log.id)}
												<li>
													{#if editingLogId === log.id}
														<form
															method="POST"
															action="?/updateHabitLog"
															class="log-edit-form"
															use:enhance={() => async ({ result, update }) => {
																if (result.type === 'success') editingLogId = null;
																await update();
															}}
														>
															<input type="hidden" name="id" value={log.id} />
															<input
																type="number"
																name="value"
																min="0"
																step="any"
																bind:value={editingLogValue}
																aria-label="Edit log value"
															/>
															<button type="submit" class="small-button primary-fill">Save</button>
															<button type="button" class="small-button" on:click={() => (editingLogId = null)}>Cancel</button>
														</form>
													{:else}
														<div class="log-entry-copy">
															<span class="log-value">+{formattedTotal(log.value)} {habit.unit}</span>
															<span class="log-time">{formatLogTime(log.created_at)}</span>
														</div>
														<div class="log-entry-actions">
															<button
																type="button"
																class="mini-icon-button"
																on:click={() => startEditLog(log.id, log.value)}
																aria-label="Edit {habit.name} log"
															>
																<Pencil size={13} strokeWidth={2} />
															</button>
															<form method="POST" action="?/removeHabitLog" use:enhance>
																<input type="hidden" name="id" value={log.id} />
																<button type="submit" class="mini-icon-button danger" aria-label="Delete {habit.name} log">
																	<Trash2 size={13} strokeWidth={2} />
																</button>
															</form>
														</div>
													{/if}
												</li>
											{/each}
										</ul>
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
				</section>
			</main>

			<aside class="side-column">
				<section class="panel compact-panel">
					<div class="panel-heading">
						<div>
							<p class="section-label">Schedule</p>
							<h2>Calendar context</h2>
						</div>
						<CalendarDays class="heading-icon" size={18} strokeWidth={2} aria-hidden="true" />
					</div>

					{#if data.calendarState === 'disconnected' || data.calendarState === 'expired'}
						<div class="callout">
							<span>
								{data.calendarState === 'expired' ? 'Google Calendar access expired.' : 'No calendar connected.'}
							</span>
							<a href="/auth/connect-calendar">{data.calendarState === 'expired' ? 'Reconnect' : 'Connect'}</a>
						</div>
					{:else}
						{#await data.calendarEvents}
							<div class="inline-loading">Loading events...</div>
						{:then events}
							{#if events.length === 0}
								<div class="empty-state compact">
									<Clock3 class="empty-icon" size={20} strokeWidth={1.8} aria-hidden="true" />
									<div>
										<p>No events today.</p>
										<span>Your calendar is quiet.</span>
									</div>
								</div>
							{:else}
								<ul class="event-list">
									{#each events as event (event.id)}
										<li>
											<span class="event-time">{event.allDay ? 'All day' : formatTime(event.start)}</span>
											<div>
												<span class="event-title">{event.title}</span>
												{#if event.location}
													<span class="event-loc">{event.location}</span>
												{/if}
											</div>
										</li>
									{/each}
								</ul>
							{/if}
						{:catch}
							<div class="callout">
								<span>Couldn't load calendar events.</span>
								<a href="/auth/connect-calendar">Reconnect</a>
							</div>
						{/await}
					{/if}
				</section>

				<section class="panel compact-panel">
					<div class="panel-heading">
						<div>
							<p class="section-label">Inbox</p>
							<h2>Quick notes</h2>
						</div>
						<a href="/notes" class="panel-link">
							Open
							<ChevronRight size={14} strokeWidth={2} />
						</a>
					</div>

					<form
						method="POST"
						action="?/addNote"
						class="note-form"
						use:enhance={() => {
							noteContent = '';
							return async ({ update }) => update();
						}}
					>
						<textarea
							name="content"
							bind:value={noteContent}
							placeholder="Jot something down..."
							rows="4"
							aria-label="Quick note"
						></textarea>
						<button type="submit" class="note-submit">
							<FileText size={15} strokeWidth={2} aria-hidden="true" />
							Save note
						</button>
					</form>

					{#if notesPreview.length > 0}
						<ul class="note-list">
							{#each notesPreview as note}
								<li>
									<span class="note-title">{note.title || 'Untitled'}</span>
									<span class="note-meta">{formatNoteTime(note.updated_at)}</span>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="hint">No notes attached to today yet.</p>
					{/if}
				</section>
			</aside>
		</div>
	</div>
</div>

<style>
	.page {
		min-height: 100vh;
		background: var(--bg);
	}

	.page-inner {
		max-width: 1180px;
		margin: 0 auto;
		padding: 32px 24px 48px;
	}

	.hero {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 24px;
		margin-bottom: 24px;
	}

	.eyebrow,
	.section-label {
		margin: 0;
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-tertiary);
	}

	h1,
	h2 {
		margin: 0;
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	h1 {
		margin-top: 3px;
		font-size: 28px;
		font-weight: 600;
		line-height: 1.15;
	}

	h2 {
		margin-top: 2px;
		font-size: 16px;
		font-weight: 600;
		line-height: 1.3;
	}

	.hero-stats {
		display: grid;
		grid-template-columns: repeat(3, minmax(96px, 1fr));
		gap: 8px;
		width: min(420px, 100%);
	}

	.hero-stat {
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		padding: 12px 14px;
		box-shadow: var(--shadow-sm);
	}

	.stat-value {
		display: block;
		font-size: 20px;
		font-weight: 600;
		line-height: 1.1;
		color: var(--text-primary);
	}

	.stat-label {
		display: block;
		margin-top: 3px;
		font-size: 12px;
		color: var(--text-tertiary);
		white-space: nowrap;
	}

	.daily-layout {
		display: grid;
		grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.85fr);
		gap: 16px;
		align-items: start;
	}

	.primary-column,
	.side-column {
		display: flex;
		flex-direction: column;
		gap: 16px;
		min-width: 0;
	}

	.panel {
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		padding: 18px;
		box-shadow: var(--shadow-sm);
	}

	.focus-panel {
		padding-bottom: 12px;
	}

	.compact-panel {
		padding: 16px;
	}

	.panel-heading {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 14px;
	}

	.heading-icon {
		color: var(--text-tertiary);
		margin-top: 2px;
	}

	.panel-link {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		margin-top: 2px;
		color: var(--text-secondary);
		font-size: 13px;
		font-weight: 500;
		transition: color 120ms var(--ease-out);
	}

	.panel-link:hover {
		color: var(--text-primary);
	}

	.muted,
	.hint {
		color: var(--text-tertiary);
		font-size: 13px;
	}

	.quick-add {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 38px;
		gap: 8px;
		margin-bottom: 10px;
	}

	input,
	textarea,
	select {
		width: 100%;
		background: var(--surface-2);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-family: inherit;
		font-size: 14px;
		outline: none;
		transition: border-color 120ms var(--ease-out), background 120ms var(--ease-out);
	}

	input {
		height: 38px;
		padding: 0 12px;
	}

	textarea {
		min-height: 104px;
		resize: vertical;
		padding: 11px 12px;
		line-height: 1.5;
	}

	input::placeholder,
	textarea::placeholder {
		color: var(--text-tertiary);
	}

	input:hover,
	textarea:hover,
	select:hover {
		border-color: var(--border-strong);
	}

	input:focus-visible,
	textarea:focus-visible,
	select:focus-visible,
	button:focus-visible,
	a:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.icon-button,
	.small-square {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: background 120ms var(--ease-out), transform 120ms var(--ease-out);
	}

	.icon-button {
		width: 38px;
		height: 38px;
	}

	.primary,
	.primary-fill {
		background: var(--accent);
		color: var(--text-on-accent);
	}

	.primary:hover,
	.primary-fill:hover {
		background: var(--accent-hover);
	}

	.primary:active,
	.primary-fill:active {
		background: var(--accent-pressed);
		transform: translateY(1px);
	}

	.todo-list,
	.habit-list,
	.event-list,
	.note-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.todo-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.todo-list li {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 42px;
		padding: 7px 6px;
		border-radius: var(--radius-md);
		transition: background 120ms var(--ease-out), opacity 120ms var(--ease-out);
	}

	.todo-list li:hover {
		background: var(--surface-2);
	}

	.todo-list li.done {
		opacity: 0.55;
	}

	.todo-list li.done .todo-title {
		text-decoration: line-through;
	}

	.check {
		width: 22px;
		height: 22px;
		border: 1.5px solid var(--border-strong);
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--text-on-accent);
		font-size: 11px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 120ms var(--ease-out), border-color 120ms var(--ease-out);
	}

	.check.checked {
		background: var(--accent);
		border-color: var(--accent);
	}

	.todo-body {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
		background: transparent;
		border: none;
		padding: 0;
		text-align: left;
		cursor: pointer;
	}

	.todo-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text-primary);
	}

	.priority-badge {
		flex-shrink: 0;
		border-radius: var(--radius-full);
		padding: 1px 7px;
		font-size: 11px;
		font-weight: 500;
	}

	.priority-high { background: var(--danger-soft); color: var(--danger); }
	.priority-medium { background: var(--warning-soft); color: var(--warning); }
	.priority-low { background: var(--info-soft); color: var(--info); }

	.delete-button {
		width: 28px;
		height: 28px;
		border: none;
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--text-tertiary);
		font-size: 18px;
		line-height: 1;
		cursor: pointer;
		transition: background 120ms var(--ease-out), color 120ms var(--ease-out);
	}

	.delete-button:hover {
		background: var(--danger-soft);
		color: var(--danger);
	}

	.edit-form {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 6px 0;
	}

	.edit-meta,
	.edit-actions,
	.log-row,
	.log-edit-form {
		display: flex;
		gap: 8px;
	}

	.meta-input {
		height: 34px;
		padding: 0 10px;
		font-size: 13px;
	}

	.small-button {
		height: 32px;
		padding: 0 12px;
		border: none;
		border-radius: var(--radius-md);
		background: var(--surface-2);
		color: var(--text-primary);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
	}

	.empty-state {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 18px;
		border-radius: var(--radius-lg);
		background: var(--surface-2);
		color: var(--text-secondary);
	}

	.empty-state.compact {
		padding: 14px;
	}

	.empty-icon {
		flex-shrink: 0;
		color: var(--text-tertiary);
	}

	.empty-state p {
		margin: 0;
		color: var(--text-primary);
		font-weight: 500;
	}

	.empty-state span {
		display: block;
		margin-top: 1px;
		font-size: 13px;
		color: var(--text-tertiary);
	}

	.habit-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.habit-list li {
		padding: 12px;
		border-radius: var(--radius-lg);
		background: var(--surface-2);
	}

	.habit-main {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.habit-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border-radius: var(--radius-md);
		background: var(--surface-3);
		flex-shrink: 0;
	}

	.habit-copy {
		flex: 1;
		min-width: 0;
	}

	.habit-title-row,
	.habit-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}

	.habit-name {
		font-weight: 500;
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.habit-state,
	.habit-meta {
		font-size: 12px;
		color: var(--text-tertiary);
	}

	.habit-state.good {
		color: var(--success);
	}

	.habit-state.warn {
		color: var(--danger);
	}

	.bar-track {
		height: 6px;
		margin: 8px 0 6px;
		background: var(--surface-3);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		border-radius: var(--radius-full);
		transition: width 260ms var(--ease-out);
	}

	.bar-fill.bar-met {
		background: var(--success) !important;
	}

	.bar-fill.bar-warn {
		background: var(--danger) !important;
	}

	.small-square {
		width: 34px;
		height: 34px;
		background: var(--surface-3);
		color: var(--text-primary);
	}

	.small-square:hover {
		background: var(--accent-soft);
		color: var(--accent);
	}

	.log-row {
		margin-top: 10px;
		padding-left: 46px;
	}

	.habit-log-list {
		list-style: none;
		margin: 10px 0 0;
		padding: 0 0 0 46px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.habit-log-list li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		min-height: 34px;
		padding: 7px 9px;
		border-radius: var(--radius-md);
		background: var(--surface-3);
	}

	.log-entry-copy {
		display: flex;
		align-items: baseline;
		gap: 8px;
		min-width: 0;
	}

	.log-value {
		color: var(--text-primary);
		font-size: 13px;
		font-weight: 500;
	}

	.log-time {
		color: var(--text-tertiary);
		font-size: 12px;
	}

	.log-entry-actions {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.mini-icon-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-tertiary);
		cursor: pointer;
		transition: background 120ms var(--ease-out), color 120ms var(--ease-out);
	}

	.mini-icon-button:hover {
		background: var(--surface-2);
		color: var(--text-primary);
	}

	.mini-icon-button.danger:hover {
		background: var(--danger-soft);
		color: var(--danger);
	}

	.log-edit-form {
		flex: 1;
	}

	.callout {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px;
		border-radius: var(--radius-lg);
		background: var(--surface-2);
		color: var(--text-secondary);
		font-size: 13px;
	}

	.callout a {
		color: var(--accent);
		font-weight: 500;
	}

	.inline-loading {
		padding: 8px 0;
		color: var(--text-tertiary);
		font-size: 13px;
	}

	.event-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.event-list li {
		display: grid;
		grid-template-columns: 64px minmax(0, 1fr);
		gap: 10px;
		padding: 10px;
		border-radius: var(--radius-md);
		background: var(--surface-2);
	}

	.event-time,
	.event-loc {
		font-size: 12px;
		color: var(--text-tertiary);
	}

	.event-title {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text-primary);
	}

	.event-loc {
		display: block;
		margin-top: 2px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.note-form {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.note-submit {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		height: 36px;
		border: none;
		border-radius: var(--radius-md);
		background: var(--accent);
		color: var(--text-on-accent);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
	}

	.note-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-top: 14px;
	}

	.note-list li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 9px 10px;
		border-radius: var(--radius-md);
		background: var(--surface-2);
	}

	.note-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text-primary);
		font-size: 13px;
	}

	.note-meta {
		flex-shrink: 0;
		color: var(--text-tertiary);
		font-size: 12px;
	}

	.hint {
		margin: 12px 0 0;
	}

	@media (max-width: 980px) {
		.hero {
			align-items: stretch;
			flex-direction: column;
			gap: 16px;
		}

		.hero-stats {
			width: 100%;
		}

		.daily-layout {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.page-inner {
			padding: 24px 16px 36px;
		}

		h1 {
			font-size: 25px;
		}

		.hero-stats {
			grid-template-columns: 1fr;
		}

		.panel {
			padding: 14px;
			border-radius: var(--radius-lg);
		}

		.panel-heading,
		.habit-title-row,
		.habit-meta {
			align-items: flex-start;
			flex-direction: column;
			gap: 4px;
		}

		.todo-list li {
			align-items: flex-start;
			padding: 10px 4px;
		}

		.todo-title {
			white-space: normal;
		}

		.edit-meta,
		.edit-actions,
		.log-row,
		.log-edit-form {
			flex-direction: column;
		}

		.log-row,
		.habit-log-list {
			padding-left: 0;
		}

		.habit-log-list li {
			align-items: flex-start;
			flex-direction: column;
		}

		.event-list li {
			grid-template-columns: 1fr;
			gap: 3px;
		}
	}
</style>
