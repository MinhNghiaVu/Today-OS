import type { AppDbClient } from '$lib/server/neon-client';
import type { AuthSession, AuthUser } from '$lib/server/neon-auth';

declare global {
	namespace App {
		interface Locals {
			supabase: AppDbClient;
			session: AuthSession | null;
			user: AuthUser | null;
		}
		interface PageData {
			session: AuthSession | null;
			user: AuthUser | null;
		}
	}
}

export {};
