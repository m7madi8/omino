import { z } from 'zod';
import { cookies } from 'next/headers';
import { handleApiError } from '@/lib/api/tenant';
import { resolveStoreByPublicSlug } from '@/server/services/storefront-service';
import {
  registerStorefrontAccount,
  loginStorefrontAccount,
  SESSION_COOKIE,
} from '@/server/services/storefront-customer-auth-service';

function sessionCookieName(storeId: string) {
  return `${SESSION_COOKIE}_${storeId}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const store = await resolveStoreByPublicSlug(storeSlug);
    const body = await request.json();
    const data = z
      .object({
        action: z.enum(['register', 'login']),
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      })
      .parse(body);

    const account =
      data.action === 'register'
        ? await registerStorefrontAccount({
            organizationId: store.organizationId,
            storeId: store.id,
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
          })
        : await loginStorefrontAccount({
            storeId: store.id,
            email: data.email,
            password: data.password,
          });

    const cookieStore = await cookies();
    cookieStore.set(sessionCookieName(store.id), account.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: `/store/${storeSlug}`,
      maxAge: 60 * 60 * 24 * 30,
    });

    return Response.json({
      account: {
        id: account.id,
        email: account.email,
        customerId: account.customerId,
        name: account.customer.name,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
    if (err instanceof Error) {
      if (err.message === 'EMAIL_TAKEN') {
        return Response.json({ error: 'EMAIL_TAKEN' }, { status: 409 });
      }
      if (err.message === 'INVALID_CREDENTIALS') {
        return Response.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
      }
    }
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const store = await resolveStoreByPublicSlug(storeSlug);
    const cookieStore = await cookies();
    cookieStore.delete(sessionCookieName(store.id));
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
