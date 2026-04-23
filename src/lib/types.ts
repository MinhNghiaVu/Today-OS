export interface Todo {
	id: string;
	text: string;
	done: boolean;
	createdAt: string;
}

export type HabitType = 'min_goal' | 'max_goal' | 'info_only';

export interface Habit {
	id: string;
	name: string;
	unit: string;
	type: HabitType;
	daily_goal: number | null;
	color: string;
	is_active: boolean;
}

export interface HabitLog {
	id: string;
	habitId: string;
	date: string;
	amount: number;
	loggedAt: string;
}

export interface Note {
	id: string;
	title: string;
	content: string;
	updatedAt: string;
}
