import type { PermissionKey } from '@/lib/permissions/constants';
import type { SessionUser } from '@/types';

export function sessionHasPermission(
  session: SessionUser | null | undefined,
  permission: PermissionKey
): boolean {
  if (!session) return false;
  if (session.roleSlug === 'OWNER') return true;
  return session.permissions.includes(permission);
}

export function assertPermission(
  session: SessionUser | null | undefined,
  permission: PermissionKey
): void {
  if (!sessionHasPermission(session, permission)) {
    throw new Error('FORBIDDEN');
  }
}

export function assertOrgAccess(
  session: SessionUser | null | undefined,
  organizationId: string
): void {
  if (!session || session.organizationId !== organizationId) {
    throw new Error('FORBIDDEN');
  }
}
