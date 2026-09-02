import { redirect } from 'next/navigation';
import { requireOnboardedSession } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { MarketingDashboard } from '@/components/marketing/marketing-dashboard';

export default async function MarketingPage() {
  const session = await requireOnboardedSession();
  if (!sessionHasPermission(session.user, 'marketing.read')) redirect('/app');
  return <MarketingDashboard />;
}
