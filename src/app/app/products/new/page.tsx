import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { listCategories } from '@/server/services/category-service';
import { listStockLocations } from '@/server/services/inventory-service';
import { prisma } from '@/lib/db';
import { ProductForm } from '@/components/catalog/product-form';

export default async function NewProductPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');

  if (!sessionHasPermission(session.user, 'products.write')) {
    redirect('/app/products');
  }

  const [categories, locations, org] = await Promise.all([
    listCategories(session.user.organizationId),
    listStockLocations(session.user.organizationId),
    prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { currency: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl">New product</h1>
        <p className="text-sm text-stone-2 mt-1">Add a product to your catalog</p>
      </div>
      <ProductForm
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        locations={locations.map((l) => ({ id: l.id, name: l.name }))}
        currency={org?.currency || 'USD'}
      />
    </div>
  );
}
