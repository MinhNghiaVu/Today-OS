<script lang="ts">
	import HabitIcon from '$lib/components/HabitIcon.svelte';
	import { HABIT_ICON_OPTIONS, type HabitIconName } from '$lib/utils/habit-icons';

	export let value: HabitIconName = 'target';
	export let name = 'icon';
	export let pickedName = 'icon_was_picked';
	export let wasPicked = false;

	function chooseIcon(icon: HabitIconName) {
		value = icon;
		wasPicked = true;
	}
</script>

<div class="icon-section">
	<div class="field-label">Icon</div>
	<input type="hidden" {name} {value} />
	<input type="hidden" name={pickedName} value={wasPicked ? 'true' : 'false'} />
	<div class="icon-picker" role="radiogroup" aria-label="Habit icon">
		{#each HABIT_ICON_OPTIONS as option}
			<button
				type="button"
				class:selected={value === option.value}
				class="icon-choice"
				role="radio"
				aria-checked={value === option.value}
				aria-label={option.label}
				title={option.label}
				on:click={() => chooseIcon(option.value)}
			>
				<HabitIcon icon={option.value} size={18} strokeWidth={2} />
			</button>
		{/each}
	</div>
</div>

<style>
	.icon-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.field-label {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.icon-picker {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
		gap: 8px;
	}

	.icon-choice {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		aspect-ratio: 1;
		min-height: 40px;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		background: var(--surface-2);
		color: var(--text-secondary);
		cursor: pointer;
		transition:
			background-color 120ms var(--ease-out),
			border-color 120ms var(--ease-out),
			color 120ms var(--ease-out),
			transform 120ms var(--ease-out);
	}

	.icon-choice:hover {
		border-color: var(--border-strong);
		background: var(--surface-3);
		color: var(--text-primary);
	}

	.icon-choice.selected {
		border-color: color-mix(in oklab, var(--accent) 55%, var(--border-default));
		background: var(--accent-soft);
		color: var(--accent);
	}

	.icon-choice:active {
		transform: translateY(1px);
	}

	.icon-choice:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}
</style>
