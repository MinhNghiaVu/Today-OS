<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { cubicOut, cubicIn } from 'svelte/easing';
	import { Activity } from 'lucide-svelte';
	import Select from '$lib/components/Select.svelte';
	import type { PageData } from './$types';
	import type { Habit, HabitType } from '$lib/types';

	export let data: PageData;

	type HabitDraft = Omit<Habit, 'id' | 'user_id'>;

	const typeOpts: { value: HabitType; label: string }[] = [
		{ value: 'min_goal', label: 'Min goal — at least this amount' },
		{ value: 'max_goal', label: "Max goal — don't exceed" },
		{ value: 'info_only', label: 'Info only — just track' }
	];

	const typeLabels: Record<HabitType, string> = {
		min_goal: 'Min goal',
		max_goal: 'Max goal',
		info_only: 'Info only'
	};

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
					<Select
						name="type"
						options={typeOpts}
						value={draft.type}
						on:change={(e) => (draft.type = e.detail as HabitType)}
					/>
				</label>
				<label>
					Daily goal
					<input
						class="goal-input"
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
					<input
						type="checkbox"
						bind:checked={draft.is_active}
						on:change={(e) => {
							const el = e.currentTarget.form?.querySelector(
								'input[name="is_active"][type="hidden"]'
							) as HTMLInputElement | null;
							if (el) el.value = e.currentTarget.checked ? 'true' : 'false';
						}}
					/>
					Active
				</label>
			</div>

			<input type="hidden" name="is_active" value={draft.is_active ? 'true' : 'false'} />

			<div class="form-actions">
				<button type="submit" class="btn-primary">{editingId ? 'Save' : 'Add habit'}</button>
				<button type="button" class="btn-ghost" on:click={cancelForm}>Cancel</button>
			</div>
		</form>
	{/if}

	{#if data.habits.length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<Activity size={40} strokeWidth={1.5} />
			</div>
			<p class="empty-title">No habits yet</p>
			<p class="empty-desc">Track anything — water, steps, screen time. Add your first habit to get started.</p>
			<button class="btn-primary" on:click={startAdd}>+ New habit</button>
		</div>
	{:else}
		<ul class="habit-list">
			{#each data.habits as habit (habit.id)}
				<li
					class:inactive={!habit.is_active}
					in:fly={{ y: -8, duration: 220, easing: cubicOut }}
					out:fly={{ y: 4, duration: 160, easing: cubicIn }}
					animate:flip={{ duration: 220, easing: cubicOut }}
				>
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
						<button class="act-btn" on:click={() => startEdit(habit)} title="Edit" aria-label="Edit habit">✎</button>

						<form method="POST" action="?/toggleActive" use:enhance>
							<input type="hidden" name="id" value={habit.id} />
							<input type="hidden" name="is_active" value={String(habit.is_active)} />
							<button
								type="submit"
								class="act-btn"
								title={habit.is_active ? 'Deactivate' : 'Activate'}
								aria-label={habit.is_active ? 'Deactivate habit' : 'Activate habit'}
							>
								{habit.is_active ? '⏸' : '▶'}
							</button>
						</form>

						<form
							method="POST"
							action="?/remove"
							use:enhance={({ cancel }) => {
								if (!confirm(`Delete "${habit.name}"? This also removes its log history.`)) cancel();
								return async ({ update }) => update();
							}}
						>
							<input type="hidden" name="id" value={habit.id} />
							<button type="submit" class="act-btn danger" title="Delete" aria-label="Delete habit">✕</button>
						</form>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.page {
		max-width: 640px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding: 32px 24px;
	}

	/* ── Header ── */
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	h1 {
		margin: 0;
		font-size: 24px;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--text-primary);
	}

	/* ── Add/Edit form ── */
	.habit-form {
		background: var(--surface-1);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-lg);
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.habit-form h2 {
		margin: 0;
		font-size: 15px;
		font-weight: 600;
		color: var(--text-primary);
	}

	.form-row {
		display: flex;
		gap: 12px;
		align-items: flex-end;
	}

	.form-row label {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 12px;
		font-weight: 500;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.form-row input:not([type='color']):not([type='checkbox']) {
		height: 36px;
		background: var(--surface-2);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		padding: 0 12px;
		color: var(--text-primary);
		font-size: 14px;
		font-family: inherit;
		outline: none;
		transition: border-color 120ms var(--ease-out);
		width: 100%;
	}

	.form-row input:not([type='color']):not([type='checkbox'])::placeholder {
		color: var(--text-tertiary);
	}

	.form-row input:not([type='color']):not([type='checkbox']):hover {
		border-color: var(--border-strong);
	}

	.form-row input:not([type='color']):not([type='checkbox']):focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.form-row input:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* make Select fill its label column */
	.form-row label :global(.select-wrapper) {
		width: 100%;
	}

	.form-row label :global(.select-trigger) {
		width: 100%;
	}

	.color-label {
		flex: 0 0 auto;
	}

	.color-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 36px;
	}

	.color-wrap input[type='color'] {
		width: 36px;
		height: 36px;
		padding: 2px;
		cursor: pointer;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-default);
		background: var(--surface-2);
	}

	.color-hex {
		font-size: 13px;
		color: var(--text-secondary);
	}

	.checkbox-label {
		flex-direction: row !important;
		align-items: center !important;
		gap: 8px !important;
		padding-bottom: 8px;
		font-size: 14px !important;
		font-weight: 400 !important;
		text-transform: none !important;
		letter-spacing: 0 !important;
		color: var(--text-primary) !important;
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

	/* ── Habit list ── */
	.habit-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.habit-list li {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		border-radius: var(--radius-md);
		min-height: 44px;
		transition: background-color 120ms var(--ease-out);
	}

	.habit-list li:hover {
		background: var(--surface-2);
	}

	.habit-list li.inactive {
		opacity: 0.5;
	}

	.color-dot {
		width: 10px;
		height: 10px;
		border-radius: var(--radius-full);
		flex-shrink: 0;
	}

	.habit-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.name {
		font-size: 14px;
		font-weight: 500;
		color: var(--text-primary);
	}

	.meta {
		font-size: 13px;
		color: var(--text-secondary);
	}

	/* ── Type badges ── */
	.type-badge {
		font-size: 12px;
		padding: 1px 6px;
		border-radius: var(--radius-full);
		font-weight: 500;
	}

	.type-min_goal  { background: var(--success-soft);  color: var(--success);  }
	.type-max_goal  { background: var(--warning-soft);  color: var(--warning);  }
	.type-info_only { background: var(--surface-3);     color: var(--text-secondary); }

	.inactive-badge {
		font-size: 12px;
		color: var(--text-tertiary);
		padding: 2px 8px;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-full);
	}

	/* ── Row actions ── */
	.actions {
		display: flex;
		gap: 4px;
		opacity: 0;
		transition: opacity 120ms var(--ease-out);
		flex-shrink: 0;
	}

	.habit-list li:hover .actions {
		opacity: 1;
	}

	.act-btn {
		width: 28px;
		height: 28px;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-tertiary);
		font-size: 13px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			color 120ms var(--ease-out),
			border-color 120ms var(--ease-out);
	}

	.act-btn:hover {
		color: var(--text-primary);
		border-color: var(--border-strong);
	}

	.act-btn.danger:hover {
		color: var(--danger);
		border-color: var(--danger);
	}

	/* ── Buttons ── */
	.btn-primary {
		height: 36px;
		padding: 0 16px;
		background: var(--accent);
		color: var(--text-on-accent);
		border: none;
		border-radius: var(--radius-md);
		font-size: 13px;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		white-space: nowrap;
		transition:
			background-color 120ms var(--ease-out),
			transform 120ms var(--ease-out);
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.btn-primary:active:not(:disabled) {
		background: var(--accent-pressed);
		transform: translateY(1px);
	}

	.btn-ghost {
		height: 36px;
		padding: 0 16px;
		background: var(--surface-2);
		color: var(--text-primary);
		border: none;
		border-radius: var(--radius-md);
		font-size: 13px;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		transition: background-color 120ms var(--ease-out);
	}

	.btn-ghost:hover {
		background: var(--surface-3);
	}

	/* ── Empty state ── */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 48px 24px;
		gap: 8px;
	}

	.empty-icon {
		color: var(--text-tertiary);
		margin-bottom: 8px;
		display: flex;
	}

	.empty-title {
		margin: 0;
		font-size: 17px;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.3;
	}

	.empty-desc {
		margin: 0 0 4px;
		font-size: 14px;
		color: var(--text-secondary);
		max-width: 280px;
	}

	/* strip form default margins inside action buttons */
	.actions form {
		display: contents;
	}
</style>
