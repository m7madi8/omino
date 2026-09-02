# OMINO — Code Extraction Log

**Phase:** 2 — Products + Inventory Engine  
**Date:** 2026-09-01

| Source Repository | Source File | Concept | What Was Reused | What Was Adapted | Target OMINO File | Reason |
| ----------------- | ----------- | ------- | --------------- | ---------------- | ----------------- | ------ |
| spree-main | `omino/spree-main/spree/core/app/models/spree/product.rb` | Product + variant separation | Domain shape only | TypeScript/Prisma models with `organizationId` | `prisma/schema.prisma` (Product, ProductVariant) | Spree 6.0 catalog pattern |
| spree-main | `omino/spree-main/spree/core/app/models/spree/variant.rb` | SKU per variant, track_inventory | Field names & relationships | Minor-unit pricing, org-scoped SKU uniqueness | `prisma/schema.prisma` (ProductVariant) | Industry-standard variant model |
| spree-main | `omino/spree-main/spree/core/app/models/spree/stock_level.rb` | Stock per location | Location-scoped levels | Linked to StockLocation + Branch | `prisma/schema.prisma` (StockLevel) | Multi-location inventory |
| spree-main | `omino/spree-main/spree/core/app/models/spree/stock_movement.rb` | Immutable movement ledger | Movement audit pattern | Added userId, referenceType, balanceAfter | `prisma/schema.prisma` (StockMovement) | Traceability for AI/automation |
| spree-main | `omino/spree-main/spree/core/app/models/spree/category.rb` | Nested categories | parentId self-reference | Soft delete, org-scoped slug | `prisma/schema.prisma` (Category) | Extensible taxonomy |
| spree-main | `omino/spree-main/spree/core/lib/spree/events.rb` | Domain events | Event type naming | Console/log placeholder emitter | `src/server/events/catalog-events.ts` | Future event bus hook |
| Nexus-ERP-main | `omino/Nexus-ERP-main/server/src/middleware/auth.js` | Tenant JWT isolation | Permission check pattern | `requireTenantContext()` helper | `src/lib/api/tenant.ts` | Server-side org enforcement |
| Nexus-ERP-main | `omino/Nexus-ERP-main/server/prisma/schema.prisma` | Flat product model | Anti-pattern noted | Rejected flat `stock` on product | — | Spree variant model preferred |
| caratflow-main | `omino/caratflow-main/packages/utils/src/money.ts` | Integer minor units | Concept | `toMinorUnits` / `formatMoney` | `src/lib/money.ts` | Safe money arithmetic |
| caratflow-main | `omino/caratflow-main/apps/api/src/common/base.service.ts` | TenantAwareService | `organizationId` on every query | Prisma where clauses in services | All `src/server/services/*` | Multi-tenant isolation |
| caratflow-main | `omino/caratflow-main/packages/shared-types/src/events.ts` | Typed event catalog | Event shape | Catalog-specific event types | `src/server/events/catalog-events.ts` | Automation foundation |
| genix-main | `omino/genix-main/backend/agent/route_turn.go` | Structured business context | Not copied (GPL) | Relational product/inventory schema for future AI tools | `prisma/schema.prisma` | AI-ready structured data |
| multi-agent-business-os-main | `omino/multi-agent-business-os-main/backend/app/core/ratelimit.py` | Rate limiting on AI routes | Concept only | Deferred to Phase 12 | — | Not in Phase 2 scope |
| main (OMINO) | `main/css/omino.css` | Design tokens | Colors, typography | Tailwind classes in components | `src/components/catalog/*` | Brand consistency |
| Phase 1 | `src/lib/db/tenant.ts` | RLS session vars | `setTenantContext()` | Extended RLS SQL for new tables | `prisma/migrations/rls_phase2_policies.sql` | Defense-in-depth |

**Not copied:** Rails ActiveRecord code, Spree workflows, Nexus flat inventory, genix GPL agent code, CaratFlow jewelry domain.

---

## Phase 4 — Orders + Payments Core (2026-09-01)

| Source Repository | Source File | Concept | What Was Reused | What Was Adapted | Target OMINO File | Reason |
| ----------------- | ----------- | ------- | --------------- | ---------------- | ----------------- | ------ |
| spree-main | `spree/core/app/models/spree/order.rb` | Order state machine | Separate payment/fulfillment states | TypeScript enums + transition guard | `prisma/schema.prisma`, `order-service.ts` | Multi-status commerce model |
| spree-main | `spree/core/app/models/spree/line_item.rb` | Price/name snapshots on order items | Snapshot fields at checkout | `productName`, `sku`, `unitPriceMinor` frozen | `OrderItem` model | Immutable order history |
| spree-main | `spree/core/app/models/spree/adjustment.rb` | Generic adjustments | Adjustment types enum | `order_adjustments` table | `prisma/schema.prisma` | Extensible pricing without schema changes |
| spree-main | `spree/core/app/models/spree/payment.rb` | Payment attempts | Attempt records per payment | `payment_attempts` table | `prisma/schema.prisma` | Online retry support |
| spree-main | `spree/core/app/models/spree/refund.rb` | Refund as separate record | Refund + refund_items | Never edit original payment | `payment-service.ts` | Financial traceability |
| Nexus-ERP-main | Audit log pattern | Append-only audit | `audit_logs` model | `logAudit()` service | `audit-service.ts` | Compliance & AI context |
| caratflow-main | Workflow/state patterns | Controlled transitions | `assertOrderTransition()` | Order cancel/void rules | `order-service.ts` | Safe state changes |
| genix-main | Event naming | Structured events | `order_events` + emitter placeholder | `order-events.ts` | Future automation bus |
| Phase 3 | POS cart/checkout schema | Cart → Order flow | Evolved enums, did not duplicate tables | Central `checkout()` in pos-service | `pos-service.ts` | ONE order engine |
| Phase 2 | `inventory-service.ts` | Stock ledger | `adjustStockInTx` exported | SALE on checkout, RETURN on refund | `inventory-service.ts` | ONE inventory domain |

**Not copied:** Spree promotion engine, Spree gateway integrations, Nexus accounting ledger, full CaratFlow workflow engine.

---

## Phase 6 — CRM + Customer Engine (2026-09-01)

| Source Repository | Source File | Concept | What Was Reused | What Was Adapted | Target OMINO File | Reason |
| ----------------- | ----------- | ------- | --------------- | ---------------- | ----------------- | ------ |
| Nexus-ERP-main | Customer/contact models | Org-scoped CRM | Single customer per org | Prisma + services | `prisma/schema.prisma` (Customer) | ONE customer domain |
| Spree | `spree/user.rb` / order customer | Guest vs registered | Customer without login account | `findOrCreateCustomerFromCheckout` | `customer-service.ts` | Guest checkout ready |
| Spree | Address model | Shipping/billing types | `customer_addresses` table | SHIPPING/BILLING/OTHER enum | `customer-address-service.ts` | Reusable addresses |
| Nexus-ERP | Activity/audit separation | Timeline vs audit | `customer_events` vs `audit_logs` | Customer-facing timeline only | `customer-timeline-service.ts` | CRM UX vs security audit |
| Caratflow | Workflow events | Lifecycle events | `recordCustomerEvent()` | Typed event names | `customer-events.ts` | Automation foundation |
| Genix | Structured business context | AI-readable payloads | `getCustomerContext()` | JSON API for future AI | `customer-metrics-service.ts` | Phase 12 AI prep |
| multi-agent-business-os | Memory/context patterns | Customer intelligence shape | Profile + metrics + activity | No agent code copied | `types/customer.ts` | AI tool boundaries |
| Phase 4 | Order.customerId | Order linkage | Same Customer entity for POS/online | Timeline on checkout | `pos-service.ts` | No duplicate customer systems |

**Not copied:** Nexus full CRM UI, Spree user authentication, marketing automation, loyalty engines.

---

## Phase 3 — POS Engine (2026-09-01)

| Source Repository | Source File | Concept | What Was Reused | What Was Adapted | Target OMINO File | Reason |
| ----------------- | ----------- | ------- | --------------- | ---------------- | ----------------- | ------ |
| spree-main | `spree/core/app/models/spree/order.rb` | Order + line items + adjustments | Domain shape, adjustment types | Prisma models with org/branch/register context | `prisma/schema.prisma` (Order, OrderItem, OrderAdjustment) | Single order domain for POS + future online |
| spree-main | `spree/core/app/models/spree/payment.rb` | Payment methods, no card storage | Method enum pattern | CASH/CARD/OTHER, idempotencyKey | `prisma/schema.prisma` (Payment) | Extensible without gateway lock-in |
| spree-main | `spree/core/app/models/spree/line_item.rb` | Historical line snapshot | productName, sku on line | CartItem + OrderItem snapshot fields | `pos-service.ts` checkout | Price changes don't corrupt history |
| spree-main | Cart/checkout flow | Cart → Order transition | Flow concept | Atomic `checkout()` transaction | `src/server/services/pos-service.ts` | Business-critical consistency |
| Nexus-ERP-main | Sales transaction patterns | Audit + tenant isolation | Multi-tenant where clauses | `requireTenantContext()` on all POS APIs | `src/lib/api/tenant.ts`, `src/app/api/pos/*` | Defense in depth |
| Nexus-ERP-main | Business transaction audit | Who/when/why on void | cancelReason, cancelledById | `voidPosOrder()` + audit log | `src/server/services/pos-service.ts` | Compliance foundation |
| caratflow-main | Money handling | Minor units, change calculation | `formatMoney`, `parseMoneyInput` | POS payment modal | `src/lib/money.ts`, `pos-terminal.tsx` | Cashier-friendly UX |
| caratflow-main | Operational workflows | Session open/close | Register session concept | PosSession with cash reconciliation | `prisma/schema.prisma` (PosSession) | End-of-day foundation |
| genix-main | Event catalog | Typed business events | Event type names only | `order-events.ts` console placeholder | `src/server/events/order-events.ts` | Future AI/automation hook |
| Phase 2 | `inventory-service.ts` | Stock decrement in sale | `adjustStockInTx` | Called inside checkout `$transaction` | `pos-service.ts` `checkout()` | One inventory domain |
| Phase 1 | RBAC | Permission keys | pos.*, orders.* | `ROLE_PERMISSION_MAP` updates | `src/lib/permissions/constants.ts` | Central authorization |

**Not copied:** Spree promotions engine, Spree state machine gem, Nexus ERP sales UI, payment gateway SDKs.

---

## Phase 5 — Online Store Engine (2026-09-01)

| Source Repository | Source File | Concept | What Was Reused | What Was Adapted | Target OMINO File | Reason |
| ----------------- | ----------- | ------- | --------------- | ---------------- | ----------------- | ------ |
| spree-main | Storefront + cart architecture | Public catalog, guest cart, checkout | Flow concepts | `CartChannel.ONLINE`, guest session token | `storefront-service.ts`, `prisma/schema.prisma` | One commerce core, multiple channels |
| spree-main | Product presentation | Variant selection, compare-at price | Display patterns | Server-rendered product pages | `src/app/store/[storeSlug]/products/[productSlug]` | Customer-facing catalog |
| spree-main | Order adjustments | Shipping/tax line items | Adjustment types | `OrderAdjustment` SHIPPING/TAX on online orders | `checkoutOnline()` | Reuse Phase 4 order engine |
| Nexus-ERP-main | Multi-tenant store isolation | Org/store boundaries | `resolveStoreByPublicSlug` validation | All storefront queries scoped by store+org | `storefront-service.ts` | Security |
| caratflow-main | Checkout workflow | State transitions | PENDING order + PENDING COD payment | Online order lifecycle | `checkoutOnline()` | Operational correctness |
| Phase 3/4 | `pos-service.checkout()` | Atomic transaction pattern | Forked for ONLINE channel | `checkoutOnline()` — no POS session updates | `storefront-service.ts` | Consistent transaction boundaries |
| Phase 2 | Product/inventory services | Catalog + stock | Direct service calls | `listStorefrontProducts`, stock validation | `storefront-service.ts` | No duplicate catalog |
| genix-main | Business events | Event catalog naming | Event type strings only | `storefront-events.ts` placeholder | `src/server/events/storefront-events.ts` | AI/analytics readiness |

**Not copied:** Spree promotions engine, payment gateway integrations, Spree storefront gem, theme marketplace.

---

## Phase 7 — Analytics + Business Intelligence (2026-09-01)

| Source Repository | Source File | Concept | What Was Reused | What Was Adapted | Target OMINO File | Reason |
| ----------------- | ----------- | ------- | --------------- | ---------------- | ----------------- | ------ |
| Nexus-ERP-main | Business analytics / dashboards | Org-level KPI reporting | Dashboard layout concepts | OMINO design language, centralized services | `overview-dashboard.tsx`, `analytics-workspace.tsx` | Executive overview pattern |
| Nexus-ERP-main | Financial reporting | Revenue summaries, period comparison | Comparison period math | `compareMetric()`, previous period in `date-range.ts` | `lib/analytics/metrics.ts` | Period-over-period KPIs |
| Nexus-ERP-main | Inventory reporting | Low-stock alerts | Threshold-based alerts | `getInventoryMetricsSummary()` | `inventory-analytics-service.ts` | Operational inventory signals |
| spree-main | Commerce metrics | Orders, products, channel sales | Order snapshot aggregation | SQL on `order_items` + `orders.source` | `sales-analytics-service.ts`, `product-analytics-service.ts` | Immutable historical reporting |
| caratflow-main | Business events / workflows | Operational metrics from events | Event type catalog (existing) | Analytics reads persisted data, not duplicate bus | Existing `order-events.ts`, etc. | No second event bus |
| genix-main | Event-driven analytics | Structured metric payloads | AI-readable snapshot shape | `BusinessContextSnapshot` type | `analytics-service.ts` | Phase 8 AI prep |
| multi-agent-business-os-main | Business context / agent data access | Controlled service boundaries | Context snapshot API | `GET /api/analytics?view=context` | `analytics-service.ts` | AI-safe data access |
| Phase 4 | Order/payment financial fields | Minor units, refunds | Net sales formula from order totals | `aggregateSalesFromOrders()` | `lib/analytics/metrics.ts` | Financial precision + reconciliation |
| Phase 6 | Customer metrics | Repeat purchase concepts | Returning customer detection | `customer-analytics-service.ts` | Centralized customer analytics |

**Not copied:** Nexus full BI builder, Spree reporting gems, predictive forecasting, data warehouse ETL, drag-and-drop report designer.

---

## Phase 10 — Marketing Engine (2026-09-01)

| Source Repository | Source File | Concept | What Was Reused | What Was Adapted | Target OMINO File | Reason |
| ----------------- | ----------- | ------- | --------------- | ---------------- | ----------------- | ------ |
| spree-main | `promotion.rb` / adjustments | Promotion + coupon codes | Rules shape (%, fixed, min cart) | `MarketingPromotion`, `MarketingCoupon` | `prisma/schema.prisma`, `promotion-service.ts` | Extend commerce discount engine |
| spree-main | Order adjustments | Discount snapshots on order | `couponCode`, `promotionId` on Order | `storefront-service.ts` checkout | Immutable historical promotions |
| Nexus-ERP-main | Customer segmentation patterns | Org-scoped audiences | JSON rule groups + server count | `segment-rules.ts`, `audience-service.ts` | Tenant-safe segmentation |
| caratflow-main | Workflow/campaign patterns | Campaign lifecycle states | DRAFT→ACTIVE→PAUSED→COMPLETED | `campaign-service.ts` | Operational campaign control |
| genix-main | Marketing automation concepts | Event-driven campaigns | `marketing-events.ts` → business event bus | Phase 9 integration | No second event bus |
| multi-agent-business-os-main | AI marketing assistance | Draft-only AI campaigns | Templates create DRAFT status | `templates.ts`, campaign API | AI safety — no auto-launch |
| Phase 6 | Customer tags/search | Audience filters | `tagId`, `source`, `status` rules | `segment-rules.ts` | ONE customer domain |
| Phase 7 | Analytics services | Campaign performance | `marketing-analytics-service.ts` | Reuses conversion aggregates | No duplicate analytics formulas |
| Phase 9 | Automation scheduler | Scheduled campaign activation | `processScheduledCampaigns` in cron | `campaign-service.ts` | ONE automation system |

**Not copied:** Spree promotion engine gem wholesale, email marketing platforms, Meta/Google ads, referral/affiliate systems.

---

## Phase 8 — AI Core + Agents (2026-09-01)

| Source Repository | Source File | Concept | What Was Reused | What Was Adapted | Target OMINO File | Reason |
| ----------------- | ----------- | ------- | --------------- | ---------------- | ----------------- | ------ |
| multi-agent-business-os-main | `backend/app/agents/multi_agent.py` | Supervisor routing | Intent → agent routing pattern | Keyword router, 4 OMINO agents | `src/server/ai/agents/router.ts`, `definitions.ts` | Lightweight routing, no multi-agent graph |
| multi-agent-business-os-main | `backend/app/services/llm.py` | Provider abstraction | Provider interface concept | `AIProvider`, Mock + OpenAI | `src/server/ai/providers/` | Env-based, server-only |
| multi-agent-business-os-main | Tool execution loop | Tool-calling iteration cap | Max iterations from config | `orchestrator.ts` | `src/server/ai/orchestrator.ts` | Safe bounded loops |
| genix-main | `backend/agent/route_turn.go` | Discovery → execution | Two-phase pattern | Mock provider intent match + tool loop | `mock-provider.ts` | Works without API key |
| genix-main | `backend/agent/discovery/planner.go` | Intent classification | Pattern-based routing | `agents/router.ts` | Same file | No GPL code |
| genix-main | Mutation approval gates | Write tool confirmation | `ai_actions` PENDING → CONFIRMED | `action-service.ts` | `src/server/ai/action-service.ts` | User must approve writes |
| genix-main | Tool permissions in prompts | RBAC on tools | `permissions[]` per tool | `tools/registry.ts`, `executor.ts` | Tool registry | AI cannot self-grant permissions |
| caratflow-main | Workflow dry-run | Preview before execute | `dryRunResult` on actions | Write tool handlers return preview | `tools/handlers.ts` | Human confirmation UX |
| Nexus-ERP-main | Tenant context | Org-scoped data access | Session-derived tenant | `requireTenantContext()` in APIs | `src/lib/api/tenant.ts` | No model-provided org IDs |
| Nexus-ERP-main | Audit trail | Action logging | `AI_ACTION_EXECUTED` audit | `audit-service.ts` integration | `action-service.ts` | Compliance |
| Spree | Commerce read patterns | Product/order/customer queries | Service wrappers only | Tool handlers call domain services | `tools/handlers.ts` | No raw SQL from AI |
| Phase 7 (partial) | Analytics concepts | Sales/customer metrics | `analytics-service.ts` created | Real Prisma queries via services | `src/server/services/analytics-service.ts` | AI uses real business data |

**Not copied:** genix GPL code, multi-agent RAG/vector store, Nexus simple Gemini forecast, autonomous agent loops, WhatsApp/voice AI.

---

## Phase 9 — Automation + Workflow Engine (2026-09-01)

| Source Repository | Source File | Concept | What Was Reused | What Was Adapted | Target OMINO File | Reason |
| ----------------- | ----------- | ------- | --------------- | ---------------- | ----------------- | ------ |
| caratflow-main | Workflow/trigger patterns | Event → condition → action | Pipeline architecture | Central event bus + execution service | `event-bus.ts`, `execution-service.ts` | CaratFlow-style orchestration without jewelry domain |
| caratflow-main | State transitions | Workflow statuses | DRAFT/ACTIVE/PAUSED/ARCHIVED | Automation status enum | `prisma/schema.prisma` | Only ACTIVE executes |
| genix-main | Event-driven automation | Domain events → subscribers | Emitter pattern | `publishBusinessEvent()` async dispatch | `event-bus.ts` | Decoupled from domain services |
| genix-main | Automation configuration | Trigger/action metadata | Registry concept | Trigger + action registries with schemas | `triggers/registry.ts`, `actions/registry.ts` | Extensible without rewrites |
| multi-agent-business-os-main | Safe action execution | Tool boundaries | Actions via domain services only | `actions/executor.ts` | No unrestricted DB access |
| Nexus-ERP-main | Enterprise workflow | Versioning + audit | Automation versions | `AutomationVersion` immutable config | `automation-service.ts` | Historical reproducibility |
| Nexus-ERP-main | Tenant isolation | Org-scoped processes | Store/branch optional scope | Automation + execution tenant checks | `execution-service.ts` | Cross-tenant prevention |
| Spree | Commerce lifecycle events | Order/customer/inventory events | Event type naming | Wired existing emitters to bus | `order-events.ts`, `catalog-events.ts` | One event vocabulary |
| Phase 8 | AI tool registry | Read-only business context | Automation summary tools | `get_automation_summary`, `list_automations` | AI tools extension | AI explains, engine executes |

**Not copied:** CaratFlow jewelry workflows, genix GPL automation code, visual BPM canvas, WhatsApp/email campaigns, arbitrary scripting.

---

## Phase 11 — Security + Performance + Scale (2026-09-02)

| Source Repository | Source File | Concept | What Was Reused | What Was Adapted | Target OMINO File | Reason |
| ----------------- | ----------- | ------- | --------------- | ---------------- | ----------------- | ------ |
| multi-agent-business-os-main | `backend/app/core/ratelimit.py` | Rate limiting | Token-bucket concept | In-memory `checkRateLimit()` shared module | `src/lib/security/rate-limit.ts` | Abuse protection for signup, AI, automation |
| genix-main | Prompt / instruction boundaries | Untrusted context treatment | Data-vs-instructions separation | Pattern-based `prompt-sanitizer.ts` | `src/lib/security/prompt-sanitizer.ts` | Prompt injection mitigation |
| Nexus-ERP-main | Health/status endpoints | Liveness probe | Minimal JSON response | DB `SELECT 1` check | `src/app/api/health/route.ts` | Production readiness |
| Nexus-ERP-main | Security headers | HTTP hardening | Standard header set | Next.js `headers()` config | `next.config.ts` | Defense in depth |
| caratflow-main | Structured logging | Redacted operational logs | JSON log lines | `logger.ts` with sensitive key redaction | `src/lib/observability/logger.ts` | Observability without PII leakage |
| Phase 9 | Automation execution | Loop prevention | Event source tagging | Skip `processEventForAutomations` when `source === 'automation'` | `event-bus.ts`, `inventory-service.ts` | Prevent infinite automation chains |
| Phase 8 | AI action confirmation | Permission re-validation | Confirm-time RBAC | `hasToolPermission()` in `confirmAction()` | `action-service.ts` | Prevent privilege escalation via stale pending actions |
| Phase 4/5 | Order totals engine | Server-side money authority | `calculateOrderTotals()` | POS + storefront price re-validation; cart lines fix | `pos-service.ts`, `storefront-service.ts` | Never trust client prices |
| Phase 1 | Organization settings API | Tenant RBAC | `requireTenantContext(permission)` | `settings.write` on PATCH | `organization/route.ts` | Settings mutation protection |

**Not copied:** WAF vendors, Redis rate-limit services, APM SaaS integrations, CSP break-glass configs, load testing frameworks.

---

## Phase 12 — Final UX + Launch (2026-09-02)

| Source | Concept | What Was Reused | What Was Adapted | Target OMINO File | Reason |
| ------ | ------- | --------------- | ---------------- | ----------------- | ------ |
| main (OMINO) | Marketing site CTAs | Hero, founding copy | Wired to Next `/signup` `/login` | `main/*.html`, `next.config.ts` | Fix broken signup funnel |
| main (OMINO) | Design tokens | CSS variables | Tailwind + globals.css | `src/app/globals.css` | Brand consistency |
| Phase 7 | Analytics overview empty state | `hasData` flag | Combined with getting-started cards | `getting-started.tsx`, `app/page.tsx` | New business guidance |
| Phase 1 | Auth/onboarding flow | Multi-step wizard | Added completion step | `onboarding/page.tsx` | Clear onboarding finish |
| Next.js conventions | SEO/error pages | App router patterns | Branded 404/error/sitemap | `not-found.tsx`, `error.tsx`, `sitemap.ts` | Launch readiness |

**Not copied:** New frameworks, redesigns, or major feature additions.

