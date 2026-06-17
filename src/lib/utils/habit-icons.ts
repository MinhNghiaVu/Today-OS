export const DEFAULT_HABIT_ICON = 'target';

export const HABIT_ICON_OPTIONS = [
	{ value: DEFAULT_HABIT_ICON, label: 'Goal' },
	{ value: 'droplets', label: 'Water' },
	{ value: 'footprints', label: 'Steps' },
	{ value: 'tree-pine', label: 'Outside' },
	{ value: 'flame', label: 'Calories' },
	{ value: 'moon', label: 'Sleep' },
	{ value: 'brain', label: 'Mind' },
	{ value: 'dumbbell', label: 'Workout' },
	{ value: 'heart-pulse', label: 'Health' },
	{ value: 'book-open', label: 'Reading' },
	{ value: 'coffee', label: 'Caffeine' },
	{ value: 'utensils', label: 'Food' },
	{ value: 'clock-3', label: 'Time' },
	{ value: 'sun', label: 'Morning' },
	{ value: 'smartphone', label: 'Screen' }
] as const;

export type HabitIconName = (typeof HABIT_ICON_OPTIONS)[number]['value'];

const HABIT_ICON_NAMES = new Set<string>(HABIT_ICON_OPTIONS.map((option) => option.value));

export function isHabitIconName(value: unknown): value is HabitIconName {
	return typeof value === 'string' && HABIT_ICON_NAMES.has(value);
}

export function normalizeHabitIcon(value: unknown): HabitIconName {
	return isHabitIconName(value) ? value : DEFAULT_HABIT_ICON;
}

export function resolveHabitIconInput(
	value: unknown,
	habit: { name: string; unit?: string | null },
	wasPicked = false
): HabitIconName {
	const normalized = normalizeHabitIcon(value);
	if (wasPicked || normalized !== DEFAULT_HABIT_ICON) return normalized;
	return inferHabitIcon(habit);
}

export function inferHabitIcon(habit: { name: string; unit?: string | null }): HabitIconName {
	const text = `${habit.name} ${habit.unit ?? ''}`.toLowerCase();

	if (/\b(water|hydrate|hydration|ml|litre|liter)\b/.test(text)) return 'droplets';
	if (/\b(step|steps|walk|walking|run|running|km|mile)\b/.test(text)) return 'footprints';
	if (/\b(outside|outdoors|sunlight|fresh air|nature)\b/.test(text)) return 'tree-pine';
	if (/\b(calorie|calories|kcal|burn)\b/.test(text)) return 'flame';
	if (/\b(sleep|bed|rest)\b/.test(text)) return 'moon';
	if (/\b(meditat\w*|mindful|journal|focus)\b/.test(text)) return 'brain';
	if (/\b(workout|gym|lift|exercise|strength)\b/.test(text)) return 'dumbbell';
	if (/\b(heart|health|pulse|blood)\b/.test(text)) return 'heart-pulse';
	if (/\b(read|reading|book|study|learn)\b/.test(text)) return 'book-open';
	if (/\b(coffee|caffeine)\b/.test(text)) return 'coffee';
	if (/\b(food|meal|protein|carb|fat)\b/.test(text)) return 'utensils';
	if (/\b(screen|phone|social|scroll)\b/.test(text)) return 'smartphone';
	if (/\b(morning|wake)\b/.test(text)) return 'sun';
	if (/\b(time|timer|minutes|hours|hour)\b/.test(text)) return 'clock-3';

	return DEFAULT_HABIT_ICON;
}
