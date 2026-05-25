<script lang="ts">
	import { goto } from '$app/navigation';
	import CalendarDayPanel from '$lib/components/calendar/CalendarDayPanel.svelte';
	import CalendarMonth from '$lib/components/calendar/CalendarMonth.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: ({ year, month, selectedDate, activity, dayData, today, gcConnected } = data);

	function navigate(direction: -1 | 1): void {
		let nextMonth = month + direction;
		let nextYear = year;
		if (nextMonth < 1) {
			nextMonth = 12;
			nextYear--;
		}
		if (nextMonth > 12) {
			nextMonth = 1;
			nextYear++;
		}

		const params = new URLSearchParams({ year: String(nextYear), month: String(nextMonth) });
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
</script>

<div class="page">
	<div class="page-inner">
		<header class="page-header">
			<h1>Calendar</h1>
		</header>

		<div class="calendar-shell">
			<CalendarMonth
				{year}
				{month}
				{selectedDate}
				{activity}
				{today}
				onNavigate={navigate}
				onSelectDate={selectDate}
			/>

			<CalendarDayPanel
				{selectedDate}
				{dayData}
				{gcConnected}
				onClose={clearDate}
			/>
		</div>
	</div>
</div>

<style>
	.page {
		min-height: 100vh;
		background: var(--bg);
		padding: 32px 24px;
	}

	.page-inner {
		width: min(100%, 1280px);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	h1 {
		margin: 0;
		color: var(--text-primary);
		font-size: 24px;
		font-weight: 600;
		line-height: 1.2;
	}

	.calendar-shell {
		display: grid;
		grid-template-columns: 320px minmax(0, 620px);
		align-items: start;
		gap: 16px;
	}

	@media (max-width: 980px) {
		.calendar-shell {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 760px) {
		.page {
			padding: 24px 16px;
		}
	}
</style>
