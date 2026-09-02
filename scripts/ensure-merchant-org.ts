import { createOrganizationWithDefaults } from '@/server/services/organization-service';
import { prisma } from '@/lib/db';

const email = process.argv[2] ?? 'eslamhuhu1@gmail.com';

async function main() {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    console.error('User not found');
    process.exit(1);
  }

  const existing = await prisma.membership.findFirst({ where: { userId: user.id } });
  if (existing) {
    console.log('Already has organization');
    return;
  }

  const result = await createOrganizationWithDefaults({
    userId: user.id,
    name: 'OMINO',
    businessType: 'retail',
    country: 'PS',
    currency: 'ILS',
    storeName: 'OMINO Store',
    branchName: 'Main Branch',
  });

  console.log(JSON.stringify({ ok: true, organizationId: result.organization.id }, null, 2));
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
