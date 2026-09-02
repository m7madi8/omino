import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { listProducts, createProduct } from '@/server/services/product-service';

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  productType: z.enum(['PHYSICAL', 'DIGITAL', 'SERVICE']).optional(),
  brand: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  trackInventory: z.boolean().optional(),
  sellingPrice: z.number().positive(),
  costPrice: z.number().optional(),
  compareAtPrice: z.number().optional(),
  currency: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  barcodeType: z.enum(['EAN', 'UPC', 'GTIN', 'INTERNAL']).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  initialStock: z.number().int().min(0).optional(),
  stockLocationId: z.string().uuid().optional(),
  catalogKind: z.enum(['SIMPLE', 'BUNDLE']).optional(),
  isFeatured: z.boolean().optional(),
  bundleItems: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .optional(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        altText: z.string().optional(),
        isPrimary: z.boolean().optional(),
      })
    )
    .optional(),
  options: z
    .array(z.object({ name: z.string(), values: z.array(z.string()) }))
    .optional(),
  variants: z
    .array(
      z.object({
        sku: z.string().optional(),
        name: z.string().optional(),
        sellingPrice: z.number().positive(),
        costPrice: z.number().optional(),
        compareAtPrice: z.number().optional(),
        barcode: z.string().optional(),
        barcodeType: z.enum(['EAN', 'UPC', 'GTIN', 'INTERNAL']).optional(),
        optionValues: z.array(z.string()).optional(),
        initialStock: z.number().int().min(0).optional(),
        lowStockThreshold: z.number().int().min(0).optional(),
      })
    )
    .optional(),
});

export async function GET(request: Request) {
  try {
    const ctx = await requireTenantContext('products.read');
    const { searchParams } = new URL(request.url);

    const result = await listProducts({
      organizationId: ctx.organizationId,
      storeId: searchParams.get('storeId') || ctx.storeId || undefined,
      status: (searchParams.get('status') as 'DRAFT' | 'ACTIVE' | 'ARCHIVED') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      pageSize: parseInt(searchParams.get('pageSize') || '25', 10),
    });

    return NextResponse.json(result);
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
      const response: {
        error: string;
        details: ReturnType<typeof parsed.error.flatten>;
        issues?: { field: string; reason: string }[];
      } = {
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      };

      if (process.env.NODE_ENV === 'development') {
        response.issues = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.') || '(root)',
          reason: issue.message,
        }));
      }

      return NextResponse.json(response, { status: 400 });
    }

    const data = parsed.data;
    if (data.catalogKind === 'BUNDLE' && (!data.bundleItems || data.bundleItems.length === 0)) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Bundle products must include at least one item.',
        },
        { status: 400 }
      );
    }

    const result = await createProduct(ctx, {
      ...data,
      variants: data.variants,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
