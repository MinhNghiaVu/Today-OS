<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let options: { value: string; label: string }[];
	export let value: string;
	export let fullWidth = false;

	const dispatch = createEventDispatcher<{ change: string }>();

	$: activeIndex = options.findIndex((o) => o.value === value);

	function select(v: string) {
		if (v === value) return;
		value = v;
		dispatch('change', v);
	}

	function handleKeydown(e: KeyboardEvent, idx: number) {
		if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
			e.preventDefault();
			const next = e.key === 'ArrowRight'
				? (idx + 1) % options.length
				: (idx - 1 + options.length) % options.length;
			select(options[next].value);
		}
	}
</script>

<div
	class="seg-track"
	class:full-width={fullWidth}
	role="tablist"
	style="--count: {options.length}; --active-idx: {activeIndex};"
>
	<div class="seg-thumb"></div>
	{#each options as opt, i}
		<button
			class="seg-option"
			class:active={opt.value === value}
			role="tab"
			aria-selected={opt.value === value}
			on:click={() => select(opt.value)}
			on:keydown={(e) => handleKeydown(e, i)}
			tabindex={opt.value === value ? 0 : -1}
		>
			{opt.label}
		</button>
	{/each}
</div>

<style>
	.seg-track {
		position: relative;
		display: flex;
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-full);
		padding: 3px;
		width: fit-content;
	}

	.seg-track.full-width {
		width: 100%;
	}

	.seg-thumb {
		position: absolute;
		top: 3px;
		left: 3px;
		/* width of one option slot */
		width: calc((100% - 6px) / var(--count));
		height: calc(100% - 6px);
		background: var(--surface-1);
		border-radius: var(--radius-full);
		border: 1px solid var(--border-default);
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.45),
			0 1px 1px rgba(0, 0, 0, 0.25);
		transform: translateX(calc(var(--active-idx) * 100%));
		transition: transform 220ms var(--ease-spring);
		pointer-events: none;
	}

	.seg-option {
		position: relative;
		z-index: 1;
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		color: var(--text-tertiary);
		font-size: 13px;
		font-weight: 500;
		font-family: inherit;
		padding: 0 16px;
		height: 30px;
		min-width: 0;
		border-radius: var(--radius-full);
		cursor: pointer;
		white-space: nowrap;
		transition: color 140ms var(--ease-out);
		user-select: none;
	}

	.seg-option.active {
		color: var(--text-primary);
	}

	.seg-option:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: -2px;
		border-radius: var(--radius-full);
	}
</style>
