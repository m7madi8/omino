import { redirect } from 'next/navigation';
import { requireOnboardedSession } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { CampaignDetail } from '@/components/marketing/campaign-detail';

type Props = { params: Promise<{ id: string }> };

export default async function CampaignDetailPage({ params }: Props) {
  const session = await requireOnboardedSession();
  if (!sessionHasPermission(session.user, 'marketing.read')) redirect('/app');
  const { id } = await params;
  return <CampaignDetail id={id} />;
}
