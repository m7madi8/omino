import type { PermissionKey } from '@/lib/permissions/constants';

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  organizationId: string | null;
  organizationName: string | null;
  organizationSlug: string | null;
  storeId: string | null;
  storeName: string | null;
  branchId: string | null;
  branchName: string | null;
  roleSlug: string | null;
  permissions: PermissionKey[];
  onboardingComplete: boolean;
};

export type ApiError = {
  error: string;
  message?: string;
};
