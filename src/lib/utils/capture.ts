export function noteTitleFromContent(content: string, maxLength = 60): string {
	const firstLine = content.split('\n').map((line) => line.trim()).find(Boolean) ?? '';
	const title = firstLine || 'Quick note';
	return title.length > maxLength ? `${title.slice(0, maxLength - 3)}...` : title;
}

export function captureActionError(result: unknown, fallback: string): string {
	if (!result || typeof result !== 'object') return fallback;
	const data = 'data' in result ? (result as { data?: unknown }).data : undefined;
	if (data && typeof data === 'object' && 'error' in data) {
		const error = (data as { error?: unknown }).error;
		if (typeof error === 'string' && error) return error;
	}
	return fallback;
}
