import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  createCustomerAddress,
  listCustomerAddresses,
} from '@/server/services/customer-address-service';
import { allowedCountrySchema } from '@/lib/geo/allowed-countries';

const addressSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: allowedCountrySchema,
  phone: z.string().optional(),
  type: z.enum(['SHIPPING', 'BILLING', 'OTHER']).optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantContext('customers.read');
    const { id } = await params;
    const addresses = await listCustomerAddresses(ctx.organizationId, id);
    return NextResponse.json({ addresses });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantContext('customers.write');
    const { id } = await params;
    const parsed = addressSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const address = await createCustomerAddress(
      ctx.organizationId,
      id,
      ctx.userId,
      parsed.data
    );
    return NextResponse.json({ address }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
