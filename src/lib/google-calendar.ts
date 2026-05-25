import type { CalendarEvent } from './types';

const CALENDAR_TIMEOUT_MS = 2500;

export async function getEventsForDate(accessToken: string, date: string): Promise<CalendarEvent[]> {
	const timeMin = `${date}T00:00:00Z`;
	const timeMax = `${date}T23:59:59Z`;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), CALENDAR_TIMEOUT_MS);

	const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
	url.searchParams.set('timeMin', timeMin);
	url.searchParams.set('timeMax', timeMax);
	url.searchParams.set('singleEvents', 'true');
	url.searchParams.set('orderBy', 'startTime');
	url.searchParams.set('maxResults', '20');

	try {
		const res = await fetch(url.toString(), {
			headers: { Authorization: `Bearer ${accessToken}` },
			signal: controller.signal
		});

		if (res.status === 401) throw new Error('TOKEN_EXPIRED');
		if (!res.ok) return [];

		const json = await res.json();
		return (json.items ?? []).map(
			(item: {
				id: string;
				summary?: string;
				start: { dateTime?: string; date?: string };
				end: { dateTime?: string; date?: string };
				location?: string;
			}): CalendarEvent => ({
				id: item.id,
				title: item.summary ?? '(no title)',
				start: item.start.dateTime ?? item.start.date ?? date,
				end: item.end.dateTime ?? item.end.date ?? date,
				allDay: !item.start.dateTime,
				location: item.location
			})
		);
	} catch (error) {
		if (error instanceof Error && error.message === 'TOKEN_EXPIRED') throw error;
		return [];
	} finally {
		clearTimeout(timeout);
	}
}
