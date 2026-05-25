<script lang="ts">
	import { CalendarDays, ChevronRight, Clock, FileText, X } from 'lucide-svelte';
	import HabitProgressList from '$lib/components/HabitProgressList.svelte';
	import TodoList from '$lib/components/TodoList.svelte';
	import type { CalendarDayData } from '$lib/types';

	export let selectedDate: string | null = null;
	export let dayData: CalendarDayData | null = null;
	export let gcConnected = false;
	export let onClose: () => void = () => {};

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function formatSelectedDate(date: string): string {
		return new Date(`${date}T00:00:00`).toLocaleDateString('en-AU', {
			weekday: 'long',
			day: 'numeric',
			month: 'long'
		});
	}
</script>

{#if selectedDate && dayData}
	<aside class="day-panel" aria-label="Selected day activity">
		<header class="panel-header">
			<div class="date-copy">
				<p>Selected day</p>
				<h2>{formatSelectedDate(selectedDate)}</h2>
			</div>
			<button class="icon-button" type="button" on:click={onClose} aria-label="Close day details">
				<X size={15} strokeWidth={2} />
			</button>
		</header>

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
				<ul class="event-list">
					{#each dayData.gcEvents as event (event.id)}
						<li>
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
				<span class="section-title">Todos</span>
				<span class="section-count">{dayData.todos.length}</span>
			</div>
			<TodoList
				todos={dayData.todos}
				today={selectedDate}
				addAction="?/addTodo"
				toggleAction="?/toggleTodo"
				updateAction="?/updateTodo"
				removeAction="?/removeTodo"
				compact
				showDueDate={false}
				emptyMode="inline"
				emptyTitle="No todos"
				emptyDescription="Add one for this day."
			/>
		</section>

		<section class="panel-section">
			<div class="section-heading">
				<span class="section-title">Habits</span>
				<span class="section-count">{dayData.habits.length}</span>
			</div>
			<HabitProgressList
				habits={dayData.habits}
				date={selectedDate}
				logAction="?/logHabit"
				updateLogAction="?/updateHabitLog"
				removeLogAction="?/removeHabitLog"
			/>
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
				<ul class="note-list">
					{#each dayData.notes as note}
						<li>
							<a href="/notes?id={note.id}" class="note-link">
								<span>{note.title || 'Untitled'}</span>
								<ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</aside>
{:else}
	<aside class="day-panel empty-panel" aria-label="Selected day activity">
		<div class="empty-content">
			<CalendarDays size={28} strokeWidth={1.5} aria-hidden="true" />
			<div>
				<h2>No day selected</h2>
				<p>Choose a date to edit its todos, habits, and notes.</p>
			</div>
		</div>
	</aside>
{/if}

<style>
	.day-panel {
		min-width: 0;
		overflow: hidden;
		background: var(--surface-1);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-lg);
	}

	.panel-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		padding: 16px;
		border-bottom: 1px solid var(--border-subtle);
	}

	.date-copy {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	h2,
	p {
		margin: 0;
	}

	.date-copy p {
		color: var(--text-tertiary);
		font-size: 12px;
		font-weight: 500;
		line-height: 1.4;
	}

	.date-copy h2,
	.empty-content h2 {
		color: var(--text-primary);
		font-size: 16px;
		font-weight: 600;
		line-height: 1.3;
	}

	.icon-button {
		width: 30px;
		height: 30px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		border: none;
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		transition:
			background-color 120ms var(--ease-out),
			color 120ms var(--ease-out);
	}

	.icon-button:hover {
		background: var(--surface-2);
		color: var(--text-primary);
	}

	.icon-button:focus-visible,
	.connect-link:focus-visible,
	.note-link:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.panel-section {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 16px;
		border-bottom: 1px solid var(--border-subtle);
	}

	.panel-section:last-child {
		border-bottom: 0;
	}

	.section-heading,
	.section-title,
	.connect-link,
	.note-link {
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

	.connect-link,
	.note-link {
		justify-content: space-between;
		gap: 12px;
		min-height: 36px;
		border-radius: var(--radius-md);
		color: var(--accent);
		font-size: 13px;
		font-weight: 500;
	}

	.event-list,
	.note-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		border-top: 1px solid var(--border-subtle);
	}

	.event-list li,
	.note-list li {
		min-width: 0;
		border-bottom: 1px solid var(--border-subtle);
	}

	.event-list li:last-child,
	.note-list li:last-child {
		border-bottom: 0;
	}

	.event-list li {
		display: grid;
		grid-template-columns: 68px minmax(0, 1fr);
		gap: 12px;
		padding: 10px 0;
	}

	.event-time,
	.event-location {
		color: var(--text-tertiary);
		font-size: 12px;
		line-height: 1.5;
	}

	.event-copy {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.event-title,
	.event-location,
	.note-link span {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.event-title,
	.note-link span {
		color: var(--text-primary);
		font-size: 13px;
		line-height: 1.5;
	}

	.note-link {
		padding: 10px 0;
		color: var(--text-secondary);
	}

	.note-link:hover span {
		color: var(--accent);
	}

	.empty-panel {
		min-height: 260px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.empty-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 24px;
		color: var(--text-tertiary);
		text-align: center;
	}

	.empty-content div {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.empty-content p {
		max-width: 240px;
		color: var(--text-tertiary);
		font-size: 13px;
		line-height: 1.5;
	}

	.panel-section :global(.todo-list-shell),
	.panel-section :global(.habit-list) {
		min-width: 0;
	}
</style>
