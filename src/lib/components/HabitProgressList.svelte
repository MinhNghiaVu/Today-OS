<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { cubicIn, cubicOut } from 'svelte/easing';
	import {
		BarChart2,
		Droplets,
		Pause,
		Pencil,
		Play,
		Plus,
		Target,
		Trash2
	} from 'lucide-svelte';
	import {
		applyHabitLogAdd,
		applyHabitLogRemove,
		applyHabitLogUpdate,
		createOptimisticHabitLog,
		formatHabitTotal,
		getHabitActionLog,
		habitProgressWidth,
		habitStatus,
		isHabitOnTrack,
		isHabitOverLimit,
		replaceHabitLog
	} from '$lib/utils/habits';
	import { parseLocalizedNumber } from '$lib/utils/number';
	import type { HabitWithTodayLogs } from '$lib/types';

	export let habits: HabitWithTodayLogs[] = [];
	export let logAction = '?/logHabit';
	export let updateLogAction = '?/updateHabitLog';
	export let removeLogAction = '?/removeHabitLog';
	export let toggleActiveAction = '?/toggleActive';
	export let removeHabitAction = '?/remove';
	export let date = new Date().toISOString().slice(0, 10);
	export let showLogs = true;
	export let showManageActions = false;
	export let onEdit: (habit: HabitWithTodayLogs) => void = () => {};

	let activeHabitId: string | null = null;
	let logAmount = '';
	let editingLogId: string | null = null;
	let editingLogValue = '';
	let optimisticLogSeq = 0;

	function openLog(id: string) {
		activeHabitId = id;
		logAmount = '';
	}

	function startEditLog(id: string, value: number) {
		editingLogId = id;
		editingLogValue = String(value);
	}

	function formatLogTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('en-AU', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

</script>

<ul class="habit-list">
	{#each habits as habit (habit.id)}
		<li class:inactive={!habit.is_active}>
			<div class="habit-main">
				<div class="habit-icon" style="color: {habit.color}">
					{#if habit.name.toLowerCase().includes('water')}
						<Droplets size={17} strokeWidth={2} aria-hidden="true" />
					{:else}
						<Target size={17} strokeWidth={2} aria-hidden="true" />
					{/if}
				</div>
				<div class="habit-copy">
					<div class="habit-title-row">
						<span class="habit-name">{habit.name}</span>
						<span
							class:good={habit.is_active && isHabitOnTrack(habit)}
							class:warn={habit.is_active && isHabitOverLimit(habit)}
							class="habit-state"
						>
							{habitStatus(habit)}
						</span>
					</div>
					<div class="bar-track">
						<div
							class="bar-fill"
							class:bar-met={habit.is_active && isHabitOnTrack(habit)}
							class:bar-warn={habit.is_active && isHabitOverLimit(habit)}
							style="width: {habitProgressWidth(habit)}%; background: {habit.color};"
						></div>
					</div>
					<div class="habit-meta">
						<span>{habit.total}{habit.daily_goal !== null ? ` / ${habit.daily_goal}` : ''} {habit.unit}</span>
						<span>{habit.daily_goal === null ? `${habit.daysLogged}/7 days logged` : `${habit.daysMet}/7 days on goal`}</span>
					</div>
				</div>

				<div class="row-actions">
					{#if habit.is_active}
						<button class="small-square" on:click={() => openLog(habit.id)} aria-label="Log {habit.name}">
							<Plus size={16} strokeWidth={2.2} />
						</button>
					{/if}

					{#if showManageActions}
						<a href="/habits/{habit.id}" class="small-square" title="View chart" aria-label="View {habit.name} chart">
							<BarChart2 size={15} strokeWidth={2} />
						</a>
						<button class="small-square" on:click={() => onEdit(habit)} title="Edit" aria-label="Edit {habit.name}">
							<Pencil size={15} strokeWidth={2} />
						</button>
						<form
							method="POST"
							action={toggleActiveAction}
							use:enhance={() => {
								const previous = habits;
								habits = habits.map((item) =>
									item.id === habit.id ? { ...item, is_active: !item.is_active } : item
								);
								return async ({ result }) => {
									if (result.type === 'failure' || result.type === 'error') habits = previous;
								};
							}}
						>
							<input type="hidden" name="id" value={habit.id} />
							<button
								type="submit"
								class="small-square"
								title={habit.is_active ? 'Deactivate' : 'Activate'}
								aria-label={habit.is_active ? 'Deactivate {habit.name}' : 'Activate {habit.name}'}
							>
								{#if habit.is_active}
									<Pause size={15} strokeWidth={2} />
								{:else}
									<Play size={15} strokeWidth={2} />
								{/if}
							</button>
						</form>
						<form
							method="POST"
							action={removeHabitAction}
							use:enhance={({ cancel }) => {
								if (!confirm(`Delete "${habit.name}"? This also removes its log history.`)) cancel();
								return async ({ update }) => update();
							}}
						>
							<input type="hidden" name="id" value={habit.id} />
							<button type="submit" class="small-square danger" title="Delete" aria-label="Delete {habit.name}">
								<Trash2 size={15} strokeWidth={2} />
							</button>
						</form>
					{/if}
				</div>
			</div>

			{#if activeHabitId === habit.id}
				<form
					method="POST"
					action={logAction}
					class="log-row"
					in:fly={{ y: -6, duration: 180, easing: cubicOut }}
					out:fly={{ y: -4, duration: 140, easing: cubicIn }}
					use:enhance={({ formData }) => {
						const value = parseLocalizedNumber(formData.get('value'));
						const optimistic = value > 0
							? createOptimisticHabitLog({
									habitId: habit.id,
									value,
									sequence: ++optimisticLogSeq,
									date
								})
							: null;
						if (optimistic) habits = applyHabitLogAdd(habits, optimistic);
						logAmount = '';
						activeHabitId = null;
						return async ({ result }) => {
							if (result.type === 'failure' || result.type === 'error') {
								if (optimistic) habits = applyHabitLogRemove(habits, optimistic);
								return;
							}
							const serverLog = getHabitActionLog(result);
							if (optimistic && serverLog) habits = replaceHabitLog(habits, optimistic.id, serverLog);
						};
					}}
				>
					<input type="hidden" name="habit_id" value={habit.id} />
					<input type="hidden" name="date" value={date} />
					<input
						type="text"
						inputmode="decimal"
						name="value"
						class="decimal-input"
						bind:value={logAmount}
						placeholder={`Amount in ${habit.unit}`}
						aria-label="Log amount"
					/>
					<button type="submit" class="small-button primary-fill">Log</button>
					<button type="button" class="small-button" on:click={() => (activeHabitId = null)}>Cancel</button>
				</form>
			{/if}

			{#if showLogs && habit.todayLogs.length > 0}
				<ul class="habit-log-list" aria-label="{habit.name} logs">
					{#each habit.todayLogs as log (log.id)}
						<li>
							{#if editingLogId === log.id}
								<form
									method="POST"
									action={updateLogAction}
									class="log-edit-form"
									use:enhance={({ formData }) => {
										const previous = habits;
										const nextValue = parseLocalizedNumber(formData.get('value'));
										if (nextValue > 0) {
											habits = applyHabitLogUpdate(habits, { ...log, value: nextValue });
										}
										return async ({ result }) => {
											if (result.type === 'success') editingLogId = null;
											if (result.type === 'failure' || result.type === 'error') {
												habits = previous;
												return;
											}
											const serverLog = getHabitActionLog(result);
											if (serverLog) habits = replaceHabitLog(habits, log.id, serverLog);
										};
									}}
								>
									<input type="hidden" name="id" value={log.id} />
									<input
										type="text"
										inputmode="decimal"
										name="value"
										class="decimal-input"
										bind:value={editingLogValue}
										aria-label="Edit log value"
									/>
									<button type="submit" class="small-button primary-fill">Save</button>
									<button type="button" class="small-button" on:click={() => (editingLogId = null)}>Cancel</button>
								</form>
							{:else}
								<div class="log-entry-copy">
									<span class="log-value">+{formatHabitTotal(log.value)} {habit.unit}</span>
									<span class="log-time">{formatLogTime(log.created_at)}</span>
								</div>
								<div class="log-entry-actions">
									<button
										type="button"
										class="mini-icon-button"
										on:click={() => startEditLog(log.id, log.value)}
										aria-label="Edit {habit.name} log"
									>
										<Pencil size={13} strokeWidth={2} />
									</button>
									<form
										method="POST"
										action={removeLogAction}
										use:enhance={() => {
											const previous = habits;
											habits = applyHabitLogRemove(habits, log);
											return async ({ result }) => {
												if (result.type === 'failure' || result.type === 'error') habits = previous;
											};
										}}
									>
										<input type="hidden" name="id" value={log.id} />
										<button type="submit" class="mini-icon-button danger" aria-label="Delete {habit.name} log">
											<Trash2 size={13} strokeWidth={2} />
										</button>
									</form>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</li>
	{/each}
</ul>

<style>
	.habit-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.habit-list > li {
		padding: 12px;
		border-radius: var(--radius-lg);
		background: var(--surface-2);
		transition:
			opacity 120ms var(--ease-out),
			background-color 120ms var(--ease-out);
	}

	.habit-list > li.inactive {
		opacity: 0.62;
	}

	.habit-main {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.habit-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border-radius: var(--radius-md);
		background: var(--surface-3);
		flex-shrink: 0;
	}

	.habit-copy {
		flex: 1;
		min-width: 0;
	}

	.habit-title-row,
	.habit-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}

	.habit-name {
		font-weight: 500;
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.habit-state,
	.habit-meta {
		font-size: 12px;
		color: var(--text-tertiary);
	}

	.habit-state.good {
		color: var(--success);
	}

	.habit-state.warn {
		color: var(--danger);
	}

	.bar-track {
		height: 6px;
		margin: 8px 0 6px;
		background: var(--surface-3);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		border-radius: var(--radius-full);
		transition: width 260ms var(--ease-out);
	}

	.bar-fill.bar-met {
		background: var(--success) !important;
	}

	.bar-fill.bar-warn {
		background: var(--danger) !important;
	}

	.row-actions,
	.log-entry-actions {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-shrink: 0;
	}

	.row-actions form,
	.log-entry-actions form {
		display: contents;
	}

	.small-square,
	.mini-icon-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		cursor: pointer;
		text-decoration: none;
		transition:
			background-color 120ms var(--ease-out),
			color 120ms var(--ease-out),
			transform 120ms var(--ease-out);
	}

	.small-square {
		width: 34px;
		height: 34px;
		border-radius: var(--radius-md);
		background: var(--surface-3);
		color: var(--text-primary);
	}

	.small-square:hover {
		background: var(--accent-soft);
		color: var(--accent);
	}

	.small-square.danger:hover,
	.mini-icon-button.danger:hover {
		background: var(--danger-soft);
		color: var(--danger);
	}

	.log-row,
	.log-edit-form {
		display: flex;
		gap: 8px;
	}

	.log-row {
		margin-top: 10px;
		padding-left: 46px;
	}

	input {
		width: 100%;
		height: 38px;
		background: var(--surface-2);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-family: inherit;
		font-size: 14px;
		outline: none;
		padding: 0 12px;
		transition:
			border-color 120ms var(--ease-out),
			background-color 120ms var(--ease-out);
	}

	input::placeholder {
		color: var(--text-tertiary);
	}

	input:hover {
		border-color: var(--border-strong);
	}

	button:focus-visible,
	a:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.small-button {
		height: 32px;
		padding: 0 12px;
		border: none;
		border-radius: var(--radius-md);
		background: var(--surface-3);
		color: var(--text-primary);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
	}

	.primary-fill {
		background: var(--accent);
		color: var(--text-on-accent);
	}

	.primary-fill:hover {
		background: var(--accent-hover);
	}

	.primary-fill:active,
	.small-square:active {
		transform: translateY(1px);
	}

	.habit-log-list {
		list-style: none;
		margin: 10px 0 0;
		padding: 0 0 0 46px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.habit-log-list li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		min-height: 34px;
		padding: 7px 9px;
		border-radius: var(--radius-md);
		background: var(--surface-3);
	}

	.log-entry-copy {
		display: flex;
		align-items: baseline;
		gap: 8px;
		min-width: 0;
	}

	.log-value {
		color: var(--text-primary);
		font-size: 13px;
		font-weight: 500;
	}

	.log-time {
		color: var(--text-tertiary);
		font-size: 12px;
	}

	.mini-icon-button {
		width: 26px;
		height: 26px;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-tertiary);
	}

	.mini-icon-button:hover {
		background: var(--surface-2);
		color: var(--text-primary);
	}

	.log-edit-form {
		flex: 1;
	}

	@media (max-width: 560px) {
		.habit-main {
			align-items: flex-start;
		}

		.habit-title-row,
		.habit-meta {
			align-items: flex-start;
			flex-direction: column;
			gap: 2px;
		}

		.row-actions {
			flex-wrap: wrap;
			justify-content: flex-end;
			max-width: 76px;
		}

		.log-row,
		.habit-log-list {
			padding-left: 0;
		}

		.log-row,
		.log-edit-form {
			flex-direction: column;
		}
	}
</style>
