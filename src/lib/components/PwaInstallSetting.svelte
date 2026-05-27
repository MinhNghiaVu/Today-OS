<script lang="ts">
	import { onMount } from 'svelte';
	import { CheckCircle2, Download, Share2, Smartphone } from 'lucide-svelte';
	import SettingsButton from '$lib/components/settings/SettingsButton.svelte';
	import SettingsRow from '$lib/components/settings/SettingsRow.svelte';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';

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

<SettingsSection title="Phone app">
	<SettingsRow {hint}>
		<svelte:fragment slot="label">
			<Smartphone size={16} strokeWidth={2} aria-hidden="true" />
			<span>Install Today OS</span>
		</svelte:fragment>

		{#if installed}
			<span class="status-chip ready">
				<CheckCircle2 size={15} strokeWidth={2} aria-hidden="true" />
				Installed
			</span>
		{:else if deferredPrompt}
			<SettingsButton on:click={installApp}>
				<Download size={15} strokeWidth={2} aria-hidden="true" />
				Install
			</SettingsButton>
		{:else}
			<span class="status-chip">
				<Share2 size={15} strokeWidth={2} aria-hidden="true" />
				{isAppleTouchDevice ? 'Share menu' : 'Browser menu'}
			</span>
		{/if}
	</SettingsRow>
</SettingsSection>

<style>
	.status-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		height: 36px;
		border-radius: var(--radius-md);
		padding: 0 16px;
		border: 1px solid var(--border-subtle);
		background: var(--surface-2);
		color: var(--text-secondary);
		font-size: 13px;
		font-weight: 500;
		flex-shrink: 0;
	}

	.status-chip.ready {
		border-color: color-mix(in oklab, var(--success) 35%, transparent);
		background: var(--success-soft);
		color: var(--text-primary);
	}
</style>
