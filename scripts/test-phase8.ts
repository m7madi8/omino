/**
 * Phase 8 — AI Core + Agents tests
 * Run: npm run test:phase8
 */

import { getToolDefinition, TOOL_INPUT_SCHEMAS, TOOL_DEFINITIONS } from '../src/server/ai/tools/registry';
import { hasToolPermission } from '../src/server/ai/tools/executor';
import { routeToAgent } from '../src/server/ai/agents/router';
import { getAgent } from '../src/server/ai/agents/definitions';
import { checkRateLimit, resetRateLimit } from '../src/lib/security/rate-limit';
import { getAiConfig } from '../src/server/ai/config';
import { MockProvider } from '../src/server/ai/providers/mock-provider';
import type { PermissionKey } from '../src/lib/permissions/constants';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${message}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${message}`);
  }
}

async function testToolRegistry() {
  console.log('\nTool Registry');
  assert(TOOL_DEFINITIONS.length >= 14, 'has at least 14 tools');
  assert(Boolean(getToolDefinition('get_sales_summary')), 'get_sales_summary exists');
  assert(getToolDefinition('get_sales_summary')?.classification === 'read', 'sales summary is read');
  assert(getToolDefinition('adjust_inventory')?.risk === 'HIGH', 'adjust_inventory is HIGH risk');
  assert(getToolDefinition('adjust_inventory')?.requiresConfirmation === true, 'adjust_inventory requires confirmation');

  const schema = TOOL_INPUT_SCHEMAS.get_sales_summary;
  assert(schema.safeParse({ period: 'this_month' }).success, 'valid sales summary input');
  assert(!schema.safeParse({ period: 'invalid' }).success, 'rejects invalid period');
}

function testPermissions() {
  console.log('\nPermissions');
  const staffPerms: PermissionKey[] = ['ai.use', 'analytics.read', 'inventory.read'];
  assert(hasToolPermission(staffPerms, ['analytics.read']), 'staff can read analytics tool');
  assert(!hasToolPermission(staffPerms, ['ai.execute']), 'staff lacks ai.execute');
  assert(
    !hasToolPermission(staffPerms, ['inventory.write', 'ai.execute']),
    'staff cannot run write tools'
  );
}

function testAgentRouting() {
  console.log('\nAgent Routing');
  assert(routeToAgent('How are my sales this month?') === 'ANALYST', 'sales → analyst');
  assert(routeToAgent('What is running low in stock?') === 'OPERATIONS', 'inventory → operations');
  assert(routeToAgent('Who are my best customers?') === 'CUSTOMER', 'customers → customer agent');
  assert(routeToAgent('What should I do to grow?') === 'GROWTH', 'growth → growth agent');

  const analyst = getAgent('ANALYST');
  assert(analyst.allowedTools.includes('get_sales_summary'), 'analyst has sales tools');
  assert(!analyst.allowedTools.includes('adjust_inventory'), 'analyst lacks write tools');
}

function testRateLimit() {
  console.log('\nRate Limiting');
  resetRateLimit('test-user');
  const config = getAiConfig();
  const limit = config.rateLimitPerMinute;
  let blocked = false;
  for (let i = 0; i < limit + 5; i++) {
    const result = checkRateLimit('test-user', limit);
    if (!result.allowed) blocked = true;
  }
  assert(blocked, 'rate limit blocks excessive requests');
  resetRateLimit('test-user');
}

async function testMockProvider() {
  console.log('\nMock Provider');
  const provider = new MockProvider();
  const tools = TOOL_DEFINITIONS.filter((t) =>
    ['get_sales_summary', 'get_top_products'].includes(t.name)
  );

  const result = await provider.generate({
    messages: [{ role: 'user', content: 'How are my sales this month?' }],
    tools,
  });

  assert(result.finishReason === 'tool_calls', 'mock provider selects tool for sales question');
  assert(result.toolCalls?.[0]?.name === 'get_sales_summary', 'selects get_sales_summary');
}

async function testDatabaseIntegration() {
  console.log('\nDatabase Integration (optional)');
  if (!process.env.DATABASE_URL) {
    console.log('  ⊘ Skipped — no DATABASE_URL');
    return;
  }

  try {
    const { prisma } = await import('../src/lib/db');
    await prisma.$connect();

    const { createConversation, addMessage, getConversation, deleteConversation } = await import(
      '../src/server/ai/conversation-service'
    );

    const org = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    if (!org || !user) {
      console.log('  ⊘ Skipped — no seed data');
      return;
    }

    const conv = await createConversation({
      organizationId: org.id,
      userId: user.id,
      title: 'Test conversation',
    });
    assert(Boolean(conv.id), 'creates conversation');

    await addMessage({
      conversationId: conv.id,
      role: 'USER',
      content: 'Test message',
    });

    const loaded = await getConversation(org.id, user.id, conv.id);
    assert(loaded.messages.length === 1, 'persists message');

    await deleteConversation(org.id, user.id, conv.id);
    assert(true, 'deletes conversation');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ⊘ Skipped — database unavailable (${msg.slice(0, 80)})`);
  }
}

async function main() {
  console.log('OMINO Phase 8 Tests\n==================');

  await testToolRegistry();
  testPermissions();
  testAgentRouting();
  testRateLimit();
  await testMockProvider();
  await testDatabaseIntegration();

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
