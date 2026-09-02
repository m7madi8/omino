import { redirect } from 'next/navigation';
import { requireOnboardedSession } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { PromotionForm } from '@/components/marketing/promotion-form';

export default async function NewPromotionPage() {
  const session = await requireOnboardedSession();
  if (!sessionHasPermission(session.user, 'marketing.manage_promotions')) redirect('/app/marketing/promotions');
  return <PromotionForm />;
}
