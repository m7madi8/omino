import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  createAutomation,
  listAutomations,
  getAutomationMetrics,
} from '@/server/automation/automation-service';
import { AUTOMATION_TRIGGERS } from '@/server/automation/triggers/registry';
import { AUTOMATION_ACTIONS } from '@/server/automation/actions/registry';
import { listAutomationTemplates } from '@/server/automation/templates';
import type { AutomationVersionConfig } from '@/types/automation';

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  storeId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  config: z.object({
    trigger: z.object({ type: z.string(), config: z.record(z.unknown()).optional() }),
    conditions: z.any().optional(),
    steps: z.array(z.any()).min(1),
    schedule: z.any().optional(),
  }),
});

export async function GET(request: Request) {
  try {
    const ctx = await requireTenantContext('automations.read');
    const { searchParams } = new URL(request.url);

    if (searchParams.get('meta') === 'true') {
      return NextResponse.json({
        triggers: AUTOMATION_TRIGGERS,
        actions: AUTOMATION_ACTIONS,
        templates: listAutomationTemplates(),
      });
    }

    if (searchParams.get('metrics') === 'true') {
      const metrics = await getAutomationMetrics(ctx.organizationId);
      return NextResponse.json({ metrics });
    }

    const automations = await listAutomations(ctx.organizationId);
    return NextResponse.json({ automations });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext('automations.write');
    const body = createSchema.parse(await request.json());

    const automation = await createAutomation({
      organizationId: ctx.organizationId,
      createdById: ctx.userId,
      name: body.name,
      description: body.description,
      storeId: body.storeId,
      branchId: body.branchId,
      config: body.config as AutomationVersionConfig,
    });

    return NextResponse.json({ automation }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
