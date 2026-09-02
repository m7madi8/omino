import type { StoreSocialLinks } from '@/types/store-contact';
import type { ResolvedContactLink } from '@/types/store-contact';

function stripAt(value: string) {
  return value.trim().replace(/^@+/, '');
}

function isUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

export function normalizeInstagram(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (isUrl(v)) return v;
  const handle = stripAt(v);
  return handle ? `https://instagram.com/${handle}` : null;
}

export function normalizeFacebook(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (isUrl(v)) return v;
  const handle = stripAt(v);
  return handle ? `https://facebook.com/${handle}` : null;
}

export function normalizeTikTok(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (isUrl(v)) return v;
  const handle = stripAt(v);
  return handle ? `https://tiktok.com/@${handle}` : null;
}

export function normalizeTwitter(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (isUrl(v)) return v;
  const handle = stripAt(v);
  return handle ? `https://x.com/${handle}` : null;
}

/** E.164-ish: digits only, 8–15 digits */
export function normalizePhoneDigits(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

export function normalizeWhatsApp(value: string): string | null {
  const digits = normalizePhoneDigits(value);
  return digits ? `https://wa.me/${digits}` : null;
}

export function normalizeTel(value: string): string | null {
  const digits = normalizePhoneDigits(value);
  return digits ? `tel:+${digits}` : null;
}

export function normalizeEmail(value: string): string | null {
  const v = value.trim();
  if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return null;
  return `mailto:${v}`;
}

export function parseSocialLinks(raw: unknown): StoreSocialLinks {
  if (!raw || typeof raw !== 'object') return {};
  const o = raw as Record<string, unknown>;
  return {
    instagram: typeof o.instagram === 'string' ? o.instagram : null,
    facebook: typeof o.facebook === 'string' ? o.facebook : null,
    tiktok: typeof o.tiktok === 'string' ? o.tiktok : null,
    twitter: typeof o.twitter === 'string' ? o.twitter : null,
    whatsapp: typeof o.whatsapp === 'string' ? o.whatsapp : null,
  };
}

export function resolveStoreContactLinks(input: {
  socialLinks?: unknown;
  contactEmail?: string | null;
  contactPhone?: string | null;
}): ResolvedContactLink[] {
  const social = parseSocialLinks(input.socialLinks);
  const links: ResolvedContactLink[] = [];

  const instagram = social.instagram ? normalizeInstagram(social.instagram) : null;
  if (instagram) links.push({ id: 'instagram', label: 'Instagram', href: instagram });

  const facebook = social.facebook ? normalizeFacebook(social.facebook) : null;
  if (facebook) links.push({ id: 'facebook', label: 'Facebook', href: facebook });

  const tiktok = social.tiktok ? normalizeTikTok(social.tiktok) : null;
  if (tiktok) links.push({ id: 'tiktok', label: 'TikTok', href: tiktok });

  const twitter = social.twitter ? normalizeTwitter(social.twitter) : null;
  if (twitter) links.push({ id: 'twitter', label: 'X', href: twitter });

  const whatsapp = social.whatsapp ? normalizeWhatsApp(social.whatsapp) : null;
  if (whatsapp) links.push({ id: 'whatsapp', label: 'WhatsApp', href: whatsapp });

  const phone = input.contactPhone ? normalizeTel(input.contactPhone) : null;
  if (phone) links.push({ id: 'phone', label: 'Phone', href: phone });

  const email = input.contactEmail ? normalizeEmail(input.contactEmail) : null;
  if (email) links.push({ id: 'email', label: 'Email', href: email });

  return links;
}
