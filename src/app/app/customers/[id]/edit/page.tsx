import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { getCustomerOrThrow } from '@/server/services/customer-service';
import { CustomerFormClient } from '@/components/crm/customer-form';

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');

  if (!sessionHasPermission(session.user, 'customers.write')) {
    redirect('/app/customers');
  }

  const { id } = await params;

  try {
    const customer = await getCustomerOrThrow(session.user.organizationId, id);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display">Edit customer</h1>
          <p className="text-sm text-stone-2 mt-1">{customer.name}</p>
        </div>
        <CustomerFormClient
          mode="edit"
          customerId={id}
          initial={{
            firstName: customer.firstName,
            lastName: customer.lastName,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            notes: customer.notes,
            status: customer.status,
          }}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
