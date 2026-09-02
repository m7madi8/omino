import { requireOnboardedSession } from '@/lib/auth';
import { assertPermission } from '@/lib/permissions/check';
import { AutomationEditor } from '@/components/automations/automation-editor';

type PageProps = { params: Promise<{ id: string }> };

export default async function EditAutomationPage({ params }: PageProps) {
  const session = await requireOnboardedSession();
  assertPermission(session.user, 'automations.write');
  const { id } = await params;
  return <AutomationEditor automationId={id} />;
}
