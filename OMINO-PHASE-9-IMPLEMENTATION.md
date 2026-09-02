# OMINO — Phase 9 Implementation Report

**Date:** 2026-09-01  
**Phase:** Automation + Workflow Engine  
**Status:** Complete

---

## Summary

Phase 9 introduces OMINO's automation and workflow engine: a deterministic, auditable system that reacts to business events, evaluates conditions, and executes actions through existing domain services.

**Core principle enforced:** Event → Trigger → Conditions → Execution → Action → Domain Service → Result → Log. No raw database access from automations.

---

## Architecture

```
Domain Service
    ↓
Domain Event Emitter (order/customer/catalog)
    ↓
Event Bus (publishBusinessEvent → business_events)
    ↓
Automation Engine (processEventForAutomations)
    ↓
Trigger Matching → Condition Evaluation → Execution
    ↓
Action Registry → Domain Services
    ↓
Execution Log + Internal Notifications
```

Failure isolation: automation errors are caught downstream and never roll back core business transactions.

---

## Event System

| File | Role |
|------|------|
| `src/server/events/event-bus.ts` | Central dispatcher, persists events, triggers automations |
| `src/server/events/order-events.ts` | Order/payment events → bus |
| `src/server/events/customer-events.ts` | Customer events → bus |
| `src/server/events/catalog-events.ts` | Product/inventory/POS events → bus |

Normalized event shape: `type`, `organizationId`, `storeId`, `branchId`, `actorId`, `entityType`, `entityId`, `payload`, `metadata`, `source`.

---

## Automation Domain

| Model | Table | Purpose |
|-------|-------|---------|
| `BusinessEvent` | `business_events` | Persisted event log |
| `Automation` | `automations` | Workflow definition + status |
| `AutomationVersion` | `automation_versions` | Immutable versioned config |
| `AutomationExecution` | `automation_executions` | Execution records |
| `AutomationExecutionStep` | `automation_execution_steps` | Per-step results |
| `AutomationScheduledJob` | `automation_scheduled_jobs` | Delays + schedules |
| `InternalNotification` | `internal_notifications` | In-app notifications |

Statuses: `DRAFT`, `ACTIVE`, `PAUSED`, `ARCHIVED` — only `ACTIVE` executes.

---

## Trigger Registry

**Location:** `src/server/automation/triggers/registry.ts`

25+ triggers across orders, payments, customers, products, inventory, POS, store, and scheduled events.

Alias support: e.g. `payment.paid` → `payment.received`.

---

## Condition Engine

**Location:** `src/server/automation/conditions/engine.ts`

Operators: `equals`, `not_equals`, numeric comparisons, string `contains`/`starts_with`/`ends_with`, `exists`/`not_exists`, boolean, `in`/`not_in`, nested `AND`/`OR`/`NOT`.

Context enrichment: order totals, customer order counts loaded via domain services.

---

## Action Registry

**Location:** `src/server/automation/actions/registry.ts`

| Action | Risk | Domain Service |
|--------|------|----------------|
| `add_customer_tag` | LOW | `customer-tag-service` |
| `remove_customer_tag` | LOW | `customer-tag-service` |
| `update_customer` | MEDIUM | `customer-service` |
| `create_customer_note` | LOW | `customer-timeline-service` |
| `add_order_note` | LOW | `order-service.recordOrderEvent` |
| `create_inventory_adjustment` | MEDIUM | `inventory-service.adjustStock` |
| `update_product_status` | MEDIUM | `product-service` |
| `send_notification` | LOW | `notification-service` |

All actions require `automations.execute` plus domain permissions.

---

## Execution Engine

**Location:** `src/server/automation/execution-service.ts`

Pipeline:
1. Find ACTIVE automations for tenant
2. Match trigger (+ store/branch scope)
3. Idempotency check (`eventId:automationId:versionId`)
4. Evaluate conditions
5. Execute steps (actions + delays)
6. Log each step with status

Retry: exponential backoff on failed steps (`maxAttempts`, `nextRetryAt`).

Delays: schedule continuation via `automation_scheduled_jobs`.

---

## Scheduling

**Location:** `src/server/automation/scheduler-service.ts`

Supports `daily`, `weekly`, `monthly` schedules.

Cron endpoint: `POST /api/automations/process` (protected by `AUTOMATION_CRON_SECRET`).

---

## Templates

**Location:** `src/server/automation/templates.ts`

- Low Stock Alert
- New Customer
- High Value Order
- Repeat Customer
- Failed Payment

Copied into tenant config via `POST /api/automations/templates`.

---

## Permissions

```
automations.read
automations.write
automations.activate
automations.pause
automations.execute
automations.delete
automations.view_executions
```

MANAGER gets read/write/activate/pause/view. OWNER gets all.

---

## API Routes

| Method | Route | Permission |
|--------|-------|------------|
| GET/POST | `/api/automations` | read/write |
| GET/PATCH/DELETE | `/api/automations/[id]` | read/write/delete |
| POST | `/api/automations/[id]/actions` | activate/pause/write |
| GET | `/api/automations/[id]?executions=true` | read |
| POST | `/api/automations/templates` | write |
| POST | `/api/automations/process` | cron secret |

---

## UI Routes

| Route | Description |
|-------|-------------|
| `/app/automations` | List + templates |
| `/app/automations/new` | Create workflow |
| `/app/automations/[id]` | Detail + execution history |
| `/app/automations/[id]/edit` | Edit draft |

---

## AI Integration

New AI tools (Phase 8 extension):
- `get_automation_summary` — metrics via automation service
- `list_automations` — list with status filter

AI cannot activate or execute automations directly. Automations created by AI remain `DRAFT` until user activates.

---

## Analytics Integration

`GET /api/analytics?view=automations` returns automation metrics.

---

## Security

- Tenant isolation on all tables
- RLS policies: `prisma/migrations/rls_phase9_policies.sql`
- Idempotency keys prevent duplicate executions
- Actions go through domain services only
- Cron endpoint requires bearer secret
- No arbitrary scripting or SQL

---

## Tests

Script: `npm run test:phase9`

Coverage:
- Condition engine (AND/OR, numeric, string, exists)
- Trigger matching + aliases
- Action registry permissions
- Templates
- Scheduler next-run computation
- Optional DB integration

---

## Files Created

### Core
- `src/types/automation.ts`
- `src/server/events/event-bus.ts`
- `src/server/automation/automation-service.ts`
- `src/server/automation/execution-service.ts`
- `src/server/automation/scheduler-service.ts`
- `src/server/automation/notification-service.ts`
- `src/server/automation/templates.ts`
- `src/server/automation/triggers/registry.ts`
- `src/server/automation/conditions/engine.ts`
- `src/server/automation/actions/registry.ts`
- `src/server/automation/actions/executor.ts`

### API
- `src/app/api/automations/route.ts`
- `src/app/api/automations/[id]/route.ts`
- `src/app/api/automations/[id]/actions/route.ts`
- `src/app/api/automations/templates/route.ts`
- `src/app/api/automations/process/route.ts`

### UI
- `src/components/automations/automations-list.tsx`
- `src/components/automations/automation-editor.tsx`
- `src/components/automations/automation-detail.tsx`
- `src/app/app/automations/page.tsx`
- `src/app/app/automations/new/page.tsx`
- `src/app/app/automations/[id]/page.tsx`
- `src/app/app/automations/[id]/edit/page.tsx`

### Other
- `prisma/migrations/rls_phase9_policies.sql`
- `scripts/test-phase9.ts`
- `OMINO-PHASE-9-IMPLEMENTATION.md`

## Files Modified

- `prisma/schema.prisma` — automation models
- `src/server/events/order-events.ts` — wired to event bus
- `src/server/events/customer-events.ts` — wired to event bus
- `src/server/events/catalog-events.ts` — wired to event bus
- `src/lib/permissions/constants.ts` — automation permissions
- `src/lib/api/tenant.ts` — INVALID_STATE handler
- `src/server/ai/tools/registry.ts` — automation AI tools
- `src/server/ai/tools/handlers.ts` — automation AI handlers
- `src/server/ai/agents/definitions.ts` — analyst automation tools
- `src/app/api/analytics/route.ts` — automations view
- `.env.example` — AUTOMATION_CRON_SECRET
- `package.json` — test:phase9

---

## Known Limitations

1. **No visual node canvas** — structured editor only (by design).
2. **Condition UI** — editor focuses on trigger + actions; advanced condition builder is JSON-backed.
3. **Scheduled jobs** — require external cron hitting `/api/automations/process`.
4. **External notifications** — email/WhatsApp/SMS not implemented; internal notifications only.
5. **Webhook triggers** — not implemented.
6. **Prisma migrate** — run `npx prisma db push` when DB credentials are valid.
7. **Reschedule after scheduled run** — foundation exists; auto-reschedule on completion should be verified in production cron setup.

---

## Readiness

Phase 9 complete. OMINO can now execute repeatable business workflows based on events, conditions, and actions.

**Phase 10 NOT started.**

---

*End of Phase 9 Implementation Report*
