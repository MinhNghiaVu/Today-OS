// @ts-nocheck
import { describe, expect, test } from 'bun:test';
import {
	TODO_OPTIMISTIC_ID_PREFIX,
	applyTodoToggle,
	createOptimisticTodo,
	reconcileTodos,
	sortTodos
} from '../src/lib/utils/todos';

function todo(overrides) {
	return {
		id: '11111111-1111-4111-8111-111111111111',
		user_id: 'user_1',
		title: 'Ship todo recovery',
		status: 'pending',
		created_at: '2026-05-23T00:00:00.000Z',
		...overrides
	};
}

describe('todo optimistic helpers', () => {
	test('reconciles an optimistic add with the server row that has the same intent', () => {
		const optimistic = createOptimisticTodo({
			title: 'Ship todo recovery',
			dueDate: '2026-05-23',
			priority: 'high',
			sequence: 1,
			now: '2026-05-23T00:00:00.000Z'
		});
		const serverTodo = todo({
			id: '22222222-2222-4222-8222-222222222222',
			due_date: '2026-05-23',
			priority: 'high'
		});

		const [reconciled] = reconcileTodos([serverTodo], [optimistic]);

		expect(reconciled.id).toBe(serverTodo.id);
		expect(reconciled.ui_id).toBe(optimistic.id);
		expect(optimistic.id.startsWith(TODO_OPTIMISTIC_ID_PREFIX)).toBe(true);
	});

	test('sorts pending todos before done todos, then by priority and creation time', () => {
		const sorted = sortTodos([
			todo({ id: 'done', title: 'Done', status: 'done', priority: 'high' }),
			todo({ id: 'low', title: 'Low', priority: 'low', created_at: '2026-05-23T00:01:00.000Z' }),
			todo({ id: 'high', title: 'High', priority: 'high', created_at: '2026-05-23T00:02:00.000Z' }),
			todo({ id: 'none', title: 'None', priority: undefined, created_at: '2026-05-23T00:00:00.000Z' })
		]);

		expect(sorted.map((item) => item.id)).toEqual(['high', 'low', 'none', 'done']);
	});

	test('toggles a todo locally while preserving the original id', () => {
		const item = todo({ id: '33333333-3333-4333-8333-333333333333' });
		const [updated] = applyTodoToggle([item], item);

		expect(updated.id).toBe(item.id);
		expect(updated.status).toBe('done');
		expect(updated.completed_at).toBeTruthy();
	});
});
