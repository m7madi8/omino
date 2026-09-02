import { prisma } from '@/lib/db';
import { slugify, uniqueSlug } from '@/lib/utils';
import { ensureDefaultStockLocation } from '@/server/services/inventory-service';
import { ensureDefaultRegister } from '@/server/services/pos-service';

export type BranchView = {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  address: string | null;
  isDefault: boolean;
  createdAt: Date;
};

export async function listBranchesForStore(organizationId: string, storeId: string) {
  const store = await prisma.store.findFirst({
    where: { id: storeId, organizationId },
  });
  if (!store) throw new Error('NOT_FOUND');

  return prisma.branch.findMany({
    where: { storeId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });
}

export async function createBranch(
  organizationId: string,
  storeId: string,
  input: { name: string; address?: string | null }
): Promise<BranchView> {
  const name = input.name.trim();
  if (!name) throw new Error('VALIDATION_ERROR');

  const store = await prisma.store.findFirst({
    where: { id: storeId, organizationId },
  });
  if (!store) throw new Error('NOT_FOUND');

  const baseSlug = slugify(name);
  let slug = baseSlug;
  let attempt = 0;
  while (await prisma.branch.findFirst({ where: { storeId, slug } })) {
    attempt += 1;
    slug = uniqueSlug(name, String(attempt));
  }

  return prisma.$transaction(async (tx) => {
    const branchCount = await tx.branch.count({ where: { storeId } });

    const branch = await tx.branch.create({
      data: {
        storeId,
        name,
        slug,
        address: input.address?.trim() || null,
        isDefault: branchCount === 0,
      },
    });

    await ensureDefaultStockLocation(organizationId, storeId, branch.id, branch.name, tx);
    await ensureDefaultRegister(organizationId, storeId, branch.id, tx);

    return branch;
  });
}

export async function updateBranch(
  organizationId: string,
  branchId: string,
  input: { name?: string; address?: string | null; isDefault?: boolean }
) {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, store: { organizationId } },
    include: { store: true },
  });
  if (!branch) throw new Error('NOT_FOUND');

  const name = input.name?.trim();

  return prisma.$transaction(async (tx) => {
    if (input.isDefault === true) {
      await tx.branch.updateMany({
        where: { storeId: branch.storeId },
        data: { isDefault: false },
      });
    }

    return tx.branch.update({
      where: { id: branchId },
      data: {
        ...(name && { name }),
        ...(input.address !== undefined && { address: input.address?.trim() || null }),
        ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
      },
    });
  });
}
