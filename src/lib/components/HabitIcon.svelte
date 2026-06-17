<script lang="ts">
	import {
		BookOpen,
		Brain,
		Clock3,
		Coffee,
		Droplets,
		Dumbbell,
		Flame,
		Footprints,
		HeartPulse,
		Moon,
		Smartphone,
		Sun,
		Target,
		TreePine,
		Utensils
	} from 'lucide-svelte';
	import { normalizeHabitIcon, type HabitIconName } from '$lib/utils/habit-icons';

	export let icon: HabitIconName | null | undefined = 'target';
	export let size = 17;
	export let strokeWidth = 2;

	$: resolvedIcon = normalizeHabitIcon(icon);
</script>

{#if resolvedIcon === 'droplets'}
	<Droplets {size} {strokeWidth} aria-hidden="true" />
{:else if resolvedIcon === 'footprints'}
	<Footprints {size} {strokeWidth} aria-hidden="true" />
{:else if resolvedIcon === 'tree-pine'}
	<TreePine {size} {strokeWidth} aria-hidden="true" />
{:else if resolvedIcon === 'flame'}
	<Flame {size} {strokeWidth} aria-hidden="true" />
{:else if resolvedIcon === 'moon'}
	<Moon {size} {strokeWidth} aria-hidden="true" />
{:else if resolvedIcon === 'brain'}
	<Brain {size} {strokeWidth} aria-hidden="true" />
{:else if resolvedIcon === 'dumbbell'}
	<Dumbbell {size} {strokeWidth} aria-hidden="true" />
{:else if resolvedIcon === 'heart-pulse'}
	<HeartPulse {size} {strokeWidth} aria-hidden="true" />
{:else if resolvedIcon === 'book-open'}
	<BookOpen {size} {strokeWidth} aria-hidden="true" />
{:else if resolvedIcon === 'coffee'}
	<Coffee {size} {strokeWidth} aria-hidden="true" />
{:else if resolvedIcon === 'utensils'}
	<Utensils {size} {strokeWidth} aria-hidden="true" />
{:else if resolvedIcon === 'clock-3'}
	<Clock3 {size} {strokeWidth} aria-hidden="true" />
{:else if resolvedIcon === 'sun'}
	<Sun {size} {strokeWidth} aria-hidden="true" />
{:else if resolvedIcon === 'smartphone'}
	<Smartphone {size} {strokeWidth} aria-hidden="true" />
{:else}
	<Target {size} {strokeWidth} aria-hidden="true" />
{/if}
