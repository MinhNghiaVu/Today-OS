<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { ArrowLeft, TrendingUp, Target, BarChart2 } from 'lucide-svelte';
	import HabitChart from '$lib/components/HabitChart.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: ({ habit, logs7, logs30 } = data);

	let range = '7d';
	const rangeTabs = [{ value: '7d', label: '7 days' }, { value: '30d', label: '30 days' }];

	$: activeLogs = range === '7d' ? logs7 : logs30;

	$: totalForRange = activeLogs.reduce((s, d) => s + d.total, 0);
	$: daysWithData = activeLogs.filter((d) => d.total > 0).length;
	$: avgPerDay = daysWithData > 0 ? (totalForRange / daysWithData).toFixed(1) : '0';
	$: maxDay = activeLogs.reduce((max, d) => (d.total > max.total ? d : max), activeLogs[0] ?? { total: 0, date: '' });

	const HABIT_TYPE_LABELS: Record<string, string> = {
		min_goal: 'Minimum goal',
		max_goal: 'Maximum goal',
		info_only: 'Info only'
	};
</script>

<div class="page">
	<div class="page-inner">
		<!-- Back nav -->
		<a href="/habits" class="back-link">
			<ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
			All habits
		</a>

		<!-- Header -->
		<div class="page-header">
			<div class="habit-title-row">
				<span class="habit-color-dot" style="background: {habit.color}"></span>
				<h1 class="page-title">{habit.name}</h1>
				<span class="habit-type-badge">{HABIT_TYPE_LABELS[habit.type]}</span>
			</div>
			<p class="page-subtitle">
				Unit: <strong>{habit.unit}</strong>
				{#if habit.daily_goal}· Goal: <strong>{habit.daily_goal} {habit.unit}/day</strong>{/if}
			</p>
		</div>

		<!-- Stats row -->
		<div class="stats-row">
			<div class="stat-card">
				<div class="stat-icon" aria-hidden="true">
					<TrendingUp size={16} strokeWidth={2} />
				</div>
				<div class="stat-body">
					<span class="stat-value">{totalForRange.toFixed(1)}</span>
					<span class="stat-label">Total ({range === '7d' ? '7 days' : '30 days'})</span>
				</div>
			</div>
			<div class="stat-card">
				<div class="stat-icon" aria-hidden="true">
					<BarChart2 size={16} strokeWidth={2} />
				</div>
				<div class="stat-body">
					<span class="stat-value">{avgPerDay}</span>
					<span class="stat-label">Avg on active days</span>
				</div>
			</div>
			{#if habit.daily_goal}
				<div class="stat-card">
					<div class="stat-icon" aria-hidden="true">
						<Target size={16} strokeWidth={2} />
					</div>
					<div class="stat-body">
						<span class="stat-value">{daysWithData}</span>
						<span class="stat-label">Days with logs</span>
					</div>
				</div>
			{/if}
		</div>

		<!-- Chart card -->
		<div class="chart-card">
			<div class="chart-header">
				<span class="section-label">Trend</span>
				<SegmentedControl options={rangeTabs} bind:value={range} />
			</div>

			{#key range}
				<div in:fly={{ x: range === '7d' ? -12 : 12, duration: 180, easing: cubicOut }}>
					{#if activeLogs.every((d) => d.total === 0)}
						<div class="chart-empty">
							<p>No data logged in this period.</p>
						</div>
					{:else}
						<HabitChart
							data={activeLogs}
							goal={habit.daily_goal}
							color={habit.color}
							type={habit.type}
						/>
					{/if}
				</div>
			{/key}

			{#if habit.daily_goal}
				<div class="chart-legend">
					<span class="legend-item">
						<span class="legend-dash"></span> Goal: {habit.daily_goal} {habit.unit}
					</span>
				</div>
			{/if}
		</div>

		<!-- Best day callout -->
		{#if maxDay && maxDay.total > 0}
			<div class="best-day">
				<span class="best-label">Best day</span>
				<span class="best-date">
					{new Date(maxDay.date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
				</span>
				<span class="best-value" style="color: {habit.color}">{maxDay.total} {habit.unit}</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.page {
		min-height: 100vh;
		background: var(--bg);
	}

	.page-inner {
		max-width: 768px;
		margin: 0 auto;
		padding: 32px 24px;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	@media (min-width: 640px) { .page-inner { padding: 32px 32px; } }

	/* ── Back link ── */
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		color: var(--text-secondary);
		text-decoration: none;
		transition: color 120ms cubic-bezier(0.22, 1, 0.36, 1);
		margin-bottom: -8px;
	}

	.back-link:hover { color: var(--text-primary); }

	.back-link:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}

	/* ── Header ── */
	.page-header { display: flex; flex-direction: column; gap: 6px; }

	.habit-title-row {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.habit-color-dot {
		width: 12px;
		height: 12px;
		border-radius: var(--radius-full);
		flex-shrink: 0;
	}

	.page-title {
		font-size: 24px;
		font-weight: 600;
		color: var(--text-primary);
		letter-spacing: -0.01em;
		line-height: 1.2;
		margin: 0;
	}

	.habit-type-badge {
		font-size: 11px;
		font-weight: 500;
		color: var(--text-tertiary);
		background: var(--surface-2);
		border-radius: var(--radius-full);
		padding: 2px 8px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.page-subtitle {
		font-size: 14px;
		color: var(--text-secondary);
		margin: 0;
	}

	.page-subtitle strong { font-weight: 500; color: var(--text-primary); }

	/* ── Stats row ── */
	.stats-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 12px;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 16px;
		background: var(--surface-1);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: var(--radius-md);
		background: var(--surface-2);
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	.stat-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; }

	.stat-value {
		font-size: 18px;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.2;
	}

	.stat-label {
		font-size: 12px;
		color: var(--text-tertiary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* ── Chart card ── */
	.chart-card {
		background: var(--surface-1);
		border-radius: var(--radius-xl);
		padding: 20px;
		box-shadow: var(--shadow-sm);
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.chart-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.section-label {
		font-size: 11px;
		font-weight: 500;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.chart-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 80px;
	}

	.chart-empty p {
		font-size: 13px;
		color: var(--text-tertiary);
		margin: 0;
	}

	.chart-legend {
		display: flex;
		gap: 12px;
		padding-top: 4px;
		border-top: 1px solid var(--border-subtle);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		color: var(--text-tertiary);
	}

	.legend-dash {
		display: inline-block;
		width: 16px;
		height: 1px;
		border-top: 2px dashed var(--border-strong);
	}

	/* ── Best day ── */
	.best-day {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 16px;
		background: var(--surface-1);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
	}

	.best-label {
		font-size: 11px;
		font-weight: 500;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		flex-shrink: 0;
	}

	.best-date {
		font-size: 14px;
		color: var(--text-secondary);
		flex: 1;
	}

	.best-value {
		font-size: 15px;
		font-weight: 600;
	}
</style>
