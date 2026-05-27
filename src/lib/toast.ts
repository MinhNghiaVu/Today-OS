import { writable } from 'svelte/store';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
	id: string;
	message: string;
	variant: ToastVariant;
}

function createToastStore() {
	const { subscribe, update } = writable<ToastItem[]>([]);

	function add(message: string, variant: ToastVariant = 'info'): void {
		const id = Math.random().toString(36).slice(2);
		const duration = variant === 'error' ? 6000 : 4000;

		update((items) => [...items.slice(-2), { id, message, variant }]);

		setTimeout(() => {
			update((items) => items.filter((t) => t.id !== id));
		}, duration);
	}

	function dismiss(id: string): void {
		update((items) => items.filter((t) => t.id !== id));
	}

	return { subscribe, add, dismiss };
}

export const toasts = createToastStore();

export function toast(message: string, variant: ToastVariant = 'info'): void {
	toasts.add(message, variant);
}
