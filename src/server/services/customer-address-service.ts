import { prisma } from '@/lib/db';
import type { CustomerAddressType } from '@/types/prisma-enums';
import { getCustomerOrThrow } from '@/server/services/customer-service';
import { recordCustomerEvent } from '@/server/services/customer-service';

export async function listCustomerAddresses(organizationId: string, customerId: string) {
  await getCustomerOrThrow(organizationId, customerId);
  return prisma.customerAddress.findMany({
    where: { organizationId, customerId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function createCustomerAddress(
  organizationId: string,
  customerId: string,
  userId: string | undefined,
  input: {
    firstName?: string;
    lastName?: string;
    company?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
    phone?: string;
    type?: CustomerAddressType;
    isDefault?: boolean;
  }
) {
  await getCustomerOrThrow(organizationId, customerId);

  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.customerAddress.updateMany({
        where: { customerId, type: input.type ?? 'SHIPPING' },
        data: { isDefault: false },
      });
    }

    const address = await tx.customerAddress.create({
      data: {
        organizationId,
        customerId,
        firstName: input.firstName,
        lastName: input.lastName,
        company: input.company,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        country: input.country,
        phone: input.phone,
        type: input.type ?? 'SHIPPING',
        isDefault: input.isDefault ?? false,
      },
    });

    await recordCustomerEvent(
      {
        organizationId,
        customerId,
        userId,
        eventType: 'ADDRESS_ADDED',
        metadata: { addressId: address.id, type: address.type },
      },
      tx
    );

    return address;
  });
}

export async function deleteCustomerAddress(
  organizationId: string,
  customerId: string,
  addressId: string
) {
  const address = await prisma.customerAddress.findFirst({
    where: { id: addressId, customerId, organizationId },
  });
  if (!address) throw new Error('NOT_FOUND');
  return prisma.customerAddress.delete({ where: { id: addressId } });
}
