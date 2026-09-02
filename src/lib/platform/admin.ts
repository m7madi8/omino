/** Platform-level OMINO operators (SaaS admins), not tenant OWNER roles. */

const PLATFORM_ADMIN_EMAILS = (process.env.PLATFORM_ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return PLATFORM_ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

/** Prefer session flag; fall back to env allowlist (works without DB migration). */
export function sessionIsPlatformAdmin(user: {
  email: string;
  isPlatformAdmin?: boolean;
}): boolean {
  return Boolean(user.isPlatformAdmin) || isPlatformAdminEmail(user.email);
}

export function resolvePlatformAdmin(email: string): boolean {
  return isPlatformAdminEmail(email);
}
