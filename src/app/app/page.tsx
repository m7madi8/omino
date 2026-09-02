import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { getAnalyticsOverview } from '@/server/services/analytics/analytics-service';
import { OverviewDashboard } from '@/components/analytics/overview-dashboard';
import { GettingStarted } from '@/components/app/getting-started';

export default async function OverviewPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

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
        currency: 'USD',
      });
      const { prisma } = await import('@/lib/db');
      const org = await prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: { currency: true },
      });
      overview.currency = org?.currency || overview.currency;
    } catch (err) {
      console.error('[overview/analytics]', err);
    }
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-stone mb-2">Overview</p>
        <h1 className="text-3xl font-display">
          Welcome back{user.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-2 text-stone-2">
          {user.organizationName} · {user.storeName} · {user.branchName}
        </p>
      </div>

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
