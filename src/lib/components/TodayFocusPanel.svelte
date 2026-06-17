<script lang="ts">
	import { enhance } from '$app/forms';
	import { Star, StarOff } from 'lucide-svelte';
	import type { Todo } from '$lib/types';

	export let todos: Todo[] = [];
	export let focusAction = '?/toggleFocus';

	$: focused = todos
		.filter((t) => t.today_focus && t.status !== 'done')
		.sort((a, b) => (a.focus_order ?? 99) - (b.focus_order ?? 99));
</script>

<section class="focus-panel">
	<div class="focus-header">
		<h2>Today's priorities</h2>
		<span class="muted">{focused.length}/3</span>
	</div>

	{#if focused.length === 0}
		<p class="hint">Star up to 3 tasks to set today's top priorities.</p>
	{:else}
		<ol class="focus-list">
			{#each focused as todo (todo.id)}
				<li class:done={todo.status === 'done'}>
					<span class="focus-number">{todo.focus_order}</span>
					<span class="focus-title">{todo.title}</span>
					<form method="POST" action={focusAction} use:enhance>
						<input type="hidden" name="id" value={todo.id} />
						<input type="hidden" name="today_focus" value="false" />
						<button type="submit" class="unstar" aria-label="Remove from focus">
							<StarOff size={14} strokeWidth={2} />
						</button>
					</form>
				</li>
			{/each}
		</ol>
	{/if}
</section>

<style>
	.focus-panel {
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		padding: 16px;
		box-shadow: var(--shadow-sm);
	}

	.focus-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10px;
	}

	h2 {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
		color: var(--text-primary);
		letter-spacing: 0;
	}

	.muted {
		color: var(--text-tertiary);
		font-size: 12px;
		font-weight: 500;
	}

	.hint {
		margin: 0;
		color: var(--text-tertiary);
		font-size: 13px;
	}

	.focus-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.focus-list li {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		border-radius: var(--radius-md);
		background: var(--surface-2);
		transition: opacity 160ms var(--ease-out);
	}

	.focus-list li.done {
		opacity: 0.45;
	}

	.focus-number {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: var(--radius-full);
		background: var(--accent);
		color: var(--text-on-accent);
		font-size: 12px;
		font-weight: 600;
		flex-shrink: 0;
	}

	.focus-title {
		flex: 1;
		min-width: 0;
		color: var(--text-primary);
		font-size: 13px;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.unstar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-tertiary);
		cursor: pointer;
		flex-shrink: 0;
		transition: background-color 120ms var(--ease-out), color 120ms var(--ease-out);
	}

	.unstar:hover {
		background: var(--surface-3);
		color: var(--accent);
	}

	button:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	@media (max-width: 640px) {
		.focus-panel {
			padding: 14px;
		}

		.focus-list li {
			padding: 10px;
		}
	}
</style>