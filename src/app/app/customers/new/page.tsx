import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { CustomerFormClient } from '@/components/crm/customer-form';

export default async function NewCustomerPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');

  if (!sessionHasPermission(session.user, 'customers.write')) {
    redirect('/app/customers');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display">New customer</h1>
        <p className="text-sm text-stone-2 mt-1">Add a customer to your CRM</p>
      </div>
      <CustomerFormClient mode="create" />
    </div>
  );
}
