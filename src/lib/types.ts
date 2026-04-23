export interface Todo {
	id: string;
	text: string;
	done: boolean;
	createdAt: string;
}

export interface Habit {
	id: string;
	name: string;
	unit: string;
	targetPerDay: number;
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
