<script lang="ts">
	import { BarChart3, CheckSquare, FileText } from 'lucide-svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import SummaryStatStrip from '$lib/components/SummaryStatStrip.svelte';
	import { formatHabitTotal } from '$lib/utils/habits';
	import type { PageData } from './$types';

	export let data: PageData;

	const { habitSummaries, todosCompleted, notesCreated, weekDays } = data;

	const habitSummariesArr = Object.values(habitSummaries);

	$: totalHabits = habitSummariesArr.length;
	$: totalTodosDone = todosCompleted.reduce((sum, d) => sum + d.count, 0);
	$: totalNotes = notesCreated.length;

	$: summaryStats = [
		{
			value: totalHabits,
			label: `habit${totalHabits === 1 ? '' : 's'} tracked`,
			ariaLabel: `${totalHabits} habits tracked`
		},
		{
			value: totalTodosDone,
			label: `todo${totalTodosDone === 1 ? '' : 's'} done`,
			ariaLabel: `${totalTodosDone} todos completed`
		},
		{
			value: totalNotes,
			label: `note${totalNotes === 1 ? '' : 's'}`,
			ariaLabel: `${totalNotes} notes`
		}
	];

	function formatDateLabel(iso: string): string {
		const d = new Date(iso + 'T00:00:00');
		return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' });
	}

	function dayColorClass(met: boolean, total: number): string {
		if (total === 0) return 'day-empty';
		return met ? 'day-met' : 'day-not-met';
	}
</script>

<PageShell title="Weekly review" subtitle="How the past 7 days went — habits, todos, and notes at a glance." maxWidth="narrow">
	<svelte:fragment slot="actions">
		<SummaryStatStrip items={summaryStats} ariaLabel="Week summary" />
	</svelte:fragment>

	{#if habitSummariesArr.length === 0 && totalTodosDone === 0 && totalNotes === 0}
		<div class="empty-state">
			<BarChart3 class="empty-icon" size={28} strokeWidth={1.8} aria-hidden="true" />
			<div>
				<p>Nothing to review yet.</p>
				<span>Log habits, complete todos, and write notes throughout the week to see them here.</span>
			</div>
		</div>
	{/if}

	{#if habitSummariesArr.length > 0}
		<section class="panel">
			<div class="panel-heading">
				<h2>Habit compliance</h2>
				<span class="panel-subtitle">Per-day progress</span>
			</div>

			<div class="habit-grid">
				{#each habitSummariesArr as { habit, days }}
					<div class="habit-card">
						<div class="habit-header">
							<span class="habit-name">{habit.name}</span>
							<span class="habit-goal">{habit.daily_goal ? `${formatHabitTotal(habit.daily_goal)} ${habit.unit}` : habit.unit}</span>
						</div>
						<div class="week-strip">
							{#each days as day}
								<div
									class="day-cell {dayColorClass(day.met, day.total)}"
									title="{formatDateLabel(day.date)}: {formatHabitTotal(day.total)} {habit.unit}"
									aria-label="{formatDateLabel(day.date)}: {formatHabitTotal(day.total)} {habit.unit}"
								>
									<span class="day-label">{formatDateLabel(day.date)}</span>
									<span class="day-value">{formatHabitTotal(day.total)}</span>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	{#if totalTodosDone > 0}
		<section class="panel">
			<div class="panel-heading">
				<div class="panel-heading-row">
					<CheckSquare size={16} strokeWidth={2} aria-hidden="true" />
					<h2>Todos completed</h2>
				</div>
				<span class="total-badge">{totalTodosDone} total</span>
			</div>

			<div class="todos-week-strip">
				{#each todosCompleted as day}
					<div class="todo-day-card" class:todo-day-empty={day.count === 0}>
						<span class="todo-day-label">{formatDateLabel(day.date)}</span>
						<span class="todo-day-count">{day.count}</span>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	{#if totalNotes > 0}
		<section class="panel">
			<div class="panel-heading">
				<div class="panel-heading-row">
					<FileText size={16} strokeWidth={2} aria-hidden="true" />
					<h2>Notes this week</h2>
				</div>
				<span class="total-badge">{totalNotes} note{totalNotes === 1 ? '' : 's'}</span>
			</div>

			<ul class="note-list">
				{#each notesCreated as note}
					<li>
						<span class="note-date">{formatDateLabel(note.date)}</span>
						<div class="note-body">
							<span class="note-title">{note.title}</span>
							{#if note.content.length > 0}
								<span class="note-preview">{note.content.slice(0, 120)}{note.content.length > 120 ? '…' : ''}</span>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</PageShell>

<style>
	h2 {
		margin: 0;
		color: var(--text-primary);
		font-size: 15px;
		font-weight: 600;
		letter-spacing: 0;
	}

	.panel {
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		padding: 18px;
		margin-top: 16px;
		box-shadow: var(--shadow-sm);
	}

	.panel-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 14px;
		gap: 12px;
	}

	.panel-heading-row {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}

	.panel-heading-row :global(svg) {
		color: var(--text-tertiary);
		flex-shrink: 0;
	}

	.panel-subtitle {
		color: var(--text-tertiary);
		font-size: 12px;
	}

	.total-badge {
		display: inline-flex;
		align-items: center;
		min-height: 24px;
		border-radius: var(--radius-full);
		background: var(--surface-2);
		padding: 0 9px;
		color: var(--text-secondary);
		font-size: 12px;
		font-weight: 500;
	}

	.empty-state {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		border-radius: var(--radius-lg);
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		color: var(--text-secondary);
		font-size: 13px;
	}

	.empty-state :global(.empty-icon) {
		flex-shrink: 0;
		margin-top: 1px;
		color: var(--text-tertiary);
	}

	.empty-state p {
		margin: 0;
		color: var(--text-primary);
		font-weight: 500;
	}

	.empty-state span {
		display: block;
		margin-top: 3px;
		color: var(--text-tertiary);
	}

	/* ── Habit grid ─────────────────────────────────────── */

	.habit-grid {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.habit-card {
		background: var(--surface-2);
		border-radius: var(--radius-md);
		padding: 14px;
	}

	.habit-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10px;
	}

	.habit-name {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-primary);
	}

	.habit-goal {
		font-size: 12px;
		color: var(--text-tertiary);
	}

	.week-strip {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 6px;
	}

	.day-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 8px 4px;
		border-radius: var(--radius-md);
		text-align: center;
		transition: background-color 120ms var(--ease-out);
	}

	.day-cell.day-met {
		background: color-mix(in oklab, var(--accent) 18%, transparent);
	}

	.day-cell.day-not-met {
		background: color-mix(in oklab, var(--accent) 9%, transparent);
	}

	.day-cell.day-empty {
		background: transparent;
	}

	.day-label {
		font-size: 10px;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.3px;
		font-weight: 500;
	}

	.day-value {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-primary);
	}

	.day-cell.day-empty .day-value {
		color: var(--text-tertiary);
	}

	/* ── Todos strip ────────────────────────────────────── */

	.todos-week-strip {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 8px;
	}

	.todo-day-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 12px 4px;
		border-radius: var(--radius-md);
		background: var(--surface-2);
		text-align: center;
	}

	.todo-day-card.todo-day-empty {
		opacity: 0.5;
	}

	.todo-day-label {
		font-size: 10px;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.3px;
		font-weight: 500;
	}

	.todo-day-count {
		font-size: 20px;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1;
	}

	.todo-day-card.todo-day-empty .todo-day-count {
		color: var(--text-tertiary);
	}

	/* ── Notes list ─────────────────────────────────────── */

	.note-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.note-list li {
		display: grid;
		grid-template-columns: 52px minmax(0, 1fr);
		gap: 10px;
		padding: 10px;
		border-radius: var(--radius-md);
		background: var(--surface-2);
	}

	.note-date {
		font-size: 11px;
		color: var(--text-tertiary);
		font-weight: 500;
		padding-top: 1px;
	}

	.note-body {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.note-title {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.note-preview {
		font-size: 12px;
		color: var(--text-tertiary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (max-width: 640px) {
		.panel {
			padding: 14px;
		}

		.day-cell {
			padding: 6px 2px;
		}

		.todo-day-card {
			padding: 8px 2px;
		}
	}
</style>