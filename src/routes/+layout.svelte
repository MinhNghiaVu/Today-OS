<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { settings } from '$lib/stores';
	import AppMobileNav from '$lib/components/AppMobileNav.svelte';
	import AppSidebar from '$lib/components/AppSidebar.svelte';
	import Toast from '$lib/components/Toast.svelte';

	export let data: { preferences?: { theme: 'dark' | 'light'; accentIndex: number }; user?: { email?: string } | null };

	$: if (data.preferences) settings.init(data.preferences);

	$: isAuthRoute = $page.url.pathname.startsWith('/login') || $page.url.pathname.startsWith('/auth');
</script>

<div class="layout">
	{#if !isAuthRoute}
		<AppSidebar user={data.user ?? null} pathname={$page.url.pathname} />
		<header class="mobile-topbar">
			<div class="mobile-brand">
				<img src="/icon-192.png" alt="" aria-hidden="true" width="24" height="24" />
				<span>Today OS</span>
			</div>
		</header>
	{/if}

	<main class="content">
		<slot />
	</main>

	{#if !isAuthRoute}
		<AppMobileNav pathname={$page.url.pathname} />
	{/if}
</div>

<Toast />

<style>
	.layout {
		display: flex;
		min-height: 100vh;
	}

	.mobile-topbar {
		display: none;
	}

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
		.layout {
			display: block;
		}

		.mobile-topbar {
			position: sticky;
			top: 0;
			z-index: 30;
			display: flex;
			align-items: center;
			justify-content: flex-start;
			height: 56px;
			padding: 8px 12px;
			background: color-mix(in oklab, var(--bg) 94%, transparent);
			border-bottom: 1px solid var(--border-subtle);
			backdrop-filter: blur(12px);
		}

		.mobile-brand {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			min-width: 0;
			height: 40px;
			border-radius: var(--radius-md);
			padding: 0 8px;
			color: var(--text-primary);
			font-size: 15px;
			font-weight: 600;
			letter-spacing: 0;
		}

		.mobile-brand img {
			width: 24px;
			height: 24px;
			border-radius: var(--radius-md);
			object-fit: cover;
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
			flex-shrink: 0;
		}

		.content {
			padding-bottom: var(--mobile-bottom-nav-height);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.content {
			animation: none;
		}
	}
</style>
