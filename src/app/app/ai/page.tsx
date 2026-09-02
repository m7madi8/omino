import { requireOnboardedSession } from '@/lib/auth';
import { assertPermission } from '@/lib/permissions/check';
import { AiChat } from '@/components/ai/ai-chat';

export default async function AiPage() {
  const session = await requireOnboardedSession();
  assertPermission(session.user, 'ai.use');

  return <AiChat user={session.user} />;
}
