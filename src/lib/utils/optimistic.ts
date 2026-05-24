export interface OptimisticMutation {
	rollback: () => void;
	reconcile?: (result: unknown) => void;
	settle?: () => void;
}

export function getActionData(result: unknown): Record<string, unknown> | null {
	if (!result || typeof result !== 'object' || !('data' in result)) return null;
	const data = (result as { data?: unknown }).data;
	return data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
}
