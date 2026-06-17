<script lang="ts">
	import { enhance } from '$app/forms';
	import { Moon } from 'lucide-svelte';

	export let pendingCount = 0;
	export let shutdownAction = '?/shutdownToday';
</script>

{#if pendingCount > 0}
	<form method="POST" action={shutdownAction} use:enhance class="shutdown-form">
		<input type="hidden" name="intent" value="shutdown" />
		<button type="submit" class="shutdown-btn">
			<Moon size={15} strokeWidth={2} aria-hidden="true" />
			Wrap up day — defer {pendingCount} task{pendingCount === 1 ? '' : 's'} to tomorrow
		</button>
	</form>
{/if}

<style>
	.shutdown-form {
		margin-top: 12px;
	}

	.shutdown-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		padding: 12px 16px;
		border: 1px dashed var(--border-default);
		border-radius: var(--radius-lg);
		background: transparent;
		color: var(--text-secondary);
		font: inherit;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 120ms var(--ease-out), border-color 120ms var(--ease-out), color 120ms var(--ease-out);
	}

	.shutdown-btn:hover {
		background: var(--surface-2);
		border-color: var(--border-strong);
		color: var(--text-primary);
	}

	.shutdown-btn:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}
</style>