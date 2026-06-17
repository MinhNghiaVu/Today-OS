<script lang="ts">
	import { ListChecks, Activity, StickyNote } from 'lucide-svelte';

	export let pendingCount = 0;
	export let focusCount = 0;
	export let nextFocusTitle: string | null = null;
	export let habitsOnTrack = 0;
	export let habitsTotal = 0;
	export let notesCount = 0;
</script>

<div class="command-center">
	<div class="stat-block">
		<ListChecks size={14} strokeWidth={2} aria-hidden="true" />
		<div class="stat-info">
			<span class="stat-value">{pendingCount}</span>
			<span class="stat-label">todo{pendingCount === 1 ? '' : 's'}</span>
		</div>
		{#if focusCount > 0}
			<span class="focus-hint" title={nextFocusTitle ?? ''}>
				{nextFocusTitle ?? `${focusCount} focused`}
			</span>
		{/if}
	</div>
	<div class="stat-block">
		<Activity size={14} strokeWidth={2} aria-hidden="true" />
		<div class="stat-info">
			<span class="stat-value">{habitsOnTrack}/{habitsTotal}</span>
			<span class="stat-label">habits</span>
		</div>
	</div>
	<div class="stat-block">
		<StickyNote size={14} strokeWidth={2} aria-hidden="true" />
		<div class="stat-info">
			<span class="stat-value">{notesCount}</span>
			<span class="stat-label">note{notesCount === 1 ? '' : 's'}</span>
		</div>
	</div>
</div>

<style>
	.command-center {
		display: none;
		gap: 8px;
		margin-bottom: 16px;
	}

	@media (max-width: 980px) {
		.command-center {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (max-width: 480px) {
		.command-center {
			grid-template-columns: repeat(3, 1fr);
			gap: 6px;
		}
		.stat-block {
			padding: 10px 8px;
		}
		.focus-hint {
			display: none;
		}
	}

	.stat-block {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px;
		border-radius: var(--radius-lg);
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		box-shadow: var(--shadow-sm);
		min-width: 0;
	}

	.stat-block :global(svg) {
		color: var(--text-tertiary);
		flex-shrink: 0;
	}

	.stat-info {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.stat-value {
		font-size: 15px;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.2;
		font-variant-numeric: tabular-nums;
	}

	.stat-label {
		font-size: 11px;
		font-weight: 500;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		line-height: 1.3;
	}

	.focus-hint {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 11px;
		color: var(--accent);
		margin-left: auto;
		flex-shrink: 1;
		min-width: 0;
	}
</style>