<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import type { CalendarDayActivity } from '$lib/types';

	export let year: number;
	export let month: number;
	export let selectedDate: string | null = null;
	export let activity: CalendarDayActivity[] = [];
	export let today: string;
	export let onNavigate: (direction: -1 | 1) => void = () => {};
	export let onSelectDate: (date: string) => void = () => {};
	export let onSelectToday: () => void = () => {};

	const MONTH_NAMES = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];
	const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	type CalendarCell = { date: string; day: number } | null;

	$: activityMap = new Map(activity.map((item) => [item.date, item]));
	$: firstDayOfWeek = new Date(year, month - 1, 1).getDay();
	$: daysInMonth = new Date(year, month, 0).getDate();
	$: monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

	$: calendarCells = (() => {
		const cells: CalendarCell[] = [];
		for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
		for (let day = 1; day <= daysInMonth; day++) {
			cells.push({
				day,
				date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
			});
		}
		while (cells.length % 7 !== 0) cells.push(null);
		return cells;
	})();

	function activityLabel(activityForDay: CalendarDayActivity | undefined): string {
		if (!activityForDay) return '';
		const labels = [
			activityForDay.hasTodos ? 'todos' : null,
			activityForDay.hasHabitLogs ? 'habit logs' : null,
			activityForDay.hasNotes ? 'notes' : null
		].filter(Boolean);
		return labels.length ? `, has ${labels.join(', ')}` : '';
	}
</script>

<section class="calendar-card" aria-label="Calendar month">
	<div class="calendar-toolbar">
		<div class="toolbar-copy">
			<h2>{monthLabel}</h2>
			<p>{selectedDate ?? today}</p>
		</div>

		<div class="toolbar-actions">
			<button class="today-button" type="button" on:click={onSelectToday}>Today</button>
			<div class="icon-group" aria-label="Month navigation">
				<button class="icon-button" type="button" on:click={() => onNavigate(-1)} aria-label="Previous month">
					<ChevronLeft size={16} strokeWidth={2} />
				</button>
				<button class="icon-button" type="button" on:click={() => onNavigate(1)} aria-label="Next month">
					<ChevronRight size={16} strokeWidth={2} />
				</button>
			</div>
		</div>
	</div>

	<div class="month-grid">
		{#each DAY_LABELS as label}
			<div class="weekday">{label}</div>
		{/each}

		{#each calendarCells as cell}
			{#if cell === null}
				<div class="day-cell empty"></div>
			{:else}
				{@const dayActivity = activityMap.get(cell.date)}
				{@const isToday = cell.date === today}
				{@const isSelected = cell.date === selectedDate}
				<button
					type="button"
					class="day-cell"
					class:is-today={isToday}
					class:is-selected={isSelected}
					on:click={() => onSelectDate(cell.date)}
					aria-label={`${cell.date}${activityLabel(dayActivity)}`}
					aria-pressed={isSelected}
				>
					<span class="day-number">{cell.day}</span>
					{#if dayActivity}
						<span class="markers" aria-hidden="true">
							{#if dayActivity.hasTodos}
								<span class="marker todo"></span>
							{/if}
							{#if dayActivity.hasHabitLogs}
								<span class="marker habit"></span>
							{/if}
							{#if dayActivity.hasNotes}
								<span class="marker note"></span>
							{/if}
						</span>
					{/if}
				</button>
			{/if}
		{/each}
	</div>

	<div class="legend" aria-label="Activity legend">
		<span><span class="marker todo"></span>Todos</span>
		<span><span class="marker habit"></span>Habits</span>
		<span><span class="marker note"></span>Notes</span>
	</div>
</section>

<style>
	.calendar-card {
		min-width: 0;
		overflow: hidden;
		background: var(--surface-1);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-lg);
	}

	.calendar-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 16px 20px;
		border-bottom: 1px solid var(--border-subtle);
	}

	.toolbar-copy {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	h2,
	p {
		margin: 0;
	}

	h2 {
		color: var(--text-primary);
		font-size: 18px;
		font-weight: 600;
		line-height: 1.3;
	}

	p {
		color: var(--text-tertiary);
		font-size: 13px;
		line-height: 1.4;
	}

	.toolbar-actions,
	.icon-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.today-button,
	.icon-button {
		height: 32px;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		background: var(--surface-2);
		color: var(--text-secondary);
		font: inherit;
		font-size: 13px;
		cursor: pointer;
		transition:
			background-color 120ms var(--ease-out),
			border-color 120ms var(--ease-out),
			color 120ms var(--ease-out);
	}

	.today-button {
		padding: 0 12px;
	}

	.icon-button {
		width: 32px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.today-button:hover,
	.icon-button:hover {
		background: var(--surface-3);
		border-color: var(--border-strong);
		color: var(--text-primary);
	}

	.today-button:focus-visible,
	.icon-button:focus-visible,
	.day-cell:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.month-grid {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
	}

	.weekday {
		display: flex;
		align-items: center;
		height: 36px;
		padding: 0 12px;
		border-bottom: 1px solid var(--border-subtle);
		color: var(--text-tertiary);
		font-size: 11px;
		font-weight: 500;
		line-height: 1;
	}

	.day-cell {
		min-width: 0;
		min-height: 88px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: space-between;
		gap: 8px;
		padding: 12px;
		border: 0;
		border-right: 1px solid var(--border-subtle);
		border-bottom: 1px solid var(--border-subtle);
		background: transparent;
		color: var(--text-secondary);
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition:
			background-color 120ms var(--ease-out),
			color 120ms var(--ease-out);
	}

	.day-cell:nth-child(7n) {
		border-right: 0;
	}

	.day-cell.empty {
		cursor: default;
		background: color-mix(in oklab, var(--surface-2) 28%, transparent);
	}

	.day-cell:not(.empty):hover {
		background: var(--surface-2);
		color: var(--text-primary);
	}

	.day-cell.is-selected {
		background: var(--accent-soft);
		color: var(--text-primary);
	}

	.day-cell.is-today:not(.is-selected) {
		background: color-mix(in oklab, var(--accent) 7%, transparent);
	}

	.day-number {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-md);
		font-size: 13px;
		font-weight: 500;
		line-height: 1;
	}

	.day-cell.is-today .day-number {
		color: var(--accent);
		box-shadow: inset 0 0 0 1px var(--accent);
	}

	.day-cell.is-selected .day-number {
		background: var(--accent);
		color: var(--text-on-accent);
		box-shadow: none;
	}

	.markers {
		display: flex;
		align-items: center;
		gap: 4px;
		min-height: 6px;
	}

	.marker {
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: var(--radius-full);
	}

	.marker.todo {
		background: var(--accent);
	}

	.marker.habit {
		background: var(--success);
	}

	.marker.note {
		background: var(--info);
	}

	.legend {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 12px 20px;
		color: var(--text-tertiary);
		font-size: 12px;
		border-top: 1px solid var(--border-subtle);
	}

	.legend span {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	@media (max-width: 760px) {
		.calendar-toolbar {
			align-items: flex-start;
			flex-direction: column;
			padding: 16px;
		}

		.toolbar-actions {
			width: 100%;
			justify-content: space-between;
		}

		.day-cell {
			min-height: 56px;
			padding: 8px;
		}

		.weekday {
			height: 32px;
			justify-content: center;
			padding: 0;
		}

		.day-number {
			width: 24px;
			height: 24px;
		}

		.legend {
			padding: 12px 16px;
			flex-wrap: wrap;
		}
	}
</style>
