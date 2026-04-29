<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut, cubicIn } from 'svelte/easing';
	import { ChevronDown, Check } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';

	export let name: string;
	export let options: { value: string; label: string }[];
	export let value: string = '';
	export let placeholder: string = 'Select…';
	export let disabled: boolean = false;

	const dispatch = createEventDispatcher<{ change: string }>();

	let open = false;
	let wrapperEl: HTMLDivElement;

	$: selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;

	function select(val: string) {
		value = val;
		open = false;
		dispatch('change', val);
	}

	function handleWindowClick(e: MouseEvent) {
		if (!wrapperEl?.contains(e.target as Node)) open = false;
	}

	function handleWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			open = false;
			e.stopPropagation();
		}
	}

	function handleOptionKeydown(e: KeyboardEvent, val: string) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			select(val);
		}
	}
</script>

<svelte:window on:click={handleWindowClick} on:keydown={handleWindowKeydown} />

<input type="hidden" {name} {value} />

<div class="select-wrapper" bind:this={wrapperEl}>
	<button
		type="button"
		class="select-trigger"
		class:open
		{disabled}
		aria-haspopup="listbox"
		aria-expanded={open}
		on:click|stopPropagation={() => !disabled && (open = !open)}
	>
		<span class="select-label">{selectedLabel}</span>
		<span class="select-chevron" class:rotated={open} aria-hidden="true">
			<ChevronDown size={14} strokeWidth={2} />
		</span>
	</button>

	{#if open}
		<ul
			class="select-panel"
			role="listbox"
			aria-label={placeholder}
			in:fly={{ y: -6, duration: 180, easing: cubicOut }}
			out:fly={{ y: -4, duration: 120, easing: cubicIn }}
		>
			{#each options as opt}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<li
					class="select-option"
					class:selected={opt.value === value}
					role="option"
					aria-selected={opt.value === value}
					tabindex="0"
					on:click|stopPropagation={() => select(opt.value)}
					on:keydown={(e) => handleOptionKeydown(e, opt.value)}
				>
					<span class="option-label">{opt.label}</span>
					{#if opt.value === value}
						<span class="option-check" aria-hidden="true">
							<Check size={13} strokeWidth={2.5} />
						</span>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.select-wrapper {
		position: relative;
		display: inline-flex;
	}

	.select-trigger {
		display: flex;
		align-items: center;
		gap: 6px;
		height: 36px;
		padding: 0 10px;
		background: var(--surface-2);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: 13px;
		font-family: inherit;
		cursor: pointer;
		outline: none;
		white-space: nowrap;
		transition:
			border-color 120ms var(--ease-out),
			background-color 120ms var(--ease-out);
	}

	.select-trigger:hover:not(:disabled) {
		border-color: var(--border-strong);
	}

	.select-trigger:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.select-trigger.open {
		border-color: var(--border-strong);
		background: var(--surface-3);
	}

	.select-trigger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.select-label {
		flex: 1;
	}

	.select-chevron {
		color: var(--text-tertiary);
		display: flex;
		align-items: center;
		transition: transform 180ms var(--ease-out);
	}

	.select-chevron.rotated {
		transform: rotate(180deg);
	}

	/* ── Dropdown panel ── */
	.select-panel {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		min-width: 100%;
		background: var(--surface-overlay);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-popover);
		padding: 6px;
		margin: 0;
		list-style: none;
		z-index: 200;
	}

	/* ── Options ── */
	.select-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 0 10px;
		height: 34px;
		border-radius: var(--radius-sm);
		font-size: 13px;
		font-weight: 400;
		color: var(--text-primary);
		cursor: pointer;
		outline: none;
		transition: background-color 80ms var(--ease-out);
	}

	.select-option:hover {
		background: var(--surface-2);
	}

	.select-option:focus-visible {
		background: var(--surface-2);
		outline: 2px solid var(--border-focus);
		outline-offset: -2px;
	}

	.select-option.selected {
		background: var(--surface-3);
		font-weight: 500;
	}

	.option-label {
		flex: 1;
	}

	.option-check {
		color: var(--accent);
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}
</style>
