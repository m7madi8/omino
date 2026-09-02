import { z } from 'zod';

/** ISO 3166-1 alpha-2 — Palestine & Israel only (OMINO market scope). */
export const ALLOWED_COUNTRY_CODES = ['PS', 'IL'] as const;

export type AllowedCountryCode = (typeof ALLOWED_COUNTRY_CODES)[number];

export const COUNTRIES = [
  { code: 'PS' as const, label: 'Palestine', labelAr: 'فلسطين' },
  { code: 'IL' as const, label: 'Israel', labelAr: 'إسرائيل' },
] as const;

export const allowedCountrySchema = z.enum(ALLOWED_COUNTRY_CODES);

export function isAllowedCountry(code: string | null | undefined): code is AllowedCountryCode {
  if (!code) return false;
  return (ALLOWED_COUNTRY_CODES as readonly string[]).includes(code.toUpperCase());
}

export function normalizeCountryCode(code: string): AllowedCountryCode | null {
  const upper = code.trim().toUpperCase();
  if (upper === 'PALESTINE' || upper === 'فلسطين') return 'PS';
  if (upper === 'ISRAEL' || upper === 'إسرائيل') return 'IL';
  return isAllowedCountry(upper) ? upper : null;
}

export function getCountryLabel(code: string, locale: 'en' | 'ar' = 'en'): string {
  const normalized = normalizeCountryCode(code) ?? code.toUpperCase();
  const match = COUNTRIES.find((c) => c.code === normalized);
  if (!match) return code;
  return locale === 'ar' ? match.labelAr : match.label;
}

export function assertAllowedCountry(code: string): AllowedCountryCode {
  const normalized = normalizeCountryCode(code);
  if (!normalized) throw new Error('COUNTRY_NOT_ALLOWED');
  return normalized;
}
