import type { HabitType } from '$lib/types';

export type HabitProgressInput = {
	type: HabitType;
	total: number;
	daily_goal: number | null;
};

export function isHabitOnTrack(habit: HabitProgressInput): boolean {
	if (habit.type === 'info_only') return habit.total > 0;
	if (habit.daily_goal === null) return habit.total > 0;
	if (habit.type === 'min_goal') return habit.total >= habit.daily_goal;
	return habit.total > 0 && habit.total <= habit.daily_goal;
}

export function isHabitOverLimit(habit: HabitProgressInput): boolean {
	return habit.type === 'max_goal' && habit.daily_goal !== null && habit.total > habit.daily_goal;
}

export function habitProgressWidth(habit: Pick<HabitProgressInput, 'daily_goal' | 'total'>): number {
	if (!habit.daily_goal) return habit.total > 0 ? 100 : 0;
	return Math.min(100, (habit.total / habit.daily_goal) * 100);
}

export function habitProgressColor(habit: HabitProgressInput & { color: string }): string {
	if (isHabitOverLimit(habit)) return 'var(--danger)';
	if (isHabitOnTrack(habit) && habit.type === 'min_goal') return 'var(--success)';
	return habit.color;
}

export function habitStatus(
	habit: HabitProgressInput & { unit: string; is_active?: boolean }
): string {
	if (habit.is_active === false) return 'Inactive';
	if (habit.type === 'info_only' || habit.daily_goal === null) {
		return habit.total > 0 ? `${habit.total} ${habit.unit} logged` : 'No log yet';
	}

	if (habit.type === 'min_goal') {
		const remaining = Math.max(0, habit.daily_goal - habit.total);
		return remaining === 0 ? 'Goal met' : `${remaining} ${habit.unit} left`;
	}

	const remaining = habit.daily_goal - habit.total;
	if (remaining < 0) return `${Math.abs(remaining)} ${habit.unit} over`;
	return `${remaining} ${habit.unit} room`;
}

export function formatHabitTotal(total: number): string {
	return Number.isInteger(total) ? String(total) : total.toFixed(1);
}
