import { redirect } from 'next/navigation';
import { requireOnboardedSession } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { AudienceDetail } from '@/components/marketing/audience-detail';

type Props = { params: Promise<{ id: string }> };

export default async function AudienceDetailPage({ params }: Props) {
  const session = await requireOnboardedSession();
  if (!sessionHasPermission(session.user, 'marketing.read')) redirect('/app');
  const { id } = await params;
  return <AudienceDetail id={id} />;
}
