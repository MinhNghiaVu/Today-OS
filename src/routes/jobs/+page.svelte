<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut, cubicIn } from 'svelte/easing';
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import { page } from '$app/stores';
	import { toast } from '$lib/toast';
	import { Briefcase, Plus, Trash2 } from 'lucide-svelte';
	import Select from '$lib/components/Select.svelte';
	import type { PageData } from './$types';
	import type { JobStatus } from '$lib/types';

	export let data: PageData;

	$: jobs = data.jobs;

	let addingNew = false;
	let editingId: string | null = null;
	let statusFormEls: Record<string, HTMLFormElement | undefined> = {};

	const statusOpts: { value: string; label: string }[] = [
		{ value: 'pending', label: 'Pending' },
		{ value: 'applied', label: 'Applied' },
		{ value: 'recruiter_screen', label: 'Recruiter Screen' },
		{ value: 'interview', label: 'Interview' },
		{ value: 'offer', label: 'Offer' },
		{ value: 'rejected', label: 'Rejected' },
		{ value: 'ghosted', label: 'Ghosted' },
		{ value: 'dropped', label: 'Dropped' }
	];

	const stageOpts: { value: string; label: string }[] = [
		{ value: '', label: '—' },
		{ value: 'first_round', label: 'First Round' },
		{ value: 'second_round', label: 'Second Round' },
		{ value: 'third_round', label: 'Third Round' },
		{ value: 'fourth_round', label: 'Fourth Round' },
		{ value: 'fifth_round', label: 'Fifth Round' }
	];

	const stageLabels: Record<string, string> = {
		first_round: 'First Round',
		second_round: 'Second Round',
		third_round: 'Third Round',
		fourth_round: 'Fourth Round',
		fifth_round: 'Fifth Round'
	};

	function formatDate(d: string | null): string {
		if (!d) return '—';
		const [y, m, day] = d.split('-').map(Number);
		return new Date(y, m - 1, day).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function showStage(status: JobStatus): boolean {
		return !['pending', 'applied'].includes(status);
	}

	$: if ($page.form?.error) {
		toast($page.form.error as string, 'error');
	}
</script>

<div class="page">
	<!-- Header -->
	<header class="page-header">
		<div class="header-left">
			<h1>Jobs</h1>
			{#if jobs.length > 0}
				<span class="count-badge">
					{jobs.length}
					{jobs.length === 1 ? 'company' : 'companies'}
				</span>
			{/if}
		</div>
		<button class="btn-primary btn-sm" on:click={() => (addingNew = true)}>
			<Plus size={15} strokeWidth={2.2} aria-hidden="true" />
			Add
		</button>
	</header>

	<!-- Add form -->
	{#if addingNew}
		<div class="add-form-wrap" transition:fly={{ y: -8, duration: 180, easing: cubicOut }}>
			<form
				method="POST"
				action="?/add"
				class="add-form"
				use:enhance={({ formElement }) =>
					async ({ result, update }) => {
						if (result.type === 'success') {
							addingNew = false;
							formElement.reset();
						}
						await update();
					}}
			>
				<!-- svelte-ignore a11y-autofocus -->
				<input
					name="company"
					type="text"
					placeholder="Company name"
					required
					autofocus
					class="field"
				/>
				<input name="role" type="text" placeholder="Role / title" class="field" />
				<button type="submit" class="btn-primary btn-sm">Add</button>
				<button type="button" class="btn-ghost btn-sm" on:click={() => (addingNew = false)}>
					Cancel
				</button>
			</form>
		</div>
	{/if}

	<!-- Table -->
	<div class="table-shell">
		<table>
			<thead>
				<tr>
					<th style="width: 18%">Company</th>
					<th style="width: 18%">Role</th>
					<th style="width: 14%">Status</th>
					<th style="width: 12%">Stage</th>
					<th style="width: 10%">Applied</th>
					<th style="width: 10%">Contact</th>
					<th>Notes</th>
					<th style="width: 36px"></th>
				</tr>
			</thead>
			<tbody>
				{#if jobs.length === 0}
					<tr class="empty-row">
						<td colspan="8">
							<div class="empty-state">
								<span class="empty-icon" aria-hidden="true">
									<Briefcase size={40} strokeWidth={1.5} />
								</span>
								<h2>No companies targeted yet</h2>
								<p>Add your first target with the + button above.</p>
							</div>
						</td>
					</tr>
				{:else}
					{#each jobs as job (job.id)}
						<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
						<tr
							class="job-row"
							class:editing={editingId === job.id}
							on:click={() => {
								editingId = editingId === job.id ? null : job.id;
							}}
							on:keydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									editingId = editingId === job.id ? null : job.id;
								}
							}}
							tabindex="0"
						>
							<td class="col-company">{job.company}</td>
							<td class="col-role">{job.role ?? '—'}</td>
							<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
							<td
								class="col-status"
								on:click|stopPropagation
								on:keydown|stopPropagation
							>
								<form
									method="POST"
									action="?/update"
									use:enhance
									bind:this={statusFormEls[job.id]}
								>
									<input type="hidden" name="id" value={job.id} />
									<div class="status-badge-wrap" data-status={job.status}>
										<Select
											name="status"
											options={statusOpts}
											value={job.status}
											on:change={() =>
												tick().then(() => statusFormEls[job.id]?.requestSubmit())}
										/>
									</div>
								</form>
							</td>
							<td class="col-stage">
								{#if showStage(job.status) && job.interview_stage}
									<span class="stage-pill">{stageLabels[job.interview_stage]}</span>
								{:else}
									<span class="col-muted">—</span>
								{/if}
							</td>
							<td class="col-secondary">{formatDate(job.applied_date)}</td>
							<td class="col-secondary">{job.contact ?? '—'}</td>
							<td class="col-notes">{job.notes ?? ''}</td>
							<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
							<td
								class="col-actions"
								on:click|stopPropagation
								on:keydown|stopPropagation
							>
								<form method="POST" action="?/remove" use:enhance>
									<input type="hidden" name="id" value={job.id} />
									<button type="submit" class="delete-btn" aria-label="Delete {job.company}">
										<Trash2 size={14} strokeWidth={2} />
									</button>
								</form>
							</td>
						</tr>

						{#if editingId === job.id}
							<tr
								class="edit-row"
								in:fly={{ y: -4, duration: 180, easing: cubicOut }}
								out:fly={{ y: -4, duration: 140, easing: cubicIn }}
							>
								<td colspan="8">
									<form
										method="POST"
										action="?/update"
										class="edit-form"
										use:enhance={() =>
											async ({ result, update }) => {
												if (result.type === 'success') {
													editingId = null;
												}
												await update();
											}}
									>
										<input type="hidden" name="id" value={job.id} />

										<div class="edit-grid">
											<div class="field-group">
												<label for="company-{job.id}"
													>Company <span class="required">*</span></label
												>
												<input
													id="company-{job.id}"
													name="company"
													type="text"
													value={job.company}
													required
													class="field"
													placeholder="Company name"
												/>
											</div>
											<div class="field-group">
												<label for="role-{job.id}">Role</label>
												<input
													id="role-{job.id}"
													name="role"
													type="text"
													value={job.role ?? ''}
													class="field"
													placeholder="Role / title"
												/>
											</div>

											<div class="field-group">
												<span class="field-label">Status</span>
												<Select name="status" options={statusOpts} value={job.status} />
											</div>
											<div class="field-group">
												<span class="field-label">Stage</span>
												<Select
													name="interview_stage"
													options={stageOpts}
													value={job.interview_stage ?? ''}
												/>
											</div>

											<div class="field-group">
												<label for="job-url-{job.id}">Job URL</label>
												<input
													id="job-url-{job.id}"
													name="job_url"
													type="url"
													value={job.job_url ?? ''}
													class="field"
													placeholder="https://…"
												/>
											</div>
											<div class="field-group">
												<label for="contact-{job.id}">Contact</label>
												<input
													id="contact-{job.id}"
													name="contact"
													type="text"
													value={job.contact ?? ''}
													class="field"
													placeholder="Recruiter / referral"
												/>
											</div>

											<div class="field-group">
												<label for="applied-date-{job.id}">Applied Date</label>
												<input
													id="applied-date-{job.id}"
													name="applied_date"
													type="date"
													value={job.applied_date ?? ''}
													class="field"
												/>
											</div>
											<div class="field-group">
												<label for="interviewer-{job.id}">Interviewer</label>
												<input
													id="interviewer-{job.id}"
													name="interviewer"
													type="text"
													value={job.interviewer ?? ''}
													class="field"
													placeholder="Interviewer name"
												/>
											</div>

											<div class="field-group full-width">
												<label for="notes-{job.id}">Notes</label>
												<textarea
													id="notes-{job.id}"
													name="notes"
													rows={3}
													class="field textarea"
													placeholder="Freeform notes…">{job.notes ?? ''}</textarea
												>
											</div>
										</div>

										<div class="edit-actions">
											<button type="submit" class="btn-primary btn-sm">Save</button>
											<button
												type="button"
												class="btn-ghost btn-sm"
												on:click={() => (editingId = null)}>Cancel</button
											>
										</div>
									</form>
								</td>
							</tr>
						{/if}
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>

<style>
	/* ── Page layout ── */
	.page {
		padding: 32px 24px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	/* ── Header ── */
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	h1 {
		font-size: 26px;
		font-weight: 600;
		color: var(--text-primary);
		letter-spacing: -0.01em;
		margin: 0;
	}

	.count-badge {
		background: var(--surface-3);
		color: var(--text-secondary);
		font-size: 12px;
		font-weight: 500;
		padding: 2px 8px;
		border-radius: var(--radius-full);
		white-space: nowrap;
	}

	/* ── Buttons ── */
	.btn-primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		background: var(--accent);
		color: var(--text-on-accent);
		border: none;
		border-radius: var(--radius-md);
		font-size: 14px;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		transition: background-color 120ms var(--ease-out);
		white-space: nowrap;
	}

	.btn-primary:hover {
		background: var(--accent-hover);
	}

	.btn-ghost {
		background: transparent;
		color: var(--text-secondary);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		font-size: 14px;
		font-weight: 400;
		font-family: inherit;
		cursor: pointer;
		transition:
			background-color 120ms var(--ease-out),
			color 120ms var(--ease-out);
		white-space: nowrap;
	}

	.btn-ghost:hover {
		background: var(--surface-2);
		color: var(--text-primary);
	}

	.btn-sm {
		height: 32px;
		padding: 0 12px;
		font-size: 13px;
	}

	/* ── Add form ── */
	.add-form-wrap {
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		padding: 12px 16px;
	}

	.add-form {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.add-form .field {
		flex: 1;
	}

	/* ── Fields ── */
	.field {
		background: var(--surface-3);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: 14px;
		font-family: inherit;
		height: 36px;
		padding: 0 10px;
		width: 100%;
		outline: none;
		transition: border-color 120ms var(--ease-out);
	}

	.field:focus {
		outline: 2px solid var(--border-focus);
		outline-offset: 0;
	}

	.field::placeholder {
		color: var(--text-tertiary);
	}

	.textarea {
		height: auto;
		padding: 8px 10px;
		resize: vertical;
		min-height: 72px;
	}

	/* ── Table shell ── */
	.table-shell {
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		overflow: hidden;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	/* ── Table head ── */
	thead th {
		padding: 10px 12px;
		font-size: 11px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-tertiary);
		text-align: left;
		border-bottom: 1px solid var(--border-subtle);
		background: var(--surface-1);
	}

	/* ── Table body rows ── */
	tbody tr.job-row {
		border-bottom: 1px solid var(--border-subtle);
		cursor: pointer;
		transition: background-color 120ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	tbody tr.job-row:last-child,
	tbody tr.job-row:has(+ tr.edit-row:last-child) {
		border-bottom: none;
	}

	tbody tr.job-row:hover,
	tbody tr.job-row.editing {
		background: var(--surface-2);
	}

	tbody tr.job-row td {
		padding: 10px 12px;
		vertical-align: middle;
	}

	/* ── Edit row ── */
	tbody tr.edit-row {
		background: var(--surface-2);
		border-bottom: 1px solid var(--border-subtle);
	}

	tbody tr.edit-row td {
		padding: 0;
	}

	/* ── Column styles ── */
	.col-company {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 0;
	}

	.col-role {
		font-size: 13px;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 0;
	}

	.col-status {
		white-space: nowrap;
	}

	.col-status form {
		display: inline-flex;
	}

	.col-stage {
		white-space: nowrap;
	}

	.col-secondary {
		font-size: 13px;
		color: var(--text-secondary);
		white-space: nowrap;
	}

	.col-notes {
		font-size: 13px;
		color: var(--text-tertiary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 0;
	}

	.col-actions {
		width: 36px;
		padding: 0 8px !important;
		text-align: center;
	}

	.col-muted {
		color: var(--text-tertiary);
		font-size: 13px;
	}

	/* ── Status badge (Select override) ── */
	.status-badge-wrap :global(.select-wrapper) {
		display: inline-flex;
	}

	.status-badge-wrap :global(.select-trigger) {
		border: none;
		border-radius: var(--radius-full);
		padding: 2px 8px;
		height: auto;
		font-size: 12px;
		font-weight: 500;
		white-space: nowrap;
		gap: 4px;
	}

	.status-badge-wrap[data-status='pending'] :global(.select-trigger) {
		background: var(--surface-3);
		color: var(--text-secondary);
	}

	.status-badge-wrap[data-status='applied'] :global(.select-trigger) {
		background: var(--warning-soft);
		color: var(--warning);
	}

	.status-badge-wrap[data-status='recruiter_screen'] :global(.select-trigger) {
		background: var(--info-soft);
		color: var(--info);
	}

	.status-badge-wrap[data-status='interview'] :global(.select-trigger) {
		background: var(--accent-soft);
		color: var(--accent);
	}

	.status-badge-wrap[data-status='offer'] :global(.select-trigger) {
		background: var(--success-soft);
		color: var(--success);
	}

	.status-badge-wrap[data-status='rejected'] :global(.select-trigger),
	.status-badge-wrap[data-status='ghosted'] :global(.select-trigger) {
		background: var(--danger-soft);
		color: var(--danger);
	}

	.status-badge-wrap[data-status='dropped'] :global(.select-trigger) {
		background: var(--surface-3);
		color: var(--text-tertiary);
	}

	/* ── Stage pill ── */
	.stage-pill {
		display: inline-block;
		background: var(--surface-2);
		color: var(--text-secondary);
		font-size: 12px;
		font-weight: 500;
		padding: 2px 8px;
		border-radius: var(--radius-full);
		white-space: nowrap;
	}

	/* ── Delete button ── */
	.delete-btn {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--danger);
		cursor: pointer;
		opacity: 0;
		transition:
			opacity 120ms var(--ease-out),
			background-color 120ms var(--ease-out);
	}

	.job-row:hover .delete-btn,
	.job-row.editing .delete-btn {
		opacity: 1;
	}

	.delete-btn:hover {
		background: var(--danger-soft);
	}

	.delete-btn:focus-visible {
		opacity: 1;
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	/* ── Edit form ── */
	.edit-form {
		padding: 16px;
	}

	.edit-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px 16px;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.field-group.full-width {
		grid-column: 1 / -1;
	}

	.field-group label,
	.field-label {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.required {
		color: var(--danger);
	}

	/* Make Select fill the field-group width in edit form */
	.edit-form :global(.select-wrapper) {
		width: 100%;
	}

	.edit-form :global(.select-trigger) {
		width: 100%;
	}

	.edit-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 16px;
		padding-top: 12px;
		border-top: 1px solid var(--border-subtle);
	}

	/* ── Empty state ── */
	.empty-row td {
		padding: 0 !important;
		border: none;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 64px 24px;
		text-align: center;
	}

	.empty-icon {
		color: var(--text-tertiary);
		display: flex;
	}

	.empty-state h2 {
		font-size: 17px;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.empty-state p {
		font-size: 14px;
		color: var(--text-secondary);
		margin: 0;
		max-width: 280px;
	}
</style>
