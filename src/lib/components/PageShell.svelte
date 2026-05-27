<script lang="ts">
	export let title: string;
	export let subtitle = '';
	export let maxWidth: 'default' | 'wide' | 'narrow' | 'full' = 'default';
</script>

<div class="page-shell" class:wide={maxWidth === 'wide'} class:narrow={maxWidth === 'narrow'} class:full={maxWidth === 'full'}>
	<header class="page-shell-header">
		<div class="title-group">
			<div class="title-row">
				<slot name="icon" />
				<h1>{title}</h1>
			</div>
			{#if subtitle}
				<p>{subtitle}</p>
			{/if}
		</div>

		{#if $$slots.meta || $$slots.actions}
			<div class="header-side">
				<slot name="meta" />
				<slot name="actions" />
			</div>
		{/if}
	</header>

	<slot />
</div>

<style>
	.page-shell {
		width: min(100%, 1040px);
		margin: 0 auto;
		padding: 40px 32px 56px;
	}

	.page-shell.wide {
		width: min(100%, 1280px);
	}

	.page-shell.narrow {
		width: min(100%, 768px);
	}

	.page-shell.full {
		width: 100%;
	}

	.page-shell-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 24px;
		margin-bottom: 28px;
	}

	.title-group {
		min-width: 0;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}

	.title-row :global(svg) {
		flex-shrink: 0;
		color: var(--text-tertiary);
	}

	h1 {
		margin: 0;
		color: var(--text-primary);
		font-size: 28px;
		font-weight: 600;
		letter-spacing: 0;
		line-height: 1.15;
	}

	p {
		max-width: 580px;
		margin: 8px 0 0;
		color: var(--text-secondary);
		font-size: 14px;
		line-height: 1.5;
	}

	.header-side {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 10px;
		min-height: 36px;
		flex-shrink: 0;
	}

	@media (max-width: 980px) {
		.page-shell-header {
			flex-direction: column;
			gap: 16px;
		}

		.header-side {
			width: 100%;
			justify-content: flex-start;
			flex-wrap: wrap;
		}
	}

	@media (max-width: 760px) {
		.page-shell {
			padding: 24px 16px 36px;
		}

		.page-shell-header {
			margin-bottom: 20px;
		}

		h1 {
			font-size: 25px;
		}
	}
</style>
