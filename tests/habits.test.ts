// @ts-nocheck
import { describe, expect, test } from 'bun:test';
import {
	applyHabitLogAdd,
	applyHabitLogRemove,
	applyHabitLogUpdate,
	createOptimisticHabitLog,
	replaceHabitLog
} from '../src/lib/utils/habits';
import type { HabitLog, HabitWithTodayLogs } from '../src/lib/types';

function habit(overrides: Partial<HabitWithTodayLogs> = {}): HabitWithTodayLogs {
	return {
		id: '11111111-1111-4111-8111-111111111111',
		user_id: 'user_1',
		name: 'Water',
		unit: 'ml',
		type: 'min_goal',
		daily_goal: 2000,
		color: '#3b82f6',
		is_active: true,
		total: 0,
		daysLogged: 0,
		daysMet: 0,
		todayLogs: [],
		...overrides
	};
}

describe('habit optimistic helpers', () => {
	test('replaces an optimistic log with the server log while preserving the total', () => {
		const optimistic = createOptimisticHabitLog({
			habitId: '11111111-1111-4111-8111-111111111111',
			value: 330,
			sequence: 1,
			date: '2026-05-24',
			now: '2026-05-24T03:00:00.000Z'
		});
		const serverLog: HabitLog = {
			...optimistic,
			id: '22222222-2222-4222-8222-222222222222',
			user_id: 'user_1'
		};

		const withOptimistic = applyHabitLogAdd([habit()], optimistic);
		const [reconciled] = replaceHabitLog(withOptimistic, optimistic.id, serverLog);

		expect(reconciled.total).toBe(330);
		expect(reconciled.todayLogs.map((log) => log.id)).toEqual([serverLog.id]);
	});

	test('updates a habit log and adjusts the derived total', () => {
		const existing: HabitLog = {
			id: '33333333-3333-4333-8333-333333333333',
			user_id: 'user_1',
			habit_id: '11111111-1111-4111-8111-111111111111',
			date: '2026-05-24',
			value: 250,
			created_at: '2026-05-24T02:00:00.000Z'
		};

		const [updated] = applyHabitLogUpdate([habit({ total: 250, todayLogs: [existing] })], {
			...existing,
			value: 500
		});

		expect(updated.total).toBe(500);
		expect(updated.todayLogs[0].value).toBe(500);
	});

	test('increments the seven-day goal count when an optimistic log meets the goal', () => {
		const log = createOptimisticHabitLog({
			habitId: '11111111-1111-4111-8111-111111111111',
			value: 2500,
			sequence: 2,
			date: '2026-05-24',
			now: '2026-05-24T03:00:00.000Z'
		});

		const [updated] = applyHabitLogAdd([habit()], log);

		expect(updated.total).toBe(2500);
		expect(updated.daysLogged).toBe(1);
		expect(updated.daysMet).toBe(1);
	});

	test('updates the seven-day goal count when editing or removing a met day', () => {
		const existing: HabitLog = {
			id: '44444444-4444-4444-8444-444444444444',
			user_id: 'user_1',
			habit_id: '11111111-1111-4111-8111-111111111111',
			date: '2026-05-24',
			value: 2500,
			created_at: '2026-05-24T02:00:00.000Z'
		};
		const starting = habit({ total: 2500, daysLogged: 1, daysMet: 1, todayLogs: [existing] });

		const [belowGoal] = applyHabitLogUpdate([starting], { ...existing, value: 500 });
		const [removed] = applyHabitLogRemove([starting], existing);

		expect(belowGoal.total).toBe(500);
		expect(belowGoal.daysLogged).toBe(1);
		expect(belowGoal.daysMet).toBe(0);
		expect(removed.total).toBe(0);
		expect(removed.daysLogged).toBe(0);
		expect(removed.daysMet).toBe(0);
	});
});
