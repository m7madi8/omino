/**
 * Category creation regression test (service layer).
 * Run: npm run test:category-create
 * Requires: DATABASE_URL
 */

import { prisma } from '@/lib/db';
import { createCategory, listCategories } from '@/server/services/category-service';

const results: { name: string; pass: boolean; detail?: string }[] = [];

function test(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log('\nOMINO Category Create Test\n');

  const ts = Date.now();
  const org = await prisma.organization.create({
    data: {
      name: `Category Test Org ${ts}`,
      slug: `category-test-${ts}`,
      currency: 'USD',
      country: 'PS',
    },
  });

  const user = await prisma.user.create({
    data: { email: `category-test-${ts}@omino.test`, fullName: 'Category Tester' },
  });

  const category = await createCategory(org.id, user.id, {
    name: `Test Category ${ts}`,
    description: 'Regression category',
  });

  test('createCategory returns id', Boolean(category.id));
  test('createCategory slug generated', Boolean(category.slug));

  const categories = await listCategories(org.id);
  test(
    'listCategories includes new category',
    categories.some((c) => c.id === category.id),
    `found ${categories.length} categories`
  );

  const duplicate = await createCategory(org.id, user.id, {
    name: `Test Category ${ts}`,
  });
  test('duplicate name gets unique slug', duplicate.slug !== category.slug);

  await prisma.organization.delete({ where: { id: org.id } });
  await prisma.user.delete({ where: { id: user.id } });

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed\n`);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
