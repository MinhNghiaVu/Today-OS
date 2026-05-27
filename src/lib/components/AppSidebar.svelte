<script lang="ts">
	import { tick, onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { sidebarCollapsed, mobileSidebarOpen } from '$lib/stores';
	import AppSidebarAccount from '$lib/components/AppSidebarAccount.svelte';
	import { appNavItems, isNavItemActive } from '$lib/navigation';
	import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-svelte';

	type User = { email?: string } | null;

	export let user: User = null;
	export let pathname = '/today';

	let isMobileViewport = false;
	let closeButton: HTMLButtonElement;
	let previousPath = pathname;

	$: navCollapsed = $sidebarCollapsed && !isMobileViewport;

	$: if (pathname !== previousPath) {
		previousPath = pathname;
		closeMobileSidebar();
	}

	$: if (browser) {
		document.body.style.overflow = $mobileSidebarOpen && isMobileViewport ? 'hidden' : '';
	}

	$: if ($mobileSidebarOpen && isMobileViewport) {
		tick().then(() => closeButton?.focus());
	}

	onMount(() => {
		const mediaQuery = window.matchMedia('(max-width: 760px)');
		const syncViewport = () => {
			isMobileViewport = mediaQuery.matches;
			if (!isMobileViewport) {
				mobileSidebarOpen.close();
			}
		};

		syncViewport();
		mediaQuery.addEventListener('change', syncViewport);

		return () => {
			mediaQuery.removeEventListener('change', syncViewport);
		};
	});

	onDestroy(() => {
		if (browser) document.body.style.overflow = '';
	});

	function closeMobileSidebar() {
		mobileSidebarOpen.close();
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		if ($mobileSidebarOpen) closeMobileSidebar();
	}
</script>

<svelte:window on:keydown={handleWindowKeydown} />

<button
	type="button"
	class="mobile-sidebar-backdrop"
	class:open={$mobileSidebarOpen}
	aria-label="Dismiss navigation"
	on:click={closeMobileSidebar}
></button>

<nav
	id="app-sidebar"
	class="sidebar"
	class:collapsed={navCollapsed}
	class:mobile-open={$mobileSidebarOpen}
	aria-label="Primary"
	inert={isMobileViewport && !$mobileSidebarOpen}
>
	<div class="sidebar-top">
		{#if isMobileViewport}
			<button
				bind:this={closeButton}
				type="button"
				class="drawer-close-button"
				on:click={closeMobileSidebar}
				aria-label="Close navigation"
			>
				<X size={18} strokeWidth={2} />
			</button>
			<div class="logo mobile-logo" aria-label="Today OS navigation">
				<img class="logo-mark" src="/icon-192.png" alt="" aria-hidden="true" width="24" height="24" />
				<span class="label-text">Today OS</span>
			</div>
		{:else}
			<a href="/today" class="logo workspace-logo" aria-label="Today OS home" on:click={closeMobileSidebar}>
				<img class="logo-mark" src="/icon-192.png" alt="" aria-hidden="true" width="24" height="24" />
				<span class="workspace-copy label-text">
					<span class="workspace-name">Today OS</span>
					<span class="workspace-type">Private workspace</span>
				</span>
			</a>
			<button
				type="button"
				class="collapse-button"
				on:click={() => sidebarCollapsed.toggle()}
				aria-label={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				aria-pressed={navCollapsed}
				title={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
			>
				{#if navCollapsed}
					<PanelLeftOpen size={16} strokeWidth={2} />
				{:else}
					<PanelLeftClose size={16} strokeWidth={2} />
				{/if}
			</button>
		{/if}
	</div>

	<div class="nav-section-label label-text">Pages</div>
	<ul class="nav-list">
		{#each appNavItems as item}
			<li>
				<a
					href={item.href}
					class:active={isNavItemActive(pathname, item.href)}
					aria-current={isNavItemActive(pathname, item.href) ? 'page' : undefined}
					title={navCollapsed ? item.label : undefined}
					on:click={closeMobileSidebar}
				>
					<span class="nav-icon" aria-hidden="true">
						<svelte:component this={item.icon} size={16} strokeWidth={2} />
					</span>
					<span class="label-text">{item.label}</span>
				</a>
			</li>
		{/each}
	</ul>

	{#if user}
		<AppSidebarAccount {user} {navCollapsed} />
	{/if}
</nav>

<style>
	.mobile-sidebar-backdrop {
		display: none;
	}

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
		width: 56px;
	}

	.sidebar-top {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		min-height: 36px;
		padding: 0 4px 8px;
	}

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
		letter-spacing: 0;
		border-radius: var(--radius-md);
		transition:
			background-color 120ms var(--ease-out),
			opacity 120ms var(--ease-out);
	}

	.logo-mark {
		width: 24px;
		height: 24px;
		border-radius: var(--radius-md);
		object-fit: cover;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
		flex-shrink: 0;
	}

	.collapse-button,
	.drawer-close-button {
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
			opacity 120ms var(--ease-out),
			transform 120ms var(--ease-out);
	}

	.collapse-button {
		opacity: 0;
		pointer-events: none;
	}

	.drawer-close-button {
		display: inline-flex;
	}

	.sidebar-top:hover .collapse-button,
	.collapse-button:focus-visible {
		opacity: 1;
		pointer-events: auto;
	}

	.collapse-button:hover,
	.drawer-close-button:hover {
		background: var(--surface-2);
		color: var(--text-primary);
	}

	.collapse-button:active,
	.drawer-close-button:active {
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

	.sidebar.collapsed .label-text {
		width: 0;
		opacity: 0;
		pointer-events: none;
	}

	.sidebar.collapsed .nav-section-label {
		display: none;
	}

	.sidebar.collapsed .sidebar-top {
		width: 40px;
		height: 40px;
		justify-content: center;
		padding: 0;
		min-height: 40px;
	}

	.sidebar.collapsed .logo {
		justify-content: center;
		gap: 0;
		width: 40px;
		height: 40px;
		flex: 0 0 40px;
		padding: 0;
	}

	.sidebar.collapsed .sidebar-top:hover .logo,
	.sidebar.collapsed .sidebar-top:has(.collapse-button:focus-visible) .logo {
		opacity: 0;
		pointer-events: none;
	}

	.sidebar.collapsed .collapse-button {
		position: absolute;
		inset: 0;
		width: 40px;
		height: 40px;
		background: var(--surface-2);
	}

	.nav-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
	}

	.nav-section-label {
		padding: 8px 12px 4px;
		color: var(--text-tertiary);
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.04em;
		text-transform: uppercase;
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
			background-color 120ms var(--ease-out),
			color 120ms var(--ease-out);
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
		gap: 0;
		width: 40px;
		min-height: 40px;
		padding: 0;
	}

	.sidebar.collapsed .nav-list {
		align-items: center;
	}

	@media (max-width: 760px) {
		.mobile-sidebar-backdrop {
			position: fixed;
			inset: 0;
			z-index: 40;
			display: block;
			border: none;
			background: color-mix(in oklab, var(--bg) 72%, transparent);
			backdrop-filter: blur(2px);
			opacity: 0;
			pointer-events: none;
			transition: opacity 180ms var(--ease-out);
		}

		.mobile-sidebar-backdrop.open {
			opacity: 1;
			pointer-events: auto;
		}

		.sidebar {
			position: fixed;
			inset: 0;
			z-index: 50;
			width: 100vw;
			height: 100dvh;
			padding: 16px 16px 20px;
			border-right: none;
			box-shadow: var(--shadow-lg);
			transform: translateX(-100%);
			transition: transform 220ms var(--ease-out);
		}

		.sidebar.mobile-open {
			transform: translateX(0);
		}

		.sidebar-top {
			width: auto;
			height: auto;
			min-height: 44px;
			justify-content: flex-start;
			padding: 0 0 12px;
		}

		.logo {
			justify-content: flex-start;
			gap: 8px;
			width: auto;
			height: 44px;
			flex: 1;
			padding: 0 8px;
		}

		.mobile-logo {
			color: var(--text-secondary);
		}

		.collapse-button {
			display: none;
		}

		.drawer-close-button {
			width: 40px;
			height: 40px;
			color: var(--text-primary);
		}

		.nav-list {
			align-items: stretch;
			gap: 4px;
		}

		.nav-list a {
			justify-content: flex-start;
			gap: 12px;
			width: 100%;
			min-height: 44px;
			padding: 0 12px;
		}

		.nav-icon {
			width: 20px;
		}

		.label-text {
			width: auto;
			opacity: 1;
			pointer-events: auto;
		}

		.nav-section-label {
			padding-top: 12px;
		}
	}

	.workspace-logo {
		align-items: center;
		padding: 6px 8px;
	}

	.workspace-copy {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 1px;
	}

	.workspace-name,
	.workspace-type {
		overflow: hidden;
		line-height: 1.2;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.workspace-name {
		color: var(--text-primary);
		font-size: 14px;
		font-weight: 600;
	}

	.workspace-type {
		color: var(--text-tertiary);
		font-size: 12px;
		font-weight: 400;
	}
</style>
