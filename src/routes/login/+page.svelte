<script lang="ts">
	import { enhance } from '$app/forms';

	export let form: { error?: string } | null = null;
</script>

<div class="login-page">
	<div class="card">
		<h1>Today OS</h1>
		<p class="sub">Your focused daily dashboard.</p>

		{#if form?.error}
			<p class="error">{form.error}</p>
		{/if}

		<form method="POST" action="?/login" use:enhance>
			<button type="submit" class="google-btn">
				<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
					<path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
					<path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
					<path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
					<path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
				</svg>
				Sign in with Google
			</button>
		</form>
	</div>
</div>

<style>
	:global(body) {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
	}

	.login-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		width: 100%;
	}

	.card {
		background: var(--surface-2);
		border: 1px solid var(--border-default);
		border-radius: 12px;
		padding: 40px 48px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		min-width: 320px;
	}

	h1 {
		margin: 0;
		font-size: 24px;
		font-weight: 700;
		color: var(--accent);
	}

	.sub {
		margin: 0;
		font-size: 14px;
		color: var(--text-secondary);
	}

	.error {
		margin: 0;
		font-size: 13px;
		color: #ef4444;
		text-align: center;
	}

	.google-btn {
		display: flex;
		align-items: center;
		gap: 10px;
		background: var(--surface-3);
		border: 1px solid var(--border-default);
		border-radius: 8px;
		padding: 10px 20px;
		font-size: 14px;
		color: var(--text-primary);
		cursor: pointer;
		transition: background 0.1s, border-color 0.1s;
		margin-top: 8px;
	}

	.google-btn:hover {
		background: var(--border-strong);
		border-color: var(--accent);
	}
</style>
