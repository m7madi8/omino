import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from '@/lib/supabase/config';

/**
 * Browser Supabase client with optional access token (custom JWT from /api/realtime/token).
 */
export function createBrowserSupabaseClient(accessToken?: string): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;

  return createClient(getSupabaseUrl()!, getSupabaseAnonKey()!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}
