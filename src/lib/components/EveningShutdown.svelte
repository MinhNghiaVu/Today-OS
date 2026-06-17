<script lang="ts">
	import { enhance } from '$app/forms';
	import { Moon } from 'lucide-svelte';

	export let pendingCount = 0;
	export let shutdownAction = '?/shutdownToday';
</script>

<form method="POST" action={shutdownAction} use:enhance class="shutdown-form">
	<input type="hidden" name="intent" value="shutdown" />
	{#if pendingCount > 0}
		<div class="shutdown-row">
			<textarea
				name="reflection"
				class="reflection-input"
				rows="2"
				placeholder="How was your day? (optional)"
			></textarea>
			<button type="submit" class="shutdown-btn">
				<Moon size={15} strokeWidth={2} aria-hidden="true" />
				Wrap up day — defer {pendingCount} task{pendingCount === 1 ? '' : 's'} to tomorrow
			</button>
		</div>
	{:else}
		<textarea
			name="reflection"
			class="reflection-input"
			rows="2"
			placeholder="How was your day? (optional)"
		></textarea>
		<button type="submit" class="shutdown-btn solo">
			<Moon size={15} strokeWidth={2} aria-hidden="true" />
			Log today's reflection
		</button>
	{/if}
</form>

<style>
	.shutdown-form {
		margin-top: 12px;
	}

	.shutdown-row {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.reflection-input {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		background: var(--surface-2);
		color: var(--text-primary);
		font-family: inherit;
		font-size: 13px;
		line-height: 1.5;
		resize: vertical;
		outline: none;
		transition: border-color 120ms var(--ease-out);
		box-sizing: border-box;
	}

	.reflection-input:focus {
		border-color: var(--border-strong);
	}

	.reflection-input::placeholder {
		color: var(--text-tertiary);
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
		transition:
			background-color 120ms var(--ease-out),
			border-color 120ms var(--ease-out),
			color 120ms var(--ease-out);
	}

	.shutdown-btn.solo {
		margin-top: 8px;
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