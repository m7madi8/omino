import { requireOnboardedSession } from '@/lib/auth';
import { assertPermission } from '@/lib/permissions/check';
import { AiActivityList } from '@/components/ai/activity-list';

export default async function AiActivityPage() {
  const session = await requireOnboardedSession();
  assertPermission(session.user, 'ai.use');

  return <AiActivityList />;
}
