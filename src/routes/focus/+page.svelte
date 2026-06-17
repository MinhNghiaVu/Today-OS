<script lang="ts">
	import { enhance } from '$app/forms';
	import { Timer, Coffee, Clock } from 'lucide-svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import FocusTimer from '$lib/components/FocusTimer.svelte';
	import type { PageData } from './$types';
	import type { FocusSession } from '$lib/types';

	export let data: PageData;

	let sessions: FocusSession[] = data.sessions;

	$: todayFocusSeconds = sessions
		.filter((s) => s.type === 'focus')
		.reduce((sum, s) => sum + s.duration_seconds, 0);
	$: todayBreakSeconds = sessions
		.filter((s) => s.type === 'break')
		.reduce((sum, s) => sum + s.duration_seconds, 0);

	function formatDuration(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		if (m >= 60) {
			const h = Math.floor(m / 60);
			const rem = m % 60;
			return `${h}h ${rem}m`;
		}
		return s > 0 ? `${m}m ${s}s` : `${m}m`;
	}

	function handleComplete(type: 'focus' | 'break', duration: number) {
		const formEl = document.getElementById('complete-session-form') as HTMLFormElement;
		if (!formEl) return;

		const durationInput = formEl.querySelector(
			'input[name="duration_seconds"]'
		) as HTMLInputElement;
		const typeInput = formEl.querySelector('input[name="type"]') as HTMLInputElement;
		if (durationInput) durationInput.value = String(duration);
		if (typeInput) typeInput.value = type;
		formEl.requestSubmit();

		// Optimistic update
		sessions = [
			{
				id: crypto.randomUUID(),
				user_id: '',
				duration_seconds: duration,
				type,
				completed_at: new Date().toISOString()
			},
			...sessions
		];
	}
</script>

<form
	id="complete-session-form"
	method="POST"
	action="?/complete"
	use:enhance
	class="hidden-form"
>
	<input type="hidden" name="duration_seconds" value="" />
	<input type="hidden" name="type" value="" />
</form>

<PageShell title="Focus" subtitle="Pomodoro timer for concentrated work sessions." maxWidth="narrow">
	<FocusTimer onComplete={handleComplete} />

	<div class="summary-strip">
		<div class="summary-card">
			<Timer size={16} strokeWidth={2} aria-hidden="true" />
			<div class="summary-data">
				<span class="summary-value">{formatDuration(todayFocusSeconds)}</span>
				<span class="summary-label">Focus today</span>
			</div>
		</div>
		<div class="summary-card">
			<Coffee size={16} strokeWidth={2} aria-hidden="true" />
			<div class="summary-data">
				<span class="summary-value">{formatDuration(todayBreakSeconds)}</span>
				<span class="summary-label">Break today</span>
			</div>
		</div>
		<div class="summary-card">
			<Clock size={16} strokeWidth={2} aria-hidden="true" />
			<div class="summary-data">
				<span class="summary-value">{sessions.filter((s) => s.type === 'focus').length}</span>
				<span class="summary-label">Sessions</span>
			</div>
		</div>
	</div>

	{#if sessions.length > 0}
		<div class="session-log">
			<span class="log-label">Today's sessions</span>
			<div class="session-list">
				{#each sessions.slice(0, 10) as session}
					<div class="session-row">
						<div class="session-type">
							<svelte:component this={session.type === 'focus' ? Timer : Coffee} size={14} strokeWidth={2} aria-hidden="true" />
							<span>{session.type === 'focus' ? 'Focus' : 'Break'}</span>
						</div>
						<span class="session-duration">{formatDuration(session.duration_seconds)}</span>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="empty-hint">
			<p>Complete a focus session to see today's log here.</p>
		</div>
	{/if}
</PageShell>

<style>
	.hidden-form {
		display: none;
	}

	.summary-strip {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
		margin-top: 24px;
		margin-bottom: 16px;
	}

	.summary-card {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 16px;
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
	}

	.summary-card :global(svg) {
		color: var(--text-tertiary);
		flex-shrink: 0;
	}

	.summary-data {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.summary-value {
		font-size: 16px;
		font-weight: 600;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
		line-height: 1.2;
	}

	.summary-label {
		font-size: 11px;
		color: var(--text-tertiary);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.session-log {
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		padding: 16px;
		margin-top: 12px;
	}

	.log-label {
		display: block;
		margin-bottom: 12px;
		font-size: 11px;
		font-weight: 500;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.session-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.session-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 10px;
		border-radius: var(--radius-md);
		background: var(--surface-2);
	}

	.session-type {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		color: var(--text-secondary);
	}

	.session-type :global(svg) {
		flex-shrink: 0;
	}

	.session-duration {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}

	.empty-hint {
		margin-top: 12px;
		padding: 24px;
		text-align: center;
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
	}

	.empty-hint p {
		margin: 0;
		font-size: 13px;
		color: var(--text-tertiary);
	}

	@media (max-width: 640px) {
		.summary-strip {
			grid-template-columns: 1fr;
		}
	}
</style>