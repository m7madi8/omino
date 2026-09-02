import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { getTodayDashboard } from '@/server/services/analytics/today-dashboard-service';
import { getBusinessInsights } from '@/server/services/business-insights-service';
import { TodayDashboard } from '@/components/merchant/today-dashboard';
import { ShareStoreWhatsAppButton } from '@/components/merchant/share-store-whatsapp';

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
    <div className="space-y-4">
      <TodayDashboard data={data} insights={insights} />
      {session.user.storePublicSlug && (
        <div className="max-w-lg mx-auto lg:max-w-2xl flex justify-center">
          <ShareStoreWhatsAppButton
            storeName={session.user.storeName || session.user.organizationName || 'OMINO'}
            publicSlug={session.user.storePublicSlug}
          />
        </div>
      )}
    </div>
  );
}
