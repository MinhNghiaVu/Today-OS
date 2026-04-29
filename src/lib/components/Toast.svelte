<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { cubicOut, cubicIn } from 'svelte/easing';
	import { toasts } from '$lib/toast';
	import { CheckCircle, XCircle, Info, X } from 'lucide-svelte';

	const iconMap = { success: CheckCircle, error: XCircle, info: Info };
</script>

<div class="toast-region" aria-live="polite" aria-label="Notifications">
	{#each $toasts as toast (toast.id)}
		<div
			class="toast toast-{toast.variant}"
			role="status"
			in:fly={{ y: 12, duration: 240, easing: cubicOut }}
			out:fly={{ y: 8, duration: 160, easing: cubicIn }}
			animate:flip={{ duration: 200, easing: cubicOut }}
		>
			<span class="toast-icon" aria-hidden="true">
				<svelte:component this={iconMap[toast.variant]} size={16} strokeWidth={2} />
			</span>
			<span class="toast-message">{toast.message}</span>
			<button
				class="toast-dismiss"
				on:click={() => toasts.dismiss(toast.id)}
				aria-label="Dismiss notification"
			>
				<X size={14} strokeWidth={2} aria-hidden="true" />
			</button>
		</div>
	{/each}
</div>

<style>
	.toast-region {
		position: fixed;
		bottom: 24px;
		right: 24px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		z-index: 9999;
		pointer-events: none;
	}

	.toast {
		display: flex;
		align-items: center;
		gap: 10px;
		background: var(--surface-overlay);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		padding: 12px 14px;
		min-width: 260px;
		max-width: 380px;
		pointer-events: all;
		border: 1px solid var(--border-subtle);
	}

	.toast-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
	}

	.toast-success .toast-icon { color: var(--success); }
	.toast-error   .toast-icon { color: var(--danger); }
	.toast-info    .toast-icon { color: var(--info); }

	.toast-message {
		flex: 1;
		font-size: 14px;
		font-weight: 400;
		color: var(--text-primary);
		line-height: 1.4;
	}

	.toast-dismiss {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: none;
		background: transparent;
		color: var(--text-tertiary);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: background 120ms var(--ease-out), color 120ms var(--ease-out);
	}

	.toast-dismiss:hover {
		background: var(--surface-2);
		color: var(--text-primary);
	}

	.toast-dismiss:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}
</style>
