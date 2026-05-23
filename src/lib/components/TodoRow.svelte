<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { cubicIn, cubicOut } from 'svelte/easing';
	import { Trash2 } from 'lucide-svelte';
	import type { TodoPriority } from '$lib/types';
	import { dateInputValue, formatShortDate, getTodoActionError, type TodoView } from '$lib/utils/todos';

	export let todo: TodoView;
	export let today: string;
	export let priorityOptions: { value: TodoPriority | ''; label: string }[];
	export let priorityLabels: Record<TodoPriority, string>;
	export let editing = false;
	export let busy = false;
	export let showDueDate = true;
	export let showDescription = true;
	export let toggleAction: string;
	export let updateAction: string;
	export let removeAction: string;
	export let setEditing: (id: string | null) => void;
	export let onToggle: (todo: TodoView) => (() => void) | void;
	export let onUpdate: (todo: TodoView, formData: FormData) => (() => void) | void;
	export let onRemove: (todo: TodoView) => (() => void) | void;
	export let onError: (message: string | null) => void = () => {};
</script>

<li
	class:done={todo.status === 'done'}
	class:busy
	aria-busy={busy}
	in:fly={{ y: -8, duration: 220, easing: cubicOut }}
	out:fly={{ y: 4, duration: 160, easing: cubicIn }}
>
	{#if editing}
		<form
			method="POST"
			action={updateAction}
			class="edit-form"
			use:enhance={({ formData }) => {
				onError(null);
				const rollback = onUpdate(todo, formData);
				return async ({ result, update }) => {
					if (result.type === 'success') setEditing(null);
					if (result.type === 'failure' || result.type === 'error') {
						rollback?.();
						onError(getTodoActionError(result, "Couldn't save task."));
					} else {
						onError(null);
					}
					await update({ reset: false });
				};
			}}
		>
			<input type="hidden" name="id" value={todo.id} />
			<input class="edit-title" name="title" value={todo.title} placeholder="Title" required />
			{#if showDescription}
				<textarea
					class="edit-desc"
					name="description"
					placeholder="Description (optional)"
					rows="2">{todo.description ?? ''}</textarea
				>
			{/if}
			<div class="edit-meta">
				<input
					type="date"
					class="meta-input"
					name="due_date"
					value={dateInputValue(todo.due_date) || today}
				/>
				<select class="meta-input" name="priority">
					{#each priorityOptions as opt}
						<option
							value={opt.value}
							selected={todo.priority === opt.value || (!todo.priority && opt.value === '')}
						>
							{opt.label}
						</option>
					{/each}
				</select>
			</div>
			<div class="edit-actions">
				<button type="submit" class="btn-primary">Save</button>
				<button type="button" class="btn-ghost" on:click={() => setEditing(null)}>Cancel</button>
			</div>
		</form>
	{:else}
		<form
			method="POST"
			action={toggleAction}
			use:enhance={() => {
				onError(null);
				const rollback = onToggle(todo);
				return async ({ result, update }) => {
					if (result.type === 'failure' || result.type === 'error') {
						rollback?.();
						onError(getTodoActionError(result, "Couldn't update task."));
					} else {
						onError(null);
					}
					await update({ reset: false });
				};
			}}
		>
			<input type="hidden" name="id" value={todo.id} />
			<input type="hidden" name="status" value={todo.status} />
			<button
				type="submit"
				class="check"
				class:checked={todo.status === 'done'}
				aria-label={todo.status === 'done' ? 'Mark pending' : 'Mark done'}
				disabled={busy}
			>
				{#if todo.status === 'done'}✓{/if}
			</button>
		</form>

		<button type="button" class="todo-body" disabled={busy} on:click={() => setEditing(todo.id)}>
			<span class="todo-main">
				<span class="todo-title">{todo.title}</span>
				{#if todo.priority}
					<span class="priority-badge priority-{todo.priority}">{priorityLabels[todo.priority]}</span>
				{/if}
				{#if showDueDate && todo.due_date}
					<span
						class="due-date"
						class:overdue={todo.status === 'pending' && dateInputValue(todo.due_date) < today}
					>
						{formatShortDate(todo.due_date)}
					</span>
				{/if}
			</span>
			{#if showDescription && todo.description}
				<span class="todo-desc">{todo.description}</span>
			{/if}
		</button>

		<div class="actions">
			<form
				method="POST"
				action={removeAction}
				use:enhance={({ cancel }) => {
					if (!confirm(`Delete "${todo.title}"?`)) {
						cancel();
						return;
					}
					onError(null);
					const rollback = onRemove(todo);
					return async ({ result, update }) => {
						if (result.type === 'failure' || result.type === 'error') {
							rollback?.();
							onError(getTodoActionError(result, "Couldn't delete task."));
						} else {
							onError(null);
						}
						await update({ reset: false });
					};
				}}
			>
				<input type="hidden" name="id" value={todo.id} />
				<button type="submit" class="act-btn danger" title="Delete" aria-label="Delete task" disabled={busy}>
					<Trash2 size={14} strokeWidth={2} />
				</button>
			</form>
		</div>
	{/if}
</li>

<style>
	li {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 48px;
		padding: 12px 16px;
		border-radius: var(--radius-md);
		transition:
			background-color 120ms var(--ease-out),
			opacity 120ms var(--ease-out);
	}

	li:hover {
		background: var(--surface-2);
	}

	li.done {
		opacity: 0.55;
	}

	li.busy {
		opacity: 0.7;
	}

	form {
		display: contents;
	}

	.check {
		width: 20px;
		height: 20px;
		border: 1.5px solid var(--border-default);
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--text-on-accent);
		font-size: 11px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition:
			background-color 120ms var(--ease-out),
			border-color 120ms var(--ease-out);
	}

	.check.checked {
		background: var(--accent);
		border-color: var(--accent);
	}

	.check:hover:not(.checked) {
		border-color: var(--accent);
	}

	.check:disabled,
	.todo-body:disabled,
	.act-btn:disabled {
		cursor: default;
		opacity: 0.65;
	}

	.todo-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		gap: 4px;
		border: none;
		background: transparent;
		padding: 0;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}

	.todo-main {
		display: flex;
		align-items: center;
		gap: 8px;
		max-width: 100%;
		min-width: 0;
		flex-wrap: wrap;
		line-height: 1.4;
	}

	.todo-title {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 14px;
		font-weight: 500;
		line-height: 1.4;
		color: var(--text-primary);
	}

	li.done .todo-title {
		color: var(--text-secondary);
		text-decoration: line-through;
	}

	.todo-desc {
		margin: 0;
		font-size: 13px;
		line-height: 1.4;
		color: var(--text-secondary);
	}

	.priority-badge {
		flex-shrink: 0;
		border-radius: var(--radius-full);
		padding: 1px 7px;
		font-size: 12px;
		font-weight: 500;
		line-height: 1.4;
	}

	.priority-high {
		background: var(--danger-soft);
		color: var(--danger);
	}

	.priority-medium {
		background: var(--warning-soft);
		color: var(--warning);
	}

	.priority-low {
		background: var(--info-soft);
		color: var(--info);
	}

	.due-date {
		flex-shrink: 0;
		font-size: 12px;
		line-height: 1.4;
		color: var(--text-secondary);
	}

	.due-date.overdue {
		color: var(--danger);
	}

	.actions {
		display: flex;
		gap: 4px;
		opacity: 0;
		transition: opacity 120ms var(--ease-out);
		flex-shrink: 0;
	}

	li:hover .actions {
		opacity: 1;
	}

	.act-btn {
		width: 28px;
		height: 28px;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-tertiary);
		font-size: 18px;
		line-height: 1;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			color 120ms var(--ease-out),
			border-color 120ms var(--ease-out),
			background-color 120ms var(--ease-out);
	}

	.act-btn:hover {
		color: var(--text-primary);
		border-color: var(--border-strong);
	}

	.act-btn.danger:hover {
		color: var(--danger);
		border-color: var(--danger);
		background: var(--danger-soft);
	}

	.edit-form {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 6px 0;
	}

	.edit-title,
	.edit-desc,
	.meta-input {
		width: 100%;
		background: var(--surface-2);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-family: inherit;
		outline: none;
		transition: border-color 120ms var(--ease-out);
	}

	.edit-title,
	.meta-input {
		height: 36px;
		padding: 0 10px;
	}

	.edit-title {
		border-color: var(--accent);
		font-size: 14px;
	}

	.edit-desc {
		min-height: 64px;
		padding: 8px 10px;
		resize: vertical;
		font-size: 13px;
		line-height: 1.4;
	}

	.meta-input {
		font-size: 13px;
	}

	button:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.edit-meta,
	.edit-actions {
		display: flex;
		gap: 8px;
	}

	.btn-primary,
	.btn-ghost {
		height: 36px;
		padding: 0 16px;
		border: none;
		border-radius: var(--radius-md);
		font-family: inherit;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition:
			background-color 120ms var(--ease-out),
			transform 120ms var(--ease-out);
	}

	.btn-primary {
		background: var(--accent);
		color: var(--text-on-accent);
	}

	.btn-primary:hover {
		background: var(--accent-hover);
	}

	.btn-primary:active {
		background: var(--accent-pressed);
		transform: translateY(1px);
	}

	.btn-ghost {
		background: var(--surface-2);
		color: var(--text-primary);
	}

	.btn-ghost:hover {
		background: var(--surface-3);
	}

	@media (max-width: 560px) {
		li {
			padding-inline: 8px;
		}

		.actions {
			opacity: 1;
		}

		.edit-meta {
			display: grid;
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}
	}
</style>
