import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  getAutomation,
  updateAutomationDraft,
  archiveAutomation,
  listAutomationExecutions,
} from '@/server/automation/automation-service';
import type { AutomationVersionConfig } from '@/types/automation';

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  config: z
    .object({
      trigger: z.object({ type: z.string() }),
      conditions: z.any().optional(),
      steps: z.array(z.any()).min(1),
      schedule: z.any().optional(),
    })
    .optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext('automations.read');
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    if (searchParams.get('executions') === 'true') {
      const page = parseInt(searchParams.get('page') ?? '1', 10);
      const executions = await listAutomationExecutions(
        ctx.organizationId,
        id,
        page
      );
      return NextResponse.json(executions);
    }

    const automation = await getAutomation(ctx.organizationId, id);
    return NextResponse.json({ automation });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext('automations.write');
    const { id } = await params;
    const body = updateSchema.parse(await request.json());

    const automation = await updateAutomationDraft(ctx.organizationId, id, {
      name: body.name,
      description: body.description,
      config: body.config as AutomationVersionConfig | undefined,
    });

    return NextResponse.json({ automation });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext('automations.delete');
    const { id } = await params;
    const automation = await archiveAutomation(ctx.organizationId, id);
    return NextResponse.json({ automation });
  } catch (err) {
    return handleApiError(err);
  }
}
