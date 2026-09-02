import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  archiveCategory,
  createCategory,
  listCategories,
  updateCategory,
} from '@/server/services/category-service';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().uuid().optional(),
  storeId: z.string().uuid().optional(),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const ctx = await requireTenantContext('products.read');
    const categories = await listCategories(ctx.organizationId);
    return NextResponse.json({ categories });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext('products.write');
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          details: parsed.error.flatten(),
          ...(process.env.NODE_ENV === 'development' && {
            issues: parsed.error.issues.map((issue) => ({
              field: issue.path.join('.') || '(root)',
              reason: issue.message,
            })),
          }),
        },
        { status: 400 }
      );
    }

    const category = await createCategory(
      ctx.organizationId,
      ctx.userId,
      parsed.data
    );
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireTenantContext('products.write');
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });

    const category = await updateCategory(ctx.organizationId, ctx.userId, id, data);
    return NextResponse.json({ category });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await requireTenantContext('products.write');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });

    await archiveCategory(ctx.organizationId, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
