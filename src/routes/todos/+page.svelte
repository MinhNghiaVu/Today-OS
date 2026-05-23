<script lang="ts">
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

<div class="page">
	<header class="page-header">
		<h1>Todos</h1>
		<span class="total-badge">{todoStats.pending} pending</span>
	</header>

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
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding: 32px 24px;
	}

	.page-header {
		display: flex;
		align-items: baseline;
		gap: 12px;
	}

	h1 {
		margin: 0;
		color: var(--text-primary);
		font-size: 24px;
		font-weight: 600;
		letter-spacing: -0.01em;
		line-height: 1.2;
	}

	.total-badge {
		color: var(--text-secondary);
		font-size: 13px;
	}

	@media (max-width: 560px) {
		.page {
			padding: 28px 16px;
		}
	}
</style>
