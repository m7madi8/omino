import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { updateUserContext } from '@/server/services/organization-service';

const contextSchema = z.object({
  organizationId: z.string().uuid().optional(),
  storeId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  return NextResponse.json({ context: session.user });
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const data = contextSchema.parse(body);

    const orgId = data.organizationId || session.user.organizationId;
    if (!orgId) {
      return NextResponse.json({ error: 'NO_ORGANIZATION' }, { status: 400 });
    }

    await updateUserContext(session.user.id, {
      organizationId: orgId,
      storeId: data.storeId,
      branchId: data.branchId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'VALIDATION' }, { status: 400 });
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    console.error('[context]', err);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}
