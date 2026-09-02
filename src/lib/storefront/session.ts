import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

const COOKIE_PREFIX = 'omino_guest_';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function guestCookieName(storePublicSlug: string) {
  return `${COOKIE_PREFIX}${storePublicSlug}`;
}

export async function getGuestSessionToken(storePublicSlug: string): Promise<string | null> {
  const jar = await cookies();
  return jar.get(guestCookieName(storePublicSlug))?.value ?? null;
}

export async function ensureGuestSessionToken(storePublicSlug: string): Promise<string> {
  const jar = await cookies();
  const name = guestCookieName(storePublicSlug);
  const existing = jar.get(name)?.value;
  if (existing) return existing;

  const token = randomUUID();
  jar.set(name, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE,
    path: '/',
  });
  return token;
}
