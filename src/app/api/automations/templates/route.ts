import { NextResponse } from 'next/server';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { getAutomationTemplate } from '@/server/automation/templates';
import { createAutomation } from '@/server/automation/automation-service';

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext('automations.write');
    const body = (await request.json()) as { templateId: string };
    const template = getAutomationTemplate(body.templateId);
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
  } catch (err) {
    return handleApiError(err);
  }
}
