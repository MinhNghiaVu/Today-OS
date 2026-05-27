<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import { cubicOut, cubicIn } from 'svelte/easing';
	import { marked } from 'marked';
	import { FileText, Trash2 } from 'lucide-svelte';
	import NoteListPane from '$lib/components/NoteListPane.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let selectedId: string | null = data.selectedId ?? data.notes[0]?.id ?? null;
	let requestedId: string | null = data.selectedId;
	let activeTab = 'edit';
	const editorTabs = [{ value: 'edit', label: 'Edit' }, { value: 'preview', label: 'Preview' }];
	let editTitle = '';
	let editContent = '';
	let saveTimer: ReturnType<typeof setTimeout>;
	let prevId: string | null = null;

	$: sorted = [...data.notes].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

	$: selected = data.notes.find((n) => n.id === selectedId) ?? null;

	$: if (data.selectedId && data.selectedId !== requestedId) {
		requestedId = selectedId = data.selectedId;
		activeTab = 'edit';
	}

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

</script>

<div class="page">
	<NoteListPane notes={sorted} {selectedId} on:select={(event) => selectNote(event.detail)} on:create={newNote} />

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
				<SegmentedControl
					options={editorTabs}
					bind:value={activeTab}
				/>
				<button class="del-btn" on:click={deleteNote} aria-label="Delete note">
					<Trash2 size={14} aria-hidden="true" />
					<span class="del-label">Delete</span>
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
		transition:
			color 120ms var(--ease-out),
			border-color 120ms var(--ease-out),
			background-color 120ms var(--ease-out);
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
		font-family: inherit;
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

	.prose :global(h1) { font-size: 22px; font-weight: 600; margin: 0 0 12px; letter-spacing: 0; }
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

	.empty-editor :global(.empty-icon) {
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
		.page {
			flex-direction: column;
			height: calc(100dvh - 56px - var(--mobile-bottom-nav-height));
		}

		.editor-header {
			flex-wrap: wrap;
			gap: 8px;
			padding: 12px 16px;
		}

		.title-input {
			flex: 1 0 100%;
			font-size: 17px;
		}

		.del-btn {
			width: 32px;
			padding: 0;
			justify-content: center;
		}

		.del-label {
			position: absolute;
			width: 1px;
			height: 1px;
			margin: -1px;
			overflow: hidden;
			clip: rect(0 0 0 0);
			white-space: nowrap;
		}

		.content-input,
		.preview {
			padding: 18px 16px 24px;
		}
	}
</style>
