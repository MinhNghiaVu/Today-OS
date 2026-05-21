export function parseLocalizedNumber(value: FormDataEntryValue | string | number | null | undefined): number {
	if (typeof value === 'number') return value;
	const normalized = String(value ?? '').trim().replace(',', '.');
	return Number.parseFloat(normalized);
}
