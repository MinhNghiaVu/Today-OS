<script lang="ts">
	import { goto } from '$app/navigation';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut, cubicIn } from 'svelte/easing';
	import {
		ChevronLeft,
		ChevronRight,
		CalendarDays,
		CheckSquare,
		Activity,
		FileText,
		Circle,
		CheckCircle2,
		Clock
	} from 'lucide-svelte';
	import { habitProgressColor, habitProgressWidth } from '$lib/utils/habits';
	import type { HabitType } from '$lib/types';

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}
	import type { PageData } from './$types';

	export let data: PageData;

	const MONTH_NAMES = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];
	const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	$: ({ year, month, selectedDate, activity, dayData, today } = data);

	$: activityMap = new Map(activity.map((a) => [a.date, a]));

	$: firstDayOfWeek = new Date(year, month - 1, 1).getDay();
	$: daysInMonth = new Date(year, month, 0).getDate();

	$: calendarCells = (() => {
		const cells: Array<{ date: string; day: number } | null> = [];
		for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
		for (let d = 1; d <= daysInMonth; d++) {
			cells.push({
				day: d,
				date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
			});
		}
		while (cells.length % 7 !== 0) cells.push(null);
		return cells;
	})();

	function navigate(dir: -1 | 1): void {
		let newMonth = month + dir;
		let newYear = year;
		if (newMonth < 1) { newMonth = 12; newYear--; }
		if (newMonth > 12) { newMonth = 1; newYear++; }
		const params = new URLSearchParams({ year: String(newYear), month: String(newMonth) });
		if (selectedDate) params.set('date', selectedDate);
		goto(`/calendar?${params}`);
	}

	function selectDate(date: string): void {
		const params = new URLSearchParams({ year: String(year), month: String(month), date });
		goto(`/calendar?${params}`);
	}

	function clearDate(): void {
		goto(`/calendar?year=${year}&month=${month}`);
	}

	function formatSelectedDate(d: string): string {
		const dt = new Date(d + 'T00:00:00');
		return dt.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
	}

	function getPriorityColor(priority: string | undefined): string {
		if (priority === 'high') return 'var(--warning)';
		if (priority === 'medium') return 'var(--info)';
		if (priority === 'low') return 'var(--text-tertiary)';
		return 'var(--text-tertiary)';
	}

	function getBarWidth(habit: { total: number; daily_goal: number | null }): number {
		return habitProgressWidth(habit);
	}

	function getBarColor(habit: { total: number; daily_goal: number | null; type: string; color: string }): string {
		return habitProgressColor({ ...habit, type: habit.type as HabitType });
	}
</script>

<div class="page">
	<!-- Page header -->
	<header class="page-header">
		<h1>Calendar</h1>
	</header>

	<div class="calendar-layout" class:has-panel={!!selectedDate}>
			<!-- Month grid -->
			<div class="month-section">
				<!-- Month navigation -->
				<div class="month-nav">
					<button
						class="nav-btn"
						on:click={() => navigate(-1)}
						aria-label="Previous month"
					>
						<ChevronLeft size={16} strokeWidth={2} />
					</button>
					<span class="month-label">{MONTH_NAMES[month - 1]} {year}</span>
					<button
						class="nav-btn"
						on:click={() => navigate(1)}
						aria-label="Next month"
					>
						<ChevronRight size={16} strokeWidth={2} />
					</button>
				</div>

				<!-- Day-of-week headers -->
				<div class="cal-grid">
					{#each DAY_LABELS as label}
						<div class="dow-label">{label}</div>
					{/each}

					{#each calendarCells as cell}
						{#if cell === null}
							<div class="cal-cell empty"></div>
						{:else}
							{@const act = activityMap.get(cell.date)}
							{@const isToday = cell.date === today}
							{@const isSelected = cell.date === selectedDate}
							<button
								class="cal-cell day-cell"
								class:is-today={isToday}
								class:is-selected={isSelected}
								on:click={() => selectDate(cell.date)}
								aria-label={cell.date}
								aria-pressed={isSelected}
							>
								<span class="day-num">{cell.day}</span>
								{#if act}
									<div class="dot-row">
										{#if act.hasTodos}
											<span class="dot dot-accent" title="Has todos"></span>
										{/if}
										{#if act.hasHabitLogs}
											<span class="dot dot-success" title="Has habit logs"></span>
										{/if}
										{#if act.hasNotes}
											<span class="dot dot-info" title="Has notes"></span>
										{/if}
									</div>
								{/if}
							</button>
						{/if}
					{/each}
				</div>

				<!-- Legend -->
				<div class="legend">
					<span class="legend-item">
						<span class="dot dot-accent"></span> Todos
					</span>
					<span class="legend-item">
						<span class="dot dot-success"></span> Habits
					</span>
					<span class="legend-item">
						<span class="dot dot-info"></span> Notes
					</span>
				</div>
			</div>

			<!-- Per-day panel -->
			{#if selectedDate && dayData}
				<div
					class="day-panel"
					in:fly={{ x: 40, duration: 300, easing: cubicOut }}
					out:fly={{ x: 24, duration: 180, easing: cubicIn }}
				>
					<div class="panel-header">
						<div>
							<div class="panel-date">{formatSelectedDate(selectedDate)}</div>
						</div>
						<button class="close-btn" on:click={clearDate} aria-label="Close panel">
							<ChevronRight size={16} strokeWidth={2} />
						</button>
					</div>

					<!-- Schedule section -->
					<div class="panel-section">
						<div class="section-label">
							<Clock size={13} strokeWidth={2} aria-hidden="true" />
							Schedule
						</div>
						{#if !data.gcConnected}
							<a href="/auth/connect-calendar" class="gc-connect-link">Connect Google Calendar →</a>
						{:else if dayData.gcEvents.length === 0}
							<p class="empty-inline">No events.</p>
						{:else}
							<ul class="gc-event-list">
								{#each dayData.gcEvents as event (event.id)}
									<li class="gc-event-row">
										<span class="gc-event-time">
											{event.allDay ? 'All day' : formatTime(event.start)}
										</span>
										<div class="gc-event-body">
											<span class="gc-event-title">{event.title}</span>
											{#if event.location}
												<span class="gc-event-loc">{event.location}</span>
											{/if}
										</div>
									</li>
								{/each}
							</ul>
						{/if}
					</div>

					<!-- Todos section -->
					<div class="panel-section">
						<div class="section-label">
							<CheckSquare size={13} strokeWidth={2} aria-hidden="true" />
							Todos
						</div>
						{#if dayData.todos.length === 0}
							<p class="empty-inline">No todos for this day.</p>
						{:else}
							<ul class="todo-list">
								{#each dayData.todos as todo}
									<li class="todo-row" class:done={todo.status === 'done'}>
										<span class="todo-check" aria-hidden="true">
											{#if todo.status === 'done'}
												<CheckCircle2 size={15} strokeWidth={2} style="color: var(--success)" />
											{:else}
												<Circle size={15} strokeWidth={2} style="color: var(--border-strong)" />
											{/if}
										</span>
										<span class="todo-title">{todo.title}</span>
										{#if todo.priority && todo.priority !== 'low'}
											<span class="priority-dot" style="background: {getPriorityColor(todo.priority)}"></span>
										{/if}
									</li>
								{/each}
							</ul>
						{/if}
					</div>

					<!-- Habits section -->
					<div class="panel-section">
						<div class="section-label">
							<Activity size={13} strokeWidth={2} aria-hidden="true" />
							Habits
						</div>
						{#if dayData.habits.length === 0}
							<p class="empty-inline">No active habits.</p>
						{:else}
							<ul class="habit-list">
								{#each dayData.habits as habit}
									<li class="habit-row">
										<div class="habit-info">
											<span class="habit-dot" style="background: {habit.color}"></span>
											<span class="habit-name">{habit.name}</span>
											<span class="habit-total">
												{habit.total} {habit.unit}
												{#if habit.daily_goal}
													<span class="habit-goal">/ {habit.daily_goal}</span>
												{/if}
											</span>
										</div>
										{#if habit.daily_goal}
											<div class="habit-bar-track">
												<div
													class="habit-bar-fill"
													style="width: {getBarWidth(habit)}%; background: {getBarColor(habit)}"
												></div>
											</div>
										{/if}
									</li>
								{/each}
							</ul>
						{/if}
					</div>

					<!-- Notes section -->
					<div class="panel-section">
						<div class="section-label">
							<FileText size={13} strokeWidth={2} aria-hidden="true" />
							Notes
						</div>
						{#if dayData.notes.length === 0}
							<p class="empty-inline">No notes for this day.</p>
						{:else}
							<ul class="notes-list">
								{#each dayData.notes as note}
									<li class="note-row">
										<a href="/notes?id={note.id}" class="note-link">
											<span class="note-title">{note.title || 'Untitled'}</span>
											<span class="note-type">{note.type}</span>
										</a>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>
			{:else if !selectedDate}
				<!-- No date selected empty state for panel area -->
				<div class="panel-empty" in:fade={{ duration: 160 }}>
					<CalendarDays size={36} strokeWidth={1.5} style="color: var(--text-tertiary)" aria-hidden="true" />
					<p class="panel-empty-text">Select a day to see your activity</p>
				</div>
			{/if}
		</div>
</div>

<style>
	.page {
		min-height: 100vh;
		background: var(--bg);
		padding: 32px 24px;
	}

	/* ── Page header ── */
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 24px;
	}

	h1 {
		font-size: 24px;
		font-weight: 600;
		color: var(--text-primary);
		letter-spacing: -0.01em;
		line-height: 1.2;
		margin: 0;
	}

	/* ── Calendar layout ── */
	.calendar-layout {
		display: grid;
		grid-template-columns: 1fr;
		gap: 24px;
		align-items: start;
	}

	.calendar-layout.has-panel {
		grid-template-columns: auto 1fr;
	}

	@media (max-width: 900px) {
		.calendar-layout.has-panel {
			grid-template-columns: 1fr;
		}
	}

	/* ── Month section ── */
	.month-section {
		background: var(--surface-1);
		border-radius: var(--radius-xl);
		padding: 20px 16px 16px;
		box-shadow: var(--shadow-sm);
		width: 320px;
		flex-shrink: 0;
	}

	@media (max-width: 900px) {
		.month-section { width: 100%; }
	}

	/* ── Month nav ── */
	.month-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20px;
	}

	.month-label {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	.nav-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-full);
		border: 1px solid var(--border-subtle);
		background: var(--surface-2);
		color: var(--text-secondary);
		cursor: pointer;
		transition: background-color 120ms cubic-bezier(0.22, 1, 0.36, 1), color 120ms cubic-bezier(0.22, 1, 0.36, 1), border-color 120ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.nav-btn:hover {
		background: var(--surface-3);
		color: var(--text-primary);
		border-color: var(--border-default);
	}

	.nav-btn:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	/* ── Calendar grid ── */
	.cal-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0;
	}

	.dow-label {
		text-align: center;
		font-size: 11px;
		font-weight: 500;
		color: var(--text-tertiary);
		letter-spacing: 0.02em;
		padding: 0 0 10px;
	}

	.cal-cell {
		aspect-ratio: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
	}

	.cal-cell.empty {
		background: transparent;
	}

	.day-cell {
		border: none;
		background: transparent;
		cursor: pointer;
		color: var(--text-primary);
		font-size: 13px;
		padding: 0;
		position: relative;
	}

	/* Circular hover target */
	.day-cell::before {
		content: '';
		position: absolute;
		inset: 15%;
		border-radius: var(--radius-full);
		background: var(--surface-2);
		transform: scale(0.7);
		opacity: 0;
		transition:
			transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1),
			opacity 120ms ease;
		pointer-events: none;
	}

	.day-cell:hover::before {
		transform: scale(1);
		opacity: 1;
	}

	.day-cell:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: -4px;
		border-radius: var(--radius-full);
	}

	/* Today — accent ring, not filled */
	.day-cell.is-today:not(.is-selected) .day-num {
		box-shadow: inset 0 0 0 1.5px var(--accent);
		border-radius: var(--radius-full);
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		color: var(--accent);
		font-size: 13px;
	}

	/* Selected — filled accent circle from center */
	.day-cell.is-selected::before {
		background: var(--accent);
		transform: scale(1);
		opacity: 1;
		inset: 10%;
		transition:
			transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1),
			opacity 150ms ease;
	}

	.day-cell.is-selected .day-num {
		color: var(--text-on-accent);
		font-weight: 600;
	}

	/* Activity dots above ::before */
	.day-num,
	.dot-row {
		position: relative;
		z-index: 1;
	}

	.day-num {
		font-size: 13px;
		line-height: 1;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* ── Activity dots ── */
	.dot-row {
		display: flex;
		gap: 2px;
		align-items: center;
	}

	.dot {
		display: inline-block;
		width: 4px;
		height: 4px;
		border-radius: var(--radius-full);
	}

	.dot-accent { background: var(--accent); }
	.dot-success { background: var(--success); }
	.dot-info { background: var(--info); }

	/* ── Legend ── */
	.legend {
		display: flex;
		gap: 12px;
		margin-top: 16px;
		padding-top: 12px;
		border-top: 1px solid var(--border-subtle);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 11px;
		color: var(--text-tertiary);
	}

	/* ── Day panel ── */
	.day-panel {
		background: var(--surface-1);
		border-radius: var(--radius-xl);
		padding: 20px;
		box-shadow: var(--shadow-sm);
		display: flex;
		flex-direction: column;
		gap: 24px;
		min-width: 0;
	}

	.panel-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	.panel-date {
		font-size: 15px;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.3;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		flex-shrink: 0;
		border-radius: var(--radius-md);
		border: none;
		background: transparent;
		color: var(--text-tertiary);
		cursor: pointer;
		transition: background-color 120ms cubic-bezier(0.22, 1, 0.36, 1), color 120ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.close-btn:hover {
		background: var(--surface-2);
		color: var(--text-primary);
	}

	.close-btn:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	/* ── Panel sections ── */
	.panel-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.section-label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		font-weight: 500;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.empty-inline {
		font-size: 13px;
		color: var(--text-tertiary);
		margin: 0;
		padding: 4px 0;
	}

	/* ── Todos ── */
	.todo-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.todo-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 10px;
		border-radius: var(--radius-md);
		background: var(--surface-2);
	}

	.todo-row.done .todo-title {
		text-decoration: line-through;
		color: var(--text-tertiary);
	}

	.todo-check {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.todo-title {
		font-size: 14px;
		color: var(--text-primary);
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.priority-dot {
		width: 6px;
		height: 6px;
		border-radius: var(--radius-full);
		flex-shrink: 0;
	}

	/* ── Habits ── */
	.habit-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.habit-row {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 8px 10px;
		border-radius: var(--radius-md);
		background: var(--surface-2);
	}

	.habit-info {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.habit-dot {
		width: 8px;
		height: 8px;
		border-radius: var(--radius-full);
		flex-shrink: 0;
	}

	.habit-name {
		font-size: 14px;
		color: var(--text-primary);
		flex: 1;
	}

	.habit-total {
		font-size: 13px;
		color: var(--text-secondary);
		white-space: nowrap;
	}

	.habit-goal {
		color: var(--text-tertiary);
	}

	.habit-bar-track {
		height: 4px;
		background: var(--surface-3);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.habit-bar-fill {
		height: 100%;
		border-radius: var(--radius-full);
		transition: width 400ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	/* ── Notes ── */
	.notes-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.note-row {
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.note-link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 8px 10px;
		background: var(--surface-2);
		color: var(--text-primary);
		text-decoration: none;
		transition: background-color 120ms cubic-bezier(0.22, 1, 0.36, 1);
		border-radius: var(--radius-md);
	}

	.note-link:hover {
		background: var(--surface-3);
	}

	.note-title {
		font-size: 14px;
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.note-type {
		font-size: 11px;
		font-weight: 500;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		flex-shrink: 0;
	}

	/* ── Panel empty state ── */
	.panel-empty {
		display: none;
	}

	@media (min-width: 901px) {
		.panel-empty {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 12px;
			padding: 48px 24px;
			background: var(--surface-1);
			border-radius: var(--radius-xl);
			box-shadow: var(--shadow-sm);
		}
	}

	.panel-empty-text {
		font-size: 14px;
		color: var(--text-tertiary);
		margin: 0;
		text-align: center;
	}

	/* ── Google Calendar events ── */
	.gc-connect-link {
		font-size: 13px;
		color: var(--accent);
		text-decoration: none;
		padding: 4px 0;
		transition: opacity 120ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.gc-connect-link:hover { opacity: 0.8; }

	.gc-event-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.gc-event-row {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 7px 10px;
		background: var(--surface-2);
		border-radius: var(--radius-md);
	}

	.gc-event-time {
		font-size: 11px;
		color: var(--text-tertiary);
		min-width: 54px;
		flex-shrink: 0;
		padding-top: 2px;
	}

	.gc-event-body {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.gc-event-title {
		font-size: 13px;
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.gc-event-loc {
		font-size: 11px;
		color: var(--text-tertiary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
