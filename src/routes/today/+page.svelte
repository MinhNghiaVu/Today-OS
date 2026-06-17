<script lang="ts">
	import {
		Activity,
		CalendarDays,
		ChevronRight,
		Clock3,
	} from 'lucide-svelte';
	import HabitProgressList from '$lib/components/HabitProgressList.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import SummaryStatStrip from '$lib/components/SummaryStatStrip.svelte';
	import TodayFocusPanel from '$lib/components/TodayFocusPanel.svelte';
	import TodayQuickCapture from '$lib/components/TodayQuickCapture.svelte';
	import TodayQuickNotesPanel from '$lib/components/TodayQuickNotesPanel.svelte';
	import TodoList from '$lib/components/TodoList.svelte';
	import EveningShutdown from '$lib/components/EveningShutdown.svelte';
	import { isHabitOnTrack } from '$lib/utils/habits';
	import TodayCommandCenter from '$lib/components/TodayCommandCenter.svelte';
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

	let habitTotals: HabitWithTodayLogs[] = data.habitTotals;
	let notesToday: Note[] = data.notesToday;
	let todoStats: TodoStats = {
		all: data.todosToday.length,
		pending: data.todosToday.filter((todo) => todo.status === 'pending').length,
		done: data.todosToday.filter((todo) => todo.status === 'done').length
	};

	$: if (data.habitTotals) habitTotals = data.habitTotals;
	$: if (data.notesToday) notesToday = data.notesToday;
	$: habitsOnTrack = habitTotals.filter(isHabitOnTrack);
	$: focusedTodos = (data.todosToday ?? []).filter((t) => t.today_focus).sort((a, b) => (a.focus_order ?? 99) - (b.focus_order ?? 99));
	$: nextFocusTitle = focusedTodos.length > 0 ? focusedTodos[0].title : null;
	$: summaryStats = [
		{
			value: todoStats.pending,
			label: `todo${todoStats.pending === 1 ? '' : 's'} left`,
			ariaLabel: `${todoStats.pending} todos left`
		},
		{
			value: `${habitsOnTrack.length}/${habitTotals.length}`,
			label: 'habits on track',
			ariaLabel: `${habitsOnTrack.length} of ${habitTotals.length} habits on track`
		},
		{
			value: notesToday.length,
			label: `note${notesToday.length === 1 ? '' : 's'}`,
			ariaLabel: `${notesToday.length} notes`
		}
	];

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

</script>

<PageShell title={dateLabel} subtitle="Your home base for tasks, habits, notes, and calendar context." maxWidth="wide">
	<svelte:fragment slot="actions">
		<SummaryStatStrip items={summaryStats} ariaLabel="Today summary" />
	</svelte:fragment>

	<TodayCommandCenter
		pendingCount={todoStats.pending}
		focusCount={focusedTodos.length}
		nextFocusTitle={nextFocusTitle}
		habitsOnTrack={habitsOnTrack.length}
		habitsTotal={habitTotals.length}
		notesCount={notesToday.length}
	/>

	<div class="daily-layout">
		<main class="primary-column">
			<TodayQuickCapture habits={habitTotals} today={todayStr} />

			<TodayFocusPanel todos={data.todosToday} />

			<section class="panel">
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
					showFocus
					emptyTitle="No tasks for today."
					emptyDescription="Add anything you want out of your head."
					bind:stats={todoStats}
				/>
				<EveningShutdown pendingCount={todoStats.pending} />
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
			<section class="panel">
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
							<div class="empty-state">
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

			<TodayQuickNotesPanel bind:notes={notesToday} today={todayStr} />
		</aside>
	</div>
</PageShell>

<style>
	h2 {
		margin: 0;
		color: var(--text-primary);
		letter-spacing: 0;
		font-size: 16px;
		font-weight: 600;
		line-height: 1.3;
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

	.muted {
		color: var(--text-tertiary);
		font-size: 13px;
	}

	a:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.empty-state {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 11px 14px;
		border-radius: var(--radius-md);
		background: var(--surface-2);
		color: var(--text-secondary);
		font-size: 13px;
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
		list-style: none;
		margin: 0;
		padding: 0;
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

	@media (max-width: 980px) {
		.daily-layout {
			grid-template-columns: 1fr;
		}
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

		.event-list li {
			grid-template-columns: 1fr;
			gap: 3px;
		}
	}
</style>
