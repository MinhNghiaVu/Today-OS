<script lang="ts">
	export let items: { value: string | number; label: string; ariaLabel?: string }[] = [];
	export let ariaLabel = 'Summary';
</script>

<div class="summary-strip" aria-label={ariaLabel}>
	{#each items as item}
		<div class="summary-card" role="group" aria-label={item.ariaLabel}>
			<span class="summary-value">{item.value}</span>
			<span class="summary-label">{item.label}</span>
		</div>
	{/each}
</div>

<style>
	.summary-strip {
		display: grid;
		grid-template-columns: repeat(3, minmax(96px, 1fr));
		gap: 8px;
		width: min(420px, 100%);
	}

	.summary-card {
		min-width: 0;
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		padding: 12px 14px;
		box-shadow: var(--shadow-sm);
	}

	.summary-value {
		display: block;
		font-size: 20px;
		font-weight: 600;
		line-height: 1.1;
		color: var(--text-primary);
	}

	.summary-label {
		display: block;
		margin-top: 3px;
		overflow: hidden;
		color: var(--text-tertiary);
		font-size: 12px;
		line-height: 1.25;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (max-width: 640px) {
		.summary-strip {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 6px;
			width: 100%;
		}

		.summary-card {
			min-height: 64px;
			padding: 12px 10px;
		}

		.summary-value {
			font-size: 18px;
		}

		.summary-label {
			font-size: 11px;
			white-space: normal;
		}
	}
</style>
