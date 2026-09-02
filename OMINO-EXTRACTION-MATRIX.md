# OMINO — Extraction Matrix

**Date:** 2026-09-01  
**Purpose:** Map useful features from reference repositories to OMINO modules.  
**Rule:** Extract **ideas and patterns** — never blind code copy.

**Recommendation key:**
- **MUST BUILD** — Critical for OMINO; implement in greenfield stack
- **SHOULD BUILD** — High value; implement when module is reached
- **REBUILD FROM CONCEPT** — Right idea; reimplement fresh in OMINO stack
- **ARCHITECTURAL REFERENCE** — Study domain model / API shape only
- **IGNORE** — Wrong stack, license, vertical, or quality

---

## Current OMINO (`main/`)

| Source | Feature / Pattern | Exact File(s) | What It Does | OMINO Module | Recommendation | Priority |
| ------ | ----------------- | ------------- | ------------ | ------------ | -------------- | -------- |
| main | Design tokens & typography | `main/css/omino.css` | Brand colors, fonts, radius, motion primitives | UI / Settings | MUST BUILD | P0 |
| main | Marketing homepage & motion | `main/index.html` | Hero, system lockup, pricing, GSAP, orbit nav | Public Marketing | MUST BUILD | P0 |
| main | Bilingual i18n (EN/AR) | `main/js/omino-nav.js`, per-page `copy` objects | RTL, `data-i18n`, `omino-lang` persistence | Core | REBUILD FROM CONCEPT | P0 |
| main | Product vision spec | `main/OMINO_README.md` | Module definitions, AI rules, roadmap | All | ARCHITECTURAL REFERENCE | P0 |
| main | Shared navigation | `main/js/omino-nav.js` | Mobile menu, scroll lock, lang toggle | Public Marketing | REBUILD FROM CONCEPT | P1 |
| main | Auth UI (signin/signup/forgot) | `main/login.html`, `main/js/auth.js` | Founding signup, mode transitions, validation | Users | REBUILD FROM CONCEPT | P1 |
| main | Founding user cap (50) | `main/js/auth.js` (`CAP`, `signUp`) | Limit founding organizations | Organizations | SHOULD BUILD | P1 |
| main | Plan pricing model | `main/js/config.js` (`plans`, `planPrice`) | Starter/Pro/Business monthly+yearly | Payments / Settings | SHOULD BUILD | P1 |
| main | App placeholder shell | `main/app.html` | Post-login gate (to replace) | Business OS | REBUILD FROM CONCEPT | P1 |
| main | Checkout flow | `main/js/order.js`, `main/checkout.html` | Plan purchase, address, payment method | Orders / Payments | REBUILD FROM CONCEPT | P2 |
| main | WhatsApp integration | `main/js/config.js` (`waLink`, `waDisplay`) | Contact, checkout, confirm flows | Integrations | SHOULD BUILD | P2 |
| main | Palestine/Israel places | `main/js/places.js` | Country/city picker for MENA checkout | Integrations | SHOULD BUILD | P2 |
| main | Cookie consent | `main/js/omino-cookies.js` | GDPR-style banner | Core | SHOULD BUILD | P3 |
| main | Boot loader | `main/js/omino-loader.js` | First-session cinematic intro | Public Marketing | MUST BUILD | P3 |

---

## spree-main → OMINO Commerce Engine

| Source | Feature / Pattern | Exact File(s) | What It Does | OMINO Module | Recommendation | Priority |
| ------ | ----------------- | ------------- | ------------ | ------------ | -------------- | -------- |
| spree-main | Product domain model | `omino/spree-main/spree/core/app/models/spree/product.rb` | Catalog entity, status, translations | Products | ARCHITECTURAL REFERENCE | P1 |
| spree-main | Variant / SKU model | `omino/spree-main/spree/core/app/models/spree/variant.rb` | SKU, stock, prices per variant | Products | ARCHITECTURAL REFERENCE | P1 |
| spree-main | Cart vs Order separation | `omino/spree-main/spree/core/app/models/spree/cart.rb`, `order.rb` | Mutable cart → immutable order | Orders / Store | ARCHITECTURAL REFERENCE | P1 |
| spree-main | Line items | `omino/spree-main/spree/core/app/models/spree/line_item.rb` | Cart/order line structure | Orders | ARCHITECTURAL REFERENCE | P1 |
| spree-main | Stock levels & movements | `omino/spree-main/spree/core/app/models/spree/stock_level.rb`, `stock_movement.rb` | Inventory ledger per location | Inventory | ARCHITECTURAL REFERENCE | P1 |
| spree-main | Cart checkout workflow | `omino/spree-main/spree/core/app/workflows/spree/carts/complete.rb` | PREPARE → PAYMENT → FINALIZE steps | Orders | ARCHITECTURAL REFERENCE | P1 |
| spree-main | Customer model | `omino/spree-main/spree/core/app/models/spree/customer.rb` | CRM customer entity | Customers / CRM | ARCHITECTURAL REFERENCE | P2 |
| spree-main | Payment + PaymentSession | `omino/spree-main/spree/core/app/models/spree/payment.rb`, `payment_session.rb` | Provider-agnostic payments | Payments | ARCHITECTURAL REFERENCE | P2 |
| spree-main | Store / Channel / Market | `omino/spree-main/spree/core/app/models/spree/store.rb`, `channel.rb`, `market.rb` | Multi-tenant, POS vs web channels | Organizations / Stores | ARCHITECTURAL REFERENCE | P2 |
| spree-main | Service layer pattern | `omino/spree-main/spree/core/app/services/spree/carts/create.rb`, `checkout/advance.rb` | Command objects for commerce | Core | ARCHITECTURAL REFERENCE | P2 |
| spree-main | Event bus | `omino/spree-main/spree/core/lib/spree/events.rb` | Domain events, webhooks, subscribers | Automations | REBUILD FROM CONCEPT | P2 |
| spree-main | Workflow engine | `omino/spree-main/spree/core/lib/spree/workflow.rb` | Multi-step processes with compensation | Workflows | ARCHITECTURAL REFERENCE | P3 |
| spree-main | Store API v3 routes | `omino/spree-main/spree/api/config/routes.rb` | Headless storefront API shape | Store | ARCHITECTURAL REFERENCE | P2 |
| spree-main | Promotion engine | `omino/spree-main/spree/core/app/models/spree/promotion.rb` | Discounts, coupon codes | Marketing | ARCHITECTURAL REFERENCE | P3 |
| spree-main | Fulfillment model | `omino/spree-main/spree/core/app/models/spree/fulfillment.rb` | Shipping/delivery post-order | Orders | ARCHITECTURAL REFERENCE | P3 |
| spree-main | Prefixed public IDs | `omino/spree-main/spree/core/app/models/spree/` (`has_prefix_id`) | Agent-friendly IDs (`ord_`, `prod_`) | Core | SHOULD BUILD | P2 |
| spree-main | Metadata / custom fields | `omino/spree-main/spree/core/app/models/concerns/spree/metadata.rb` | Extensibility without schema churn | Core | SHOULD BUILD | P3 |
| spree-main | TypeScript Store SDK | `omino/spree-main/packages/sdk/` | Typed headless client pattern | SDK | REBUILD FROM CONCEPT | P3 |
| spree-main | Full Rails monolith | `omino/spree-main/spree/` (entire tree) | Wrong runtime for OMINO | — | IGNORE | — |

---

## Nexus-ERP-main → OMINO Business Core

| Source | Feature / Pattern | Exact File(s) | What It Does | OMINO Module | Recommendation | Priority |
| ------ | ----------------- | ------------- | ------------ | ------------ | -------------- | -------- |
| Nexus-ERP-main | Prisma ERP schema | `omino/Nexus-ERP-main/server/prisma/schema.prisma` | Tenant, Product, Customer, Deal, Transaction models | All | ARCHITECTURAL REFERENCE | P1 |
| Nexus-ERP-main | JWT tenant middleware | `omino/Nexus-ERP-main/server/src/middleware/auth.js` | `req.tenantId` from JWT, never from body | Core / Organizations | SHOULD BUILD | P1 |
| Nexus-ERP-main | Dashboard layout + RBAC nav | `omino/Nexus-ERP-main/client/src/app/dashboard/layout.tsx` | Role-based sidebar (hardcoded matrix) | Business OS | REBUILD FROM CONCEPT | P2 |
| Nexus-ERP-main | Inventory API | `omino/Nexus-ERP-main/server/src/routes/inventory.js` | Products, stock, suppliers, PO | Inventory | ARCHITECTURAL REFERENCE | P2 |
| Nexus-ERP-main | CRM API | `omino/Nexus-ERP-main/server/src/routes/crm.js` | Customers, deals pipeline | Customers / CRM | ARCHITECTURAL REFERENCE | P2 |
| Nexus-ERP-main | POS + shop checkout | `omino/Nexus-ERP-main/server/src/routes/shop.js` | In-store sales, Razorpay, public catalog | POS / Store | ARCHITECTURAL REFERENCE | P2 |
| Nexus-ERP-main | Workflow approvals | `omino/Nexus-ERP-main/server/src/routes/workflows.js` | PO + leave approval pattern | Workflows | REBUILD FROM CONCEPT | P3 |
| Nexus-ERP-main | Audit log API | `omino/Nexus-ERP-main/server/src/routes/audit.js` | Tenant-scoped activity feed | Core | SHOULD BUILD | P2 |
| Nexus-ERP-main | Scheduler (cron) | `omino/Nexus-ERP-main/server/src/services/scheduler.js` | Low-stock alerts, audit cleanup | Automations | REBUILD FROM CONCEPT | P3 |
| Nexus-ERP-main | AI routes (Gemini) | `omino/Nexus-ERP-main/server/src/routes/ai.js` | Forecast, briefing, chat | AI Agents | ARCHITECTURAL REFERENCE | P3 |
| Nexus-ERP-main | Tenant storefront by domain | `omino/Nexus-ERP-main/client/src/app/shop/[storeDomain]/page.tsx` | Public catalog per org | Store | SHOULD BUILD | P3 |
| Nexus-ERP-main | In-memory permission matrix | `omino/Nexus-ERP-main/server/src/routes/admin.js` | Anti-pattern — lost on restart | Roles & Permissions | IGNORE | — |
| Nexus-ERP-main | Spring Boot dual backend | `omino/Nexus-ERP-main/backend/` | Parallel users/tenants tables | — | IGNORE | — |

---

## caratflow-main → OMINO Automation / Workflow Engine

| Source | Feature / Pattern | Exact File(s) | What It Does | OMINO Module | Recommendation | Priority |
| ------ | ----------------- | ------------- | ------------ | ------------ | -------------- | -------- |
| caratflow-main | Monorepo structure | `omino/caratflow-main/pnpm-workspace.yaml`, `turbo.json` | apps + packages layout | Core | SHOULD BUILD | P1 |
| caratflow-main | Split Prisma schemas | `omino/caratflow-main/packages/db/prisma/schema/*.prisma` | Domain-separated DB (~166 models) | Core | SHOULD BUILD | P1 |
| caratflow-main | TenantAwareService | `omino/caratflow-main/apps/api/src/common/base.service.ts` | Mandatory `tenantWhere()` on queries | Organizations | MUST BUILD | P1 |
| caratflow-main | Event bus (BullMQ) | `omino/caratflow-main/apps/api/src/event-bus/event-bus.service.ts` | Cross-module events without imports | Automations | MUST BUILD | P2 |
| caratflow-main | Domain event types | `omino/caratflow-main/packages/shared-types/src/events.ts` | Typed event catalog (70+ events) | Automations | MUST BUILD | P2 |
| caratflow-main | Sale → inventory handler | `omino/caratflow-main/apps/api/src/modules/inventory/inventory.event-handler.ts` | `retail.sale.completed` → stock decrement | Automations / Inventory | REBUILD FROM CONCEPT | P2 |
| caratflow-main | Reporting scheduler | `omino/caratflow-main/apps/api/src/modules/reporting/reporting.scheduler.service.ts` | Cron → execute → deliver pipeline | Automations | REBUILD FROM CONCEPT | P3 |
| caratflow-main | State machine pattern | `omino/caratflow-main/packages/shared-types/src/manufacturing.ts` (`JOB_ORDER_TRANSITIONS`) | Declarative workflow transitions | Workflows | ARCHITECTURAL REFERENCE | P3 |
| caratflow-main | tRPC router aggregation | `omino/caratflow-main/apps/api/src/trpc/trpc.router.ts` | 27 domain routers, type-safe internal API | Core | REBUILD FROM CONCEPT | P2 |
| caratflow-main | Retail / POS module | `omino/caratflow-main/apps/api/src/modules/retail/` | Sales, returns, pricing | POS | ARCHITECTURAL REFERENCE | P2 |
| caratflow-main | CRM notification service | `omino/caratflow-main/apps/api/src/modules/crm/crm.notification.service.ts` | Multi-channel templates (WhatsApp/SMS/email) | Notifications | REBUILD FROM CONCEPT | P2 |
| caratflow-main | Abandoned cart recovery | `omino/caratflow-main/apps/api/src/modules/b2c-features/abandoned-cart.service.ts` | Multi-step reminder sequencer | Marketing / Automations | REBUILD FROM CONCEPT | P3 |
| caratflow-main | Money utilities | `omino/caratflow-main/packages/utils/src/money.ts` | Integer minor units pattern | Core | SHOULD BUILD | P2 |
| caratflow-main | Shared UI AppShell | `omino/caratflow-main/packages/ui/src/layout/app-shell.tsx` | Dashboard shell structure | Business OS | ARCHITECTURAL REFERENCE | P2 |
| caratflow-main | Architecture doc | `omino/caratflow-main/docs/architecture.md` | System diagram, event flows, tenancy | All | ARCHITECTURAL REFERENCE | P1 |
| caratflow-main | India / jewelry compliance | `omino/caratflow-main/apps/api/src/modules/india/`, `compliance/` | Girvi, HUID, hallmark | — | IGNORE | — |
| caratflow-main | Manufacturing / karigar | `omino/caratflow-main/apps/api/src/modules/manufacturing/` | Jewelry production | — | IGNORE | — |

---

## genix-main → OMINO AI Layer

| Source | Feature / Pattern | Exact File(s) | What It Does | OMINO Module | Recommendation | Priority |
| ------ | ----------------- | ------------- | ------------ | ------------ | -------------- | -------- |
| genix-main | Discovery → execution router | `omino/genix-main/backend/agent/route_turn.go` | Planner classifies intent; executor uses tools | AI Agents | ARCHITECTURAL REFERENCE | P2 |
| genix-main | Discovery planner | `omino/genix-main/backend/agent/discovery/planner.go` | Intent routing to ERP features via JSON plan | AI Agents | ARCHITECTURAL REFERENCE | P2 |
| genix-main | ERP tool-calling loop | `omino/genix-main/backend/agent/chat_loop.go` | LLM drives actions via tools with pruning | AI Agents | ARCHITECTURAL REFERENCE | P2 |
| genix-main | Agent tool definitions | `omino/genix-main/backend/agent/llm/prompts.go` | `get_page`, `navigate`, `invoke_batch`, `finish` | AI Tools | ARCHITECTURAL REFERENCE | P2 |
| genix-main | Mutation route guard | `omino/genix-main/backend/agent/route_turn.go` (`buildExecutionPolicy`) | Write tools only on validated routes | AI Agents | REBUILD FROM CONCEPT | P2 |
| genix-main | Action summary persistence | `omino/genix-main/backend/agent/chat_loop.go` (`finish.summary`) | Durable action log for follow-up turns | AI Agents | SHOULD BUILD | P2 |
| genix-main | SSE browser bridge | `omino/genix-main/backend/agent/ws.go`, `frontend/core/agent/sse.ts` | Real-time agent status streaming | AI Agents | REBUILD FROM CONCEPT | P3 |
| genix-main | Agent message storage | `omino/genix-main/backend/agent/types/agent_messages.go` | Session history per company/user | AI Agents | SHOULD BUILD | P2 |
| genix-main | Qdrant documentation RAG | `omino/genix-main/backend/agent/knowledge/search.go` | Hybrid vector search for help docs | AI Tools | ARCHITECTURAL REFERENCE | P3 |
| genix-main | External agent API | `omino/genix-main/backend/agent/http.go`, `HTTP_API.md` | `POST /agent` for third-party agents | AI Tools | ARCHITECTURAL REFERENCE | P4 |
| genix-main | All Go backend code | `omino/genix-main/backend/` | GPL v3 license — cannot import | — | IGNORE | — |
| genix-main | ScyllaDB custom ORM | `omino/genix-main/backend/genix-orm/` | Wrong DB stack | — | IGNORE | — |
| genix-main | SvelteKit frontend | `omino/genix-main/frontend/` | Wrong UI framework | — | IGNORE | — |

---

## multi-agent-business-os-main → OMINO AI Agents

| Source | Feature / Pattern | Exact File(s) | What It Does | OMINO Module | Recommendation | Priority |
| ------ | ----------------- | ------------- | ------------ | ------------ | -------------- | -------- |
| multi-agent-business-os-main | LangGraph supervisor | `omino/multi-agent-business-os-main/backend/app/agents/multi_agent.py` | Route tasks to researcher/writer/analyst | AI Agents | ARCHITECTURAL REFERENCE | P2 |
| multi-agent-business-os-main | Research agent graph | `omino/multi-agent-business-os-main/backend/app/agents/research_agent.py` | Planner → searcher → critic → synthesizer | AI Agents | ARCHITECTURAL REFERENCE | P3 |
| multi-agent-business-os-main | LLM abstraction | `omino/multi-agent-business-os-main/backend/app/services/llm.py` | Provider-agnostic chat + embeddings | AI Agents | SHOULD BUILD | P2 |
| multi-agent-business-os-main | KB search tool | `omino/multi-agent-business-os-main/backend/app/agents/tools.py` | RAG tool for agents | AI Tools | REBUILD FROM CONCEPT | P2 |
| multi-agent-business-os-main | RAG pipeline | `omino/multi-agent-business-os-main/backend/app/services/rag/` | Load, chunk, embed, retrieve | AI Tools | SHOULD BUILD | P3 |
| multi-agent-business-os-main | Streaming chat endpoint | `omino/multi-agent-business-os-main/backend/app/api/v1/endpoints/chat.py` | SSE chat with history window | AI Agents | SHOULD BUILD | P2 |
| multi-agent-business-os-main | Celery worker setup | `omino/multi-agent-business-os-main/backend/app/workers/celery_app.py` | Async jobs: ingest, OCR, agents | Automations | REBUILD FROM CONCEPT | P3 |
| multi-agent-business-os-main | Workspace tenancy | `omino/multi-agent-business-os-main/backend/app/db/models/workspace.py` | `workspace_id` isolation pattern | Organizations | ARCHITECTURAL REFERENCE | P2 |
| multi-agent-business-os-main | Conversation models | `omino/multi-agent-business-os-main/backend/app/db/models/conversation.py` | Chat persistence | AI Agents | SHOULD BUILD | P2 |
| multi-agent-business-os-main | Invoice extractor | `omino/multi-agent-business-os-main/backend/app/agents/invoice_extractor.py` | OCR → structured JSON extraction | AI Tools | ARCHITECTURAL REFERENCE | P4 |
| multi-agent-business-os-main | Rate limiting | `omino/multi-agent-business-os-main/backend/app/core/ratelimit.py` | Redis sliding window on LLM routes | Core | SHOULD BUILD | P3 |
| multi-agent-business-os-main | Architecture doc | `omino/multi-agent-business-os-main/docs/ARCHITECTURE.md` | Flow diagrams, scaling notes | AI Agents | ARCHITECTURAL REFERENCE | P1 |
| multi-agent-business-os-main | Prompt injection defense | `omino/multi-agent-business-os-main/backend/app/services/rag/retriever.py` | RAG context marked untrusted | AI Agents | SHOULD BUILD | P3 |
| multi-agent-business-os-main | Flutter mobile app | `omino/multi-agent-business-os-main/mobile/` | No web dashboard | — | IGNORE | — |

---

## Cross-Repository Patterns

| Source | Feature / Pattern | Exact File(s) | What It Does | OMINO Module | Recommendation | Priority |
| ------ | ----------------- | ------------- | ------------ | ------------ | -------------- | -------- |
| spree + caratflow | Cart → Order immutability | Spree `cart.rb`/`order.rb`; CaratFlow `retail.service.ts` | Clean checkout boundary | Orders | MUST BUILD | P1 |
| caratflow + spree | Event-driven sale → inventory | CaratFlow `events.ts`; Spree `events.rb` | `sale.completed` → stock decrement | Automations | MUST BUILD | P2 |
| genix + multi-agent + OMINO_README | Agent with approval gate | genix `chat_loop.go`; multi-agent `multi_agent.py`; `main/OMINO_README.md` | Recommend → approve → execute | AI Agents | MUST BUILD | P2 |
| main + Nexus | Founding org onboarding | `main/js/auth.js`; Nexus tenant login | Signup creates org + locks plan | Organizations | SHOULD BUILD | P1 |
| main + spree | Platform fee on payments | `main/js/config.js`; Spree adjustments | 0.3%–0.5% OMINO fee model | Payments | SHOULD BUILD | P2 |
| caratflow + main | OMINO UI on shadcn base | `main/css/omino.css`; CaratFlow `packages/ui` | One design system | UI | MUST BUILD | P1 |

---

## Priority Legend

| Priority | Meaning |
| -------- | ------- |
| **P0** | Blocker — required before any product work |
| **P1** | Core platform — Phases 1–2 |
| **P2** | Primary business modules — Phases 3–8 |
| **P3** | Enhancement — Phases 9–13 |
| **P4** | Future / optional |

---

## Summary Counts

| Recommendation | Count |
| -------------- | ----- |
| MUST BUILD | 10 |
| SHOULD BUILD | 22 |
| REBUILD FROM CONCEPT | 18 |
| ARCHITECTURAL REFERENCE | 38 |
| IGNORE | 10 |

**Total rows:** 98 feature mappings

---

## Top 20 Features Worth Building (Prioritized)

| # | Feature | Primary Source | OMINO Module |
|---|---------|----------------|--------------|
| 1 | Design tokens → `@omino/ui` | `main/css/omino.css` | UI |
| 2 | Multi-tenant `organizationId` isolation | CaratFlow `base.service.ts` | Organizations |
| 3 | Cart → immutable Order | Spree `cart.rb`, `order.rb` | Orders |
| 4 | Product + Variant + SKU model | Spree `product.rb`, `variant.rb` | Products |
| 5 | Stock level + movement ledger | Spree `stock_level.rb` | Inventory |
| 6 | JWT auth + persisted RBAC | Nexus `auth.js` + CaratFlow permissions | Users / Roles |
| 7 | Event bus (BullMQ) | CaratFlow `event-bus.service.ts` | Automations |
| 8 | AI approval gate | OMINO_README + genix pattern | AI Agents |
| 9 | Founding org onboarding | `main/js/auth.js` | Organizations |
| 10 | POS sale flow | CaratFlow `retail/` | POS |
| 11 | Payment provider abstraction | Spree `payment_session.rb` | Payments |
| 12 | App shell with module nav | Nexus `dashboard/layout.tsx` | Business OS |
| 13 | LLM provider abstraction | multi-agent `llm.py` | AI Agents |
| 14 | RAG per organization | multi-agent `services/rag/` | AI Tools |
| 15 | Audit logs | Nexus `audit.js` | Core |
| 16 | WhatsApp integration | `main/js/config.js` | Integrations |
| 17 | EN/AR i18n | `main/js/omino-nav.js` | Core |
| 18 | Workflow approvals | Nexus `workflows.js` | Workflows |
| 19 | CRM customers + segments | Spree `customer.rb` | CRM |
| 20 | Platform fee on payments | `main/js/config.js` | Payments |

---

*This matrix is read-only intelligence. No code was extracted or merged. See `OMINO-ARCHITECTURE-AUDIT.md` for full architectural decisions.*
