<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';

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

	.content {
		flex: 1;
		padding: 32px;
		overflow-y: auto;
	}
</style>
