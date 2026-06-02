import { authErrorMessage, authPost } from '$lib/server/neon-auth';

export const GOOGLE_CALENDAR_SCOPES = [
	'openid',
	'email',
	'profile',
	'https://www.googleapis.com/auth/calendar.readonly'
];

type GoogleCalendarAuthState = 'ok' | 'disconnected' | 'expired';

type CalendarTokenResult = {
	state: GoogleCalendarAuthState;
	accessToken: string | null;
	expiresAt: string | null;
	error: string | null;
};

type AuthRequestInput = {
	cookieHeader: string | null;
	origin: string;
};

export async function getGoogleCalendarAccessToken({
	cookieHeader,
	origin,
	userId
}: AuthRequestInput & { userId: string }): Promise<CalendarTokenResult> {
	const response = await authPost(
		'get-access-token',
		{ providerId: 'google', userId },
		origin,
		cookieHeader
	);

	if (!response.ok) {
		return {
			state: 'disconnected',
			accessToken: null,
			expiresAt: null,
			error: await authErrorMessage(response, 'Google Calendar is not connected.')
		};
	}

	const json = await response.json().catch(() => null);
	const accessToken = typeof json?.accessToken === 'string' ? json.accessToken : null;
	const expiresAt = typeof json?.accessTokenExpiresAt === 'string' ? json.accessTokenExpiresAt : null;

	if (!accessToken) {
		return {
			state: 'disconnected',
			accessToken: null,
			expiresAt: null,
			error: 'Google Calendar is not connected.'
		};
	}

	if (expiresAt && new Date(expiresAt) < new Date()) {
		return {
			state: 'expired',
			accessToken,
			expiresAt,
			error: 'Google Calendar access expired.'
		};
	}

	return {
		state: 'ok',
		accessToken,
		expiresAt,
		error: null
	};
}

export function beginGoogleCalendarLink({ cookieHeader, origin }: AuthRequestInput) {
	return authPost(
		'link-social',
		{
			provider: 'google',
			callbackURL: `${origin}/today`,
			errorCallbackURL: `${origin}/today`,
			scopes: GOOGLE_CALENDAR_SCOPES
		},
		origin,
		cookieHeader
	);
}
