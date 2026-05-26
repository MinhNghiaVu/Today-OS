import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const ACCENT_PRESETS = [
	{ label: 'Sky', accent: '#38bdf8', hover: '#0ea5e9', pressed: '#0284c7' },
	{ label: 'Teal', accent: '#14b8a6', hover: '#0d9488', pressed: '#0f766e' },
	{ label: 'Indigo', accent: '#6366f1', hover: '#4f52d4', pressed: '#4338ca' },
	{ label: 'Violet', accent: '#8b5cf6', hover: '#7c3aed', pressed: '#6d28d9' },
	{ label: 'Amber', accent: '#f59e0b', hover: '#d97706', pressed: '#b45309' },
	{ label: 'Rose', accent: '#f43f5e', hover: '#e11d48', pressed: '#be123c' }
];

type Preferences = { theme: 'dark' | 'light'; accentIndex: number };

const STORAGE_THEME_KEY = 'today-os-theme';
const STORAGE_ACCENT_KEY = 'today-os-accent-index';
const STORAGE_SIDEBAR_KEY = 'today-os-sidebar-collapsed';

const _settings = writable({ theme: 'dark' as 'dark' | 'light', accentIndex: 0 });
const _sidebarCollapsed = writable(false);
const _mobileSidebarOpen = writable(false);

function persistPreferences(prefs: Preferences): void {
	if (!browser) return;

	const preset = ACCENT_PRESETS[prefs.accentIndex] ?? ACCENT_PRESETS[0];
	document.documentElement.setAttribute('data-theme', prefs.theme);
	document.documentElement.style.colorScheme = prefs.theme;
	document.documentElement.style.setProperty('--accent', preset.accent);
	document.documentElement.style.setProperty('--accent-hover', preset.hover);
	document.documentElement.style.setProperty('--accent-pressed', preset.pressed);
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

if (browser) {
	_sidebarCollapsed.set(localStorage.getItem(STORAGE_SIDEBAR_KEY) === 'true');
}

export const sidebarCollapsed = {
	subscribe: _sidebarCollapsed.subscribe,
	toggle() {
		_sidebarCollapsed.update((collapsed) => {
			const next = !collapsed;
			if (browser) localStorage.setItem(STORAGE_SIDEBAR_KEY, String(next));
			return next;
		});
	}
};

export const mobileSidebarOpen = {
	subscribe: _mobileSidebarOpen.subscribe,
	open() {
		_mobileSidebarOpen.set(true);
	},
	close() {
		_mobileSidebarOpen.set(false);
	},
	toggle() {
		_mobileSidebarOpen.update((open) => !open);
	}
};
