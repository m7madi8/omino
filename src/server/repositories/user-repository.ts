import { prisma } from '@/lib/db';
import type { PermissionKey } from '@/lib/permissions/constants';
import { PERMISSIONS } from '@/lib/permissions/constants';
import { resolvePlatformAdmin } from '@/lib/platform/admin';
import type { SessionUser } from '@/types';

export async function getUserPermissions(
  userId: string,
  organizationId: string
): Promise<{ roleSlug: string; permissions: PermissionKey[] } | null> {
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

  if (!membership) return null;

  return {
    roleSlug: membership.role.slug,
    permissions: membership.role.permissions.map(
      (rp) => rp.permission.key as PermissionKey
    ),
  };
}

export async function buildSessionUser(userId: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      context: true,
      memberships: {
        include: {
          organization: true,
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  const membership =
    user.memberships.find((m) => m.organizationId === user.context?.organizationId) ||
    user.memberships[0];

  if (!membership) {
    const isPlatformAdmin = resolvePlatformAdmin(user.email);
    return {
      id: user.id,
      email: user.email,
      name: user.fullName,
      organizationId: null,
      organizationName: null,
      organizationSlug: null,
      storeId: null,
      storeName: null,
      storePublicSlug: null,
      branchId: null,
      branchName: null,
      roleSlug: isPlatformAdmin ? 'PLATFORM_ADMIN' : null,
      permissions: isPlatformAdmin ? [...PERMISSIONS] : [],
      onboardingComplete: false,
      isPlatformAdmin,
      locale: 'en',
      merchantExperienceMode: 'standard',
      currency: 'USD',
    };
  }

  const org = membership.organization;
  let storeId = user.context?.storeId ?? null;
  let branchId = user.context?.branchId ?? null;
  let storeName: string | null = null;
  let storePublicSlug: string | null = null;
  let branchName: string | null = null;

  if (storeId) {
    const store = await prisma.store.findFirst({
      where: { id: storeId, organizationId: org.id },
      include: { branches: true },
    });
    if (store) {
      storeName = store.name;
      storePublicSlug = store.publicSlug;
      if (branchId) {
        const branch = store.branches.find((b) => b.id === branchId);
        branchName = branch?.name ?? null;
      }
    } else {
      storeId = null;
      branchId = null;
    }
  }

  if (!storeId) {
    const defaultStore = await prisma.store.findFirst({
      where: { organizationId: org.id, isDefault: true },
      include: { branches: { where: { isDefault: true }, take: 1 } },
    });
    if (defaultStore) {
      storeId = defaultStore.id;
      storeName = defaultStore.name;
      storePublicSlug = defaultStore.publicSlug;
      if (defaultStore.branches[0]) {
        branchId = defaultStore.branches[0].id;
        branchName = defaultStore.branches[0].name;
      }
    }
  }

  const onboardingComplete = Boolean(
    org.name && org.country && org.currency && storeId && branchId
  );

  const isPlatformAdmin = resolvePlatformAdmin(user.email);

  return {
    id: user.id,
    email: user.email,
    name: user.fullName,
    organizationId: org.id,
    organizationName: org.name,
    organizationSlug: org.slug,
    storeId,
    storeName,
    storePublicSlug,
    branchId,
    branchName,
    roleSlug: isPlatformAdmin ? 'PLATFORM_ADMIN' : membership.role.slug,
    permissions: isPlatformAdmin
      ? [...PERMISSIONS]
      : membership.role.permissions.map((rp) => rp.permission.key as PermissionKey),
    onboardingComplete,
    isPlatformAdmin,
    locale: (org.locale === 'ar' ? 'ar' : 'en') as 'ar' | 'en',
    merchantExperienceMode:
      org.merchantExperienceMode === 'simple' ? 'simple' : 'standard',
    currency: org.currency,
  };
}
