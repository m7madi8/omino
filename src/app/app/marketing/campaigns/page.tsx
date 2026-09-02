import { redirect } from 'next/navigation';
import { requireOnboardedSession } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { CampaignsList } from '@/components/marketing/campaigns-list';

export default async function CampaignsPage() {
  const session = await requireOnboardedSession();
  if (!sessionHasPermission(session.user, 'marketing.read')) redirect('/app');
  return <CampaignsList />;
}
