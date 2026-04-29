<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { settings, ACCENT_PRESETS } from '$lib/stores';
	import type { PageData } from './$types';

	export let data: PageData;

	async function exportData() {
		const sb = (await import('$lib/supabase')).supabase;
		const [todos, habits, habitLogs, notes] = await Promise.all([
			sb.from('todos').select('*'),
			sb.from('habit_definitions').select('*'),
			sb.from('habit_logs').select('*'),
			sb.from('notes').select('*')
		]);

		const blob = new Blob(
			[JSON.stringify({ exportedAt: new Date().toISOString(), todos: todos.data, habits: habits.data, habitLogs: habitLogs.data, notes: notes.data }, null, 2)],
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

<div class="page">
	<header class="page-header">
		<h1>Settings</h1>
	</header>

	<section class="settings-section">
		<h2 class="section-heading">Appearance</h2>

		<div class="row">
			<div class="row-label">
				<span class="label">Theme</span>
			</div>
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
		</div>

		<div class="row">
			<div class="row-label">
				<span class="label">Accent color</span>
			</div>
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
		</div>
	</section>

	<section class="settings-section">
		<h2 class="section-heading">Account</h2>

		<div class="row">
			<div class="row-label">
				<span class="label">Email</span>
				<span class="hint">{data.email}</span>
			</div>
		</div>
	</section>

	<section class="settings-section">
		<h2 class="section-heading">Data</h2>

		<div class="row">
			<div class="row-label">
				<span class="label">Export</span>
				<span class="hint">Download all data as JSON.</span>
			</div>
			<button class="btn-secondary" on:click={exportData}>Export JSON</button>
		</div>

		<div class="row">
			<div class="row-label">
				<span class="label">Clear all data</span>
				<span class="hint">Permanently deletes all todos, habits, and notes.</span>
			</div>
			<button class="btn-destructive" on:click={clearData}>Clear</button>
		</div>
	</section>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	/* Page header */
	.page-header {
		margin-bottom: 32px;
	}

	h1 {
		margin: 0;
		font-size: 24px;
		font-weight: 600;
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	/* Section */
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

	.section-heading {
		margin: 0 0 16px;
		font-size: 11px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-tertiary);
	}

	/* Row */
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 12px 0;
	}

	.row + .row {
		border-top: 1px solid var(--border-subtle);
	}

	.row-label {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.label {
		font-size: 14px;
		font-weight: 400;
		color: var(--text-primary);
	}

	.hint {
		font-size: 13px;
		color: var(--text-secondary);
	}

	/* Segmented button group (theme toggle) */
	.seg-group {
		display: flex;
		background: var(--surface-2);
		border-radius: var(--radius-md);
		padding: 2px;
		gap: 2px;
		flex-shrink: 0;
	}

	.seg-group form {
		display: contents;
	}

	.seg-btn {
		background: transparent;
		border: none;
		border-radius: 6px;
		padding: 0 14px;
		height: 28px;
		font-size: 13px;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		transition: background 120ms var(--ease-out), color 120ms var(--ease-out);
	}

	.seg-btn:hover {
		color: var(--text-primary);
	}

	.seg-btn.active {
		background: var(--surface-overlay);
		color: var(--text-primary);
		box-shadow: var(--shadow-sm);
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

	/* Action buttons */
	.btn-secondary {
		background: transparent;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		padding: 0 16px;
		height: 36px;
		font-size: 13px;
		font-weight: 500;
		color: var(--text-primary);
		cursor: pointer;
		flex-shrink: 0;
		transition: background 120ms var(--ease-out), border-color 120ms var(--ease-out);
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

	/* Destructive button §8.1 */
	.btn-destructive {
		background: transparent;
		border: 1px solid color-mix(in oklab, var(--danger) 40%, transparent);
		border-radius: var(--radius-md);
		padding: 0 16px;
		height: 36px;
		font-size: 13px;
		font-weight: 500;
		color: var(--danger);
		cursor: pointer;
		flex-shrink: 0;
		transition: background 120ms var(--ease-out), border-color 120ms var(--ease-out);
	}

	.btn-destructive:hover {
		background: var(--danger-soft);
		border-color: var(--danger);
	}

	.btn-destructive:active {
		transform: translateY(1px);
	}

	.btn-destructive:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}
</style>
