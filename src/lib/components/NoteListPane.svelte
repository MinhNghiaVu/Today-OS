<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { FileText, Plus } from 'lucide-svelte';
	import type { Note } from '$lib/types';

	export let notes: Note[] = [];
	export let selectedId: string | null = null;

	const dispatch = createEventDispatcher<{ select: string; create: void }>();

	function fmtDate(iso: string) {
		const d = new Date(iso);
		const diff = Date.now() - d.getTime();
		if (diff < 60_000) return 'just now';
		if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
		if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
</script>

<aside class="note-list-pane" aria-label="Notes">
	<div class="list-header">
		<span class="list-title">Notes</span>
		<button class="new-btn" on:click={() => dispatch('create')} aria-label="New note">
			<Plus size={16} aria-hidden="true" />
		</button>
	</div>
	<ul class="list-scroll">
		{#each notes as note (note.id)}
			<li class="note-row" transition:fly={{ y: -4, duration: 180, easing: cubicOut }}>
				<button
					class="note-item"
					class:active={selectedId === note.id}
					on:click={() => dispatch('select', note.id)}
				>
					<span class="note-item-title">{note.title || 'Untitled'}</span>
					<span class="note-item-date">{fmtDate(note.updated_at)}</span>
				</button>
			</li>
		{/each}
		{#if notes.length === 0}
			<li class="empty-list">
				<FileText size={32} class="empty-icon" aria-hidden="true" />
				<p class="empty-title">No notes yet</p>
				<p class="empty-desc">Create your first note to get started</p>
				<button class="empty-cta" on:click={() => dispatch('create')}>New note</button>
			</li>
		{/if}
	</ul>
</aside>

<style>
	.note-list-pane {
		width: 240px;
		flex-shrink: 0;
		border-right: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: var(--surface-1);
	}

	.list-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 16px 12px;
		border-bottom: 1px solid var(--border-subtle);
		flex-shrink: 0;
	}

	.list-title {
		color: var(--text-tertiary);
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.new-btn {
		width: 28px;
		height: 28px;
		border: none;
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			background-color 120ms var(--ease-out),
			color 120ms var(--ease-out);
	}

	.new-btn:hover {
		background: var(--surface-2);
		color: var(--text-primary);
	}

	.new-btn:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.list-scroll {
		flex: 1;
		list-style: none;
		margin: 0;
		overflow-y: auto;
		padding: 6px 0;
	}

	.note-item {
		width: 100%;
		background: transparent;
		border: none;
		padding: 10px 16px;
		text-align: left;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 3px;
		transition: background-color 120ms var(--ease-out);
	}

	.note-item:hover {
		background: var(--surface-2);
	}

	.note-item.active {
		background: var(--surface-3);
	}

	.note-item:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: -2px;
	}

	.note-item-title {
		overflow: hidden;
		color: var(--text-primary);
		font-size: 13px;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.note-item-date {
		color: var(--text-tertiary);
		font-size: 12px;
	}

	.empty-list {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 32px 16px;
		text-align: center;
	}

	.empty-list :global(.empty-icon) {
		color: var(--text-tertiary);
		margin-bottom: 4px;
	}

	.empty-title {
		margin: 0;
		color: var(--text-primary);
		font-size: 13px;
		font-weight: 600;
	}

	.empty-desc {
		max-width: 280px;
		margin: 0;
		color: var(--text-secondary);
		font-size: 12px;
	}

	.empty-cta {
		margin-top: 4px;
		height: 28px;
		border: none;
		border-radius: var(--radius-md);
		background: var(--accent);
		color: var(--text-on-accent);
		cursor: pointer;
		font-size: 13px;
		font-weight: 500;
		padding: 0 12px;
		transition:
			background-color 120ms var(--ease-out),
			transform 120ms var(--ease-out);
	}

	.empty-cta:hover {
		background: var(--accent-hover);
	}

	.empty-cta:active {
		background: var(--accent-pressed);
		transform: translateY(1px);
	}

	.empty-cta:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	@media (max-width: 760px) {
		.note-list-pane {
			width: 100%;
			max-height: 132px;
			border-right: none;
			border-bottom: 1px solid var(--border-subtle);
		}

		.list-header {
			padding: 10px 12px 4px;
			border-bottom: none;
		}

		.list-scroll {
			flex: none;
			display: flex;
			gap: 8px;
			overflow-x: auto;
			overflow-y: hidden;
			padding: 6px 12px 10px;
			scrollbar-width: none;
		}

		.list-scroll::-webkit-scrollbar {
			display: none;
		}

		.note-row {
			flex: 0 0 min(164px, 44vw);
		}

		.note-item {
			min-height: 58px;
			border-radius: var(--radius-lg);
			background: var(--surface-2);
			padding: 10px 12px;
		}

		.note-item.active {
			background: var(--surface-3);
			box-shadow: inset 0 0 0 1px var(--border-strong);
		}

		.empty-list {
			flex: 1 0 100%;
			padding: 16px;
		}
	}
</style>
