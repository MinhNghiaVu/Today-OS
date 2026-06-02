import type { HabitLog, HabitType, HabitWithTodayLogs } from '$lib/types';
import { getActionData } from '$lib/utils/optimistic';

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

const HABIT_OPTIMISTIC_LOG_PREFIX = 'optimistic-log-';

function roundedTotal(value: number): number {
	const rounded = parseFloat(value.toFixed(6));
	return Math.abs(rounded) < 0.000001 ? 0 : rounded;
}

function clampSevenDays(value: number): number {
	return Math.max(0, Math.min(7, value));
}

function isGoalDayMet(habit: HabitProgressInput): boolean {
	return habit.daily_goal !== null && isHabitOnTrack(habit);
}

function withHabitDayTotals(
	habit: HabitWithTodayLogs,
	total: number,
	todayLogs: HabitLog[]
): HabitWithTodayLogs {
	const nextTotal = roundedTotal(total);
	const wasLogged = habit.total > 0;
	const isLogged = nextTotal > 0;
	const wasMet = isGoalDayMet(habit);
	const isMet = isGoalDayMet({ ...habit, total: nextTotal });

	return {
		...habit,
		total: nextTotal,
		daysLogged: clampSevenDays(habit.daysLogged + Number(isLogged) - Number(wasLogged)),
		daysMet: clampSevenDays(habit.daysMet + Number(isMet) - Number(wasMet)),
		todayLogs
	};
}

export function createOptimisticHabitLog(options: {
	habitId: string;
	value: number;
	sequence: number;
	date?: string;
	now?: string;
}): HabitLog {
	const now = options.now ?? new Date().toISOString();
	return {
		id: `${HABIT_OPTIMISTIC_LOG_PREFIX}${Date.now()}-${options.sequence}`,
		user_id: 'optimistic',
		habit_id: options.habitId,
		date: options.date ?? now.slice(0, 10),
		value: options.value,
		created_at: now
	};
}

export function applyHabitLogAdd(habits: HabitWithTodayLogs[], log: HabitLog): HabitWithTodayLogs[] {
	return habits.map((habit) =>
		habit.id === log.habit_id
			? withHabitDayTotals(habit, habit.total + log.value, [log, ...habit.todayLogs])
			: habit
	);
}

export function applyHabitLogUpdate(habits: HabitWithTodayLogs[], log: HabitLog): HabitWithTodayLogs[] {
	return habits.map((habit) => {
		const existing = habit.todayLogs.find((item) => item.id === log.id);
		if (!existing) return habit;

		return withHabitDayTotals(
			habit,
			habit.total - existing.value + log.value,
			habit.todayLogs.map((item) => (item.id === log.id ? log : item))
		);
	});
}

export function applyHabitLogRemove(
	habits: HabitWithTodayLogs[],
	log: Pick<HabitLog, 'id'> & Partial<HabitLog>
): HabitWithTodayLogs[] {
	return habits.map((habit) => {
		const existing = habit.todayLogs.find((item) => item.id === log.id);
		if (!existing) return habit;

		return withHabitDayTotals(
			habit,
			habit.total - existing.value,
			habit.todayLogs.filter((item) => item.id !== log.id)
		);
	});
}

export function replaceHabitLog(
	habits: HabitWithTodayLogs[],
	currentId: string,
	serverLog: HabitLog
): HabitWithTodayLogs[] {
	let found = false;
	const replaced = habits.map((habit) => {
		const existing = habit.todayLogs.find((log) => log.id === currentId);
		if (!existing) return habit;
		found = true;
		return withHabitDayTotals(
			habit,
			habit.total - existing.value + serverLog.value,
			habit.todayLogs.map((log) => (log.id === currentId ? serverLog : log))
		);
	});

	return found ? replaced : applyHabitLogAdd(replaced, serverLog);
}

export function getHabitActionLog(result: unknown): HabitLog | null {
	const log = getActionData(result)?.log;
	return log && typeof log === 'object' && 'id' in log ? (log as HabitLog) : null;
}
