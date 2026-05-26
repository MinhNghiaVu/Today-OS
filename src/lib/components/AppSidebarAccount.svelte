<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { mobileSidebarOpen } from '$lib/stores';
	import { ChevronUp, Settings2 } from 'lucide-svelte';

	export let user: { email?: string };
	export let navCollapsed = false;

	let accountOpen = false;
	function getInitial(email: string | undefined): string {
		if (!email) return '?';
		return email[0].toUpperCase();
	}
	function getDisplayName(email: string | undefined): string {
		if (!email) return '';
		return email.split('@')[0];
	}
	function closeMobileSidebar() {
		mobileSidebarOpen.close();
	}
	function handleWindowClick(event: MouseEvent) {
		if (!(event.target as HTMLElement).closest('.account-wrapper')) {
			accountOpen = false;
		}
	}
	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') accountOpen = false;
	}
</script>

<svelte:window on:click={handleWindowClick} on:keydown={handleWindowKeydown} />

<div class="account-wrapper" class:collapsed={navCollapsed}>
	{#if accountOpen}
		<div
			class="account-popover"
			transition:fly={{ y: 8, duration: 180, easing: cubicOut }}
			role="menu"
		>
			<div class="popover-email">{user.email}</div>
			<div class="popover-divider"></div>
			<a
				href="/settings"
				class="popover-item"
				role="menuitem"
				on:click={() => {
					accountOpen = false;
					closeMobileSidebar();
				}}
			>
				<span aria-hidden="true"><Settings2 size={14} strokeWidth={2} /></span>
				Settings
				<span class="popover-hint">⌘,</span>
			</a>
			<div class="popover-divider"></div>
			<form method="POST" action="/logout">
				<button type="submit" class="popover-item popover-danger" role="menuitem">
					Sign out
				</button>
			</form>
		</div>
	{/if}

	<button
		class="account-block"
		class:open={accountOpen}
		on:click|stopPropagation={() => (accountOpen = !accountOpen)}
		aria-label={user.email ? `Account menu for ${user.email}` : 'Account menu'}
		aria-expanded={accountOpen}
		aria-haspopup="menu"
		title={navCollapsed ? user.email : undefined}
	>
		<div class="avatar" aria-hidden="true">{getInitial(user.email)}</div>
		<div class="account-info">
			<span class="account-name">{getDisplayName(user.email)}</span>
			<span class="account-email">{user.email}</span>
		</div>
		<span class="chevron" aria-hidden="true">
			<ChevronUp size={14} strokeWidth={2} />
		</span>
	</button>
</div>

<style>
	.account-wrapper {
		position: relative;
		margin-top: auto;
	}

	.account-popover {
		position: absolute;
		bottom: calc(100% + 8px);
		left: 0;
		right: 0;
		background: var(--surface-overlay);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-popover);
		padding: 6px;
		z-index: 100;
		min-width: 224px;
	}

	.account-wrapper.collapsed .account-popover {
		left: calc(100% + 8px);
		right: auto;
		bottom: 0;
		width: 224px;
	}

	.popover-email {
		font-size: 12px;
		color: var(--text-tertiary);
		padding: 6px 10px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.popover-divider {
		height: 1px;
		background: var(--border-subtle);
		margin: 4px 0;
	}

	.popover-item {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 7px 10px;
		border-radius: var(--radius-sm);
		font-size: 14px;
		font-weight: 400;
		color: var(--text-primary);
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		transition:
			background-color 120ms var(--ease-out),
			color 120ms var(--ease-out);
	}

	.popover-item:hover {
		background: var(--surface-2);
	}

	.popover-danger {
		color: var(--danger);
	}

	.popover-danger:hover {
		background: var(--danger-soft);
	}

	.popover-hint {
		margin-left: auto;
		font-size: 12px;
		color: var(--text-tertiary);
	}

	.account-block {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 8px 10px;
		border-radius: var(--radius-md);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: background-color 120ms var(--ease-out);
	}

	.account-block:hover,
	.account-block.open {
		background: var(--surface-2);
	}

	.account-wrapper.collapsed {
		display: flex;
		justify-content: center;
	}

	.account-wrapper.collapsed .account-block {
		justify-content: center;
		gap: 0;
		width: 40px;
		height: 40px;
		padding: 0;
	}

	.account-wrapper.collapsed .account-info,
	.account-wrapper.collapsed .chevron {
		width: 0;
		opacity: 0;
		pointer-events: none;
	}

	.avatar {
		width: 24px;
		height: 24px;
		border-radius: var(--radius-full);
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 12px;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.account-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		opacity: 1;
		transition:
			opacity 120ms var(--ease-out),
			width 180ms var(--ease-out);
	}

	.account-name {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1.3;
	}

	.account-email {
		font-size: 11px;
		color: var(--text-tertiary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1.3;
	}

	.chevron {
		display: flex;
		align-items: center;
		color: var(--text-tertiary);
		flex-shrink: 0;
		opacity: 1;
		transition:
			opacity 120ms var(--ease-out),
			transform 180ms var(--ease-out),
			width 180ms var(--ease-out);
	}

	.account-block.open .chevron {
		transform: rotate(180deg);
	}

	@media (max-width: 760px) {
		.account-wrapper,
		.account-wrapper.collapsed {
			display: block;
		}

		.account-block,
		.account-wrapper.collapsed .account-block {
			justify-content: flex-start;
			gap: 10px;
			width: 100%;
			height: 44px;
			padding: 0 10px;
		}

		.account-popover,
		.account-wrapper.collapsed .account-popover {
			left: 0;
			right: 0;
			bottom: calc(100% + 8px);
			width: auto;
		}

		.account-info,
		.chevron,
		.account-wrapper.collapsed .account-info,
		.account-wrapper.collapsed .chevron {
			width: auto;
			opacity: 1;
			pointer-events: auto;
		}
	}
</style>
