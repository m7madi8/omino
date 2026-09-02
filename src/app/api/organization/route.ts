import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { allowedCountrySchema } from '@/lib/geo/allowed-countries';

const updateSchema = z.object({
  organizationId: z.string().uuid().optional(),
  name: z.string().min(1).max(200).optional(),
  currency: z.string().length(3).optional(),
  country: allowedCountrySchema.optional(),
});

export async function GET() {
  try {
    const ctx = await requireTenantContext('settings.read');
    const { prisma } = await import('@/lib/db');
    const { getOrgStores, getOrgTeam } = await import('@/server/services/organization-service');

    const [organization, team, stores] = await Promise.all([
      prisma.organization.findUnique({ where: { id: ctx.organizationId } }),
      getOrgTeam(ctx.organizationId),
      getOrgStores(ctx.organizationId),
    ]);

    return NextResponse.json({
      organization,
      team: team.map((m) => ({
        id: m.id,
        email: m.user.email,
        fullName: m.user.fullName,
        phone: m.user.phone,
        role: m.role.slug,
        joinedAt: m.createdAt,
      })),
      stores: stores.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        isDefault: s.isDefault,
        branches: s.branches.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          isDefault: b.isDefault,
          address: b.address,
        })),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireTenantContext('settings.write');
    const body = updateSchema.parse(await request.json());

    if (body.organizationId && body.organizationId !== ctx.organizationId) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { prisma } = await import('@/lib/db');
    const updated = await prisma.organization.update({
      where: { id: ctx.organizationId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.currency && { currency: body.currency }),
        ...(body.country && { country: body.country }),
      },
    });

    return NextResponse.json({ organization: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
