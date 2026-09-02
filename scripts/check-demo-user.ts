import { prisma } from '@/lib/db';

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'demo@omino.test' },
    select: {
      email: true,
      memberships: {
        select: {
          organization: {
            select: {
              slug: true,
              stores: { select: { publicSlug: true, name: true } },
            },
          },
        },
      },
    },
  });
  console.log(JSON.stringify(user, null, 2));
}

main().finally(() => prisma.$disconnect());
