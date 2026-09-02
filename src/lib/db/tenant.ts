import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { assertOrgAccess } from '@/lib/permissions/check';

/**
 * Sets PostgreSQL session variables for RLS defense-in-depth.
 * Call at the start of sensitive server operations when using direct SQL.
 */
export async function setTenantContext(organizationId: string, userId: string) {
  await prisma.$executeRaw`SELECT set_config('app.current_organization_id', ${organizationId}, true)`;
  await prisma.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
}

export async function withOrgScope<T>(
  userId: string,
  organizationId: string,
  fn: () => Promise<T>
): Promise<T> {
  assertOrgAccess(
    { id: userId, organizationId } as Parameters<typeof assertOrgAccess>[0],
    organizationId
  );

  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  if (!membership) throw new Error('FORBIDDEN');

  return fn();
}
