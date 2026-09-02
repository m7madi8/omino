import { prisma } from '@/lib/db';
import { seedNovaeDemo } from '../prisma/seeds/novae';

seedNovaeDemo()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
