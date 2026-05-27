<script lang="ts">
	import { onMount } from 'svelte';
	import { CheckCircle2, Download, Share2, Smartphone } from 'lucide-svelte';

	type InstallChoice = {
		outcome: 'accepted' | 'dismissed';
		platform: string;
	};

	interface BeforeInstallPromptEvent extends Event {
		readonly platforms: string[];
		readonly userChoice: Promise<InstallChoice>;
		prompt(): Promise<void>;
	}

	let deferredPrompt: BeforeInstallPromptEvent | null = null;
	let installed = false;
	let isAppleTouchDevice = false;

	$: hint = installed
		? 'Ready from your Home Screen.'
		: deferredPrompt
			? 'Ready to install on this device.'
			: isAppleTouchDevice
				? 'Safari: Share, then Add to Home Screen.'
				: 'Use your browser menu to install.';

	onMount(() => {
		const displayMode = window.matchMedia('(display-mode: standalone)');
		const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };

		const syncInstalledState = () => {
			installed = displayMode.matches || navigatorWithStandalone.standalone === true;
		};

		isAppleTouchDevice =
			/iPhone|iPad|iPod/.test(navigator.userAgent) ||
			(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

		const handleBeforeInstallPrompt = (event: Event) => {
			event.preventDefault();
			deferredPrompt = event as BeforeInstallPromptEvent;
		};

		const handleAppInstalled = () => {
			installed = true;
			deferredPrompt = null;
		};

		syncInstalledState();
		displayMode.addEventListener('change', syncInstalledState);
		window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
		window.addEventListener('appinstalled', handleAppInstalled);

		return () => {
			displayMode.removeEventListener('change', syncInstalledState);
			window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
			window.removeEventListener('appinstalled', handleAppInstalled);
		};
	});

	async function installApp() {
		if (!deferredPrompt) return;

		await deferredPrompt.prompt();
		const choice = await deferredPrompt.userChoice;
		if (choice.outcome === 'accepted') installed = true;
		deferredPrompt = null;
	}
</script>

<section class="settings-section">
	<h2 class="section-heading">Phone app</h2>

	<div class="row">
		<div class="row-label">
			<span class="label">
				<Smartphone size={16} strokeWidth={2} aria-hidden="true" />
				<span>Install Today OS</span>
			</span>
			<span class="hint">{hint}</span>
		</div>

		{#if installed}
			<span class="status-chip ready">
				<CheckCircle2 size={15} strokeWidth={2} aria-hidden="true" />
				Installed
			</span>
		{:else if deferredPrompt}
			<button type="button" class="btn-secondary" on:click={installApp}>
				<Download size={15} strokeWidth={2} aria-hidden="true" />
				Install
			</button>
		{:else}
			<span class="status-chip">
				<Share2 size={15} strokeWidth={2} aria-hidden="true" />
				{isAppleTouchDevice ? 'Share menu' : 'Browser menu'}
			</span>
		{/if}
	</div>
</section>

<style>
	.settings-section {
		border-top: 1px solid var(--border-subtle);
		padding: 24px 0;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.section-heading {
		margin: 0 0 16px;
		font-size: 11px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-tertiary);
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 12px 0;
	}

	.row-label {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.label {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		font-weight: 400;
		color: var(--text-primary);
	}

	.label :global(svg) {
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	.hint {
		font-size: 13px;
		color: var(--text-secondary);
	}

	.btn-secondary,
	.status-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		height: 36px;
		border-radius: var(--radius-md);
		padding: 0 16px;
		font-size: 13px;
		font-weight: 500;
		flex-shrink: 0;
	}

	.btn-secondary {
		background: transparent;
		border: 1px solid var(--border-default);
		color: var(--text-primary);
		cursor: pointer;
		font-family: inherit;
		transition:
			background-color 120ms var(--ease-out),
			border-color 120ms var(--ease-out),
			transform 120ms var(--ease-out);
	}

	.btn-secondary:hover {
		background: var(--surface-2);
		border-color: var(--border-strong);
	}

	.btn-secondary:active {
		transform: translateY(1px);
	}

	.btn-secondary:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.status-chip {
		border: 1px solid var(--border-subtle);
		background: var(--surface-2);
		color: var(--text-secondary);
	}

	.status-chip.ready {
		border-color: color-mix(in oklab, var(--success) 35%, transparent);
		background: var(--success-soft);
		color: var(--text-primary);
	}

	@media (max-width: 640px) {
		.row {
			align-items: flex-start;
			flex-direction: column;
			gap: 12px;
		}
	}
</style>
