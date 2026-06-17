import type { AppDbClient } from '$lib/server/neon-client';
import type {
	CalendarDayActivity,
	Todo,
	Habit,
	HabitLog,
	HabitWithTodayLogs,
	Note,
	Job
} from './types';
import { sortTodos } from '$lib/utils/todos';
import { inferHabitIcon, isHabitIconName, normalizeHabitIcon } from '$lib/utils/habit-icons';

function today(): string {
	return new Date().toISOString().slice(0, 10);
}

// ── Todos ─────────────────────────────────────────────────────

export async function getTodos(sb: AppDbClient, userId: string): Promise<Todo[]> {
	const { data, error } = await sb
		.from('todos')
		.select('*')
		.eq('user_id', userId)
		.order('created_at');
	if (error) throw error;
	return sortTodos((data ?? []) as Todo[]);
}

export async function getTodosToday(sb: AppDbClient, userId: string): Promise<Todo[]> {
	const d = today();
	const { data, error } = await sb
		.from('todos')
		.select('*')
		.eq('user_id', userId)
		.or(`due_date.eq.${d},and(status.eq.pending,due_date.lt.${d})`);
	if (error) throw error;

	return sortTodos((data ?? []) as Todo[]);
}

// ── Habits ────────────────────────────────────────────────────

function normalizeHabitRecord(row: Habit): Habit {
	const icon = isHabitIconName(row.icon)
		? row.icon
		: inferHabitIcon({ name: row.name, unit: row.unit });

	return {
		...row,
		icon: normalizeHabitIcon(icon)
	};
}

export async function getHabits(sb: AppDbClient, userId: string): Promise<Habit[]> {
	const { data, error } = await sb
		.from('habit_definitions')
		.select('*')
		.eq('user_id', userId)
		.order('created_at');
	if (error) throw error;
	return ((data ?? []) as Habit[]).map(normalizeHabitRecord);
}

export async function getHabitLogEntriesForRange(
	sb: AppDbClient,
	userId: string,
	habitId: string,
	startDate: string,
	endDate: string
): Promise<HabitLog[]> {
	const { data, error } = await sb
		.from('habit_logs')
		.select('*')
		.eq('user_id', userId)
		.eq('habit_id', habitId)
		.gte('date', startDate)
		.lte('date', endDate)
		.order('date', { ascending: false })
		.order('created_at', { ascending: false });
	if (error) throw error;
	return (data ?? []) as any;
}

// ── Notes ─────────────────────────────────────────────────────

export async function getNotes(sb: AppDbClient, userId: string): Promise<Note[]> {
	const { data, error } = await sb
		.from('notes')
		.select('*')
		.eq('user_id', userId)
		.order('updated_at', { ascending: false });
	if (error) throw error;
	return (data ?? []) as any;
}

// ── Calendar ──────────────────────────────────────────────────

export async function getTodosForDate(
	sb: AppDbClient,
	userId: string,
	date: string
): Promise<Todo[]> {
	const { data, error } = await sb
		.from('todos')
		.select('*')
		.eq('user_id', userId)
		.eq('due_date', date)
		.order('created_at');
	if (error) throw error;
	return sortTodos((data ?? []) as Todo[]);
}

export async function getNotesForDate(
	sb: AppDbClient,
	userId: string,
	date: string
): Promise<Note[]> {
	const { data, error } = await sb
		.from('notes')
		.select('*')
		.eq('user_id', userId)
		.eq('date', date)
		.order('updated_at', { ascending: false });
	if (error) throw error;
	return (data ?? []) as any;
}

export async function getCalendarMonthActivity(
	sb: AppDbClient,
	userId: string,
	year: number,
	month: number
): Promise<CalendarDayActivity[]> {
	const start = `${year}-${String(month).padStart(2, '0')}-01`;
	const lastDay = new Date(year, month, 0).getDate();
	const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

	const [{ data: todos }, { data: logs }, { data: notes }] = await Promise.all([
		sb.from('todos').select('due_date').eq('user_id', userId).gte('due_date', start).lte('due_date', end),
		sb.from('habit_logs').select('date').eq('user_id', userId).gte('date', start).lte('date', end),
		sb.from('notes').select('date').eq('user_id', userId).gte('date', start).lte('date', end).not('date', 'is', null)
	]);

	const todoSet = new Set(((todos ?? []) as Pick<Todo, 'due_date'>[]).map((t) => t.due_date));
	const logSet = new Set(((logs ?? []) as Pick<HabitLog, 'date'>[]).map((l) => l.date));
	const noteSet = new Set(((notes ?? []) as Pick<Note, 'date'>[]).map((n) => n.date));

	const days: CalendarDayActivity[] = [];
	for (let d = 1; d <= lastDay; d++) {
		const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
		days.push({
			date: dateStr,
			hasTodos: todoSet.has(dateStr),
			hasHabitLogs: logSet.has(dateStr),
			hasNotes: noteSet.has(dateStr)
		});
	}
	return days;
}

// ── Habit charts ──────────────────────────────────────────────

export interface HabitDailyTotal {
	date: string;
	total: number;
}

export async function getHabitSummariesToday(
	sb: AppDbClient,
	userId: string,
	options: { includeInactive?: boolean } = {}
): Promise<HabitWithTodayLogs[]> {
	return getHabitSummariesForDate(sb, userId, today(), options);
}

export async function getHabitSummariesForDate(
	sb: AppDbClient,
	userId: string,
	date: string,
	options: { includeInactive?: boolean } = {}
): Promise<HabitWithTodayLogs[]> {
	const targetDate = date;
	const start = new Date(`${targetDate}T00:00:00`);
	start.setDate(start.getDate() - 6);
	const startDate = start.toISOString().slice(0, 10);

	const [{ data: habits, error: hErr }, { data: logs, error: lErr }] = await Promise.all([
		(options.includeInactive
			? sb.from('habit_definitions').select('*').eq('user_id', userId).order('created_at')
			: sb
					.from('habit_definitions')
					.select('*')
					.eq('user_id', userId)
					.eq('is_active', true)
					.order('created_at')),
		sb
			.from('habit_logs')
			.select('*')
			.eq('user_id', userId)
			.gte('date', startDate)
			.lte('date', targetDate)
			.order('created_at', { ascending: false })
	]);

	if (hErr) throw hErr;
	if (lErr) throw lErr;

	const totalsByHabitDate = new Map<string, number>();
	for (const log of ((logs ?? []) as HabitLog[])) {
		const key = `${log.habit_id}:${log.date}`;
		totalsByHabitDate.set(key, (totalsByHabitDate.get(key) ?? 0) + log.value);
	}

	return ((habits ?? []) as Habit[]).map((habit) => {
		const normalized = normalizeHabitRecord(habit);
		let daysLogged = 0;
		let daysMet = 0;
		let todayTotal = 0;
		const todayLogs = ((logs ?? []) as HabitLog[]).filter(
			(log) => log.habit_id === habit.id && log.date === targetDate
		);

		for (let offset = 0; offset < 7; offset++) {
			const d = new Date(`${startDate}T00:00:00`);
			d.setDate(d.getDate() + offset);
			const date = d.toISOString().slice(0, 10);
			const total = totalsByHabitDate.get(`${habit.id}:${date}`) ?? 0;

			if (date === targetDate) todayTotal = total;
			if (total > 0) daysLogged += 1;
			if (habit.daily_goal !== null) {
				if (habit.type === 'min_goal' && total >= habit.daily_goal) daysMet += 1;
				if (habit.type === 'max_goal' && total > 0 && total <= habit.daily_goal) daysMet += 1;
			}
		}

		return {
			...normalized,
			total: parseFloat(todayTotal.toFixed(6)),
			daysLogged,
			daysMet,
			todayLogs
		};
	});
}

export async function getHabitLogsForRange(
	sb: AppDbClient,
	userId: string,
	habitId: string,
	startDate: string,
	endDate: string
): Promise<HabitDailyTotal[]> {
	const { data, error } = await sb
		.from('habit_logs')
		.select('date, value')
		.eq('user_id', userId)
		.eq('habit_id', habitId)
		.gte('date', startDate)
		.lte('date', endDate)
		.order('date');
	if (error) throw error;

	const totals = new Map<string, number>();
	for (const log of ((data ?? []) as Pick<HabitLog, 'date' | 'value'>[])) {
		totals.set(log.date, (totals.get(log.date) ?? 0) + log.value);
	}

	const result: HabitDailyTotal[] = [];
	const start = new Date(startDate);
	const end = new Date(endDate);
	for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
		const dateStr = d.toISOString().slice(0, 10);
		result.push({ date: dateStr, total: totals.get(dateStr) ?? 0 });
	}
	return result;
}

// ── Weekly review ────────────────────────────────────────────

function getWeekRange(): { start: string; end: string } {
	const end = new Date().toISOString().slice(0, 10);
	const start = new Date();
	start.setDate(start.getDate() - 6);
	return { start: start.toISOString().slice(0, 10), end };
}

export interface WeeklyHabitSummary {
	date: string;
	total: number;
	met: boolean;
}

export interface WeeklyReviewData {
	habitSummaries: Record<string, { habit: Habit; days: WeeklyHabitSummary[] }>;
	todosCompleted: { date: string; count: number }[];
	notesCreated: { id: string; title: string; content: string; date: string }[];
	weekDays: string[];
}

export async function getWeeklyReviewData(
	sb: AppDbClient,
	userId: string
): Promise<WeeklyReviewData> {
	const { start, end } = getWeekRange();

	const weekDays: string[] = [];
	for (let d = new Date(start); d <= new Date(end); d.setDate(d.getDate() + 1)) {
		weekDays.push(d.toISOString().slice(0, 10));
	}

	// Habits: definitions + logs for the week
	const [{ data: habits, error: hErr }, { data: logs, error: lErr }] = await Promise.all([
		sb.from('habit_definitions').select('*').eq('user_id', userId).eq('is_active', true).order('created_at'),
		sb.from('habit_logs').select('*').eq('user_id', userId).gte('date', start).lte('date', end)
	]);
	if (hErr) throw hErr;
	if (lErr) throw lErr;

	const logsByHabitDate = new Map<string, number>();
	for (const log of ((logs ?? []) as HabitLog[])) {
		const key = `${log.habit_id}:${log.date}`;
		logsByHabitDate.set(key, (logsByHabitDate.get(key) ?? 0) + log.value);
	}

	const habitSummaries: Record<string, { habit: Habit; days: WeeklyHabitSummary[] }> = {};
	for (const habit of ((habits ?? []) as Habit[])) {
		const days = weekDays.map((date) => {
			const total = logsByHabitDate.get(`${habit.id}:${date}`) ?? 0;
			let met = false;
			if (habit.daily_goal !== null) {
				if (habit.type === 'min_goal') met = total >= habit.daily_goal;
				else if (habit.type === 'max_goal') met = total > 0 && total <= habit.daily_goal;
				else met = total > 0;
			} else {
				met = total > 0;
			}
			return { date, total, met };
		});
		habitSummaries[habit.id] = { habit, days };
	}

	// Todos completed this week
	const { data: completedTodos, error: ctErr } = await sb
		.from('todos')
		.select('completed_at')
		.eq('user_id', userId)
		.eq('status', 'done')
		.not('completed_at', 'is', null)
		.gte('completed_at', start)
		.lte('completed_at', `${end}T23:59:59Z`);
	if (ctErr) throw ctErr;

	const completedByDate = new Map<string, number>();
	for (const todo of ((completedTodos ?? []) as { completed_at: string }[])) {
		const date = todo.completed_at.slice(0, 10);
		completedByDate.set(date, (completedByDate.get(date) ?? 0) + 1);
	}
	const todosCompleted = weekDays.map((date) => ({
		date,
		count: completedByDate.get(date) ?? 0
	}));

	// Notes created this week
	const { data: notes, error: nErr } = await sb
		.from('notes')
		.select('id, title, content, date')
		.eq('user_id', userId)
		.not('date', 'is', null)
		.gte('date', start)
		.lte('date', end)
		.order('created_at', { ascending: false });
	if (nErr) throw nErr;

	const notesCreated = ((notes ?? []) as { id: string; title: string; content: string; date: string }[])
		.filter((n) => weekDays.includes(n.date));

	return { habitSummaries, todosCompleted, notesCreated, weekDays };
}

// ── Jobs ──────────────────────────────────────────────────────

export async function getJobs(sb: AppDbClient, userId: string): Promise<Job[]> {
	const { data, error } = await sb
		.from('jobs')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false });
	if (error) throw error;
	return (data ?? []) as any;
}
