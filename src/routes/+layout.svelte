<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { settings, sidebarCollapsed } from '$lib/stores';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Sun, CheckSquare, Activity, FileText, Settings2, ChevronUp, CalendarDays, PanelLeftClose, PanelLeftOpen/*, Bot*/ } from 'lucide-svelte';
	import Toast from '$lib/components/Toast.svelte';

	export let data: { preferences?: { theme: 'dark' | 'light'; accentIndex: number }; user?: { email?: string } | null };

	$: if (data.preferences) settings.init(data.preferences);

	const nav = [
		{ href: '/today', label: 'Today', icon: Sun },
		{ href: '/todos', label: 'Todos', icon: CheckSquare },
		{ href: '/habits', label: 'Habits', icon: Activity },
		{ href: '/notes', label: 'Notes', icon: FileText },
		{ href: '/calendar', label: 'Calendar', icon: CalendarDays },
		// { href: '/assistant', label: 'Assistant', icon: Bot },
		{ href: '/settings', label: 'Settings', icon: Settings2 }
	];

	$: isAuthRoute = $page.url.pathname.startsWith('/login') || $page.url.pathname.startsWith('/auth');

	let accountOpen = false;

	function getInitial(email: string | undefined): string {
		if (!email) return '?';
		return email[0].toUpperCase();
	}

	function getDisplayName(email: string | undefined): string {
		if (!email) return '';
		return email.split('@')[0];
	}

	function handleWindowClick(event: MouseEvent) {
		if (!(event.target as HTMLElement).closest('.account-wrapper')) {
			accountOpen = false;
		}
	}
</script>

<svelte:window on:click={handleWindowClick} />

<div class="layout">
	{#if !isAuthRoute}
		<nav class="sidebar" class:collapsed={$sidebarCollapsed} aria-label="Primary">
			<div class="sidebar-top">
				<a href="/today" class="logo" aria-label="Today OS home">
					<span class="logo-mark" aria-hidden="true">T</span>
					<span class="label-text">Today OS</span>
				</a>
				<button
					type="button"
					class="collapse-button"
					on:click={() => sidebarCollapsed.toggle()}
					aria-label={$sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
					aria-pressed={$sidebarCollapsed}
					title={$sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				>
					{#if $sidebarCollapsed}
						<PanelLeftOpen size={16} strokeWidth={2} />
					{:else}
						<PanelLeftClose size={16} strokeWidth={2} />
					{/if}
				</button>
			</div>

			<ul class="nav-list">
				{#each nav as item}
					<li>
						<a
							href={item.href}
							class:active={$page.url.pathname.startsWith(item.href)}
							aria-current={$page.url.pathname.startsWith(item.href) ? 'page' : undefined}
							title={$sidebarCollapsed ? item.label : undefined}
						>
							<span class="nav-icon" aria-hidden="true">
								<svelte:component this={item.icon} size={16} strokeWidth={2} />
							</span>
							<span class="label-text">{item.label}</span>
						</a>
					</li>
				{/each}
			</ul>

			{#if data.user}
				<div class="account-wrapper">
					{#if accountOpen}
						<div
							class="account-popover"
							transition:fly={{ y: 8, duration: 180, easing: cubicOut }}
							role="menu"
						>
							<div class="popover-email">{data.user.email}</div>
							<div class="popover-divider"></div>
							<a
								href="/settings"
								class="popover-item"
								role="menuitem"
								on:click={() => (accountOpen = false)}
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
						aria-label={data.user.email ? `Account menu for ${data.user.email}` : 'Account menu'}
						aria-expanded={accountOpen}
						aria-haspopup="menu"
						title={$sidebarCollapsed ? data.user.email : undefined}
					>
						<div class="avatar" aria-hidden="true">{getInitial(data.user.email)}</div>
						<div class="account-info">
							<span class="account-name">{getDisplayName(data.user.email)}</span>
							<span class="account-email">{data.user.email}</span>
						</div>
						<span class="chevron" aria-hidden="true">
							<ChevronUp size={14} strokeWidth={2} />
						</span>
					</button>
				</div>
			{/if}
		</nav>
	{/if}

	<main class="content">
		<slot />
	</main>
</div>

<Toast />

<style>
	.layout {
		display: flex;
		min-height: 100vh;
	}

	/* ── Sidebar shell ── */
	.sidebar {
		width: 240px;
		background: var(--surface-1);
		border-right: 1px solid var(--border-subtle);
		padding: 16px 8px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		flex-shrink: 0;
		position: sticky;
		top: 0;
		height: 100vh;
		overflow: hidden;
		transition:
			width 180ms var(--ease-out),
			padding 180ms var(--ease-out);
	}

	.sidebar.collapsed {
		width: 64px;
	}

	.sidebar-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		min-height: 36px;
		padding: 0 4px 8px;
	}

	/* ── Brand mark ── */
	.logo {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
		flex: 1;
		font-size: 15px;
		font-weight: 600;
		padding: 4px 8px;
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	.logo-mark {
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border-radius: var(--radius-md);
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 13px;
		font-weight: 600;
		flex-shrink: 0;
	}

	.collapse-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		border: none;
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--text-tertiary);
		cursor: pointer;
		flex-shrink: 0;
		transition:
			background-color 120ms var(--ease-out),
			color 120ms var(--ease-out),
			transform 120ms var(--ease-out);
	}

	.collapse-button:hover {
		background: var(--surface-2);
		color: var(--text-primary);
	}

	.collapse-button:active {
		transform: translateY(1px);
	}

	.label-text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		opacity: 1;
		transition:
			opacity 120ms var(--ease-out),
			width 180ms var(--ease-out);
	}

	.sidebar.collapsed .label-text,
	.sidebar.collapsed .account-info,
	.sidebar.collapsed .chevron {
		width: 0;
		opacity: 0;
		pointer-events: none;
	}

	.sidebar.collapsed .sidebar-top {
		flex-direction: column;
		justify-content: center;
		padding-inline: 0;
		min-height: 72px;
	}

	.sidebar.collapsed .logo {
		flex: 0 0 auto;
		padding-inline: 0;
	}

	/* ── Nav list ── */
	.nav-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
	}

	.nav-list a {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 12px;
		min-height: 34px;
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: 14px;
		font-weight: 400;
		transition:
			background-color 120ms cubic-bezier(0.22, 1, 0.36, 1),
			color 120ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.nav-list a:hover {
		background: var(--surface-2);
		color: var(--text-primary);
	}

	.nav-list a.active {
		background: var(--surface-3);
		color: var(--text-primary);
		font-weight: 500;
	}

	.nav-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		flex-shrink: 0;
	}

	.sidebar.collapsed .nav-list a {
		justify-content: center;
		padding-inline: 0;
	}

	/* ── Account wrapper (anchors popover) ── */
	.account-wrapper {
		position: relative;
		margin-top: auto;
	}

	/* ── Account popover ── */
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

	.sidebar.collapsed .account-popover {
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
			background-color 120ms cubic-bezier(0.22, 1, 0.36, 1),
			color 120ms cubic-bezier(0.22, 1, 0.36, 1);
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

	/* ── Account block button ── */
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
		transition:
			background-color 120ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.account-block:hover,
	.account-block.open {
		background: var(--surface-2);
	}

	.sidebar.collapsed .account-block {
		justify-content: center;
		padding-inline: 0;
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
		transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.account-block.open .chevron {
		transform: rotate(180deg);
	}

	/* ── Main content ── */
	.content {
		flex: 1;
		min-width: 0;
		overflow-y: auto;
		animation: content-enter 180ms var(--ease-out);
	}

	@keyframes content-enter {
		from {
			opacity: 0.98;
			transform: translateY(2px);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 760px) {
		.sidebar {
			width: 64px;
			padding: 12px 8px;
			z-index: 20;
		}

		.sidebar:not(.collapsed) {
			width: 212px;
		}

		.nav-list {
			gap: 2px;
		}

		.nav-list a {
			justify-content: center;
			padding: 8px 0;
		}

		.sidebar:not(.collapsed) .nav-list a {
			justify-content: flex-start;
			padding-inline: 12px;
		}

		.account-block {
			justify-content: center;
			padding-inline: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.content {
			animation: none;
		}
	}
</style>
