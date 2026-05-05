import type { SupabaseClient, Session } from '@supabase/supabase-js';

interface AuthUser {
	id: string;
	email?: string;
}

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			session: Session | null;
			user: AuthUser | null;
		}
		interface PageData {
			session: Session | null;
			user: AuthUser | null;
		}
	}
}

export {};
