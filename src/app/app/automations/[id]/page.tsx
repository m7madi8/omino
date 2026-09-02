import { requireOnboardedSession } from '@/lib/auth';
import { assertPermission } from '@/lib/permissions/check';
import { AutomationDetail } from '@/components/automations/automation-detail';

type PageProps = { params: Promise<{ id: string }> };

export default async function AutomationDetailPage({ params }: PageProps) {
  const session = await requireOnboardedSession();
  assertPermission(session.user, 'automations.read');
  const { id } = await params;
  return <AutomationDetail automationId={id} />;
}
