<script lang="ts">
	export let type: 'button' | 'submit' = 'button';
	export let variant: 'secondary' | 'destructive' = 'secondary';
</script>

<button {type} class="settings-button" class:destructive={variant === 'destructive'} on:click>
	<slot />
</button>

<style>
	.settings-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		height: 36px;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		background: transparent;
		padding: 0 16px;
		color: var(--text-primary);
		font-family: inherit;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		flex-shrink: 0;
		transition:
			background-color 120ms var(--ease-out),
			border-color 120ms var(--ease-out),
			transform 120ms var(--ease-out);
	}

	.settings-button:hover {
		background: var(--surface-2);
		border-color: var(--border-strong);
	}

	.settings-button:active {
		transform: translateY(1px);
	}

	.settings-button:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.settings-button.destructive {
		border-color: color-mix(in oklab, var(--danger) 40%, transparent);
		color: var(--danger);
	}

	.settings-button.destructive:hover {
		background: var(--danger-soft);
		border-color: var(--danger);
	}
</style>
