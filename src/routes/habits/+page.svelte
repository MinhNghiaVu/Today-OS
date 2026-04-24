<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import type { Habit, HabitType } from '$lib/types';

	export let data: PageData;

	type HabitDraft = Omit<Habit, 'id' | 'user_id'>;

	const blank = (): HabitDraft => ({
		name: '',
		unit: '',
		type: 'min_goal',
		daily_goal: null,
		color: '#6366f1',
		is_active: true
	});

	let editingId: string | null = null;
	let showForm = false;
	let draft: HabitDraft = blank();

	function startAdd() {
		editingId = null;
		draft = blank();
		showForm = true;
	}

	function startEdit(habit: Habit) {
		editingId = habit.id;
		draft = {
			name: habit.name,
			unit: habit.unit,
			type: habit.type,
			daily_goal: habit.daily_goal,
			color: habit.color,
			is_active: habit.is_active
		};
		showForm = true;
	}

	function cancelForm() {
		showForm = false;
		editingId = null;
	}

	const typeLabels: Record<HabitType, string> = {
		min_goal: 'Min goal',
		max_goal: 'Max goal',
		info_only: 'Info only'
	};
</script>

<div class="page">
	<div class="header">
		<h1>Habits</h1>
		<button class="btn-primary" on:click={startAdd}>+ New habit</button>
	</div>

	{#if showForm}
		<form
			method="POST"
			action={editingId ? '?/update' : '?/add'}
			class="habit-form"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success' || result.type === 'redirect') {
						showForm = false;
						editingId = null;
					}
					await update();
				};
			}}
		>
			<h2>{editingId ? 'Edit habit' : 'New habit'}</h2>
			{#if editingId}
				<input type="hidden" name="id" value={editingId} />
			{/if}

			<div class="form-row">
				<label>
					Name
					<input bind:value={draft.name} name="name" placeholder="e.g. Water" required />
				</label>
				<label>
					Unit
					<input bind:value={draft.unit} name="unit" placeholder="e.g. ml" required />
				</label>
			</div>

			<div class="form-row">
				<label>
					Type
					<select bind:value={draft.type} name="type">
						<option value="min_goal">Min goal — at least this amount</option>
						<option value="max_goal">Max goal — don't exceed</option>
						<option value="info_only">Info only — just track</option>
					</select>
				</label>
				<label>
					Daily goal
					<input
						type="number"
						name="daily_goal"
						min="0"
						step="any"
						placeholder={draft.type === 'info_only' ? 'None' : 'Required'}
						value={draft.daily_goal ?? ''}
						on:input={(e) => {
							const v = parseFloat((e.target as HTMLInputElement).value);
							draft.daily_goal = isNaN(v) ? null : v;
						}}
						disabled={draft.type === 'info_only'}
					/>
				</label>
			</div>

			<div class="form-row">
				<label class="color-label">
					Color
					<div class="color-wrap">
						<input type="color" name="color" bind:value={draft.color} />
						<span class="color-hex">{draft.color}</span>
					</div>
				</label>
				<label class="checkbox-label">
					<input type="hidden" name="is_active" value="false" />
					<input type="checkbox" bind:checked={draft.is_active} on:change={(e) => {
						const el = e.currentTarget.form?.querySelector('input[name="is_active"][type="hidden"]') as HTMLInputElement | null;
						if (el) el.value = e.currentTarget.checked ? 'true' : 'false';
					}} />
					Active
				</label>
			</div>

			<!-- Hidden is_active value synced via checkbox handler -->
			<input type="hidden" name="is_active" value={draft.is_active ? 'true' : 'false'} />

			<div class="form-actions">
				<button type="submit" class="btn-primary">{editingId ? 'Save' : 'Add habit'}</button>
				<button type="button" class="btn-ghost" on:click={cancelForm}>Cancel</button>
			</div>
		</form>
	{/if}

	<ul class="habit-list">
		{#each data.habits as habit (habit.id)}
			<li class:inactive={!habit.is_active}>
				<div class="color-dot" style="background: {habit.color}"></div>
				<div class="habit-info">
					<span class="name">{habit.name}</span>
					<span class="meta">
						{#if habit.daily_goal !== null}
							{habit.daily_goal} {habit.unit} ·
						{/if}
						<span class="type-badge type-{habit.type}">{typeLabels[habit.type]}</span>
					</span>
				</div>
				{#if !habit.is_active}
					<span class="inactive-badge">Inactive</span>
				{/if}
				<div class="actions">
					<button class="act-btn" on:click={() => startEdit(habit)} title="Edit">✎</button>

					<form method="POST" action="?/toggleActive" use:enhance>
						<input type="hidden" name="id" value={habit.id} />
						<input type="hidden" name="is_active" value={String(habit.is_active)} />
						<button type="submit" class="act-btn" title={habit.is_active ? 'Deactivate' : 'Activate'}>
							{habit.is_active ? '⏸' : '▶'}
						</button>
					</form>

					<form method="POST" action="?/remove" use:enhance={({ cancel }) => {
						if (!confirm(`Delete "${habit.name}"? This also removes its log history.`)) cancel();
						return async ({ update }) => update();
					}}>
						<input type="hidden" name="id" value={habit.id} />
						<button type="submit" class="act-btn danger" title="Delete">✕</button>
					</form>
				</div>
			</li>
		{/each}
	</ul>

	{#if data.habits.length === 0}
		<p class="empty">No habits yet. Add one above.</p>
	{/if}
</div>

<style>
	.page {
		max-width: 640px;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	h1 {
		margin: 0;
		font-size: 24px;
		font-weight: 600;
	}

	.habit-form {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.habit-form h2 {
		margin: 0;
		font-size: 15px;
		font-weight: 600;
	}

	.form-row {
		display: flex;
		gap: 12px;
	}

	.form-row label {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 12px;
		font-weight: 500;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.form-row input,
	.form-row select {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 8px 10px;
		color: var(--text);
		font-size: 14px;
		outline: none;
		width: 100%;
	}

	.form-row input:focus,
	.form-row select:focus {
		border-color: var(--accent);
	}

	.form-row input:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.color-label {
		flex: 0 0 auto;
	}

	.color-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.color-wrap input[type='color'] {
		width: 36px;
		height: 36px;
		padding: 2px;
		cursor: pointer;
		border-radius: 6px;
	}

	.color-hex {
		font-size: 12px;
		color: var(--muted);
		font-family: monospace;
	}

	.checkbox-label {
		flex-direction: row !important;
		align-items: center;
		gap: 8px !important;
		padding-top: 22px;
	}

	.checkbox-label input[type='checkbox'] {
		width: 16px;
		height: 16px;
		accent-color: var(--accent);
		cursor: pointer;
	}

	.form-actions {
		display: flex;
		gap: 8px;
	}

	.btn-primary {
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 6px;
		padding: 8px 16px;
		font-size: 14px;
		cursor: pointer;
	}

	.btn-primary:hover {
		background: var(--accent-hover);
	}

	.btn-ghost {
		background: var(--border);
		color: var(--text);
		border: none;
		border-radius: 6px;
		padding: 8px 16px;
		font-size: 14px;
		cursor: pointer;
	}

	.habit-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.habit-list li {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 14px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		transition: opacity 0.15s;
	}

	.habit-list li.inactive {
		opacity: 0.5;
	}

	.color-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.habit-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.name {
		font-size: 14px;
		font-weight: 500;
	}

	.meta {
		font-size: 12px;
		color: var(--muted);
	}

	.type-badge {
		font-size: 11px;
		padding: 1px 6px;
		border-radius: 999px;
		font-weight: 500;
	}

	.type-min_goal { background: #10b98120; color: #10b981; }
	.type-max_goal { background: #f59e0b20; color: #f59e0b; }
	.type-info_only { background: #88888820; color: #888; }

	.inactive-badge {
		font-size: 11px;
		color: var(--muted);
		padding: 2px 8px;
		border: 1px solid var(--border);
		border-radius: 999px;
	}

	.actions {
		display: flex;
		gap: 4px;
		opacity: 0;
		transition: opacity 0.1s;
	}

	.habit-list li:hover .actions {
		opacity: 1;
	}

	.act-btn {
		width: 26px;
		height: 26px;
		border: 1px solid var(--border);
		border-radius: 5px;
		background: transparent;
		color: var(--muted);
		font-size: 13px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.1s, border-color 0.1s;
	}

	.act-btn:hover {
		color: var(--text);
		border-color: var(--text);
	}

	.act-btn.danger:hover {
		color: #ef4444;
		border-color: #ef4444;
	}

	.empty {
		color: var(--muted);
		font-size: 14px;
		margin: 0;
	}

	/* strip form default margins inside action buttons */
	.actions form {
		display: contents;
	}
</style>
