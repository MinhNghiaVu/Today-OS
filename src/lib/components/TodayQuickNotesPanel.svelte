<script lang="ts">
	import { enhance } from '$app/forms';
	import { ChevronRight, FileText } from 'lucide-svelte';
	import { getActionData } from '$lib/utils/optimistic';
	import { noteTitleFromContent } from '$lib/utils/capture';
	import type { Note } from '$lib/types';

	export let notes: Note[] = [];
	export let today: string;

	let noteContent = '';
	let optimisticNoteSeq = 0;

	$: notesPreview = notes.slice(0, 3);

	function makeOptimisticNote(content: string): Note {
		const now = new Date().toISOString();
		optimisticNoteSeq += 1;
		return {
			id: `optimistic-note-${Date.now()}-${optimisticNoteSeq}`,
			user_id: 'optimistic',
			title: noteTitleFromContent(content),
			content,
			type: 'note',
			date: today,
			created_at: now,
			updated_at: now
		};
	}

	function getNoteFromResult(result: unknown): Note | null {
		const note = getActionData(result)?.note;
		return note && typeof note === 'object' && 'id' in note ? (note as Note) : null;
	}

	function formatNoteTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}
</script>

<section class="panel">
	<div class="panel-heading">
		<div>
			<h2>Quick notes</h2>
		</div>
		<a href="/notes" class="panel-link">
			Open
			<ChevronRight size={14} strokeWidth={2} />
		</a>
	</div>

	<form
		method="POST"
		action="?/addNote"
		class="note-form"
		use:enhance={({ formData }) => {
			const content = String(formData.get('content') ?? '').trim();
			const optimistic = content ? makeOptimisticNote(content) : null;
			if (optimistic) notes = [optimistic, ...notes];
			noteContent = '';
			return async ({ result }) => {
				if (result.type === 'failure' || result.type === 'error') {
					if (optimistic) notes = notes.filter((note) => note.id !== optimistic.id);
					return;
				}
				const serverNote = getNoteFromResult(result);
				if (optimistic && serverNote) {
					notes = notes.map((note) => note.id === optimistic.id ? serverNote : note);
				}
			};
		}}
	>
		<textarea
			name="content"
			bind:value={noteContent}
			placeholder="Jot something down..."
			rows="4"
			aria-label="Quick note"
		></textarea>
		<button type="submit" class="note-submit">
			<FileText size={15} strokeWidth={2} aria-hidden="true" />
			Save note
		</button>
	</form>

	{#if notesPreview.length > 0}
		<ul class="note-list">
			{#each notesPreview as note}
				<li>
					<span class="note-title">{note.title || 'Untitled'}</span>
					<span class="note-meta">{formatNoteTime(note.updated_at)}</span>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="hint">No notes attached to today yet.</p>
	{/if}
</section>

<style>
	.panel {
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		padding: 18px;
		box-shadow: var(--shadow-sm);
	}

	.panel-heading {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 14px;
	}

	h2 {
		margin: 2px 0 0;
		color: var(--text-primary);
		font-size: 16px;
		font-weight: 600;
		letter-spacing: 0;
		line-height: 1.3;
	}

	.panel-link {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		margin-top: 2px;
		color: var(--text-secondary);
		font-size: 13px;
		font-weight: 500;
		transition: color 120ms var(--ease-out);
	}

	.panel-link:hover {
		color: var(--text-primary);
	}

	.note-form {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	textarea {
		width: 100%;
		min-height: 104px;
		resize: vertical;
		padding: 11px 12px;
		background: var(--surface-2);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-family: inherit;
		font-size: 14px;
		line-height: 1.5;
		outline: none;
		transition:
			border-color 120ms var(--ease-out),
			background-color 120ms var(--ease-out);
	}

	textarea::placeholder {
		color: var(--text-tertiary);
	}

	textarea:hover {
		border-color: var(--border-strong);
	}

	.note-submit {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		height: 36px;
		border: none;
		border-radius: var(--radius-md);
		background: var(--accent);
		color: var(--text-on-accent);
		cursor: pointer;
		font-size: 14px;
		font-weight: 500;
		transition:
			background-color 120ms var(--ease-out),
			transform 120ms var(--ease-out);
	}

	.note-submit:hover {
		background: var(--accent-hover);
	}

	.note-submit:active {
		background: var(--accent-pressed);
		transform: translateY(1px);
	}

	.note-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		list-style: none;
		margin: 14px 0 0;
		padding: 0;
	}

	.note-list li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 9px 10px;
		border-radius: var(--radius-md);
		background: var(--surface-2);
	}

	.note-title {
		overflow: hidden;
		color: var(--text-primary);
		font-size: 13px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.note-meta {
		flex-shrink: 0;
		color: var(--text-tertiary);
		font-size: 12px;
	}

	.hint {
		margin: 12px 0 0;
		color: var(--text-tertiary);
		font-size: 13px;
	}

	button:focus-visible,
	a:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	@media (max-width: 640px) {
		.panel {
			padding: 14px;
		}

		.panel-heading {
			align-items: flex-start;
			flex-direction: column;
			gap: 4px;
		}
	}
</style>
