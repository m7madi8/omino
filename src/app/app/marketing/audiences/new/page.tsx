import { redirect } from 'next/navigation';
import { requireOnboardedSession } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { AudienceForm } from '@/components/marketing/audience-form';

export default async function NewAudiencePage() {
  const session = await requireOnboardedSession();
  if (!sessionHasPermission(session.user, 'marketing.manage_audiences')) redirect('/app/marketing/audiences');
  return <AudienceForm />;
}
