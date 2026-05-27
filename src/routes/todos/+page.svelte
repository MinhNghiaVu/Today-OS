<script lang="ts">
	import PageShell from '$lib/components/PageShell.svelte';
	import TodoList from '$lib/components/TodoList.svelte';
	import type { TodoStats } from '$lib/utils/todos';
	import type { PageData } from './$types';

	export let data: PageData;

	const todayStr = new Date().toISOString().slice(0, 10);
	let todoStats: TodoStats = {
		all: data.todos.length,
		pending: data.todos.filter((todo) => todo.status === 'pending').length,
		done: data.todos.filter((todo) => todo.status === 'done').length
	};
</script>

<PageShell title="Todos" subtitle="A clean task ledger for everything that should not stay in your head.">
	<span slot="meta" class="total-badge">{todoStats.pending} pending</span>

	<TodoList
		todos={data.todos}
		today={todayStr}
		addAction="?/add"
		toggleAction="?/toggle"
		updateAction="?/update"
		removeAction="?/remove"
		showFilters
		emptyTitle="No tasks yet"
		emptyDescription="Add your first task using the form above."
		bind:stats={todoStats}
	/>
</PageShell>

<style>
	.total-badge {
		display: inline-flex;
		align-items: center;
		min-height: 28px;
		border-radius: var(--radius-full);
		background: var(--surface-2);
		padding: 0 10px;
		color: var(--text-secondary);
		font-size: 13px;
	}
</style>
