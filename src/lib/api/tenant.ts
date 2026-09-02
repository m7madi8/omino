import { requireOnboardedSession } from '@/lib/auth';
import { setTenantContext } from '@/lib/db/tenant';
import { assertPermission } from '@/lib/permissions/check';
import type { PermissionKey } from '@/lib/permissions/constants';
import type { SessionUser } from '@/types';

export type TenantContext = {
  userId: string;
  organizationId: string;
  storeId: string | null;
  branchId: string | null;
  currency: string;
  user: SessionUser;
};

export async function requireTenantContext(
  permission?: PermissionKey
): Promise<TenantContext> {
  const session = await requireOnboardedSession();
  const { user } = session;

  if (!user.organizationId) {
    throw new ApiError('UNAUTHORIZED', 401);
  }

  if (permission) {
    assertPermission(user, permission);
  }

  await setTenantContext(user.organizationId, user.id);

  const { prisma } = await import('@/lib/db');
  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { currency: true },
  });

  return {
    userId: user.id,
    organizationId: user.organizationId,
    storeId: user.storeId,
    branchId: user.branchId,
    currency: org?.currency || 'USD',
    user,
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return Response.json(
      { error: err.message, code: err.code },
      { status: err.status }
    );
  }
  if (err instanceof Error) {
    if (err.message === 'UNAUTHORIZED') {
      return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    if (err.message === 'NOT_FOUND') {
      return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    if (err.message === 'INSUFFICIENT_STOCK') {
      return Response.json({ error: 'INSUFFICIENT_STOCK' }, { status: 409 });
    }
    if (err.message === 'VALIDATION_ERROR') {
      return Response.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
    if (err.message === 'INVALID_STATE_TRANSITION') {
      return Response.json({ error: 'INVALID_STATE_TRANSITION' }, { status: 409 });
    }
    if (err.message === 'INVALID_STATE') {
      return Response.json({ error: 'INVALID_STATE' }, { status: 409 });
    }
    if (err.message === 'DUPLICATE_CUSTOMER') {
      return Response.json(
        { error: 'DUPLICATE_CUSTOMER', matches: (err as Error & { matches?: unknown }).matches },
        { status: 409 }
      );
    }
    if (err.message === 'AMBIGUOUS_CUSTOMER_MATCH') {
      return Response.json(
        { error: 'AMBIGUOUS_CUSTOMER_MATCH', matches: (err as Error & { matches?: unknown }).matches },
        { status: 409 }
      );
    }
    if (err.message === 'SESSION_CLOSED') {
      return Response.json({ error: 'SESSION_CLOSED' }, { status: 409 });
    }
    if (err.message === 'SESSION_ALREADY_OPEN') {
      return Response.json({ error: 'SESSION_ALREADY_OPEN' }, { status: 409 });
    }
  }
  console.error(err);
  return Response.json({ error: 'SERVER_ERROR' }, { status: 500 });
}
