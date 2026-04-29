import type { SupabaseClient } from '@supabase/supabase-js';
import type { Todo, Habit, HabitLog, HabitWithTotal, Note } from './types';

function today(): string {
	return new Date().toISOString().slice(0, 10);
}

// ── Todos ─────────────────────────────────────────────────────

export async function getTodos(sb: SupabaseClient, userId: string): Promise<Todo[]> {
	const { data, error } = await sb
		.from('todos')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false });
	if (error) throw error;
	return data ?? [];
}

export async function getTodosToday(sb: SupabaseClient, userId: string): Promise<Todo[]> {
	const d = today();
	const { data, error } = await sb
		.from('todos')
		.select('*')
		.eq('user_id', userId)
		.or(`due_date.eq.${d},and(status.eq.pending,due_date.lt.${d})`);
	if (error) throw error;

	const rank: Record<string, number> = { high: 0, medium: 1, low: 2 };
	return (data ?? []).sort((a, b) => {
		if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
		return (rank[a.priority ?? ''] ?? 3) - (rank[b.priority ?? ''] ?? 3);
	});
}

// ── Habits ────────────────────────────────────────────────────

export async function getHabits(sb: SupabaseClient, userId: string): Promise<Habit[]> {
	const { data, error } = await sb
		.from('habit_definitions')
		.select('*')
		.eq('user_id', userId)
		.order('created_at');
	if (error) throw error;
	return data ?? [];
}

export async function getHabitTotalsToday(
	sb: SupabaseClient,
	userId: string
): Promise<HabitWithTotal[]> {
	const d = today();

	const [{ data: habits, error: hErr }, { data: logs, error: lErr }] = await Promise.all([
		sb.from('habit_definitions').select('*').eq('user_id', userId).eq('is_active', true).order('created_at'),
		sb.from('habit_logs').select('*').eq('user_id', userId).eq('date', d)
	]);

	if (hErr) throw hErr;
	if (lErr) throw lErr;

	const totals = new Map<string, number>();
	for (const log of logs ?? []) {
		totals.set(log.habit_id, (totals.get(log.habit_id) ?? 0) + log.value);
	}

	return (habits ?? []).map((h) => ({
		...h,
		total: parseFloat(((totals.get(h.id) ?? 0)).toFixed(6))
	}));
}

export async function getLogsForHabitToday(
	sb: SupabaseClient,
	habitId: string
): Promise<HabitLog[]> {
	const { data, error } = await sb
		.from('habit_logs')
		.select('*')
		.eq('habit_id', habitId)
		.eq('date', today())
		.order('created_at', { ascending: false });
	if (error) throw error;
	return data ?? [];
}

// ── Notes ─────────────────────────────────────────────────────

export async function getNotes(sb: SupabaseClient, userId: string): Promise<Note[]> {
	const { data, error } = await sb
		.from('notes')
		.select('*')
		.eq('user_id', userId)
		.order('updated_at', { ascending: false });
	if (error) throw error;
	return data ?? [];
}
