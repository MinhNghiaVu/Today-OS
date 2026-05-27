<script lang="ts">
	export let title: string;
</script>

<section class="settings-section">
	<h2>{title}</h2>
	<slot />
</section>

<style>
	.settings-section {
		border-top: 1px solid var(--border-subtle);
		padding: 24px 0;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.settings-section:last-child {
		border-bottom: 1px solid var(--border-subtle);
	}

	h2 {
		margin: 0 0 16px;
		color: var(--text-tertiary);
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
</style>
