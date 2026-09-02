import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  isSupabaseStorageConfigured,
} from '@/lib/supabase/config';

let adminClient: SupabaseClient | null = null;

/**
 * Privileged Supabase client (service role).
 * Server-only — bypasses RLS. Use inside domain services after tenant checks.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!isSupabaseStorageConfigured()) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }

  if (!adminClient) {
    adminClient = createClient(getSupabaseUrl()!, getSupabaseServiceRoleKey()!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}
