<script lang="ts">
	export let label = '';
	export let hint: string | null | undefined = undefined;
</script>

<div class="settings-row">
	<div class="row-label">
		<span class="label">
			<slot name="label">{label}</slot>
		</span>
		{#if hint}
			<span class="hint">{hint}</span>
		{/if}
		<slot name="hint" />
	</div>

	<slot />
</div>

<style>
	.settings-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 12px 0;
	}

	:global(.settings-row + .settings-row) {
		border-top: 1px solid var(--border-subtle);
	}

	.row-label {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.label {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: var(--text-primary);
		font-size: 14px;
		font-weight: 400;
	}

	.label :global(svg) {
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	.hint,
	:global(.settings-row-hint) {
		color: var(--text-secondary);
		font-size: 13px;
	}

	@media (max-width: 640px) {
		.settings-row {
			align-items: flex-start;
			flex-direction: column;
			gap: 12px;
		}
	}
</style>
