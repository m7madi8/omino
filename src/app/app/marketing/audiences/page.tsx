import { redirect } from 'next/navigation';
import { requireOnboardedSession } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { AudiencesList } from '@/components/marketing/audiences-list';

export default async function AudiencesPage() {
  const session = await requireOnboardedSession();
  if (!sessionHasPermission(session.user, 'marketing.read')) redirect('/app');
  return <AudiencesList />;
}
