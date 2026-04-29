<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { cubicOut, cubicIn } from 'svelte/easing';
	import { tick } from 'svelte';
	import { Bot, Send, User, Sparkles, Loader } from 'lucide-svelte';
	import { toast } from '$lib/toast';

	interface Message {
		role: 'user' | 'assistant';
		content: string;
		streaming?: boolean;
	}

	let messages: Message[] = [];
	let input = '';
	let isLoading = false;
	let chatEl: HTMLElement;

	const examples = [
		'How much water did I drink today?',
		'What tasks are still pending?',
		'Summarise my recent notes.',
		'How are my habits going this week?',
		'What did I complete today?'
	];

	async function scrollToBottom() {
		await tick();
		if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
	}

	async function send() {
		const text = input.trim();
		if (!text || isLoading) return;
		input = '';

		messages = [...messages, { role: 'user', content: text }];
		await scrollToBottom();

		isLoading = true;
		const assistantMsg: Message = { role: 'assistant', content: '', streaming: true };
		messages = [...messages, assistantMsg];
		await scrollToBottom();

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: messages
						.filter((m) => !m.streaming || m.content.length > 0)
						.slice(0, -1)
						.map(({ role, content }) => ({ role, content }))
				})
			});

			if (!response.ok) {
				const err = await response.text().catch(() => 'Unknown error');
				throw new Error(err);
			}

			const reader = response.body?.getReader();
			if (!reader) throw new Error('No response body');

			const decoder = new TextDecoder();
			let done = false;

			while (!done) {
				const { value, done: doneReading } = await reader.read();
				done = doneReading;
				if (value) {
					const chunk = decoder.decode(value, { stream: true });
					messages[messages.length - 1] = {
						...messages[messages.length - 1],
						content: messages[messages.length - 1].content + chunk
					};
					messages = messages;
					await scrollToBottom();
				}
			}

			messages[messages.length - 1] = {
				...messages[messages.length - 1],
				streaming: false
			};
			messages = messages;
		} catch (e) {
			messages = messages.slice(0, -1);
			toast('Couldn\'t reach the assistant — check your connection.', 'error');
		} finally {
			isLoading = false;
			await scrollToBottom();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}

	function useExample(q: string) {
		input = q;
		send();
	}
</script>

<svelte:head>
	<title>Assistant — Today OS</title>
</svelte:head>

<div class="page">
	<div class="container">
		<header class="page-header">
			<div class="header-left">
				<h1 class="page-title">AI Assistant</h1>
				<p class="page-subtitle">Ask about your habits, todos, and notes</p>
			</div>
		</header>

		<div class="chat-shell">
			<div class="chat-messages" bind:this={chatEl}>
				{#if messages.length === 0}
					<div
						class="empty-state"
						in:fade={{ duration: 200, easing: cubicOut }}
					>
						<div class="empty-icon" aria-hidden="true">
							<Bot size={40} strokeWidth={1.5} />
						</div>
						<h2 class="empty-title">Ask about your day</h2>
						<p class="empty-desc">
							Your habits, todos, and notes are loaded as context. Ask anything.
						</p>
						<div class="example-chips">
							{#each examples as q}
								<button
									class="chip"
									on:click={() => useExample(q)}
									type="button"
								>
									{q}
								</button>
							{/each}
						</div>
					</div>
				{:else}
					{#each messages as msg, i (i)}
						<div
							class="message"
							class:user={msg.role === 'user'}
							class:assistant={msg.role === 'assistant'}
							in:fly={{ y: 8, duration: 200, easing: cubicOut }}
						>
							<div class="msg-avatar" aria-hidden="true">
								{#if msg.role === 'user'}
									<User size={14} strokeWidth={2} />
								{:else}
									<Sparkles size={14} strokeWidth={2} />
								{/if}
							</div>
							<div class="msg-bubble">
								<p class="msg-content">{msg.content}{#if msg.streaming}<span class="cursor" aria-hidden="true"></span>{/if}</p>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<div class="input-area">
				<div class="input-row">
					<textarea
						class="msg-input"
						placeholder="Ask about your day…"
						bind:value={input}
						on:keydown={handleKeydown}
						disabled={isLoading}
						rows={1}
						aria-label="Message"
					></textarea>
					<button
						class="send-btn"
						on:click={send}
						disabled={!input.trim() || isLoading}
						aria-label="Send message"
						type="button"
					>
						{#if isLoading}
							<Loader size={16} strokeWidth={2} class="spin" />
						{:else}
							<Send size={16} strokeWidth={2} />
						{/if}
					</button>
				</div>
				<p class="input-hint">Enter to send · Shift+Enter for new line</p>
			</div>
		</div>
	</div>
</div>

<style>
	.page {
		padding: 32px 24px;
	}

	@media (min-width: 640px) {
		.page { padding: 32px 32px; }
	}
	@media (min-width: 1024px) {
		.page { padding: 32px 40px; }
	}

	.container {
		max-width: 768px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 32px;
	}

	/* ── Header ── */
	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}

	.page-title {
		font-size: 26px;
		font-weight: 600;
		color: var(--text-primary);
		letter-spacing: -0.01em;
		line-height: 1.2;
		margin: 0;
	}

	.page-subtitle {
		font-size: 14px;
		color: var(--text-secondary);
		margin: 4px 0 0;
	}

	/* ── Chat shell ── */
	.chat-shell {
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		display: flex;
		flex-direction: column;
		height: calc(100vh - 220px);
		min-height: 400px;
		overflow: hidden;
	}

	.chat-messages {
		flex: 1;
		overflow-y: auto;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		scroll-behavior: smooth;
	}

	/* ── Empty state ── */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding-top: 48px;
		gap: 12px;
	}

	.empty-icon {
		color: var(--text-tertiary);
	}

	.empty-title {
		font-size: 18px;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.empty-desc {
		font-size: 14px;
		color: var(--text-secondary);
		max-width: 320px;
		margin: 0;
		line-height: 1.5;
	}

	.example-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		justify-content: center;
		margin-top: 8px;
	}

	.chip {
		padding: 6px 12px;
		border-radius: var(--radius-full);
		background: var(--surface-2);
		border: 1px solid var(--border-default);
		color: var(--text-secondary);
		font-size: 13px;
		font-weight: 400;
		cursor: pointer;
		transition:
			background-color 120ms cubic-bezier(0.22, 1, 0.36, 1),
			border-color 120ms cubic-bezier(0.22, 1, 0.36, 1),
			color 120ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.chip:hover {
		background: var(--surface-3);
		border-color: var(--border-strong);
		color: var(--text-primary);
	}

	/* ── Messages ── */
	.message {
		display: flex;
		gap: 10px;
		align-items: flex-start;
	}

	.message.user {
		flex-direction: row-reverse;
	}

	.msg-avatar {
		width: 28px;
		height: 28px;
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.message.user .msg-avatar {
		background: var(--accent-soft);
		color: var(--accent);
	}

	.message.assistant .msg-avatar {
		background: var(--surface-3);
		color: var(--text-secondary);
	}

	.msg-bubble {
		max-width: 80%;
	}

	.message.user .msg-bubble {
		background: var(--accent-soft);
		border-radius: var(--radius-lg) var(--radius-sm) var(--radius-lg) var(--radius-lg);
		padding: 10px 14px;
	}

	.message.assistant .msg-bubble {
		background: var(--surface-2);
		border-radius: var(--radius-sm) var(--radius-lg) var(--radius-lg) var(--radius-lg);
		padding: 10px 14px;
	}

	.msg-content {
		font-size: 14px;
		line-height: 1.6;
		color: var(--text-primary);
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.message.user .msg-content {
		color: var(--accent);
	}

	/* streaming cursor */
	.cursor {
		display: inline-block;
		width: 2px;
		height: 14px;
		background: var(--text-secondary);
		border-radius: 1px;
		margin-left: 2px;
		vertical-align: middle;
		animation: blink 1s step-end infinite;
	}

	@keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0; }
	}

	@media (prefers-reduced-motion: reduce) {
		.cursor { animation: none; }
	}

	/* ── Input area ── */
	.input-area {
		border-top: 1px solid var(--border-subtle);
		padding: 16px 20px 12px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.input-row {
		display: flex;
		gap: 10px;
		align-items: flex-end;
	}

	.msg-input {
		flex: 1;
		background: var(--surface-2);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: 14px;
		font-family: inherit;
		line-height: 1.5;
		padding: 8px 12px;
		resize: none;
		min-height: 36px;
		max-height: 120px;
		overflow-y: auto;
		transition:
			border-color 120ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.msg-input::placeholder {
		color: var(--text-tertiary);
	}

	.msg-input:hover {
		border-color: var(--border-strong);
	}

	.msg-input:focus {
		outline: 2px solid var(--border-focus);
		outline-offset: 2px;
	}

	.msg-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.send-btn {
		width: 36px;
		height: 36px;
		border-radius: var(--radius-md);
		background: var(--accent);
		color: var(--text-on-accent);
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition:
			background-color 120ms cubic-bezier(0.22, 1, 0.36, 1),
			transform 120ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.send-btn:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.send-btn:active:not(:disabled) {
		background: var(--accent-pressed);
		transform: translateY(1px);
	}

	.send-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.input-hint {
		font-size: 12px;
		color: var(--text-tertiary);
		margin: 0;
	}

	/* Spin animation for loading icon */
	:global(.spin) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.spin) { animation: none; }
	}
</style>
