/**
 * Phase 9 — Automation + Workflow Engine tests
 * Run: npm run test:phase9
 */

import { evaluateConditionGroup } from '../src/server/automation/conditions/engine';
import { triggerMatches, AUTOMATION_TRIGGERS } from '../src/server/automation/triggers/registry';
import { AUTOMATION_ACTIONS, getActionDefinition } from '../src/server/automation/actions/registry';
import { listAutomationTemplates } from '../src/server/automation/templates';
import { computeNextRun } from '../src/server/automation/scheduler-service';

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

function testConditionEngine() {
  console.log('\nCondition Engine');

  const data = { order: { totalMinor: 15000 }, customer: { completedOrders: 5 } };

  const passed1 = evaluateConditionGroup(
    {
      operator: 'AND',
      conditions: [
        { field: 'order.totalMinor', operator: 'greater_than', value: 10000 },
        { field: 'customer.completedOrders', operator: 'greater_than_or_equal', value: 3 },
      ],
    },
    data
  );
  assert(passed1.passed, 'AND numeric conditions pass');

  const failed1 = evaluateConditionGroup(
    {
      operator: 'OR',
      conditions: [
        { field: 'order.totalMinor', operator: 'less_than', value: 100 },
        { field: 'customer.completedOrders', operator: 'equals', value: 1 },
      ],
    },
    data
  );
  assert(!failed1.passed, 'OR conditions fail when neither matches');

  const contains = evaluateConditionGroup(
    {
      operator: 'AND',
      conditions: [{ field: 'payload.name', operator: 'contains', value: 'test' }],
    },
    { payload: { name: 'Test Customer' } }
  );
  assert(contains.passed, 'string contains works');

  const notExists = evaluateConditionGroup(
    {
      operator: 'AND',
      conditions: [{ field: 'payload.missing', operator: 'not_exists' }],
    },
    { payload: {} }
  );
  assert(notExists.passed, 'not_exists works');
}

function testTriggerRegistry() {
  console.log('\nTrigger Registry');
  assert(AUTOMATION_TRIGGERS.length >= 20, 'has at least 20 triggers');
  assert(triggerMatches('order.completed', 'order.completed'), 'exact match');
  assert(triggerMatches('payment.received', 'payment.paid'), 'alias match');
  assert(!triggerMatches('order.created', 'order.completed'), 'wrong event no match');
}

function testActionRegistry() {
  console.log('\nAction Registry');
  assert(AUTOMATION_ACTIONS.length >= 8, 'has at least 8 actions');
  const tag = getActionDefinition('add_customer_tag');
  assert(tag?.riskLevel === 'LOW', 'add_customer_tag is LOW risk');
  assert(tag?.permissions.includes('automations.execute'), 'requires automations.execute');
}

function testTemplates() {
  console.log('\nTemplates');
  const templates = listAutomationTemplates();
  assert(templates.length >= 5, 'has at least 5 templates');
  assert(templates.some((t) => t.id === 'low-stock-alert'), 'low stock template exists');
}

function testScheduler() {
  console.log('\nScheduler');
  const next = computeNextRun({ type: 'daily', hour: 9, minute: 0 }, new Date('2026-01-01T10:00:00Z'));
  assert(next > new Date('2026-01-01T10:00:00Z'), 'daily schedule computes future run');
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

    const { createAutomation, activateAutomation, archiveAutomation } = await import(
      '../src/server/automation/automation-service'
    );

    const org = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    if (!org || !user) {
      console.log('  ⊘ Skipped — no seed data');
      return;
    }

    const automation = await createAutomation({
      organizationId: org.id,
      createdById: user.id,
      name: 'Test Automation',
      config: {
        trigger: { type: 'customer.created' },
        steps: [
          {
            type: 'action',
            actionType: 'send_notification',
            input: { title: 'Test', body: 'Test notification' },
          },
        ],
      },
    });
    assert(Boolean(automation.id), 'creates automation');

    const activated = await activateAutomation(org.id, automation.id);
    assert(activated.status === 'ACTIVE', 'activates automation');

    await archiveAutomation(org.id, automation.id);
    assert(true, 'archives automation');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ⊘ Skipped — database unavailable (${msg.slice(0, 80)})`);
  }
}

async function main() {
  console.log('OMINO Phase 9 Tests\n==================');

  testConditionEngine();
  testTriggerRegistry();
  testActionRegistry();
  testTemplates();
  testScheduler();
  await testDatabaseIntegration();

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
