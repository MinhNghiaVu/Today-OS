<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicIn, cubicOut } from 'svelte/easing';
	import { Play, Pause, RotateCcw, Timer, Coffee } from 'lucide-svelte';

	export let onComplete: (type: 'focus' | 'break', duration: number) => void = () => {};

	const WORK_KEY = 'focus-work-minutes';
	const BREAK_KEY = 'focus-break-minutes';

	type TimerMode = 'focus' | 'break';
	type TimerState = 'idle' | 'running' | 'paused';

	function loadDuration(key: string, fallback: number): number {
		if (!browser) return fallback;
		const stored = localStorage.getItem(key);
		return stored ? parseInt(stored, 10) : fallback;
	}

	let workMinutes = loadDuration(WORK_KEY, 25);
	let breakMinutes = loadDuration(BREAK_KEY, 5);
	let mode: TimerMode = 'focus';
	let state: TimerState = 'idle';
	let remaining = workMinutes * 60;
	let intervalId: ReturnType<typeof setInterval> | null = null;
	let showSettings = false;

	$: totalSeconds = mode === 'focus' ? workMinutes * 60 : breakMinutes * 60;
	$: progress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 0;
	$: minutes = Math.floor(remaining / 60);
	$: seconds = remaining % 60;
	$: display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

	// Notification sound — use the Notification API + a short audio beep
	function notify(type: 'focus' | 'break') {
		if (!browser) return;
		if (Notification.permission === 'default') Notification.requestPermission();
		if (Notification.permission === 'granted') {
			new Notification(
				type === 'focus'
					? 'Focus session complete — time for a break!'
					: 'Break over — ready to focus?',
				{ body: type === 'focus' ? 'Great work. Take a breather.' : 'Let\'s get back to it.' }
			);
		}
	}

	function tick() {
		remaining -= 1;
		if (remaining <= 0) {
			stop();
			state = 'idle';
			const completedType = mode;
			notify(completedType);
			onComplete(completedType, totalSeconds);

			// Auto-switch to next mode
			if (completedType === 'focus') {
				mode = 'break';
				remaining = breakMinutes * 60;
			} else {
				mode = 'focus';
				remaining = workMinutes * 60;
			}
		}
	}

	function start() {
		if (state === 'idle' || state === 'paused') {
			state = 'running';
			intervalId = setInterval(tick, 1000);
		}
	}

	function pause() {
		if (state === 'running') {
			state = 'paused';
			stop();
		}
	}

	function stop() {
		if (intervalId !== null) {
			clearInterval(intervalId);
			intervalId = null;
		}
	}

	function reset() {
		stop();
		state = 'idle';
		mode = 'focus';
		remaining = workMinutes * 60;
	}

	function setWork(mins: number) {
		workMinutes = mins;
		if (browser) localStorage.setItem(WORK_KEY, String(mins));
		if (mode === 'focus' && state === 'idle') remaining = mins * 60;
	}

	function setBreak(mins: number) {
		breakMinutes = mins;
		if (browser) localStorage.setItem(BREAK_KEY, String(mins));
		if (mode === 'break' && state === 'idle') remaining = mins * 60;
	}

	onDestroy(() => stop());

	function formatProgressLabel(): string {
		if (mode === 'focus') return 'Focus';
		return 'Break';
	}

	const DURATIONS = [5, 10, 15, 20, 25, 30, 45, 60];
</script>

<div class="timer-card">
	<div class="timer-mode-badge" class:break-mode={mode === 'break'}>
		<svelte:component this={mode === 'focus' ? Timer : Coffee} size={14} strokeWidth={2} aria-hidden="true" />
		<span>{formatProgressLabel()}</span>
	</div>

	<div class="ring-container">
		<svg class="progress-ring" viewBox="0 0 120 120" aria-label="{display} remaining">
			<circle class="ring-bg" cx="60" cy="60" r="52" />
			<circle
				class="ring-fill"
				class:break-mode={mode === 'break'}
				cx="60"
				cy="60"
				r="52"
				stroke-dasharray="326.73"
				stroke-dashoffset={326.73 * (1 - progress)}
			/>
		</svg>
		<div class="ring-label">
			<span class="timer-display">{display}</span>
		</div>
	</div>

	<div class="controls">
		{#if state === 'running'}
			<button class="btn-icon btn-secondary" on:click={pause} aria-label="Pause timer">
				<Pause size={20} strokeWidth={2} />
			</button>
		{:else}
			<button class="btn-icon btn-primary" on:click={start} aria-label="Start timer" disabled={remaining <= 0}>
				<Play size={20} strokeWidth={2} />
			</button>
		{/if}
		<button class="btn-icon btn-ghost" on:click={reset} aria-label="Reset timer">
			<RotateCcw size={18} strokeWidth={2} />
		</button>
	</div>

	<button class="settings-toggle" on:click={() => (showSettings = !showSettings)}>
		{showSettings ? 'Done' : 'Settings'}
	</button>

	{#if showSettings}
		<div class="duration-pickers" transition:fly={{ y: -8, duration: 180, easing: cubicOut }}>
			<div class="picker-group">
				<span class="picker-label">Focus</span>
				<div class="pill-options">
					{#each DURATIONS as mins}
						<button
							class="pill"
							class:active={mode === 'focus' && workMinutes === mins}
							disabled={state === 'running'}
							on:click={() => setWork(mins)}
						>
							{mins}m
						</button>
					{/each}
				</div>
			</div>
			<div class="picker-group">
				<span class="picker-label">Break</span>
				<div class="pill-options">
					{#each DURATIONS as mins}
						<button
							class="pill"
							class:active={mode === 'break' && breakMinutes === mins}
							disabled={state === 'running'}
							on:click={() => setBreak(mins)}
						>
							{mins}m
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

{#if !browser || Notification.permission === 'default'}
	<p class="notification-hint">
		Enable notifications for session-end alerts.
	</p>
{/if}

<style>
	.timer-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24px;
		padding: 40px 24px 32px;
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-sm);
	}

	.timer-mode-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 12px;
		border-radius: var(--radius-full);
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 12px;
		font-weight: 500;
		transition: background-color 180ms var(--ease-out), color 180ms var(--ease-out);
	}

	.timer-mode-badge.break-mode {
		background: var(--success-soft);
		color: var(--success);
	}

	/* ── Ring ── */
	.ring-container {
		position: relative;
		width: 180px;
		height: 180px;
	}

	.progress-ring {
		width: 100%;
		height: 100%;
		transform: rotate(-90deg);
	}

	.ring-bg {
		fill: none;
		stroke: var(--surface-3);
		stroke-width: 8;
	}

	.ring-fill {
		fill: none;
		stroke: var(--accent);
		stroke-width: 8;
		stroke-linecap: round;
		transition: stroke-dashoffset 500ms linear, stroke 180ms var(--ease-out);
	}

	.ring-fill.break-mode {
		stroke: var(--success);
	}

	.ring-label {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.timer-display {
		font-size: 42px;
		font-weight: 600;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
		letter-spacing: 2px;
		line-height: 1;
	}

	/* ── Controls ── */
	.controls {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.btn-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: var(--radius-full);
		cursor: pointer;
		transition:
			background-color 120ms var(--ease-out),
			transform 120ms var(--ease-out),
			opacity 120ms var(--ease-out);
		font-family: inherit;
	}

	.btn-icon:active {
		transform: scale(0.95);
	}

	.btn-icon:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.btn-primary {
		width: 60px;
		height: 60px;
		background: var(--accent);
		color: var(--text-on-accent);
		box-shadow: 0 4px 12px color-mix(in oklab, var(--accent) 30%, transparent);
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.btn-secondary {
		width: 60px;
		height: 60px;
		background: var(--surface-2);
		color: var(--text-primary);
	}

	.btn-secondary:hover:not(:disabled) {
		background: var(--surface-3);
	}

	.btn-ghost {
		width: 44px;
		height: 44px;
		background: transparent;
		color: var(--text-tertiary);
	}

	.btn-ghost:hover:not(:disabled) {
		background: var(--surface-2);
		color: var(--text-primary);
	}

	/* ── Settings ── */
	.settings-toggle {
		background: none;
		border: none;
		color: var(--text-tertiary);
		font-size: 12px;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: var(--radius-sm);
		transition: color 120ms var(--ease-out);
	}

	.settings-toggle:hover {
		color: var(--text-primary);
	}

	.duration-pickers {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 100%;
		max-width: 320px;
		padding: 20px;
		background: var(--surface-2);
		border-radius: var(--radius-lg);
	}

	.picker-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.picker-label {
		font-size: 11px;
		font-weight: 500;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.pill-options {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.pill {
		height: 30px;
		padding: 0 10px;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--text-secondary);
		font-size: 12px;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		transition:
			background-color 120ms var(--ease-out),
			border-color 120ms var(--ease-out),
			color 120ms var(--ease-out);
	}

	.pill:hover:not(:disabled) {
		border-color: var(--border-strong);
		color: var(--text-primary);
	}

	.pill.active {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--text-on-accent);
	}

	.pill:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.notification-hint {
		margin: 0;
		font-size: 12px;
		color: var(--text-tertiary);
		text-align: center;
		padding: 4px 0;
	}
</style>