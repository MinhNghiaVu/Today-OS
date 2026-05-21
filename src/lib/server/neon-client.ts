import { neon } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';

type Filter =
	| { kind: 'eq' | 'gte' | 'lte'; column: string; value: unknown }
	| { kind: 'not-null'; column: string }
	| { kind: 'today-todos'; date: string };

type Order = { column: string; ascending: boolean };

const TABLES = new Set(['users', 'todos', 'habit_definitions', 'habit_logs', 'notes', 'jobs']);
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
	'applied_date',
	'interviewer',
	'notes'
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

const UUID_ID_TABLES = new Set(['todos', 'habit_definitions', 'habit_logs', 'notes', 'jobs']);
const UUID_COLUMNS = new Set(['habit_id', 'note_id']);

let sql: ReturnType<typeof neon> | null = null;
let schemaReady: Promise<void> | null = null;
const ensuredUserIds = new Set<string>();

const SCHEMA = [
	'create extension if not exists pgcrypto',
	`create table if not exists public.users (
		id text primary key,
		email text not null default '',
		display_name text,
		preferences jsonb not null default '{"theme":"dark","accentIndex":0}'::jsonb,
		google_access_token text,
		google_refresh_token text,
		google_token_expiry timestamptz,
		created_at timestamptz not null default now(),
		updated_at timestamptz not null default now()
	)`,
	`create table if not exists public.todos (
		id uuid primary key default gen_random_uuid(),
		user_id text not null references public.users(id) on delete cascade,
		title text not null,
		description text,
		status text not null default 'pending' check (status in ('pending', 'done')),
		due_date date,
		priority text check (priority in ('high', 'medium', 'low')),
		note_id uuid,
		created_at timestamptz not null default now(),
		completed_at timestamptz
	)`,
	'create index if not exists todos_user_due on public.todos (user_id, due_date)',
	`create table if not exists public.habit_definitions (
		id uuid primary key default gen_random_uuid(),
		user_id text not null references public.users(id) on delete cascade,
		name text not null,
		unit text not null,
		type text not null check (type in ('min_goal', 'max_goal', 'info_only')),
		daily_goal numeric,
		color text not null default '#6366f1',
		is_active boolean not null default true,
		created_at timestamptz not null default now(),
		updated_at timestamptz not null default now()
	)`,
	`create table if not exists public.habit_logs (
		id uuid primary key default gen_random_uuid(),
		user_id text not null references public.users(id) on delete cascade,
		habit_id uuid not null references public.habit_definitions(id) on delete cascade,
		date date not null,
		value numeric not null,
		created_at timestamptz not null default now()
	)`,
	'create index if not exists habit_logs_user_date on public.habit_logs (user_id, date)',
	'create index if not exists habit_logs_habit_date on public.habit_logs (habit_id, date)',
	`create table if not exists public.notes (
		id uuid primary key default gen_random_uuid(),
		user_id text not null references public.users(id) on delete cascade,
		title text not null default 'Untitled',
		content text not null default '',
		type text not null default 'note' check (type in ('note', 'draft', 'list')),
		date date,
		created_at timestamptz not null default now(),
		updated_at timestamptz not null default now()
	)`,
	'create index if not exists notes_user_updated on public.notes (user_id, updated_at desc)',
	`create table if not exists public.jobs (
		id uuid primary key default gen_random_uuid(),
		user_id text not null references public.users(id) on delete cascade,
		company text not null,
		role text,
		status text not null default 'pending'
			check (status in ('pending','applied','recruiter_screen','interview','offer','rejected','ghosted','dropped')),
		interview_stage text
			check (interview_stage is null or interview_stage in ('first_round','second_round','third_round','fourth_round','fifth_round')),
		job_url text,
		contact text,
		applied_date date,
		interviewer text,
		notes text,
		created_at timestamptz not null default now(),
		updated_at timestamptz not null default now()
	)`,
	'create index if not exists jobs_user_created on public.jobs (user_id, created_at desc)'
];

function getSql() {
	const connectionString = env.DATABASE_URL || env.POSTGRES_URL || env.POSTGRES_PRISMA_URL;
	if (!connectionString) throw new Error('DATABASE_URL, POSTGRES_URL, or POSTGRES_PRISMA_URL is not configured.');
	sql ??= neon(connectionString);
	return sql;
}

function ident(value: string) {
	if (!TABLES.has(value) && !COLUMNS.has(value)) throw new Error(`Unknown SQL identifier: ${value}`);
	return `"${value}"`;
}

function selection(columns: string) {
	if (columns.trim() === '*') return '*';
	return columns
		.split(',')
		.map((column) => ident(column.trim()))
		.join(', ');
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

function param(index: number, column: string, table: string) {
	const cast =
		column === 'id' && UUID_ID_TABLES.has(table)
			? 'uuid'
			: UUID_COLUMNS.has(column)
				? 'uuid'
				: UPDATE_CASTS[column];
	return cast ? `cast($${index} as ${cast})` : `$${index}`;
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

export async function ensureSchema() {
	if (schemaReady) return schemaReady;
	schemaReady = (async () => {
		const db = getSql();
		for (const statement of SCHEMA) await db.query(statement);
	})();
	return schemaReady;
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
		this.op = this.op === 'insert' ? 'insert' : 'select';
		if (this.op === 'insert') this.returnColumns = columns;
		else this.selectColumns = columns;
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

	private addFilters(parts: string[], values: unknown[]) {
		for (const filter of this.filters) {
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
			const operator = filter.kind === 'eq' ? '=' : filter.kind === 'gte' ? '>=' : '<=';
			parts.push(`${ident(filter.column)} ${operator} ${param(values.length, filter.column, this.table)}`);
		}
	}

	private async execute(): Promise<{ data: any; error: Error | null }> {
		try {
			const values: unknown[] = [];
			const where: string[] = [];
			this.addFilters(where, values);
			const whereSql = where.length ? ` where ${where.join(' and ')}` : '';
			const orderSql = this.orders.length
				? ` order by ${this.orders.map((order) => `${ident(order.column)} ${order.ascending ? 'asc' : 'desc'}`).join(', ')}`
				: '';

			if (this.op === 'select') {
				const rows = await query(`select ${selection(this.selectColumns)} from ${ident(this.table)}${whereSql}${orderSql}`, values);
				return { data: this.singleRow ? (rows[0] ?? null) : rows, error: null };
			}

			if (this.op === 'insert') {
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
				const assignments = Object.entries(patch).map(([column, value]) => {
					values.push(value);
					return `${ident(column)} = ${param(values.length, column, this.table)}`;
				});
				const filterValues: unknown[] = [];
				const filterParts: string[] = [];
				this.addFilters(filterParts, filterValues);
				const offsetParts = filterParts.map((part) =>
					part.replace(/\$(\d+)/g, (_, index) => `$${Number(index) + values.length}`)
				);
				await query(
					`update ${ident(this.table)} set ${assignments.join(', ')}${offsetParts.length ? ` where ${offsetParts.join(' and ')}` : ''}`,
					[...values, ...filterValues]
				);
				return { data: null, error: null };
			}

			const filterValues: unknown[] = [];
			const filterParts: string[] = [];
			this.addFilters(filterParts, filterValues);
			await query(`delete from ${ident(this.table)}${filterParts.length ? ` where ${filterParts.join(' and ')}` : ''}`, filterValues);
			return { data: null, error: null };
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
