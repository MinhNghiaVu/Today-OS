<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import { cubicOut, cubicIn } from 'svelte/easing';
	import { marked } from 'marked';
	import { FileText, Plus, Trash2 } from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let selectedId: string | null = data.notes[0]?.id ?? null;
	let activeTab: 'edit' | 'preview' = 'edit';
	let editTitle = '';
	let editContent = '';
	let saveTimer: ReturnType<typeof setTimeout>;
	let prevId: string | null = null;

	$: sorted = [...data.notes].sort(
		(a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
	);

	$: selected = data.notes.find((n) => n.id === selectedId) ?? null;

	$: if (selectedId !== prevId) {
		prevId = selectedId;
		editTitle = selected?.title ?? '';
		editContent = selected?.content ?? '';
	}

	$: preview = editContent
		? (marked.parse(editContent) as string)
		: '<p style="color:var(--text-tertiary)">Nothing to preview.</p>';

	function selectNote(id: string) {
		if (selectedId !== id) {
			selectedId = id;
			activeTab = 'edit';
		}
	}

	async function newNote() {
		const form = new FormData();
		const res = await fetch('?/add', { method: 'POST', body: form });
		const result = await res.json();
		const newId = result?.data?.newId ?? null;
		await invalidateAll();
		if (newId) {
			selectedId = newId;
			activeTab = 'edit';
		}
	}

	function scheduleAutoSave() {
		clearTimeout(saveTimer);
		if (!selectedId) return;
		saveTimer = setTimeout(async () => {
			const form = new FormData();
			form.set('id', selectedId!);
			form.set('title', editTitle);
			form.set('content', editContent);
			await fetch('?/update', { method: 'POST', body: form });
			await invalidateAll();
		}, 800);
	}

	async function deleteNote() {
		if (!selected) return;
		if (!confirm(`Delete "${selected.title || 'Untitled'}"?`)) return;

		const form = new FormData();
		form.set('id', selected.id);
		await fetch('?/remove', { method: 'POST', body: form });
		await invalidateAll();

		const remaining = data.notes.filter((n) => n.id !== selected!.id);
		selectedId = remaining[0]?.id ?? null;
	}

	function fmtDate(iso: string) {
		const d = new Date(iso);
		const diff = Date.now() - d.getTime();
		if (diff < 60_000) return 'just now';
		if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
		if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
</script>

<div class="page">
	<aside class="note-list">
		<div class="list-header">
			<span class="list-title">Notes</span>
			<button class="new-btn" on:click={newNote} aria-label="New note">
				<Plus size={16} aria-hidden="true" />
			</button>
		</div>
		<ul>
			{#each sorted as note (note.id)}
				<li transition:fly={{ y: -4, duration: 180, easing: cubicOut }}>
					<button
						class="note-item"
						class:active={selectedId === note.id}
						on:click={() => selectNote(note.id)}
					>
						<span class="note-item-title">{note.title || 'Untitled'}</span>
						<span class="note-item-date">{fmtDate(note.updated_at)}</span>
					</button>
				</li>
			{/each}
			{#if sorted.length === 0}
				<li class="empty-list">
					<FileText size={32} class="empty-icon" aria-hidden="true" />
					<p class="empty-title">No notes yet</p>
					<p class="empty-desc">Create your first note to get started</p>
					<button class="empty-cta" on:click={newNote}>New note</button>
				</li>
			{/if}
		</ul>
	</aside>

	<div class="editor">
		{#if selected}
			<div class="editor-header">
				<input
					class="title-input"
					bind:value={editTitle}
					on:input={scheduleAutoSave}
					placeholder="Untitled"
					aria-label="Note title"
				/>
				<div class="seg-track" role="tablist" aria-label="Editor mode">
					<div class="seg-indicator" class:at-preview={activeTab === 'preview'}></div>
					<button
						role="tab"
						aria-selected={activeTab === 'edit'}
						class="seg-tab"
						class:active={activeTab === 'edit'}
						on:click={() => (activeTab = 'edit')}
					>Edit</button>
					<button
						role="tab"
						aria-selected={activeTab === 'preview'}
						class="seg-tab"
						class:active={activeTab === 'preview'}
						on:click={() => (activeTab = 'preview')}
					>Preview</button>
				</div>
				<button class="del-btn" on:click={deleteNote} aria-label="Delete note">
					<Trash2 size={14} aria-hidden="true" />
					Delete
				</button>
			</div>

			{#key selectedId}
				<div
					class="editor-body"
					in:fly={{ y: 6, duration: 200, easing: cubicOut }}
					out:fly={{ y: -4, duration: 140, easing: cubicIn }}
				>
					{#if activeTab === 'edit'}
						<textarea
							class="content-input"
							bind:value={editContent}
							on:input={scheduleAutoSave}
							placeholder="Write in markdown…"
							spellcheck="false"
							aria-label="Note content"
						></textarea>
					{:else}
						<div class="preview prose">{@html preview}</div>
					{/if}
				</div>
			{/key}
		{:else}
			<div class="empty-editor">
				<FileText size={40} class="empty-icon" aria-hidden="true" />
				<p class="empty-title">No note selected</p>
				<p class="empty-desc">Select a note from the list or create a new one</p>
				<button class="empty-cta" on:click={newNote}>New note</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.page {
		display: flex;
		height: 100vh;
		margin: 0;
		overflow: hidden;
	}

	/* ─── Note list ─────────────────────────────────────── */

	.note-list {
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
		font-size: 11px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-tertiary);
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
		transition: background 120ms var(--ease-out), color 120ms var(--ease-out);
	}

	.new-btn:hover {
		background: var(--surface-2);
		color: var(--text-primary);
	}

	.new-btn:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 6px 0;
		overflow-y: auto;
		flex: 1;
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
		transition: background 120ms var(--ease-out);
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
		font-size: 13px;
		font-weight: 500;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.note-item-date {
		font-size: 12px;
		color: var(--text-tertiary);
	}

	/* Empty list state §8.12 */
	.empty-list {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 32px 16px;
		gap: 8px;
	}

	/* ─── Editor ─────────────────────────────────────────── */

	.editor {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-width: 0;
	}

	.editor-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 24px;
		border-bottom: 1px solid var(--border-subtle);
		flex-shrink: 0;
	}

	.title-input {
		flex: 1;
		background: transparent;
		border: none;
		color: var(--text-primary);
		font-size: 18px;
		font-weight: 600;
		font-family: inherit;
		outline: none;
		min-width: 0;
	}

	.title-input::placeholder {
		color: var(--text-tertiary);
	}

	/* Segmented control §8.9 */
	.seg-track {
		position: relative;
		display: flex;
		background: var(--surface-2);
		border-radius: var(--radius-full);
		padding: 3px;
		flex-shrink: 0;
	}

	.seg-indicator {
		position: absolute;
		top: 3px;
		left: 3px;
		width: calc(50% - 3px);
		height: calc(100% - 6px);
		background: var(--surface-overlay);
		border-radius: var(--radius-full);
		box-shadow: var(--shadow-sm);
		transition: transform 200ms var(--ease-out);
		pointer-events: none;
	}

	.seg-indicator.at-preview {
		transform: translateX(100%);
	}

	.seg-tab {
		position: relative;
		z-index: 1;
		flex: 1;
		border: none;
		background: transparent;
		color: var(--text-secondary);
		font-size: 13px;
		font-weight: 500;
		padding: 0 14px;
		height: 28px;
		border-radius: var(--radius-full);
		cursor: pointer;
		transition: color 120ms var(--ease-out);
		white-space: nowrap;
	}

	.seg-tab.active {
		color: var(--text-primary);
	}

	.seg-tab:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.del-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		padding: 0 12px;
		height: 32px;
		font-size: 13px;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		flex-shrink: 0;
		transition: color 120ms var(--ease-out), border-color 120ms var(--ease-out), background 120ms var(--ease-out);
	}

	.del-btn:hover {
		color: var(--danger);
		border-color: var(--danger);
		background: var(--danger-soft);
	}

	.del-btn:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	/* Editor body — keyed for transition */
	.editor-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.content-input {
		flex: 1;
		background: transparent;
		border: none;
		color: var(--text-primary);
		font-size: 15px;
		line-height: 1.6;
		padding: 24px;
		outline: none;
		resize: none;
		font-family: inherit; /* Inter, not mono */
	}

	.content-input::placeholder {
		color: var(--text-tertiary);
	}

	.preview {
		flex: 1;
		padding: 24px;
		overflow-y: auto;
		font-size: 15px;
		line-height: 1.6;
	}

	/* Prose styles — only inline <code> and <pre> use mono */
	.prose :global(h1) { font-size: 22px; font-weight: 600; margin: 0 0 12px; letter-spacing: -0.01em; }
	.prose :global(h2) { font-size: 17px; font-weight: 600; margin: 20px 0 8px; }
	.prose :global(h3) { font-size: 15px; font-weight: 600; margin: 16px 0 6px; }
	.prose :global(p) { margin: 0 0 12px; }
	.prose :global(ul), .prose :global(ol) { margin: 0 0 12px; padding-left: 24px; }
	.prose :global(li) { margin: 4px 0; }
	.prose :global(code) {
		background: var(--surface-3);
		border-radius: var(--radius-xs);
		padding: 1px 5px;
		font-size: 13px;
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace;
	}
	.prose :global(pre) {
		background: var(--surface-3);
		border-radius: var(--radius-md);
		padding: 12px 16px;
		overflow-x: auto;
		margin: 0 0 12px;
	}
	.prose :global(pre code) { background: none; padding: 0; font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace; }
	.prose :global(blockquote) {
		border-left: 3px solid var(--accent);
		margin: 0 0 12px;
		padding: 4px 16px;
		color: var(--text-secondary);
	}
	.prose :global(hr) { border: none; border-top: 1px solid var(--border-subtle); margin: 16px 0; }
	.prose :global(a) { color: var(--accent); }
	.prose :global(strong) { font-weight: 600; }

	/* Empty states §8.12 */
	.empty-editor {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		text-align: center;
		padding: 32px;
	}

	.empty-editor :global(.empty-icon),
	.empty-list :global(.empty-icon) {
		color: var(--text-tertiary);
		margin-bottom: 4px;
	}

	.empty-title {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
		color: var(--text-primary);
	}

	.empty-desc {
		margin: 0;
		font-size: 14px;
		color: var(--text-secondary);
		max-width: 280px;
	}

	.empty-list .empty-title {
		font-size: 13px;
	}

	.empty-list .empty-desc {
		font-size: 12px;
	}

	.empty-cta {
		margin-top: 4px;
		background: var(--accent);
		color: var(--text-on-accent);
		border: none;
		border-radius: var(--radius-md);
		padding: 0 16px;
		height: 36px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: background 120ms var(--ease-out), transform 120ms var(--ease-out);
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

	.empty-list .empty-cta {
		height: 28px;
		font-size: 13px;
		padding: 0 12px;
	}
</style>
