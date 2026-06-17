export type Filter =
	| { kind: 'eq' | 'gte' | 'lte' | 'lt'; column: string; value: unknown }
	| { kind: 'not-null'; column: string }
	| { kind: 'today-todos'; date: string };

export type Order = { column: string; ascending: boolean };

export interface BuiltSql {
	text: string;
	values: unknown[];
}

const TABLES = new Set(['users', 'todos', 'habit_definitions', 'habit_logs', 'notes', 'jobs', 'focus_sessions']);
const COLUMNS = new Set([
	'id',
	'user_id',
	'email',
	'display_name',
	'preferences',
	'google_access_token',
	'google_refresh_token',
	'google_token_expiry',
	'title',
	'description',
	'status',
	'due_date',
	'priority',
	'note_id',
	'created_at',
	'completed_at',
	'name',
	'unit',
	'type',
	'daily_goal',
	'color',
	'is_active',
	'updated_at',
	'habit_id',
	'date',
	'value',
	'content',
	'company',
	'role',
	'interview_stage',
	'job_url',
	'contact',
	'notes',
	'applied_date',
	'interviewer',
	'duration_seconds',
]);

const UPDATE_CASTS: Record<string, string> = {
	applied_date: 'date',
	completed_at: 'timestamptz',
	daily_goal: 'numeric',
	date: 'date',
	due_date: 'date',
	google_token_expiry: 'timestamptz',
	is_active: 'boolean',
	preferences: 'jsonb',
	updated_at: 'timestamptz',
	value: 'numeric'
};

const UUID_ID_TABLES = new Set(['todos', 'habit_definitions', 'habit_logs', 'notes', 'jobs', 'focus_sessions']);
const UUID_COLUMNS = new Set(['habit_id', 'note_id']);

export function ident(value: string) {
	if (!TABLES.has(value) && !COLUMNS.has(value)) throw new Error(`Unknown SQL identifier: ${value}`);
	return `"${value}"`;
}

export function selection(columns: string) {
	if (columns.trim() === '*') return '*';
	return columns
		.split(',')
		.map((column) => ident(column.trim()))
		.join(', ');
}

function param(index: number, column: string, table: string) {
	const cast =
		column === 'id' && UUID_ID_TABLES.has(table)
			? 'uuid'
			: UUID_COLUMNS.has(column)
				? 'uuid'
				: UPDATE_CASTS[column];
	return cast ? `cast($${index} as ${cast})` : `$${index}`;
}

function addFilterParts(filters: Filter[], table: string, parts: string[], values: unknown[]) {
	for (const filter of filters) {
		if (filter.kind === 'not-null') {
			parts.push(`${ident(filter.column)} is not null`);
			continue;
		}
		if (filter.kind === 'today-todos') {
			values.push(filter.date, filter.date);
			parts.push(`("due_date" = $${values.length - 1} or ("status" = 'pending' and "due_date" < $${values.length}))`);
			continue;
		}
		values.push(filter.value);
		const operator = filter.kind === 'eq' ? '=' : filter.kind === 'gte' ? '>=' : filter.kind === 'lte' ? '<=' : '<';
		parts.push(`${ident(filter.column)} ${operator} ${param(values.length, filter.column, table)}`);
	}
}

export function buildOrderSql(orders: Order[]) {
	return orders.length
		? ` order by ${orders.map((order) => `${ident(order.column)} ${order.ascending ? 'asc' : 'desc'}`).join(', ')}`
		: '';
}

export function buildWhereSql(filters: Filter[], table: string, values: unknown[]) {
	const parts: string[] = [];
	addFilterParts(filters, table, parts, values);
	return parts.length ? ` where ${parts.join(' and ')}` : '';
}

export function buildUpdateStatement(
	table: string,
	payload: Record<string, unknown>,
	filters: Filter[],
	returnColumns: string | null = null
): BuiltSql {
	const values: unknown[] = [];
	const assignments = Object.entries(payload).map(([column, value]) => {
		values.push(value);
		return `${ident(column)} = ${param(values.length, column, table)}`;
	});
	const whereSql = buildWhereSql(filters, table, values);
	const returning = returnColumns ? ` returning ${selection(returnColumns)}` : '';
	return {
		text: `update ${ident(table)} set ${assignments.join(', ')}${whereSql}${returning}`,
		values
	};
}
