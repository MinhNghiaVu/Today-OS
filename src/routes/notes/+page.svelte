<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { marked } from 'marked';
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

	// Only reset edit buffers when the selected note changes, not when data refreshes
	$: if (selectedId !== prevId) {
		prevId = selectedId;
		editTitle = selected?.title ?? '';
		editContent = selected?.content ?? '';
	}

	$: preview = editContent
		? (marked.parse(editContent) as string)
		: '<p style="color:var(--muted)">Nothing to preview.</p>';

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
		// SvelteKit serializes action results — extract the newId
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
			<button class="new-btn" on:click={newNote} title="New note">+</button>
		</div>
		<ul>
			{#each sorted as note (note.id)}
				<li class:active={selectedId === note.id}>
					<button class="note-item" on:click={() => selectNote(note.id)}>
						<span class="note-item-title">{note.title || 'Untitled'}</span>
						<span class="note-item-date">{fmtDate(note.updated_at)}</span>
					</button>
				</li>
			{/each}
			{#if sorted.length === 0}
				<li class="empty-list">No notes yet.</li>
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
				/>
				<div class="tab-bar">
					<button class="tab" class:active={activeTab === 'edit'} on:click={() => (activeTab = 'edit')}>Edit</button>
					<button class="tab" class:active={activeTab === 'preview'} on:click={() => (activeTab = 'preview')}>Preview</button>
				</div>
				<button class="del-btn" on:click={deleteNote} title="Delete note">Delete</button>
			</div>

			{#if activeTab === 'edit'}
				<textarea
					class="content-input"
					bind:value={editContent}
					on:input={scheduleAutoSave}
					placeholder="Write in markdown…"
					spellcheck="false"
				></textarea>
			{:else}
				<div class="preview prose">{@html preview}</div>
			{/if}
		{:else}
			<div class="empty-editor">
				<p>Select a note or <button class="link-btn" on:click={newNote}>create one</button>.</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.page {
		display: flex;
		height: calc(100vh - 64px);
		margin: -32px;
		overflow: hidden;
	}

	.note-list {
		width: 220px;
		flex-shrink: 0;
		border-right: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.list-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 16px 12px;
		border-bottom: 1px solid var(--border);
	}

	.list-title {
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}

	.new-btn {
		width: 24px;
		height: 24px;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: transparent;
		color: var(--accent);
		font-size: 18px;
		line-height: 1;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.new-btn:hover {
		background: var(--border);
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 8px 0;
		overflow-y: auto;
		flex: 1;
	}

	li.active .note-item {
		background: var(--border);
		color: var(--text);
	}

	.note-item {
		width: 100%;
		background: transparent;
		border: none;
		padding: 8px 16px;
		text-align: left;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.note-item:hover {
		background: var(--border);
	}

	.note-item-title {
		font-size: 13px;
		font-weight: 500;
		color: var(--text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.note-item-date {
		font-size: 11px;
		color: var(--muted);
	}

	.empty-list {
		padding: 12px 16px;
		font-size: 13px;
		color: var(--muted);
	}

	.editor {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.editor-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px 24px;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}

	.title-input {
		flex: 1;
		background: transparent;
		border: none;
		color: var(--text);
		font-size: 18px;
		font-weight: 600;
		outline: none;
		min-width: 0;
	}

	.title-input::placeholder {
		color: var(--muted);
	}

	.tab-bar {
		display: flex;
		gap: 2px;
		flex-shrink: 0;
	}

	.tab {
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 5px;
		padding: 4px 12px;
		font-size: 12px;
		color: var(--muted);
		cursor: pointer;
		transition: background 0.1s, color 0.1s;
	}

	.tab:hover {
		background: var(--border);
		color: var(--text);
	}

	.tab.active {
		background: var(--accent);
		color: #fff;
		border-color: var(--accent);
	}

	.del-btn {
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 5px;
		padding: 4px 10px;
		font-size: 12px;
		color: var(--muted);
		cursor: pointer;
		flex-shrink: 0;
		transition: color 0.1s, border-color 0.1s;
	}

	.del-btn:hover {
		color: #ef4444;
		border-color: #ef4444;
	}

	.content-input {
		flex: 1;
		background: transparent;
		border: none;
		color: var(--text);
		font-size: 14px;
		line-height: 1.7;
		padding: 24px;
		outline: none;
		resize: none;
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
	}

	.content-input::placeholder {
		color: var(--muted);
	}

	.preview {
		flex: 1;
		padding: 24px;
		overflow-y: auto;
		font-size: 14px;
		line-height: 1.7;
	}

	.prose :global(h1) { font-size: 22px; font-weight: 700; margin: 0 0 12px; }
	.prose :global(h2) { font-size: 17px; font-weight: 600; margin: 20px 0 8px; }
	.prose :global(h3) { font-size: 15px; font-weight: 600; margin: 16px 0 6px; }
	.prose :global(p) { margin: 0 0 12px; }
	.prose :global(ul), .prose :global(ol) { margin: 0 0 12px; padding-left: 24px; }
	.prose :global(li) { margin: 4px 0; }
	.prose :global(code) {
		background: var(--border);
		border-radius: 3px;
		padding: 1px 5px;
		font-size: 13px;
		font-family: 'SF Mono', 'Fira Code', monospace;
	}
	.prose :global(pre) {
		background: var(--border);
		border-radius: 6px;
		padding: 12px 16px;
		overflow-x: auto;
		margin: 0 0 12px;
	}
	.prose :global(pre code) { background: none; padding: 0; }
	.prose :global(blockquote) {
		border-left: 3px solid var(--accent);
		margin: 0 0 12px;
		padding: 4px 16px;
		color: var(--muted);
	}
	.prose :global(hr) { border: none; border-top: 1px solid var(--border); margin: 16px 0; }
	.prose :global(a) { color: var(--accent); }
	.prose :global(strong) { font-weight: 600; }

	.empty-editor {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--muted);
		font-size: 14px;
	}

	.link-btn {
		background: none;
		border: none;
		color: var(--accent);
		font-size: 14px;
		cursor: pointer;
		padding: 0;
		text-decoration: underline;
	}
</style>
