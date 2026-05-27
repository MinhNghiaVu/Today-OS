<script lang="ts">
	import { goto } from '$app/navigation';
	import CalendarDayPanel from '$lib/components/calendar/CalendarDayPanel.svelte';
	import CalendarMonth from '$lib/components/calendar/CalendarMonth.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
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

<PageShell title="Calendar" subtitle="Read-only context for the day, with Today OS activity layered in." maxWidth="wide">
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
</PageShell>

<style>
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

</style>
