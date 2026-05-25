<script lang="ts">
	import { CalendarDays, X } from 'lucide-svelte';
	import type { CalendarDayData } from '$lib/types';
	import CalendarDaySections from './CalendarDaySections.svelte';

	export let selectedDate: string | null = null;
	export let dayData: CalendarDayData | null = null;
	export let gcConnected = false;
	export let onClose: () => void = () => {};

	function formatSelectedDate(date: string): string {
		return new Date(`${date}T00:00:00`).toLocaleDateString('en-AU', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
		return `${count} ${count === 1 ? singular : pluralForm}`;
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

		<div class="summary-strip" aria-label="Daily activity totals">
			<span>{plural(dayData.gcEvents.length, 'event')}</span>
			<span>{plural(dayData.todos.length, 'todo')}</span>
			<span>{plural(dayData.habits.filter((habit) => habit.total > 0).length, 'habit logged', 'habits logged')}</span>
			<span>{plural(dayData.notes.length, 'note')}</span>
		</div>

		<CalendarDaySections {dayData} {gcConnected} />
	</aside>
{:else}
	<aside class="day-panel empty-panel" aria-label="Selected day activity">
		<div class="empty-content">
			<CalendarDays size={28} strokeWidth={1.5} aria-hidden="true" />
			<div>
				<h2>No day selected</h2>
				<p>Choose a date to see schedule, todos, habits, and notes.</p>
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
		padding: 16px 20px;
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
		width: 32px;
		height: 32px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		background: var(--surface-2);
		color: var(--text-secondary);
		cursor: pointer;
		transition:
			background-color 120ms var(--ease-out),
			border-color 120ms var(--ease-out),
			color 120ms var(--ease-out);
	}

	.icon-button:hover {
		background: var(--surface-3);
		border-color: var(--border-strong);
		color: var(--text-primary);
	}

	.icon-button:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.summary-strip {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0;
		border-bottom: 1px solid var(--border-subtle);
		background: color-mix(in oklab, var(--surface-2) 42%, transparent);
	}

	.summary-strip span {
		min-width: 0;
		padding: 10px 16px;
		color: var(--text-secondary);
		font-size: 12px;
		line-height: 1.4;
		border-right: 1px solid var(--border-subtle);
		border-bottom: 1px solid var(--border-subtle);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.summary-strip span:nth-child(2n) {
		border-right: 0;
	}

	.summary-strip span:nth-last-child(-n + 2) {
		border-bottom: 0;
	}

	.empty-panel {
		min-height: 360px;
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

	@media (max-width: 760px) {
		.panel-header {
			padding-right: 16px;
			padding-left: 16px;
		}

		.summary-strip span {
			padding-right: 12px;
			padding-left: 12px;
		}
	}
</style>
