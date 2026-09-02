import { redirect } from 'next/navigation';
import { requireOnboardedSession } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { PromotionDetail } from '@/components/marketing/promotion-detail';

type Props = { params: Promise<{ id: string }> };

export default async function PromotionDetailPage({ params }: Props) {
  const session = await requireOnboardedSession();
  if (!sessionHasPermission(session.user, 'marketing.read')) redirect('/app');
  const { id } = await params;
  return <PromotionDetail id={id} />;
}
