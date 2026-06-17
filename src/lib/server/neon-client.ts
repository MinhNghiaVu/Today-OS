import { neon } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';
import {
	buildOrderSql,
	buildUpdateStatement,
	buildWhereSql,
	ident,
	selection,
	type Filter,
	type Order
} from '$lib/server/neon-sql';

let sql: ReturnType<typeof neon> | null = null;
const ensuredUserIds = new Set<string>();

function getSql() {
	const connectionString = env.DATABASE_URL || env.POSTGRES_URL || env.POSTGRES_PRISMA_URL;
	if (!connectionString) throw new Error('DATABASE_URL, POSTGRES_URL, or POSTGRES_PRISMA_URL is not configured.');
	sql ??= neon(connectionString);
	return sql;
}

function normalizeRow<T>(row: T): T {
	if (!row || typeof row !== 'object') return row;
	const next = { ...(row as Record<string, unknown>) };
	for (const key of ['value', 'daily_goal', 'total']) {
		if (typeof next[key] === 'string') next[key] = Number(next[key]);
	}
	for (const key of ['applied_date', 'date', 'due_date']) {
		if (next[key] instanceof Date) next[key] = next[key].toISOString().slice(0, 10);
	}
	return next as T;
}

function normalizeRows<T>(rows: T[]): T[] {
	return rows.map((row) => normalizeRow(row));
}

function errorResult(error: unknown) {
	return {
		data: null,
		error: error instanceof Error ? error : new Error(String(error))
	};
}

export async function query<T = Record<string, unknown>>(text: string, values: unknown[] = []) {
	const rows = await getSql().query(text, values);
	return normalizeRows(rows as T[]);
}

export async function ensureUser(user: { id: string; email?: string | null }) {
	if (ensuredUserIds.has(user.id)) return;
	await query(
		`insert into "users" ("id", "email", "display_name")
		 values ($1, $2, $3)
		 on conflict ("id") do nothing`,
		[user.id, user.email ?? '', user.email ?? 'Today OS user']
	);
	ensuredUserIds.add(user.id);
}

class QueryBuilder {
	private op: 'select' | 'insert' | 'update' | 'delete' = 'select';
	private selectColumns = '*';
	private filters: Filter[] = [];
	private orders: Order[] = [];
	private payload: Record<string, unknown> | Record<string, unknown>[] | null = null;
	private returnColumns: string | null = null;
	private singleRow = false;

	constructor(private table: string) {
		ident(table);
	}

	select(columns = '*') {
		if (this.op === 'insert' || this.op === 'update' || this.op === 'delete') {
			this.returnColumns = columns;
		} else {
			this.op = 'select';
			this.selectColumns = columns;
		}
		return this;
	}

	insert(payload: Record<string, unknown> | Record<string, unknown>[]) {
		this.op = 'insert';
		this.payload = payload;
		return this;
	}

	update(payload: Record<string, unknown>) {
		this.op = 'update';
		this.payload = payload;
		return this;
	}

	delete() {
		this.op = 'delete';
		return this;
	}

	eq(column: string, value: unknown) {
		this.filters.push({ kind: 'eq', column, value });
		return this;
	}

	gte(column: string, value: unknown) {
		this.filters.push({ kind: 'gte', column, value });
		return this;
	}

	lte(column: string, value: unknown) {
		this.filters.push({ kind: 'lte', column, value });
		return this;
	}

	lt(column: string, value: unknown) {
		this.filters.push({ kind: 'lt', column, value });
		return this;
	}

	not(column: string, operator: string, value: unknown) {
		if (operator === 'is' && value === null) this.filters.push({ kind: 'not-null', column });
		return this;
	}

	or(expression: string) {
		const match = expression.match(/^due_date\.eq\.([^,]+),and\(status\.eq\.pending,due_date\.lt\.([^)]+)\)$/);
		if (match) this.filters.push({ kind: 'today-todos', date: match[1] });
		return this;
	}

	order(column: string, options: { ascending?: boolean } = {}) {
		this.orders.push({ column, ascending: options.ascending ?? true });
		return this;
	}

	single() {
		this.singleRow = true;
		return this;
	}

	then<TResult1 = { data: any; error: Error | null }, TResult2 = never>(
		onfulfilled?: ((value: { data: any; error: Error | null }) => TResult1 | PromiseLike<TResult1>) | null,
		onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
	) {
		return this.execute().then(onfulfilled, onrejected);
	}

	private async execute(): Promise<{ data: any; error: Error | null }> {
		try {
			const orderSql = buildOrderSql(this.orders);

			if (this.op === 'select') {
				const values: unknown[] = [];
				const whereSql = buildWhereSql(this.filters, this.table, values);
				const rows = await query(`select ${selection(this.selectColumns)} from ${ident(this.table)}${whereSql}${orderSql}`, values);
				return { data: this.singleRow ? (rows[0] ?? null) : rows, error: null };
			}

			if (this.op === 'insert') {
				const values: unknown[] = [];
				const rows = Array.isArray(this.payload) ? this.payload : [this.payload as Record<string, unknown>];
				const columns = Object.keys(rows[0] ?? {});
				const placeholders = rows
					.map((row) => {
						const rowValues = columns.map((column) => {
							values.push(row[column]);
							return `$${values.length}`;
						});
						return `(${rowValues.join(', ')})`;
					})
					.join(', ');
				const returning = this.returnColumns ? ` returning ${selection(this.returnColumns)}` : '';
				const data = await query(
					`insert into ${ident(this.table)} (${columns.map(ident).join(', ')}) values ${placeholders}${returning}`,
					values
				);
				return { data: this.singleRow ? (data[0] ?? null) : data, error: null };
			}

			if (this.op === 'update') {
				const patch = this.payload as Record<string, unknown>;
				const statement = buildUpdateStatement(this.table, patch, this.filters, this.returnColumns);
				const data = await query(statement.text, statement.values);
				return {
					data: this.returnColumns ? (this.singleRow ? (data[0] ?? null) : data) : null,
					error: null
				};
			}

			const values: unknown[] = [];
			const whereSql = buildWhereSql(this.filters, this.table, values);
			const returning = this.returnColumns ? ` returning ${selection(this.returnColumns)}` : '';
			const data = await query(`delete from ${ident(this.table)}${whereSql}${returning}`, values);
			return {
				data: this.returnColumns ? (this.singleRow ? (data[0] ?? null) : data) : null,
				error: null
			};
		} catch (error) {
			return errorResult(error);
		}
	}
}

export function createDbClient() {
	return {
		from(table: string) {
			return new QueryBuilder(table);
		}
	};
}

export type AppDbClient = ReturnType<typeof createDbClient>;
