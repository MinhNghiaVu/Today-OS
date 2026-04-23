<script lang="ts">
	import { settings, ACCENT_PRESETS, todos, habits, habitLogs, notes } from '$lib/stores';

	function exportData() {
		const data = {
			exportedAt: new Date().toISOString(),
			todos: $todos,
			habits: $habits,
			habitLogs: $habitLogs,
			notes: $notes
		};
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `today-os-export-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function clearData() {
		if (!confirm('Clear all todos, habits, habit logs, and notes? This cannot be undone.')) return;
		todos.clear();
		habits.clear();
		habitLogs.clear();
		notes.clear();
	}
</script>

<div class="page">
	<h1>Settings</h1>

	<section>
		<h2>Appearance</h2>

		<div class="row">
			<span class="label">Theme</span>
			<div class="toggle-group">
				<button
					class="toggle-btn"
					class:active={$settings.theme === 'dark'}
					on:click={() => settings.setTheme('dark')}
				>Dark</button>
				<button
					class="toggle-btn"
					class:active={$settings.theme === 'light'}
					on:click={() => settings.setTheme('light')}
				>Light</button>
			</div>
		</div>

		<div class="row">
			<span class="label">Accent</span>
			<div class="swatch-row">
				{#each ACCENT_PRESETS as preset, i}
					<button
						class="swatch"
						class:selected={$settings.accentIndex === i}
						style="background: {preset.accent};"
						title={preset.label}
						on:click={() => settings.setAccent(i)}
					></button>
				{/each}
			</div>
		</div>
	</section>

	<section>
		<h2>Data</h2>

		<div class="row">
			<div class="col">
				<span class="label">Export</span>
				<span class="hint">Download all data as JSON.</span>
			</div>
			<button class="action-btn" on:click={exportData}>Export JSON</button>
		</div>

		<div class="row danger-row">
			<div class="col">
				<span class="label">Clear all data</span>
				<span class="hint">Permanently deletes all todos, habits, and notes.</span>
			</div>
			<button class="action-btn danger-btn" on:click={clearData}>Clear</button>
		</div>
	</section>
</div>

<style>
	.page {
		max-width: 480px;
		display: flex;
		flex-direction: column;
		gap: 40px;
	}

	h1 {
		margin: 0;
		font-size: 24px;
		font-weight: 600;
	}

	h2 {
		margin: 0 0 16px;
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}

	section {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 14px 0;
		border-bottom: 1px solid var(--border);
	}

	.row:last-child {
		border-bottom: none;
	}

	.col {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.label {
		font-size: 14px;
		color: var(--text);
	}

	.hint {
		font-size: 12px;
		color: var(--muted);
	}

	.toggle-group {
		display: flex;
		gap: 2px;
	}

	.toggle-btn {
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 5px;
		padding: 5px 14px;
		font-size: 13px;
		color: var(--muted);
		cursor: pointer;
		transition: background 0.1s, color 0.1s;
	}

	.toggle-btn:hover {
		background: var(--border);
		color: var(--text);
	}

	.toggle-btn.active {
		background: var(--accent);
		color: #fff;
		border-color: var(--accent);
	}

	.swatch-row {
		display: flex;
		gap: 8px;
	}

	.swatch {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		transition: transform 0.1s, border-color 0.1s;
	}

	.swatch:hover {
		transform: scale(1.15);
	}

	.swatch.selected {
		border-color: var(--text);
	}

	.action-btn {
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 7px 16px;
		font-size: 13px;
		color: var(--text);
		cursor: pointer;
		flex-shrink: 0;
		transition: background 0.1s;
	}

	.action-btn:hover {
		background: var(--border);
	}

	.danger-btn {
		color: #ef4444;
		border-color: #ef444440;
	}

	.danger-btn:hover {
		background: #ef444415;
		border-color: #ef4444;
	}
</style>
