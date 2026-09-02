import { requireOnboardedSession } from '@/lib/auth';
import { assertPermission } from '@/lib/permissions/check';
import { AutomationEditor } from '@/components/automations/automation-editor';

export default async function NewAutomationPage() {
  const session = await requireOnboardedSession();
  assertPermission(session.user, 'automations.write');
  return <AutomationEditor />;
}
