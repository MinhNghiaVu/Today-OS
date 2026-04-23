import { writable, derived } from 'svelte/store';
import type { Todo, TodoPriority, Habit, HabitLog, Note } from './types';

function uid(): string {
	return Math.random().toString(36).slice(2, 10);
}

function today(): string {
	return new Date().toISOString().slice(0, 10);
}

// ── Todos ────────────────────────────────────────────────────────────────────

const _todos = writable<Todo[]>([
	{ id: uid(), title: 'Review morning notes', status: 'pending', due_date: today(), created_at: today() },
	{ id: uid(), title: 'Write daily log', status: 'done', due_date: today(), created_at: today(), completed_at: new Date().toISOString() },
	{ id: uid(), title: 'Buy groceries', status: 'pending', due_date: today(), priority: 'medium', created_at: today() },
	{ id: uid(), title: 'Finish assignment', status: 'pending', due_date: today(), priority: 'high', description: 'Chapter 3 review — due Friday', created_at: today() }
]);

export const todos = {
	subscribe: _todos.subscribe,
	add(title: string, opts?: Partial<Pick<Todo, 'description' | 'due_date' | 'priority'>>) {
		_todos.update((t) => [
			...t,
			{ id: uid(), title, status: 'pending', created_at: new Date().toISOString(), ...opts }
		]);
	},
	toggle(id: string) {
		_todos.update((t) =>
			t.map((x) => {
				if (x.id !== id) return x;
				const nowDone = x.status !== 'done';
				return {
					...x,
					status: nowDone ? 'done' : 'pending',
					completed_at: nowDone ? new Date().toISOString() : undefined
				};
			})
		);
	},
	update(id: string, patch: Partial<Omit<Todo, 'id' | 'created_at'>>) {
		_todos.update((t) => t.map((x) => (x.id === id ? { ...x, ...patch } : x)));
	},
	remove(id: string) {
		_todos.update((t) => t.filter((x) => x.id !== id));
	}
};

const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };

export const todosToday = derived(_todos, ($todos) => {
	const d = today();
	return $todos
		.filter((t) => t.due_date === d || (t.status === 'pending' && !!t.due_date && t.due_date < d))
		.sort((a, b) => {
			if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
			const pa = priorityRank[a.priority ?? ''] ?? 3;
			const pb = priorityRank[b.priority ?? ''] ?? 3;
			return pa - pb;
		});
});

// ── Habits ───────────────────────────────────────────────────────────────────

const _habits = writable<Habit[]>([
	{ id: 'h1', name: 'Water', unit: 'ml', type: 'min_goal', daily_goal: 2000, color: '#6366f1', is_active: true },
	{ id: 'h2', name: 'Exercise', unit: 'minutes', type: 'min_goal', daily_goal: 30, color: '#10b981', is_active: true },
	{ id: 'h3', name: 'Screen time', unit: 'hours', type: 'max_goal', daily_goal: 4, color: '#f59e0b', is_active: true },
	{ id: 'h4', name: 'Sleep', unit: 'hours', type: 'info_only', daily_goal: null, color: '#8b5cf6', is_active: true }
]);

export const habits = {
	subscribe: _habits.subscribe,
	add(draft: Omit<Habit, 'id'>) {
		_habits.update((h) => [...h, { id: uid(), ...draft }]);
	},
	update(id: string, patch: Partial<Omit<Habit, 'id'>>) {
		_habits.update((h) => h.map((x) => (x.id === id ? { ...x, ...patch } : x)));
	},
	toggleActive(id: string) {
		_habits.update((h) => h.map((x) => (x.id === id ? { ...x, is_active: !x.is_active } : x)));
	},
	remove(id: string) {
		_habits.update((h) => h.filter((x) => x.id !== id));
	}
};

// ── Habit Logs ────────────────────────────────────────────────────────────────

const _habitLogs = writable<HabitLog[]>([
	{ id: uid(), habitId: 'h1', date: today(), amount: 500, loggedAt: new Date().toISOString() },
	{ id: uid(), habitId: 'h1', date: today(), amount: 330, loggedAt: new Date().toISOString() },
	{ id: uid(), habitId: 'h2', date: today(), amount: 15, loggedAt: new Date().toISOString() }
]);

export const habitLogs = {
	subscribe: _habitLogs.subscribe,
	log(habitId: string, amount: number) {
		_habitLogs.update((l) => [
			...l,
			{ id: uid(), habitId, date: today(), amount, loggedAt: new Date().toISOString() }
		]);
	},
	remove(id: string) {
		_habitLogs.update((l) => l.filter((x) => x.id !== id));
	},
	update(id: string, amount: number) {
		_habitLogs.update((l) => l.map((x) => (x.id === id ? { ...x, amount } : x)));
	}
};

export const habitTotalsToday = derived([_habits, _habitLogs], ([$habits, $logs]) => {
	const d = today();
	const map = new Map<string, number>();
	for (const log of $logs) {
		if (log.date === d) map.set(log.habitId, (map.get(log.habitId) ?? 0) + log.amount);
	}
	return $habits
		.filter((h) => h.is_active)
		.map((h) => ({ ...h, total: map.get(h.id) ?? 0 }));
});

// ── Notes ────────────────────────────────────────────────────────────────────

const _notes = writable<Note[]>([
	{
		id: uid(),
		title: 'Welcome',
		content: '# Welcome to Today OS\n\nStart writing your notes here.',
		updatedAt: new Date().toISOString()
	}
]);

export const notes = {
	subscribe: _notes.subscribe,
	add(title: string, content = '') {
		_notes.update((n) => [
			...n,
			{ id: uid(), title, content, updatedAt: new Date().toISOString() }
		]);
	},
	update(id: string, patch: Partial<Pick<Note, 'title' | 'content'>>) {
		_notes.update((n) =>
			n.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x))
		);
	},
	remove(id: string) {
		_notes.update((n) => n.filter((x) => x.id !== id));
	}
};
