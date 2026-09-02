import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isSimpleMode } from '@/lib/merchant/palestine-mode';
import { sessionHasPermission } from '@/lib/permissions/check';
import { getAnalyticsOverview } from '@/server/services/analytics/analytics-service';
import { PageHeader } from '@/components/app/dashboard/page-header';
import { OverviewDashboard } from '@/components/analytics/overview-dashboard';
import { GettingStarted } from '@/components/app/getting-started';

export default async function OverviewPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  if (isSimpleMode(session.user.merchantExperienceMode)) {
    redirect('/app/today');
  }

  const user = session.user;
  const canViewAnalytics = sessionHasPermission(user, 'analytics.read');

  let overview = null;
  if (canViewAnalytics && user.organizationId) {
    try {
      overview = await getAnalyticsOverview({
        organizationId: user.organizationId,
        storeId: user.storeId ?? undefined,
        branchId: user.branchId ?? undefined,
        preset: 'last_30_days',
        currency: user.currency,
      });
    } catch (err) {
      console.error('[overview/analytics]', err);
    }
  }

  return (
    <div className="max-w-6xl space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back${user.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        description={[user.organizationName, user.storeName, user.branchName].filter(Boolean).join(' · ')}
      />

      {canViewAnalytics && overview ? (
        overview.hasData ? (
          <OverviewDashboard data={overview} />
        ) : (
          <div className="space-y-6">
            <GettingStarted />
            <OverviewDashboard data={overview} />
          </div>
        )
      ) : (
        <p className="text-sm text-stone-2">
          Contact your administrator for analytics access to view business metrics.
        </p>
      )}
    </div>
  );
}
