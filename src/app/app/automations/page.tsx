import { requireOnboardedSession } from '@/lib/auth';
import { assertPermission } from '@/lib/permissions/check';
import { AutomationsList } from '@/components/automations/automations-list';

export default async function AutomationsPage() {
  const session = await requireOnboardedSession();
  assertPermission(session.user, 'automations.read');
  return <AutomationsList />;
}
