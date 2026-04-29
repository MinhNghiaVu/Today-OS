<script lang="ts">
	import type { HabitDailyTotal } from '$lib/db';

	export let data: HabitDailyTotal[];
	export let goal: number | null = null;
	export let color: string;
	export let type: 'min_goal' | 'max_goal' | 'info_only';

	const HEIGHT = 80;
	const BAR_GAP = 3;

	$: maxVal = Math.max(...data.map((d) => d.total), goal ?? 0, 1);

	$: barWidth = data.length > 0
		? Math.floor((100 - (data.length - 1) * (BAR_GAP / (100 / data.length))) / data.length)
		: 8;

	function barColor(total: number): string {
		if (type === 'min_goal' && goal !== null) return total >= goal ? 'var(--success)' : color;
		if (type === 'max_goal' && goal !== null) return total > goal ? 'var(--danger)' : color;
		return color;
	}

	function formatDate(dateStr: string, showYear = false): string {
		const d = new Date(dateStr + 'T00:00:00');
		if (showYear) return d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
		return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' });
	}

	$: showEveryN = data.length <= 7 ? 1 : data.length <= 14 ? 2 : 5;
</script>

<div class="chart-wrap">
	<svg
		viewBox="0 0 100 {HEIGHT}"
		preserveAspectRatio="none"
		class="chart-svg"
		aria-label="Habit bar chart"
		role="img"
	>
		<!-- Goal line -->
		{#if goal !== null && goal > 0}
			{@const goalY = HEIGHT - (goal / maxVal) * HEIGHT}
			<line
				x1="0"
				y1={goalY}
				x2="100"
				y2={goalY}
				stroke="var(--border-strong)"
				stroke-width="0.4"
				stroke-dasharray="2 1.5"
			/>
		{/if}

		<!-- Bars -->
		{#each data as entry, i}
			{@const barH = Math.max((entry.total / maxVal) * HEIGHT, entry.total > 0 ? 1 : 0)}
			{@const x = i * (100 / data.length) + 0.5}
			{@const w = 100 / data.length - BAR_GAP / data.length}
			<rect
				x={x}
				y={HEIGHT - barH}
				width={w}
				height={barH}
				fill={barColor(entry.total)}
				rx="1"
				opacity={entry.total === 0 ? 0.2 : 1}
			/>
		{/each}
	</svg>

	<!-- X-axis labels -->
	<div class="x-labels" style="grid-template-columns: repeat({data.length}, 1fr)">
		{#each data as entry, i}
			<span class="x-label" class:visible={i % showEveryN === 0 || i === data.length - 1}>
				{formatDate(entry.date, data.length > 7)}
			</span>
		{/each}
	</div>
</div>

<style>
	.chart-wrap {
		display: flex;
		flex-direction: column;
		gap: 4px;
		width: 100%;
	}

	.chart-svg {
		width: 100%;
		height: 80px;
		display: block;
		overflow: visible;
	}

	.x-labels {
		display: grid;
		gap: 0;
	}

	.x-label {
		font-size: 10px;
		color: transparent;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.3;
	}

	.x-label.visible {
		color: var(--text-tertiary);
		font-size: 10px;
	}
</style>
