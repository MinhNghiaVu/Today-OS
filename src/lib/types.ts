export type TodoStatus = 'pending' | 'done';
export type TodoPriority = 'high' | 'medium' | 'low';

export interface Todo {
	id: string;
	title: string;
	description?: string;
	status: TodoStatus;
	due_date?: string;
	priority?: TodoPriority;
	note_id?: string;
	created_at: string;
	completed_at?: string;
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
