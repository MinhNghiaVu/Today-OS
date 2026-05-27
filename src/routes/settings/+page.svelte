<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { settings, ACCENT_PRESETS } from '$lib/stores';
	import PageShell from '$lib/components/PageShell.svelte';
	import PwaInstallSetting from '$lib/components/PwaInstallSetting.svelte';
	import SettingsButton from '$lib/components/settings/SettingsButton.svelte';
	import SettingsRow from '$lib/components/settings/SettingsRow.svelte';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	async function exportData() {
		const blob = new Blob(
			[JSON.stringify({ exportedAt: new Date().toISOString(), ...data.exportData }, null, 2)],
			{ type: 'application/json' }
		);
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `today-os-export-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function clearData() {
		if (!confirm('Clear all todos, habits, habit logs, and notes? This cannot be undone.')) return;
		const form = new FormData();
		await fetch('?/clearData', { method: 'POST', body: form });
		await invalidateAll();
	}
</script>

<PageShell title="Settings" subtitle="Appearance, account, and local data controls." maxWidth="narrow">
	<SettingsSection title="Appearance">
		<SettingsRow label="Theme">
			<div class="seg-group">
				<form method="POST" action="?/setTheme" use:enhance={() => {
					settings.setTheme('dark');
					return async ({ update }) => update();
				}}>
					<input type="hidden" name="theme" value="dark" />
					<button type="submit" class="seg-btn" class:active={$settings.theme === 'dark'}>Dark</button>
				</form>
				<form method="POST" action="?/setTheme" use:enhance={() => {
					settings.setTheme('light');
					return async ({ update }) => update();
				}}>
					<input type="hidden" name="theme" value="light" />
					<button type="submit" class="seg-btn" class:active={$settings.theme === 'light'}>Light</button>
				</form>
			</div>
		</SettingsRow>

		<SettingsRow label="Accent color">
			<div class="swatch-row">
				{#each ACCENT_PRESETS as preset, i}
					<form method="POST" action="?/setAccent" use:enhance={() => {
						settings.setAccent(i);
						return async ({ update }) => update();
					}}>
						<input type="hidden" name="accentIndex" value={i} />
						<button
							type="submit"
							class="swatch"
							class:selected={$settings.accentIndex === i}
							style="background: {preset.accent};"
							title={preset.label}
							aria-label={preset.label}
						></button>
					</form>
				{/each}
			</div>
		</SettingsRow>
	</SettingsSection>

	<SettingsSection title="Account">
		<SettingsRow label="Email" hint={data.email} />
	</SettingsSection>

	<PwaInstallSetting />

	<SettingsSection title="Data">
		<SettingsRow label="Export" hint="Download all data as JSON.">
			<SettingsButton on:click={exportData}>Export JSON</SettingsButton>
		</SettingsRow>

		<SettingsRow label="Clear all data" hint="Permanently deletes all todos, habits, and notes.">
			<SettingsButton variant="destructive" on:click={clearData}>Clear</SettingsButton>
		</SettingsRow>
	</SettingsSection>
</PageShell>

<style>
	/* Segmented button group (theme toggle) */
	.seg-group {
		position: relative;
		display: flex;
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-full);
		padding: 3px;
		gap: 0;
		flex-shrink: 0;
	}

	.seg-group form {
		display: contents;
	}

	.seg-btn {
		position: relative;
		z-index: 1;
		background: transparent;
		border: none;
		border-radius: var(--radius-full);
		padding: 0 14px;
		height: 28px;
		font-size: 13px;
		font-weight: 500;
		color: var(--text-tertiary);
		cursor: pointer;
		transition: color 140ms var(--ease-out);
		font-family: inherit;
	}

	.seg-btn:hover {
		color: var(--text-primary);
	}

	.seg-btn.active {
		background: var(--surface-1);
		color: var(--text-primary);
		border: 1px solid var(--border-default);
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.45),
			0 1px 1px rgba(0, 0, 0, 0.25);
	}

	.seg-btn:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	/* Accent swatches */
	.swatch-row {
		display: flex;
		gap: 8px;
		flex-shrink: 0;
	}

	.swatch-row form {
		display: contents;
	}

	.swatch {
		width: 24px;
		height: 24px;
		border-radius: var(--radius-full);
		border: 2px solid transparent;
		cursor: pointer;
		transition: transform 120ms var(--ease-out), border-color 120ms var(--ease-out);
	}

	.swatch:hover {
		transform: scale(1.15);
	}

	.swatch.selected {
		border-color: var(--text-primary);
	}

	.swatch:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}
</style>
