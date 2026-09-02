import { SignJWT } from 'jose';
import { getSupabaseJwtSecret, isSupabaseRealtimeConfigured } from '@/lib/supabase/config';
import type { SessionUser } from '@/types';

const REALTIME_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour

export type OminoRealtimeClaims = {
  sub: string;
  email: string;
  organization_id: string;
  store_id: string | null;
  branch_id: string | null;
  role: string;
};

export async function signRealtimeAccessToken(user: SessionUser): Promise<string | null> {
  if (!isSupabaseRealtimeConfigured() || !user.organizationId) {
    return null;
  }

  const secret = new TextEncoder().encode(getSupabaseJwtSecret()!);
  const now = Math.floor(Date.now() / 1000);

  const claims: OminoRealtimeClaims = {
    sub: user.id,
    email: user.email,
    organization_id: user.organizationId,
    store_id: user.storeId,
    branch_id: user.branchId,
    role: user.roleSlug || 'STAFF',
  };

  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + REALTIME_TOKEN_TTL_SECONDS)
    .setAudience('authenticated')
    .sign(secret);
}
