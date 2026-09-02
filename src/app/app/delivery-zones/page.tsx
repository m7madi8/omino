import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { DeliveryZonesEditor } from '@/components/merchant/delivery-zones-editor';
import { PageHeader } from '@/components/app/dashboard/page-header';
import { t } from '@/lib/i18n';

export default async function DeliveryZonesPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');
  if (!sessionHasPermission(session.user, 'store.read')) redirect('/app');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.advanced', session.user.locale)}
        title={t('delivery.zones', session.user.locale)}
      />
      <DeliveryZonesEditor currency={session.user.currency} />
    </div>
  );
}
