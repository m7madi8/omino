/** Normalize email for deduplication and search. */
export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed || null;
}

/** Normalize phone to digits-only for matching. */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits || null;
}

export function buildDisplayName(input: {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}): string {
  const parts = [input.firstName, input.lastName].filter(Boolean);
  if (parts.length) return parts.join(' ');
  if (input.name?.trim()) return input.name.trim();
  if (input.email) return input.email;
  if (input.phone) return input.phone;
  return 'Customer';
}

export function splitDisplayName(name: string): { firstName: string | null; lastName: string | null } {
  const trimmed = name.trim();
  if (!trimmed) return { firstName: null, lastName: null };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}
