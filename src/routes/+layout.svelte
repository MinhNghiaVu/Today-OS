<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { settings, ACCENT_PRESETS } from '$lib/stores';

	export let data: { preferences?: { theme: 'dark' | 'light'; accentIndex: number }; user?: { email?: string } | null };

	// Initialize settings store from DB preferences on every load
	$: if (data.preferences) settings.init(data.preferences);

	$: if (browser) {
		document.documentElement.setAttribute('data-theme', $settings.theme);
		const p = ACCENT_PRESETS[$settings.accentIndex];
		document.documentElement.style.setProperty('--accent', p.accent);
		document.documentElement.style.setProperty('--accent-hover', p.hover);
	}

	const nav = [
		{ href: '/today', label: 'Today' },
		{ href: '/todos', label: 'Todos' },
		{ href: '/habits', label: 'Habits' },
		{ href: '/notes', label: 'Notes' },
		{ href: '/settings', label: 'Settings' }
	];
</script>

<div class="layout">
	<nav class="sidebar">
		<div class="logo">Today OS</div>
		<ul>
			{#each nav as item}
				<li>
					<a href={item.href} class:active={$page.url.pathname.startsWith(item.href)}>
						{item.label}
					</a>
				</li>
			{/each}
		</ul>

		{#if data.user}
			<div class="user-section">
				<span class="user-email" title={data.user.email}>{data.user.email}</span>
				<form method="POST" action="/logout">
					<button type="submit" class="logout-btn">Sign out</button>
				</form>
			</div>
		{/if}
	</nav>

	<main class="content">
		<slot />
	</main>
</div>

<style>
	.layout {
		display: flex;
		min-height: 100vh;
	}

	.sidebar {
		width: 180px;
		background: var(--surface);
		border-right: 1px solid var(--border);
		padding: 24px 12px;
		display: flex;
		flex-direction: column;
		gap: 24px;
		flex-shrink: 0;
	}

	.logo {
		font-size: 16px;
		font-weight: 600;
		padding: 0 8px;
		color: var(--accent);
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
	}

	a {
		display: block;
		padding: 8px 12px;
		border-radius: 6px;
		color: var(--muted);
		transition: background 0.1s, color 0.1s;
	}

	a:hover {
		background: var(--border);
		color: var(--text);
	}

	a.active {
		background: var(--border);
		color: var(--text);
	}

	.user-section {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 12px 8px 0;
		border-top: 1px solid var(--border);
	}

	.user-email {
		font-size: 11px;
		color: var(--muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.logout-btn {
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 5px;
		padding: 5px 10px;
		font-size: 12px;
		color: var(--muted);
		cursor: pointer;
		width: 100%;
		text-align: left;
		transition: color 0.1s, border-color 0.1s;
	}

	.logout-btn:hover {
		color: #ef4444;
		border-color: #ef444440;
	}

	.content {
		flex: 1;
		padding: 32px;
		overflow-y: auto;
	}
</style>
