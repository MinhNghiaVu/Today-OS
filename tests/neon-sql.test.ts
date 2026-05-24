// @ts-nocheck
import { describe, expect, test } from 'bun:test';
import { buildUpdateStatement, type Filter } from '../src/lib/server/neon-sql';

function referencedParams(text: string): number[] {
	return [...text.matchAll(/\$(\d+)/g)].map((match) => Number(match[1]));
}

function expectDenseParams(text: string, values: unknown[]) {
	const refs = referencedParams(text);
	expect(new Set(refs)).toEqual(new Set(Array.from({ length: values.length }, (_, index) => index + 1)));
}

describe('Neon SQL builder', () => {
	test('builds todo updates without untyped unused leading filter params', () => {
		const id = '11111111-1111-4111-8111-111111111111';
		const userId = 'user_1';
		const filters: Filter[] = [
			{ kind: 'eq', column: 'id', value: id },
			{ kind: 'eq', column: 'user_id', value: userId }
		];

		const statement = buildUpdateStatement(
			'todos',
			{ status: 'done', completed_at: null },
			filters,
			'*'
		);

		expect(statement.text).toBe(
			'update "todos" set "status" = $1, "completed_at" = cast($2 as timestamptz) where "id" = cast($3 as uuid) and "user_id" = $4 returning *'
		);
		expect(statement.values).toEqual(['done', null, id, userId]);
		expectDenseParams(statement.text, statement.values);
	});

	test('builds habit log updates with numeric and uuid casts in one parameter sequence', () => {
		const logId = '22222222-2222-4222-8222-222222222222';
		const userId = 'user_1';

		const statement = buildUpdateStatement(
			'habit_logs',
			{ value: 1.5 },
			[
				{ kind: 'eq', column: 'id', value: logId },
				{ kind: 'eq', column: 'user_id', value: userId }
			],
			'*'
		);

		expect(statement.text).toBe(
			'update "habit_logs" set "value" = cast($1 as numeric) where "id" = cast($2 as uuid) and "user_id" = $3 returning *'
		);
		expect(statement.values).toEqual([1.5, logId, userId]);
		expectDenseParams(statement.text, statement.values);
	});
});
