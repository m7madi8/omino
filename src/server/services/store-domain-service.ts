import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import type { StoreDomainStatus } from '@prisma/client';

export async function listStoreDomains(organizationId: string, storeId: string) {
  return prisma.storeDomain.findMany({
    where: { organizationId, storeId },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function addStoreDomain(
  organizationId: string,
  storeId: string,
  hostname: string
) {
  const normalized = hostname.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!normalized || normalized.includes('/')) throw new Error('INVALID_HOSTNAME');

  const existing = await prisma.storeDomain.findUnique({ where: { hostname: normalized } });
  if (existing) throw new Error('DOMAIN_TAKEN');

  const verificationToken = `omino-verify=${randomBytes(16).toString('hex')}`;

  return prisma.storeDomain.create({
    data: {
      organizationId,
      storeId,
      hostname: normalized,
      status: 'PENDING',
      verificationToken,
    },
  });
}

export async function verifyStoreDomain(organizationId: string, domainId: string) {
  const domain = await prisma.storeDomain.findFirst({
    where: { id: domainId, organizationId },
  });
  if (!domain) throw new Error('NOT_FOUND');

  // Provider-agnostic: manual verification flow — merchant confirms DNS TXT record
  return prisma.storeDomain.update({
    where: { id: domainId },
    data: {
      status: 'VERIFYING',
      errorMessage: null,
    },
  });
}

export async function markDomainConnected(organizationId: string, domainId: string) {
  const domain = await prisma.storeDomain.findFirst({
    where: { id: domainId, organizationId },
  });
  if (!domain) throw new Error('NOT_FOUND');

  return prisma.storeDomain.update({
    where: { id: domainId },
    data: {
      status: 'CONNECTED',
      verifiedAt: new Date(),
      sslStatus: 'pending_provisioning',
      errorMessage: null,
    },
  });
}

export async function setPrimaryDomain(organizationId: string, domainId: string) {
  const domain = await prisma.storeDomain.findFirst({
    where: { id: domainId, organizationId, status: 'CONNECTED' },
  });
  if (!domain) throw new Error('NOT_FOUND');

  return prisma.$transaction(async (tx) => {
    await tx.storeDomain.updateMany({
      where: { storeId: domain.storeId },
      data: { isPrimary: false },
    });
    return tx.storeDomain.update({
      where: { id: domainId },
      data: { isPrimary: true },
    });
  });
}

export async function removeStoreDomain(organizationId: string, domainId: string) {
  const domain = await prisma.storeDomain.findFirst({
    where: { id: domainId, organizationId },
  });
  if (!domain) throw new Error('NOT_FOUND');
  return prisma.storeDomain.delete({ where: { id: domainId } });
}

export function getDnsInstructions(domain: {
  hostname: string;
  verificationToken: string | null;
}) {
  return {
    cname: {
      type: 'CNAME',
      host: domain.hostname,
      value: 'stores.omino.app',
      note: 'Point your domain to OMINO storefront infrastructure',
    },
    txt: {
      type: 'TXT',
      host: `_omino.${domain.hostname}`,
      value: domain.verificationToken ?? '',
      note: 'Add this TXT record to verify domain ownership',
    },
  };
}

export async function resolveStoreByHostname(hostname: string) {
  const normalized = hostname.toLowerCase().trim();
  const domain = await prisma.storeDomain.findFirst({
    where: {
      hostname: normalized,
      status: 'CONNECTED',
      isPrimary: true,
    },
    include: { store: true },
  });
  return domain?.store ?? null;
}
