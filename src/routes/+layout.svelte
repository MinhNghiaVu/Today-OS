<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { settings, ACCENT_PRESETS } from '$lib/stores';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Sun, CheckSquare, Activity, FileText, Settings2, ChevronUp } from 'lucide-svelte';

	export let data: { preferences?: { theme: 'dark' | 'light'; accentIndex: number }; user?: { email?: string } | null };

	$: if (data.preferences) settings.init(data.preferences);

	$: if (browser) {
		document.documentElement.setAttribute('data-theme', $settings.theme);
		const p = ACCENT_PRESETS[$settings.accentIndex];
		document.documentElement.style.setProperty('--accent', p.accent);
		document.documentElement.style.setProperty('--accent-hover', p.hover);
	}

	const nav = [
		{ href: '/today', label: 'Today', icon: Sun },
		{ href: '/todos', label: 'Todos', icon: CheckSquare },
		{ href: '/habits', label: 'Habits', icon: Activity },
		{ href: '/notes', label: 'Notes', icon: FileText },
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
		<nav class="sidebar">
			<div class="logo">Today OS</div>

			<ul class="nav-list">
				{#each nav as item}
					<li>
						<a
							href={item.href}
							class:active={$page.url.pathname.startsWith(item.href)}
							aria-current={$page.url.pathname.startsWith(item.href) ? 'page' : undefined}
						>
							<span class="nav-icon" aria-hidden="true">
								<svelte:component this={item.icon} size={16} strokeWidth={2} />
							</span>
							{item.label}
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
						aria-label="Account menu"
						aria-expanded={accountOpen}
						aria-haspopup="menu"
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
	}

	/* ── Brand mark ── */
	.logo {
		font-size: 15px;
		font-weight: 600;
		padding: 4px 12px 12px;
		color: var(--text-primary);
		letter-spacing: -0.01em;
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
		flex-shrink: 0;
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
		overflow-y: auto;
	}
</style>
