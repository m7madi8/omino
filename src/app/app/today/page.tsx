import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { getTodayDashboard } from '@/server/services/analytics/today-dashboard-service';
import { getBusinessInsights } from '@/server/services/business-insights-service';
import { TodayDashboard } from '@/components/merchant/today-dashboard';

export default async function TodayPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');

  if (!sessionHasPermission(session.user, 'analytics.read')) {
    redirect('/app/orders');
  }

  const [data, insights] = await Promise.all([
    getTodayDashboard({
      organizationId: session.user.organizationId,
      storeId: session.user.storeId ?? undefined,
      branchId: session.user.branchId ?? undefined,
      currency: session.user.currency,
    }),
    getBusinessInsights({
      organizationId: session.user.organizationId,
      storeId: session.user.storeId ?? undefined,
      locale: session.user.locale,
    }),
  ]);

  return (
    <TodayDashboard
      data={data}
      insights={insights}
      storePublicSlug={session.user.storePublicSlug}
      storeName={session.user.storeName || session.user.organizationName || 'OMINO'}
    />
  );
}
