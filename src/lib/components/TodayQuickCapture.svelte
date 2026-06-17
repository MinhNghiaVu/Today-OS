<script lang="ts">
	import { enhance } from '$app/forms';
	import { Briefcase, ClipboardPlus, FileText, NotebookPen, Plus, Target } from 'lucide-svelte';
	import HabitIcon from '$lib/components/HabitIcon.svelte';
	import { captureActionError } from '$lib/utils/capture';
	import type { HabitWithTodayLogs } from '$lib/types';

	export let habits: HabitWithTodayLogs[] = [];
	export let today: string;
	export let addTodoAction = '?/addTodo';
	export let addNoteAction = '?/addNote';
	export let logHabitAction = '?/logHabit';
	export let addJobAction = '?/addJob';

	type CaptureMode = 'task' | 'note' | 'habit' | 'job';

	let mode: CaptureMode = 'task';
	let taskTitle = '';
	let noteContent = '';
	let habitId = '';
	let habitValue = '';
	let jobCompany = '';
	let jobRole = '';
	let errorMessage: string | null = null;

	$: if (!habitId && habits[0]) habitId = habits[0].id;
	$: selectedHabit = habits.find((habit) => habit.id === habitId) ?? habits[0] ?? null;

	function clearError() {
		errorMessage = null;
	}

	function setMode(next: CaptureMode) {
		mode = next;
		clearError();
	}

	function handleFailure(result: unknown, fallback: string) {
		errorMessage = captureActionError(result, fallback);
	}
</script>

<section class="capture-panel" aria-label="Quick capture">
	<div class="capture-tabs" role="tablist" aria-label="Quick capture type">
		<button type="button" class:selected={mode === 'task'} on:click={() => setMode('task')}>
			<ClipboardPlus size={15} strokeWidth={2} aria-hidden="true" />
			Task
		</button>
		<button type="button" class:selected={mode === 'note'} on:click={() => setMode('note')}>
			<NotebookPen size={15} strokeWidth={2} aria-hidden="true" />
			Note
		</button>
		<button type="button" class:selected={mode === 'habit'} on:click={() => setMode('habit')}>
			<Target size={15} strokeWidth={2} aria-hidden="true" />
			Habit
		</button>
		<button type="button" class:selected={mode === 'job'} on:click={() => setMode('job')}>
			<Briefcase size={15} strokeWidth={2} aria-hidden="true" />
			Job
		</button>
	</div>

	{#if errorMessage}
		<p class="capture-error" role="alert">{errorMessage}</p>
	{/if}

	{#if mode === 'task'}
		<form
			method="POST"
			action={addTodoAction}
			class="capture-form inline-form"
			use:enhance={() => {
				clearError();
				return async ({ result, update }) => {
					if (result.type === 'failure' || result.type === 'error') {
						handleFailure(result, "Couldn't add task.");
						return;
					}
					taskTitle = '';
					clearError();
					await update();
				};
			}}
		>
			<input name="title" bind:value={taskTitle} placeholder="Add to today..." aria-label="Task title" required />
			<input type="hidden" name="due_date" value={today} />
			<button type="submit" aria-label="Add task">
				<Plus size={17} strokeWidth={2.2} />
			</button>
		</form>
	{:else if mode === 'note'}
		<form
			method="POST"
			action={addNoteAction}
			class="capture-form"
			use:enhance={() => {
				clearError();
				return async ({ result, update }) => {
					if (result.type === 'failure' || result.type === 'error') {
						handleFailure(result, "Couldn't save note.");
						return;
					}
					noteContent = '';
					clearError();
					await update();
				};
			}}
		>
			<textarea
				name="content"
				bind:value={noteContent}
				placeholder="Dump the thought before it disappears..."
				rows="3"
				required
			></textarea>
			<button type="submit">
				<FileText size={15} strokeWidth={2} aria-hidden="true" />
				Save note
			</button>
		</form>
	{:else if mode === 'habit'}
		<form
			method="POST"
			action={logHabitAction}
			class="capture-form habit-capture"
			use:enhance={() => {
				clearError();
				return async ({ result, update }) => {
					if (result.type === 'failure' || result.type === 'error') {
						handleFailure(result, "Couldn't log habit.");
						return;
					}
					habitValue = '';
					clearError();
					await update();
				};
			}}
		>
			{#if habits.length === 0}
				<p class="capture-hint">Add a habit first, then log it here without leaving Today.</p>
			{:else}
				<div class="habit-select-row">
					<label>
						<span>Habit</span>
						<select name="habit_id" bind:value={habitId}>
							{#each habits as habit}
								<option value={habit.id}>{habit.name}</option>
							{/each}
						</select>
					</label>
					{#if selectedHabit}
						<div class="selected-habit" style="color: {selectedHabit.color}">
							<HabitIcon icon={selectedHabit.icon} />
						</div>
					{/if}
				</div>
				<input type="hidden" name="date" value={today} />
				<div class="inline-form">
					<input
						name="value"
						type="text"
						inputmode="decimal"
						bind:value={habitValue}
						placeholder={selectedHabit ? `Amount in ${selectedHabit.unit}` : 'Amount'}
						required
					/>
					<button type="submit" aria-label="Log habit">
						<Plus size={17} strokeWidth={2.2} />
					</button>
				</div>
			{/if}
		</form>
	{:else}
		<form
			method="POST"
			action={addJobAction}
			class="capture-form"
			use:enhance={() => {
				clearError();
				return async ({ result, update }) => {
					if (result.type === 'failure' || result.type === 'error') {
						handleFailure(result, "Couldn't save job lead.");
						return;
					}
					jobCompany = '';
					jobRole = '';
					clearError();
					await update();
				};
			}}
		>
			<div class="job-fields">
				<label>
					<span>Company</span>
					<input name="company" bind:value={jobCompany} placeholder="e.g. Acme" required />
				</label>
				<label>
					<span>Role</span>
					<input name="role" bind:value={jobRole} placeholder="Optional role title" />
				</label>
			</div>
			<button type="submit">
				<Briefcase size={15} strokeWidth={2} aria-hidden="true" />
				Save lead
			</button>
		</form>
	{/if}
</section>

<style>
	.capture-panel {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 18px;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-subtle);
		background: var(--surface-1);
		box-shadow: var(--shadow-sm);
	}

	.capture-tabs {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 4px;
		padding: 4px;
		border-radius: var(--radius-lg);
		background: var(--surface-2);
	}

	.capture-tabs button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-height: 34px;
		border: none;
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--text-secondary);
		font: inherit;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		padding: 0 6px;
	}

	.capture-tabs button.selected {
		background: var(--surface-3);
		color: var(--text-primary);
	}

	.capture-error {
		margin: 0;
		padding: 8px 10px;
		border-radius: var(--radius-md);
		background: var(--danger-soft);
		color: var(--danger);
		font-size: 13px;
	}

	.capture-hint {
		margin: 0;
		color: var(--text-secondary);
		font-size: 13px;
	}

	.capture-form {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.inline-form {
		display: flex;
		gap: 8px;
	}

	.job-fields {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
	}

	.job-fields label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		color: var(--text-tertiary);
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	input,
	select,
	textarea {
		width: 100%;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		background: var(--surface-2);
		color: var(--text-primary);
		font-family: inherit;
		font-size: 14px;
		outline: none;
		transition:
			background-color 120ms var(--ease-out),
			border-color 120ms var(--ease-out);
	}

	input,
	select {
		height: 40px;
		padding: 0 12px;
	}

	textarea {
		min-height: 86px;
		resize: vertical;
		padding: 10px 12px;
		line-height: 1.5;
	}

	input::placeholder,
	textarea::placeholder {
		color: var(--text-tertiary);
	}

	input:hover,
	select:hover,
	textarea:hover {
		border-color: var(--border-strong);
	}

	.capture-form button[type='submit'],
	.inline-form button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		min-width: 40px;
		height: 40px;
		border: none;
		border-radius: var(--radius-md);
		background: var(--accent);
		color: var(--text-on-accent);
		font: inherit;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition:
			background-color 120ms var(--ease-out),
			transform 120ms var(--ease-out);
	}

	.capture-form button[type='submit']:hover:not(:disabled),
	.inline-form button:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.capture-form button:disabled,
	.inline-form button:disabled {
		cursor: not-allowed;
		opacity: 0.45;
	}

	.habit-select-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 40px;
		gap: 8px;
		align-items: end;
	}

	.habit-select-row label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		color: var(--text-tertiary);
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.selected-habit {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-md);
		background: var(--surface-2);
	}

	button:focus-visible,
	input:focus-visible,
	select:focus-visible,
	textarea:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	@media (max-width: 640px) {
		.capture-tabs {
			grid-template-columns: repeat(2, 1fr);
		}

		.job-fields {
			grid-template-columns: 1fr;
		}
	}
</style>
