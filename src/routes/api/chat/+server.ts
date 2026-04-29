import { error } from '@sveltejs/kit';
// import Anthropic from '@anthropic-ai/sdk';
// import { ANTHROPIC_API_KEY } from '$env/static/private';
// import { getHabitTotalsToday, getTodosToday, getNotes } from '$lib/db';
import type { RequestHandler } from './$types';

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

function buildSystemPrompt(
	habitTotals: Awaited<ReturnType<typeof getHabitTotalsToday>>,
	todos: Awaited<ReturnType<typeof getTodosToday>>,
	notes: Awaited<ReturnType<typeof getNotes>>
): string {
	const todayStr = new Date().toLocaleDateString('en-AU', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	const habitsSection =
		habitTotals.length > 0
			? habitTotals
					.map((h) => {
						const goal = h.daily_goal ? ` / ${h.daily_goal} ${h.unit}` : ` ${h.unit}`;
						const status =
							h.daily_goal && h.type === 'min_goal'
								? h.total >= h.daily_goal
									? 'goal met'
									: 'goal not met'
								: h.daily_goal && h.type === 'max_goal'
									? h.total > h.daily_goal
										? 'over limit'
										: 'within limit'
									: 'tracking';
						return `- ${h.name}: ${h.total}${goal} (${status})`;
					})
					.join('\n')
			: 'No habits tracked today.';

	const pendingTodos = todos.filter((t) => t.status === 'pending');
	const doneTodos = todos.filter((t) => t.status === 'done');
	const todosSection =
		todos.length > 0
			? [
					pendingTodos.length > 0
						? `Pending (${pendingTodos.length}):\n${pendingTodos.map((t) => `- ${t.title}${t.priority ? ` [${t.priority}]` : ''}`).join('\n')}`
						: '',
					doneTodos.length > 0
						? `Done (${doneTodos.length}):\n${doneTodos.map((t) => `- ${t.title}`).join('\n')}`
						: ''
				]
					.filter(Boolean)
					.join('\n')
			: 'No todos for today.';

	const recentNotes = notes.slice(0, 10);
	const notesSection =
		recentNotes.length > 0
			? recentNotes
					.map((n) => {
						const preview = n.content.slice(0, 200).replace(/\n+/g, ' ');
						return `- "${n.title}" (${n.type}): ${preview}${n.content.length > 200 ? '…' : ''}`;
					})
					.join('\n')
			: 'No notes yet.';

	return `You are a personal daily assistant integrated into "Today OS", a personal productivity app. You help the user understand their habits, todos, and notes. You are warm, concise, and data-driven.

Today is ${todayStr}.

## Today's habit data
${habitsSection}

## Today's todos
${todosSection}

## Recent notes (up to 10)
${notesSection}

## Guidelines
- Answer questions about the user's data above. You have the authoritative numbers — use them directly rather than asking the user to check.
- For questions outside this data (general knowledge, future planning, etc.), you can still help but make clear you're not drawing from tracked data.
- Keep responses short and scannable. Use bullet points for lists, plain prose for explanations.
- Don't perform raw arithmetic on totals — the data you have is already aggregated correctly. If asked "how much water today?", just state the number from above.
- Never make up data. If something wasn't tracked, say so.`;
}

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	throw error(503, 'AI assistant temporarily disabled');
};
