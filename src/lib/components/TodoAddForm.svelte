<script lang="ts">
	import { enhance } from '$app/forms';
	import { Plus } from 'lucide-svelte';
	import Select from '$lib/components/Select.svelte';
	import type { TodoPriority } from '$lib/types';
	import type { OptimisticMutation } from '$lib/utils/optimistic';
	import { getTodoActionError } from '$lib/utils/todos';

	export let action: string;
	export let today: string;
	export let priorityOptions: { value: TodoPriority | ''; label: string }[];
	export let compact = false;
	export let onAdd: (formData: FormData) => OptimisticMutation | void;
	export let onError: (message: string | null) => void = () => {};

	let title = '';

	function handleAdd(formData: FormData): OptimisticMutation | void {
		const mutation = onAdd?.(formData);
		title = '';
		return mutation;
	}
</script>

<form
	method="POST"
	{action}
	class:compact
	class="todo-add-form"
	use:enhance={({ formData, formElement }) => {
		onError(null);
		const mutation = handleAdd(formData);
		if (compact) {
			formElement.reset();
			title = '';
		} else {
			formElement.reset();
		}
		return async ({ result, update }) => {
			if (result.type === 'failure' || result.type === 'error') {
				mutation?.rollback();
				onError(getTodoActionError(result, "Couldn't add task."));
			} else {
				mutation?.reconcile?.(result);
				onError(null);
			}
			await update({ reset: false });
			mutation?.settle?.();
		};
	}}
>
	<input
		class="todo-add-title"
		bind:value={title}
		name="title"
		placeholder={compact ? 'Add the next thing...' : 'Add a task…'}
		autocomplete="off"
		aria-label={compact ? 'New task' : undefined}
		required
	/>

	{#if compact}
		<button type="submit" class="icon-button primary" aria-label="Add task">
			<Plus size={17} strokeWidth={2.2} />
		</button>
	{:else}
		<div class="todo-add-meta">
			<input type="date" class="meta-input" name="due_date" value={today} aria-label="Due date" />
			<Select name="priority" options={priorityOptions} />
			<button type="submit" class="btn-primary">Add</button>
		</div>
	{/if}
</form>

<style>
	.todo-add-form {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.todo-add-form.compact {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 38px;
		gap: 8px;
	}

	.todo-add-title,
	.meta-input {
		width: 100%;
		background: var(--surface-2);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-family: inherit;
		outline: none;
		transition:
			border-color 120ms var(--ease-out),
			background-color 120ms var(--ease-out);
	}

	.todo-add-title {
		height: 36px;
		padding: 0 12px;
		font-size: 14px;
	}

	.todo-add-form.compact .todo-add-title {
		height: 38px;
	}

	.todo-add-title::placeholder {
		color: var(--text-tertiary);
	}

	.todo-add-title:hover,
	.meta-input:hover {
		border-color: var(--border-strong);
	}

	button:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.todo-add-meta {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.meta-input {
		height: 36px;
		padding: 0 10px;
		font-size: 13px;
	}

	.btn-primary,
	.icon-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: var(--radius-md);
		background: var(--accent);
		color: var(--text-on-accent);
		font-family: inherit;
		font-weight: 500;
		cursor: pointer;
		transition:
			background-color 120ms var(--ease-out),
			transform 120ms var(--ease-out);
	}

	.btn-primary {
		height: 36px;
		padding: 0 16px;
		font-size: 13px;
		white-space: nowrap;
	}

	.icon-button {
		width: 38px;
		height: 38px;
	}

	.btn-primary:hover,
	.icon-button:hover {
		background: var(--accent-hover);
	}

	.btn-primary:active,
	.icon-button:active {
		background: var(--accent-pressed);
		transform: translateY(1px);
	}

	@media (min-width: 720px) {
		.todo-add-form:not(.compact) {
			display: grid;
			grid-template-columns: minmax(220px, 1fr) auto;
			align-items: center;
		}

		.todo-add-form:not(.compact) .todo-add-meta {
			min-width: max-content;
		}

		.todo-add-form:not(.compact) .meta-input {
			width: 132px;
		}
	}

	@media (max-width: 560px) {
		.todo-add-meta {
			display: grid;
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}

		.todo-add-meta .btn-primary {
			grid-column: 1 / -1;
			width: 100%;
		}
	}
</style>
