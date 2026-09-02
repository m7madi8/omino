import { prisma } from '@/lib/db';

async function main() {
  const orgs = await prisma.organization.findMany({
    select: { slug: true, name: true, stores: { select: { publicSlug: true, name: true } } },
    take: 10,
  });
  const users = await prisma.user.findMany({
    where: { email: { contains: 'demo' } },
    select: { email: true, fullName: true },
  });
  console.log('orgs:', JSON.stringify(orgs, null, 2));
  console.log('demo users:', JSON.stringify(users, null, 2));
}

main().finally(() => prisma.$disconnect());
