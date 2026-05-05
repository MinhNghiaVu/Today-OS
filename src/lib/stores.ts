import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const ACCENT_PRESETS = [
	{ label: 'Indigo', accent: '#6366f1', hover: '#4f52d4' },
	{ label: 'Violet', accent: '#8b5cf6', hover: '#7c3aed' },
	{ label: 'Emerald', accent: '#10b981', hover: '#059669' },
	{ label: 'Rose', accent: '#f43f5e', hover: '#e11d48' },
	{ label: 'Amber', accent: '#f59e0b', hover: '#d97706' },
	{ label: 'Sky', accent: '#0ea5e9', hover: '#0284c7' }
];

type Preferences = { theme: 'dark' | 'light'; accentIndex: number };

const STORAGE_THEME_KEY = 'today-os-theme';
const STORAGE_ACCENT_KEY = 'today-os-accent-index';

const _settings = writable({ theme: 'dark' as 'dark' | 'light', accentIndex: 0 });

function persistPreferences(prefs: Preferences): void {
	if (!browser) return;

	const preset = ACCENT_PRESETS[prefs.accentIndex] ?? ACCENT_PRESETS[0];
	document.documentElement.setAttribute('data-theme', prefs.theme);
	document.documentElement.style.colorScheme = prefs.theme;
	document.documentElement.style.setProperty('--accent', preset.accent);
	document.documentElement.style.setProperty('--accent-hover', preset.hover);
	localStorage.setItem(STORAGE_THEME_KEY, prefs.theme);
	localStorage.setItem(STORAGE_ACCENT_KEY, String(prefs.accentIndex));
	document.cookie = `theme=${prefs.theme};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
	document.cookie = `accentIndex=${prefs.accentIndex};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

function setPreferences(prefs: Preferences): void {
	_settings.set(prefs);
	persistPreferences(prefs);
}

export const settings = {
	subscribe: _settings.subscribe,
	setTheme(theme: 'dark' | 'light') {
		_settings.update((s) => {
			const next = { ...s, theme };
			persistPreferences(next);
			return next;
		});
	},
	setAccent(index: number) {
		_settings.update((s) => {
			const next = { ...s, accentIndex: index };
			persistPreferences(next);
			return next;
		});
	},
	init(prefs: Preferences) {
		setPreferences(prefs);
	}
};
