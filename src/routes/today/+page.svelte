<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Activity,
		CalendarDays,
		ChevronRight,
		Clock3,
		FileText,
	} from 'lucide-svelte';
	import HabitProgressList from '$lib/components/HabitProgressList.svelte';
	import TodoList from '$lib/components/TodoList.svelte';
	import { isHabitOnTrack } from '$lib/utils/habits';
	import { getActionData } from '$lib/utils/optimistic';
	import type { TodoStats } from '$lib/utils/todos';
	import type { PageData } from './$types';
	import type { HabitWithTodayLogs, Note } from '$lib/types';

	export let data: PageData;

	const dateLabel = new Date().toLocaleDateString('en-AU', {
		weekday: 'long',
		month: 'long',
		day: 'numeric'
	});

	const todayStr = new Date().toISOString().slice(0, 10);

	let noteContent = '';
	let habitTotals: HabitWithTodayLogs[] = data.habitTotals;
	let notesToday: Note[] = data.notesToday;
	let optimisticNoteSeq = 0;
	let todoStats: TodoStats = {
		all: data.todosToday.length,
		pending: data.todosToday.filter((todo) => todo.status === 'pending').length,
		done: data.todosToday.filter((todo) => todo.status === 'done').length
	};

	$: if (data.habitTotals) habitTotals = data.habitTotals;
	$: if (data.notesToday) notesToday = data.notesToday;
	$: habitsOnTrack = habitTotals.filter(isHabitOnTrack);
	$: notesPreview = notesToday.slice(0, 3);

	function makeOptimisticNote(content: string): Note {
		const now = new Date().toISOString();
		const firstLine = content.split('\n').find(Boolean)?.trim() ?? 'Quick note';
		optimisticNoteSeq += 1;
		return {
			id: `optimistic-note-${Date.now()}-${optimisticNoteSeq}`,
			user_id: 'optimistic',
			title: firstLine.length > 60 ? `${firstLine.slice(0, 57)}...` : firstLine,
			content,
			type: 'note',
			date: todayStr,
			created_at: now,
			updated_at: now
		};
	}

	function getNoteFromResult(result: unknown): Note | null {
		const note = getActionData(result)?.note;
		return note && typeof note === 'object' && 'id' in note ? (note as Note) : null;
	}

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function formatNoteTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

</script>

<div class="page">
	<div class="page-inner">
		<header class="hero">
			<div>
				<h1>{dateLabel}</h1>
			</div>
			<div class="hero-stats" aria-label="Today summary">
				<div class="hero-stat">
					<span class="stat-value">{todoStats.pending}</span>
					<span class="stat-label">todo{todoStats.pending === 1 ? '' : 's'} left</span>
				</div>
				<div class="hero-stat">
					<span class="stat-value">{habitsOnTrack.length}/{habitTotals.length}</span>
					<span class="stat-label">habits on track</span>
				</div>
				<div class="hero-stat">
					<span class="stat-value">{notesToday.length}</span>
					<span class="stat-label">note{notesToday.length === 1 ? '' : 's'}</span>
				</div>
			</div>
		</header>

		<div class="daily-layout">
			<main class="primary-column">
				<section class="panel focus-panel">
					<div class="panel-heading">
						<div>
							<h2>Things to do today</h2>
						</div>
						<span class="muted">{todoStats.done} done</span>
					</div>

					<TodoList
						todos={data.todosToday}
						today={todayStr}
						addAction="?/addTodo"
						toggleAction="?/toggleTodo"
						updateAction="?/updateTodo"
						removeAction="?/removeTodo"
						compact
						showDueDate={false}
						showDescription={false}
						emptyMode="inline"
						emptyTitle="No tasks for today."
						emptyDescription="Add anything you want out of your head."
						bind:stats={todoStats}
					/>
				</section>

				<section class="panel">
					<div class="panel-heading">
						<div>
							<h2>Habits</h2>
						</div>
						<a href="/habits" class="panel-link">
							Manage
							<ChevronRight size={14} strokeWidth={2} />
						</a>
					</div>

					{#if habitTotals.length === 0}
						<div class="empty-state">
							<Activity class="empty-icon" size={22} strokeWidth={1.8} aria-hidden="true" />
							<div>
								<p>No active habits yet.</p>
								<span>Create habits for water, calories, sleep, or anything worth tracking.</span>
							</div>
						</div>
					{:else}
						<HabitProgressList bind:habits={habitTotals} />
					{/if}
				</section>
			</main>

			<aside class="side-column">
				<section class="panel compact-panel">
					<div class="panel-heading">
						<div>
							<h2>Calendar context</h2>
						</div>
						<CalendarDays class="heading-icon" size={18} strokeWidth={2} aria-hidden="true" />
					</div>

					{#if data.calendarState === 'disconnected' || data.calendarState === 'expired'}
						<div class="callout">
							<span>
								{data.calendarState === 'expired' ? 'Google Calendar access expired.' : 'No calendar connected.'}
							</span>
							<a href="/auth/connect-calendar">{data.calendarState === 'expired' ? 'Reconnect' : 'Connect'}</a>
						</div>
					{:else}
						{#await data.calendarEvents}
							<div class="inline-loading">Loading events...</div>
						{:then events}
							{#if events.length === 0}
								<div class="empty-state compact">
									<Clock3 class="empty-icon" size={20} strokeWidth={1.8} aria-hidden="true" />
									<div>
										<p>No events today.</p>
										<span>Your calendar is quiet.</span>
									</div>
								</div>
							{:else}
								<ul class="event-list">
									{#each events as event (event.id)}
										<li>
											<span class="event-time">{event.allDay ? 'All day' : formatTime(event.start)}</span>
											<div>
												<span class="event-title">{event.title}</span>
												{#if event.location}
													<span class="event-loc">{event.location}</span>
												{/if}
											</div>
										</li>
									{/each}
								</ul>
							{/if}
						{:catch}
							<div class="callout">
								<span>Couldn't load calendar events.</span>
								<a href="/auth/connect-calendar">Reconnect</a>
							</div>
						{/await}
					{/if}
				</section>

				<section class="panel compact-panel">
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
							if (optimistic) notesToday = [optimistic, ...notesToday];
							noteContent = '';
							return async ({ result }) => {
								if (result.type === 'failure' || result.type === 'error') {
									if (optimistic) notesToday = notesToday.filter((note) => note.id !== optimistic.id);
									return;
								}
								const serverNote = getNoteFromResult(result);
								if (optimistic && serverNote) {
									notesToday = notesToday.map((note) => note.id === optimistic.id ? serverNote : note);
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
			</aside>
		</div>
	</div>
</div>

<style>
	.page {
		min-height: 100vh;
		background: var(--bg);
	}

	.page-inner {
		max-width: 1180px;
		margin: 0 auto;
		padding: 32px 24px 48px;
	}

	.hero {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 24px;
		margin-bottom: 24px;
	}

	h1,
	h2 {
		margin: 0;
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	h1 {
		margin-top: 3px;
		font-size: 28px;
		font-weight: 600;
		line-height: 1.15;
	}

	h2 {
		margin-top: 2px;
		font-size: 16px;
		font-weight: 600;
		line-height: 1.3;
	}

	.hero-stats {
		display: grid;
		grid-template-columns: repeat(3, minmax(96px, 1fr));
		gap: 8px;
		width: min(420px, 100%);
	}

	.hero-stat {
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		padding: 12px 14px;
		box-shadow: var(--shadow-sm);
	}

	.stat-value {
		display: block;
		font-size: 20px;
		font-weight: 600;
		line-height: 1.1;
		color: var(--text-primary);
	}

	.stat-label {
		display: block;
		margin-top: 3px;
		font-size: 12px;
		color: var(--text-tertiary);
		white-space: nowrap;
	}

	.daily-layout {
		display: grid;
		grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.85fr);
		gap: 16px;
		align-items: start;
	}

	.primary-column,
	.side-column {
		display: flex;
		flex-direction: column;
		gap: 16px;
		min-width: 0;
	}

	.panel {
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		padding: 18px;
		box-shadow: var(--shadow-sm);
	}

	.focus-panel {
		padding-bottom: 12px;
	}

	.compact-panel {
		padding: 16px;
	}

	.panel-heading {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 14px;
	}

	:global(.heading-icon) {
		color: var(--text-tertiary);
		margin-top: 2px;
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

	.muted,
	.hint {
		color: var(--text-tertiary);
		font-size: 13px;
	}

	textarea {
		width: 100%;
		background: var(--surface-2);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-family: inherit;
		font-size: 14px;
		outline: none;
		transition: border-color 120ms var(--ease-out), background 120ms var(--ease-out);
	}

	textarea {
		min-height: 104px;
		resize: vertical;
		padding: 11px 12px;
		line-height: 1.5;
	}

	textarea::placeholder {
		color: var(--text-tertiary);
	}

	textarea:hover {
		border-color: var(--border-strong);
	}

	button:focus-visible,
	a:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.event-list,
	.note-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.empty-state {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 18px;
		border-radius: var(--radius-lg);
		background: var(--surface-2);
		color: var(--text-secondary);
	}

	.empty-state.compact {
		padding: 14px;
	}

	:global(.empty-icon) {
		flex-shrink: 0;
		color: var(--text-tertiary);
	}

	.empty-state p {
		margin: 0;
		color: var(--text-primary);
		font-weight: 500;
	}

	.empty-state span {
		display: block;
		margin-top: 1px;
		font-size: 13px;
		color: var(--text-tertiary);
	}


	.callout {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px;
		border-radius: var(--radius-lg);
		background: var(--surface-2);
		color: var(--text-secondary);
		font-size: 13px;
	}

	.callout a {
		color: var(--accent);
		font-weight: 500;
	}

	.inline-loading {
		padding: 8px 0;
		color: var(--text-tertiary);
		font-size: 13px;
	}

	.event-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.event-list li {
		display: grid;
		grid-template-columns: 64px minmax(0, 1fr);
		gap: 10px;
		padding: 10px;
		border-radius: var(--radius-md);
		background: var(--surface-2);
	}

	.event-time,
	.event-loc {
		font-size: 12px;
		color: var(--text-tertiary);
	}

	.event-title {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text-primary);
	}

	.event-loc {
		display: block;
		margin-top: 2px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.note-form {
		display: flex;
		flex-direction: column;
		gap: 8px;
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
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
	}

	.note-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-top: 14px;
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
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text-primary);
		font-size: 13px;
	}

	.note-meta {
		flex-shrink: 0;
		color: var(--text-tertiary);
		font-size: 12px;
	}

	.hint {
		margin: 12px 0 0;
	}

	@media (max-width: 980px) {
		.hero {
			align-items: stretch;
			flex-direction: column;
			gap: 16px;
		}

		.hero-stats {
			width: 100%;
		}

		.daily-layout {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.page-inner {
			padding: 24px 16px 36px;
		}

		h1 {
			font-size: 25px;
		}

		.hero-stats {
			grid-template-columns: 1fr;
		}

		.panel {
			padding: 14px;
			border-radius: var(--radius-lg);
		}

		.panel-heading {
			align-items: flex-start;
			flex-direction: column;
			gap: 4px;
		}

		.event-list li {
			grid-template-columns: 1fr;
			gap: 3px;
		}
	}
</style>
