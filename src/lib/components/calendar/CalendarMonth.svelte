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
	$: monthName = MONTH_NAMES[month - 1];

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
		<h2><span>{monthName}</span> <span class="muted-year">{year}</span></h2>

		<div class="icon-group" aria-label="Month navigation">
			<button class="icon-button" type="button" on:click={() => onNavigate(-1)} aria-label="Previous month">
				<ChevronLeft size={17} strokeWidth={2.2} />
			</button>
			<button class="icon-button" type="button" on:click={() => onNavigate(1)} aria-label="Next month">
				<ChevronRight size={17} strokeWidth={2.2} />
			</button>
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
							<span class="marker" class:active={dayActivity.hasTodos || dayActivity.hasHabitLogs || dayActivity.hasNotes}></span>
						</span>
					{/if}
				</button>
			{/if}
		{/each}
	</div>
</section>

<style>
	.calendar-card {
		width: 320px;
		max-width: 100%;
		background: var(--surface-1);
		border-radius: var(--radius-lg);
		padding: 20px;
		box-shadow: var(--shadow-sm);
	}

	.calendar-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 20px;
	}

	h2 {
		margin: 0;
		color: var(--text-primary);
		font-size: 18px;
		font-weight: 600;
		line-height: 1.2;
	}

	.muted-year {
		color: var(--text-tertiary);
		font-weight: 600;
	}

	.icon-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.icon-button {
		width: 30px;
		height: 30px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--text-secondary);
		font: inherit;
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
	.day-cell:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.month-grid {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 6px;
	}

	.weekday {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 28px;
		color: var(--text-tertiary);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.08em;
		line-height: 1;
		text-transform: uppercase;
	}

	.day-cell {
		width: 100%;
		min-width: 0;
		height: 40px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		padding: 0;
		border: 0;
		border-radius: var(--radius-md);
		background: var(--surface-2);
		color: var(--text-primary);
		font: inherit;
		cursor: pointer;
		transition:
			background-color 120ms var(--ease-out),
			color 120ms var(--ease-out);
	}

	.day-cell.empty {
		cursor: default;
		background: transparent;
	}

	.day-cell:not(.empty):hover {
		background: var(--surface-3);
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
		font-size: 14px;
		font-weight: 600;
		line-height: 1;
	}

	.day-cell.is-today .day-number {
		color: var(--accent);
	}

	.day-cell.is-selected .day-number {
		color: var(--accent);
	}

	.markers {
		display: flex;
		align-items: center;
		gap: 4px;
		min-height: 6px;
	}

	.marker {
		display: inline-block;
		width: 5px;
		height: 5px;
		border-radius: var(--radius-full);
		background: transparent;
	}

	.marker.active {
		background: var(--text-primary);
	}

	@media (max-width: 760px) {
		.calendar-toolbar {
			margin-bottom: 16px;
		}
	}
</style>
