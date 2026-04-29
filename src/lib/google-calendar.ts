export interface CalendarEvent {
	id: string;
	title: string;
	start: string;
	end: string;
	allDay: boolean;
	location?: string;
}

export async function getEventsForDate(accessToken: string, date: string): Promise<CalendarEvent[]> {
	const timeMin = `${date}T00:00:00Z`;
	const timeMax = `${date}T23:59:59Z`;

	const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
	url.searchParams.set('timeMin', timeMin);
	url.searchParams.set('timeMax', timeMax);
	url.searchParams.set('singleEvents', 'true');
	url.searchParams.set('orderBy', 'startTime');
	url.searchParams.set('maxResults', '20');

	const res = await fetch(url.toString(), {
		headers: { Authorization: `Bearer ${accessToken}` }
	});

	if (res.status === 401) throw new Error('TOKEN_EXPIRED');
	if (!res.ok) return [];

	const json = await res.json();
	return (json.items ?? []).map(
		(item: Record<string, Record<string, string>>): CalendarEvent => ({
			id: item.id as unknown as string,
			title: (item.summary as unknown as string) ?? '(no title)',
			start: (item.start.dateTime ?? item.start.date) as string,
			end: (item.end.dateTime ?? item.end.date) as string,
			allDay: !item.start.dateTime,
			location: item.location as unknown as string | undefined
		})
	);
}

export function formatEventTime(iso: string): string {
	return new Date(iso).toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	});
}
