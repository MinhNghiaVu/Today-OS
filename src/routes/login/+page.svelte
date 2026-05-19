<script lang="ts">
	import { enhance } from '$app/forms';
	import { Eye, EyeOff } from 'lucide-svelte';
	import SegmentedControl from '$lib/components/SegmentedControl.svelte';

	export let form: { error?: string; success?: boolean; message?: string } | null = null;

	let mode = 'signin';
	let password = '';
	let confirmPassword = '';
	let showPassword = false;
	let showConfirmPassword = false;
	const modeTabs = [{ value: 'signin', label: 'Sign in' }, { value: 'signup', label: 'Sign up' }];
	const passwordChecks = [
		{ label: 'At least 8 characters', valid: () => password.length >= 8 },
		{ label: 'One capital letter', valid: () => /[A-Z]/.test(password) },
		{ label: 'One number', valid: () => /\d/.test(password) },
		{ label: 'One special character', valid: () => /[^A-Za-z0-9]/.test(password) }
	];

	$: passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
</script>

<div class="login-page">
	<div class="card">
		<div class="brand">
			<h1>Today OS</h1>
			<p class="sub">Your focused daily dashboard.</p>
		</div>

		{#if form?.success}
			<div class="success-msg">{form.message}</div>
		{:else}
			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}

			<SegmentedControl options={modeTabs} bind:value={mode} fullWidth />

			<form
				method="POST"
				action={mode === 'signin' ? '?/signIn' : '?/signUp'}
				class="email-form"
				use:enhance
			>
				<label class="field">
					<span class="field-label">Email</span>
					<input
						type="email"
						name="email"
						placeholder="you@example.com"
						autocomplete="email"
						required
					/>
				</label>
				<label class="field">
					<span class="field-label">Password</span>
					<span class="password-input">
						<input
							type={showPassword ? 'text' : 'password'}
							name="password"
							placeholder={mode === 'signup' ? '8+ chars, number, symbol' : '••••••••'}
							autocomplete={mode === 'signin' ? 'current-password' : 'new-password'}
							bind:value={password}
							required
						/>
						<button
							type="button"
							class="password-toggle"
							aria-label={showPassword ? 'Hide password' : 'Show password'}
							aria-pressed={showPassword}
							on:click={() => (showPassword = !showPassword)}
						>
							{#if showPassword}
								<EyeOff size={16} strokeWidth={1.8} aria-hidden="true" />
							{:else}
								<Eye size={16} strokeWidth={1.8} aria-hidden="true" />
							{/if}
						</button>
					</span>
				</label>
				{#if mode === 'signup'}
					<div class="password-checks" aria-live="polite">
						{#each passwordChecks as check}
							<div class:met={check.valid()} class="password-check">
								<span aria-hidden="true">{check.valid() ? '✓' : '•'}</span>
								{check.label}
							</div>
						{/each}
					</div>
					<label class="field">
						<span class="field-label">Confirm password</span>
						<span class="password-input">
							<input
								type={showConfirmPassword ? 'text' : 'password'}
								name="confirmPassword"
								placeholder="Repeat password"
								autocomplete="new-password"
								bind:value={confirmPassword}
								required
							/>
							<button
								type="button"
								class="password-toggle"
								aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
								aria-pressed={showConfirmPassword}
								on:click={() => (showConfirmPassword = !showConfirmPassword)}
							>
								{#if showConfirmPassword}
									<EyeOff size={16} strokeWidth={1.8} aria-hidden="true" />
								{:else}
									<Eye size={16} strokeWidth={1.8} aria-hidden="true" />
								{/if}
							</button>
						</span>
					</label>
					{#if confirmPassword}
						<div class:met={passwordsMatch} class="password-check">
							<span aria-hidden="true">{passwordsMatch ? '✓' : '•'}</span>
							Passwords match
						</div>
					{/if}
				{/if}
				<button type="submit" class="btn-primary">
					{mode === 'signin' ? 'Sign in' : 'Create account'}
				</button>
			</form>

			<div class="divider"><span>or</span></div>

			<form method="POST" action="?/googleLogin" use:enhance>
				<button type="submit" class="google-btn">
					<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
						<path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
						<path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
						<path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
						<path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
					</svg>
					Continue with Google
				</button>
			</form>
		{/if}
	</div>
</div>

<style>
	.login-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		width: 100%;
		padding: 24px 16px;
	}

	.card {
		background: var(--surface-1);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-xl);
		padding: 40px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		width: 100%;
		max-width: 384px;
	}

	.brand {
		text-align: center;
	}

	h1 {
		margin: 0 0 4px;
		font-size: 24px;
		font-weight: 600;
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	.sub {
		margin: 0;
		font-size: 13px;
		color: var(--text-tertiary);
	}

	.error {
		margin: 0;
		font-size: 13px;
		color: var(--danger);
		background: var(--danger-soft);
		border-radius: var(--radius-md);
		padding: 8px 12px;
	}

	.success-msg {
		font-size: 14px;
		color: var(--success);
		background: var(--success-soft);
		border-radius: var(--radius-md);
		padding: 12px 14px;
		text-align: center;
	}

	.email-form {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.field-label {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.field input {
		background: var(--surface-2);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		padding: 0 12px;
		height: 40px;
		color: var(--text-primary);
		font-size: 14px;
		font-family: inherit;
		outline: none;
		transition: border-color 120ms var(--ease-out);
		width: 100%;
	}

	.field input::placeholder {
		color: var(--text-tertiary);
	}

	.field input:hover {
		border-color: var(--border-strong);
	}

	.field input:focus {
		border-color: var(--accent);
		box-shadow: 0 0 0 1px var(--border-focus);
	}

	.password-input {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 40px;
		align-items: center;
		background: var(--surface-2);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		height: 40px;
		transition: border-color 120ms var(--ease-out), box-shadow 120ms var(--ease-out);
	}

	.password-input:hover {
		border-color: var(--border-strong);
	}

	.password-input:focus-within {
		border-color: var(--accent);
		box-shadow: 0 0 0 1px var(--border-focus);
	}

	.password-input input {
		background: transparent;
		border: 0;
		height: 100%;
		padding-right: 4px;
	}

	.password-input input:hover,
	.password-input input:focus {
		border-color: transparent;
		box-shadow: none;
	}

	.password-toggle {
		display: grid;
		place-items: center;
		width: 40px;
		height: 100%;
		border: 0;
		border-left: 1px solid var(--border-subtle);
		border-radius: 0 var(--radius-md) var(--radius-md) 0;
		background: transparent;
		color: var(--text-tertiary);
		cursor: pointer;
		transition: background 120ms var(--ease-out), color 120ms var(--ease-out);
	}

	.password-toggle:hover {
		background: var(--surface-3);
		color: var(--text-secondary);
	}

	.password-toggle:focus-visible {
		outline: 2px solid var(--border-focus);
		outline-offset: -2px;
	}

	.password-checks {
		display: grid;
		gap: 8px;
	}

	.password-check {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 18px;
		color: var(--text-tertiary);
		font-size: 12px;
		line-height: 1.4;
	}

	.password-check span {
		display: grid;
		place-items: center;
		width: 16px;
		color: var(--text-tertiary);
		font-size: 12px;
	}

	.password-check.met {
		color: var(--success);
	}

	.password-check.met span {
		color: var(--success);
	}

	.btn-primary {
		background: var(--accent);
		color: var(--text-on-accent);
		border: none;
		border-radius: var(--radius-md);
		padding: 0 16px;
		height: 40px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: background 120ms var(--ease-out), transform 120ms var(--ease-out);
		font-family: inherit;
		width: 100%;
		margin-top: 4px;
	}

	.btn-primary:hover {
		background: var(--accent-hover);
	}

	.btn-primary:active {
		background: var(--accent-pressed);
		transform: translateY(1px);
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 12px;
		color: var(--text-tertiary);
		font-size: 12px;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--border-subtle);
	}

	.google-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		background: var(--surface-2);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		padding: 0 16px;
		height: 40px;
		font-size: 14px;
		font-weight: 500;
		color: var(--text-primary);
		cursor: pointer;
		transition: background 120ms var(--ease-out), border-color 120ms var(--ease-out);
		font-family: inherit;
		width: 100%;
	}

	.google-btn:hover {
		background: var(--surface-3);
		border-color: var(--border-strong);
	}

	@media (min-width: 768px) {
		.login-page {
			padding: 40px;
		}

		.card {
			max-width: 512px;
			padding: 48px 64px;
			gap: 24px;
		}

		h1 {
			font-size: 30px;
		}

		.sub {
			font-size: 15px;
		}

		.email-form {
			gap: 16px;
		}

		.field {
			gap: 8px;
		}

		.field-label {
			font-size: 13px;
		}

		.field input,
		.password-input,
		.btn-primary,
		.google-btn {
			height: 48px;
			font-size: 15px;
		}

		.password-check {
			font-size: 13px;
			min-height: 20px;
		}
	}
</style>
