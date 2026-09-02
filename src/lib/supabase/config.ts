/**
 * Supabase environment configuration.
 * Public keys are safe for the browser; service role stays server-only.
 */

export function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function getSupabaseAnonKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

/** Server-only — never import from client components. */
export function getSupabaseServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

/** Server-only — used to sign realtime JWTs for NextAuth sessions. */
export function getSupabaseJwtSecret(): string | undefined {
  return process.env.SUPABASE_JWT_SECRET;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(isSupabaseConfigured() && getSupabaseServiceRoleKey());
}

export function isSupabaseRealtimeConfigured(): boolean {
  return Boolean(isSupabaseConfigured() && getSupabaseJwtSecret());
}

export const SUPABASE_MEDIA_BUCKET = 'omino-media';
