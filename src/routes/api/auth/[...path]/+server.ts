import type { RequestHandler } from './$types';
import { proxyAuthRequest } from '$lib/server/neon-auth';

const handler: RequestHandler = async ({ request, params }) => {
	return proxyAuthRequest(request, params.path);
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
