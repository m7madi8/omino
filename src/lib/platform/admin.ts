/** Platform-level OMINO operators (SaaS admins), not tenant OWNER roles. */

const PLATFORM_ADMIN_EMAILS = (process.env.PLATFORM_ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return PLATFORM_ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

export function resolvePlatformAdmin(
  email: string,
  dbFlag: boolean | null | undefined
): boolean {
  return Boolean(dbFlag) || isPlatformAdminEmail(email);
}
