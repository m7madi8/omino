import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  addStoreDomain,
  listStoreDomains,
  removeStoreDomain,
  setPrimaryDomain,
  markDomainConnected,
  getDnsInstructions,
} from '@/server/services/store-domain-service';

export async function GET() {
  try {
    const ctx = await requireTenantContext('store.read');
    if (!ctx.storeId) {
      return Response.json({ error: 'STORE_REQUIRED' }, { status: 400 });
    }
    const domains = await listStoreDomains(ctx.organizationId, ctx.storeId);
    return Response.json({
      domains: domains.map((d) => ({
        ...d,
        dns: getDnsInstructions(d),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext('store.write');
    if (!ctx.storeId) {
      return Response.json({ error: 'STORE_REQUIRED' }, { status: 400 });
    }
    const body = await request.json();
    const { hostname } = z.object({ hostname: z.string().min(3).max(253) }).parse(body);
    const domain = await addStoreDomain(ctx.organizationId, ctx.storeId, hostname);
    return Response.json({
      domain: { ...domain, dns: getDnsInstructions(domain) },
    }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
    if (err instanceof Error && err.message === 'DOMAIN_TAKEN') {
      return Response.json({ error: 'DOMAIN_TAKEN' }, { status: 409 });
    }
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireTenantContext('store.write');
    const body = await request.json();
    const data = z
      .object({
        domainId: z.string().uuid(),
        action: z.enum(['mark_connected', 'set_primary']),
      })
      .parse(body);

    const domain =
      data.action === 'set_primary'
        ? await setPrimaryDomain(ctx.organizationId, data.domainId)
        : await markDomainConnected(ctx.organizationId, data.domainId);

    return Response.json({ domain });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
    return handleApiError(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await requireTenantContext('store.write');
    const body = await request.json();
    const { domainId } = z.object({ domainId: z.string().uuid() }).parse(body);
    await removeStoreDomain(ctx.organizationId, domainId);
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
    return handleApiError(err);
  }
}
