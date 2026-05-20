<script lang="ts">
	import { enhance } from '$app/forms';
	import { Activity, Plus } from 'lucide-svelte';
	import HabitProgressList from '$lib/components/HabitProgressList.svelte';
	import Select from '$lib/components/Select.svelte';
	import type { PageData } from './$types';
	import type { Habit, HabitType, HabitWithTodayLogs } from '$lib/types';

	export let data: PageData;

	type HabitDraft = Omit<Habit, 'id' | 'user_id'>;

	const typeOpts: { value: HabitType; label: string }[] = [
		{ value: 'min_goal', label: 'Min goal — at least this amount' },
		{ value: 'max_goal', label: "Max goal — don't exceed" },
		{ value: 'info_only', label: 'Info only — just track' }
	];

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
	let habits: HabitWithTodayLogs[] = data.habits;

	$: if (data.habits) habits = data.habits;

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
	<header class="page-header">
		<h1>Habits</h1>
		<button class="btn-primary" on:click={startAdd}>
			<Plus size={16} strokeWidth={2.2} aria-hidden="true" />
			New habit
		</button>
	</header>

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
					<input
						type="checkbox"
						bind:checked={draft.is_active}
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

	{#if habits.length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<Activity size={40} strokeWidth={1.5} />
			</div>
			<p class="empty-title">No habits yet</p>
			<p class="empty-desc">Track anything — water, steps, screen time. Add your first habit to get started.</p>
			<button class="btn-primary" on:click={startAdd}>
				<Plus size={16} strokeWidth={2.2} aria-hidden="true" />
				New habit
			</button>
		</div>
	{:else}
		<HabitProgressList bind:habits showManageActions onEdit={startEdit} />
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding: 32px 24px;
	}

	/* ── Header ── */
	.page-header {
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
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
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

	@media (max-width: 560px) {
		.page {
			padding: 28px 16px;
		}

		.page-header {
			align-items: flex-start;
			gap: 12px;
		}

		.form-row,
		.form-actions {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
