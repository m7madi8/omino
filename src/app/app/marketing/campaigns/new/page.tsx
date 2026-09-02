import { redirect } from 'next/navigation';
import { requireOnboardedSession } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { CampaignNewPage } from '@/components/marketing/campaign-new';

export default async function NewCampaignPage() {
  const session = await requireOnboardedSession();
  if (!sessionHasPermission(session.user, 'marketing.create_campaign')) redirect('/app/marketing/campaigns');
  return <CampaignNewPage />;
}
