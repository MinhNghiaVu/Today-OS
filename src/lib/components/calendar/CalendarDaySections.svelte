<script lang="ts">
	import {
		Activity,
		CheckCircle2,
		CheckSquare,
		ChevronRight,
		Circle,
		Clock,
		FileText
	} from 'lucide-svelte';
	import { habitProgressColor, habitProgressWidth } from '$lib/utils/habits';
	import type { CalendarDayData, HabitType, TodoPriority } from '$lib/types';

	export let dayData: CalendarDayData;
	export let gcConnected = false;

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function getPriorityColor(priority: TodoPriority | undefined): string {
		if (priority === 'high') return 'var(--warning)';
		if (priority === 'medium') return 'var(--info)';
		return 'var(--text-tertiary)';
	}

	function getBarColor(habit: { total: number; daily_goal: number | null; type: string; color: string }): string {
		return habitProgressColor({ ...habit, type: habit.type as HabitType });
	}
</script>

<div class="section-stack">
	<section class="panel-section">
		<div class="section-heading">
			<span class="section-title">
				<Clock size={14} strokeWidth={2} aria-hidden="true" />
				Schedule
			</span>
			<span class="section-count">{dayData.gcEvents.length}</span>
		</div>

		{#if !gcConnected}
			<a href="/auth/connect-calendar" class="connect-link">
				<span>Connect Google Calendar</span>
				<ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
			</a>
		{:else if dayData.gcEvents.length === 0}
			<p class="empty-inline">No events.</p>
		{:else}
			<ul class="row-list">
				{#each dayData.gcEvents as event (event.id)}
					<li class="event-row">
						<span class="event-time">{event.allDay ? 'All day' : formatTime(event.start)}</span>
						<span class="event-copy">
							<span class="event-title">{event.title}</span>
							{#if event.location}
								<span class="event-location">{event.location}</span>
							{/if}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="panel-section">
		<div class="section-heading">
			<span class="section-title">
				<CheckSquare size={14} strokeWidth={2} aria-hidden="true" />
				Todos
			</span>
			<span class="section-count">{dayData.todos.length}</span>
		</div>

		{#if dayData.todos.length === 0}
			<p class="empty-inline">No todos for this day.</p>
		{:else}
			<ul class="row-list">
				{#each dayData.todos as todo}
					<li class="todo-row" class:done={todo.status === 'done'}>
						<span class="todo-check" aria-hidden="true">
							{#if todo.status === 'done'}
								<CheckCircle2 size={15} strokeWidth={2} />
							{:else}
								<Circle size={15} strokeWidth={2} />
							{/if}
						</span>
						<span class="row-title">{todo.title}</span>
						{#if todo.priority && todo.priority !== 'low'}
							<span class="priority-dot" style="background: {getPriorityColor(todo.priority)}"></span>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="panel-section">
		<div class="section-heading">
			<span class="section-title">
				<Activity size={14} strokeWidth={2} aria-hidden="true" />
				Habits
			</span>
			<span class="section-count">{dayData.habits.length}</span>
		</div>

		{#if dayData.habits.length === 0}
			<p class="empty-inline">No active habits.</p>
		{:else}
			<ul class="row-list">
				{#each dayData.habits as habit}
					<li class="habit-row">
						<div class="habit-topline">
							<span class="habit-dot" style="background: {habit.color}"></span>
							<span class="row-title">{habit.name}</span>
							<span class="habit-total">
								{habit.total} {habit.unit}
								{#if habit.daily_goal}
									<span>/ {habit.daily_goal}</span>
								{/if}
							</span>
						</div>
						{#if habit.daily_goal}
							<div class="habit-bar-track">
								<div
									class="habit-bar-fill"
									style="width: {habitProgressWidth(habit)}%; background: {getBarColor(habit)}"
								></div>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="panel-section">
		<div class="section-heading">
			<span class="section-title">
				<FileText size={14} strokeWidth={2} aria-hidden="true" />
				Notes
			</span>
			<span class="section-count">{dayData.notes.length}</span>
		</div>

		{#if dayData.notes.length === 0}
			<p class="empty-inline">No notes for this day.</p>
		{:else}
			<ul class="row-list">
				{#each dayData.notes as note}
					<li class="note-row">
						<a href="/notes?id={note.id}" class="note-link">
							<span class="row-title">{note.title || 'Untitled'}</span>
							<span class="note-type">{note.type}</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<style>
	.section-stack,
	.panel-section {
		display: flex;
		flex-direction: column;
	}

	.panel-section {
		gap: 12px;
		padding: 16px 20px;
		border-bottom: 1px solid var(--border-subtle);
	}

	.panel-section:last-child {
		border-bottom: 0;
	}

	.section-heading,
	.section-title {
		display: flex;
		align-items: center;
	}

	.section-heading {
		justify-content: space-between;
		gap: 12px;
	}

	.section-title {
		gap: 8px;
		min-width: 0;
		color: var(--text-secondary);
		font-size: 13px;
		font-weight: 500;
		line-height: 1.4;
	}

	.section-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 24px;
		height: 22px;
		padding: 0 8px;
		border-radius: var(--radius-full);
		background: var(--surface-2);
		color: var(--text-tertiary);
		font-size: 12px;
		line-height: 1;
	}

	.empty-inline {
		margin: 0;
		color: var(--text-tertiary);
		font-size: 13px;
		line-height: 1.5;
	}

	.connect-link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		min-height: 40px;
		color: var(--accent);
		font-size: 13px;
		font-weight: 500;
		border-radius: var(--radius-md);
	}

	.connect-link:focus-visible,
	.note-link:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.row-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		border-top: 1px solid var(--border-subtle);
	}

	.event-row,
	.todo-row,
	.habit-row,
	.note-link {
		min-width: 0;
		border-bottom: 1px solid var(--border-subtle);
	}

	.row-list > :last-child,
	.row-list > :last-child .note-link {
		border-bottom: 0;
	}

	.event-row {
		display: grid;
		grid-template-columns: 68px minmax(0, 1fr);
		gap: 12px;
		padding: 10px 0;
	}

	.event-time {
		color: var(--text-tertiary);
		font-size: 12px;
		line-height: 1.5;
		white-space: nowrap;
	}

	.event-copy {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.event-title,
	.event-location,
	.row-title,
	.note-type {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.event-title,
	.row-title {
		color: var(--text-primary);
		font-size: 13px;
		line-height: 1.5;
	}

	.event-location,
	.note-type {
		color: var(--text-tertiary);
		font-size: 12px;
		line-height: 1.4;
	}

	.todo-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 0;
	}

	.todo-row.done .row-title {
		color: var(--text-tertiary);
		text-decoration: line-through;
	}

	.todo-check {
		display: inline-flex;
		color: var(--border-strong);
	}

	.todo-row.done .todo-check {
		color: var(--success);
	}

	.priority-dot,
	.habit-dot {
		display: inline-block;
		flex: 0 0 auto;
		border-radius: var(--radius-full);
	}

	.priority-dot {
		width: 6px;
		height: 6px;
	}

	.habit-row {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 10px 0;
	}

	.habit-topline {
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.habit-dot {
		width: 8px;
		height: 8px;
	}

	.habit-total {
		flex: 0 0 auto;
		color: var(--text-secondary);
		font-size: 12px;
		line-height: 1.4;
	}

	.habit-total span {
		color: var(--text-tertiary);
	}

	.habit-bar-track {
		height: 4px;
		overflow: hidden;
		background: var(--surface-3);
		border-radius: var(--radius-full);
	}

	.habit-bar-fill {
		height: 100%;
		border-radius: inherit;
		transition: width 220ms var(--ease-out);
	}

	.note-row {
		min-width: 0;
	}

	.note-link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 0;
		border-radius: var(--radius-sm);
		transition: color 120ms var(--ease-out);
	}

	.note-link:hover .row-title {
		color: var(--accent);
	}

	.note-type {
		flex: 0 0 auto;
	}

	@media (max-width: 760px) {
		.panel-section {
			padding-right: 16px;
			padding-left: 16px;
		}

		.event-row {
			grid-template-columns: 60px minmax(0, 1fr);
		}
	}
</style>
