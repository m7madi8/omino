import { NextResponse } from 'next/server';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  activateAutomation,
  pauseAutomation,
  duplicateAutomation,
} from '@/server/automation/automation-service';
import { getAutomationTemplate } from '@/server/automation/templates';
import { createAutomation } from '@/server/automation/automation-service';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { action: string };

    if (id === 'from-template' && body.action === 'create') {
      const ctx = await requireTenantContext('automations.write');
      const templateId = (body as { templateId?: string }).templateId;
      if (!templateId) {
        return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
      }
      const template = getAutomationTemplate(templateId);
      if (!template) {
        return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
      }
      const automation = await createAutomation({
        organizationId: ctx.organizationId,
        createdById: ctx.userId,
        name: template.name,
        description: template.description,
        config: template.config,
      });
      return NextResponse.json({ automation }, { status: 201 });
    }

    const ctx = await requireTenantContext(
      body.action === 'activate' ? 'automations.activate' : 'automations.write'
    );

    switch (body.action) {
      case 'activate': {
        const automation = await activateAutomation(ctx.organizationId, id);
        return NextResponse.json({ automation });
      }
      case 'pause': {
        const automation = await pauseAutomation(ctx.organizationId, id);
        return NextResponse.json({ automation });
      }
      case 'duplicate': {
        const automation = await duplicateAutomation(
          ctx.organizationId,
          id,
          ctx.userId
        );
        return NextResponse.json({ automation }, { status: 201 });
      }
      default:
        return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
  } catch (err) {
    return handleApiError(err);
  }
}
