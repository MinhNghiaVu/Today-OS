<script lang="ts">
	import { MoreHorizontal } from 'lucide-svelte';
	import { mobileSidebarOpen } from '$lib/stores';
	import { isNavItemActive, mobilePrimaryNavItems } from '$lib/navigation';

	export let pathname = '/today';

	$: moreActive = !mobilePrimaryNavItems.some((item) => isNavItemActive(pathname, item.href));
</script>

<nav class="mobile-tabbar" aria-label="Primary mobile">
	{#each mobilePrimaryNavItems as item}
		<a
			href={item.href}
			class:active={isNavItemActive(pathname, item.href)}
			aria-current={isNavItemActive(pathname, item.href) ? 'page' : undefined}
		>
			<svelte:component this={item.icon} size={19} strokeWidth={2} />
			<span>{item.label}</span>
		</a>
	{/each}
	<button
		type="button"
		class:active={moreActive || $mobileSidebarOpen}
		on:click={() => mobileSidebarOpen.open()}
		aria-label="Open workspace navigation"
		aria-controls="app-sidebar"
		aria-expanded={$mobileSidebarOpen}
	>
		<MoreHorizontal size={20} strokeWidth={2} />
		<span>More</span>
	</button>
</nav>

<style>
	.mobile-tabbar {
		display: none;
	}

	@media (max-width: 760px) {
		.mobile-tabbar {
			position: fixed;
			right: 0;
			bottom: 0;
			left: 0;
			z-index: 35;
			display: grid;
			grid-template-columns: repeat(5, minmax(0, 1fr));
			gap: 2px;
			min-height: var(--mobile-bottom-nav-height);
			padding: 8px 8px calc(8px + env(safe-area-inset-bottom));
			background: color-mix(in oklab, var(--surface-1) 94%, transparent);
			border-top: 1px solid var(--border-subtle);
			backdrop-filter: blur(16px);
		}

		.mobile-tabbar a,
		.mobile-tabbar button {
			display: flex;
			min-width: 0;
			min-height: 48px;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 3px;
			border: none;
			border-radius: var(--radius-lg);
			background: transparent;
			color: var(--text-tertiary);
			cursor: pointer;
			font: inherit;
			font-size: 11px;
			font-weight: 500;
			line-height: 1.1;
			transition:
				background-color 120ms var(--ease-out),
				color 120ms var(--ease-out),
				transform 120ms var(--ease-out);
		}

		.mobile-tabbar a:hover,
		.mobile-tabbar button:hover {
			background: var(--surface-2);
			color: var(--text-primary);
		}

		.mobile-tabbar a:active,
		.mobile-tabbar button:active {
			transform: translateY(1px);
		}

		.mobile-tabbar a.active,
		.mobile-tabbar button.active {
			background: var(--surface-2);
			color: var(--text-primary);
		}

		.mobile-tabbar a:focus-visible,
		.mobile-tabbar button:focus-visible {
			outline: 2px solid var(--border-focus);
			outline-offset: -2px;
		}

		.mobile-tabbar span {
			overflow: hidden;
			max-width: 100%;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}
</style>
