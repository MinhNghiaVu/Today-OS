import { writable } from 'svelte/store';

export const ACCENT_PRESETS = [
	{ label: 'Indigo', accent: '#6366f1', hover: '#4f52d4' },
	{ label: 'Violet', accent: '#8b5cf6', hover: '#7c3aed' },
	{ label: 'Emerald', accent: '#10b981', hover: '#059669' },
	{ label: 'Rose', accent: '#f43f5e', hover: '#e11d48' },
	{ label: 'Amber', accent: '#f59e0b', hover: '#d97706' },
	{ label: 'Sky', accent: '#0ea5e9', hover: '#0284c7' }
];

const _settings = writable({ theme: 'dark' as 'dark' | 'light', accentIndex: 0 });

export const settings = {
	subscribe: _settings.subscribe,
	setTheme(theme: 'dark' | 'light') {
		_settings.update((s) => ({ ...s, theme }));
	},
	setAccent(index: number) {
		_settings.update((s) => ({ ...s, accentIndex: index }));
	},
	init(prefs: { theme: 'dark' | 'light'; accentIndex: number }) {
		_settings.set(prefs);
	}
};
