export type TodoStatus = 'pending' | 'done';
export type TodoPriority = 'high' | 'medium' | 'low';

export interface Todo {
	id: string;
	user_id: string;
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
	user_id: string;
	name: string;
	unit: string;
	type: HabitType;
	daily_goal: number | null;
	color: string;
	is_active: boolean;
}

export interface HabitLog {
	id: string;
	user_id: string;
	habit_id: string;
	date: string;
	value: number;
	created_at: string;
}

export type NoteType = 'note' | 'draft' | 'list';

export interface Note {
	id: string;
	user_id: string;
	title: string;
	content: string;
	type: NoteType;
	date?: string;
	created_at: string;
	updated_at: string;
}

export interface HabitWithTotal extends Habit {
	total: number;
}

export interface HabitWithTodayLogs extends HabitWithTotal {
	daysLogged: number;
	daysMet: number;
	todayLogs: HabitLog[];
}

export interface CalendarEvent {
	id: string;
	title: string;
	start: string;
	end: string;
	allDay: boolean;
	location?: string;
}

export interface CalendarDayActivity {
	date: string;
	hasTodos: boolean;
	hasHabitLogs: boolean;
	hasNotes: boolean;
}

export interface CalendarDayData {
	todos: Todo[];
	habits: HabitWithTodayLogs[];
	notes: Note[];
	gcEvents: CalendarEvent[];
}

export type JobStatus =
	| 'pending' | 'applied' | 'recruiter_screen' | 'interview'
	| 'offer' | 'rejected' | 'ghosted' | 'dropped';

export type JobInterviewStage =
	| 'first_round' | 'second_round' | 'third_round' | 'fourth_round' | 'fifth_round';

export interface Job {
	id: string;
	user_id: string;
	company: string;
	role: string | null;
	status: JobStatus;
	interview_stage: JobInterviewStage | null;
	job_url: string | null;
	contact: string | null;
	applied_date: string | null;
	interviewer: string | null;
	notes: string | null;
	created_at: string;
	updated_at: string;
}
