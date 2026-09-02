# OMINO — Implementation Roadmap

**Date:** 2026-09-01  
**Status:** Recommended sequence for post-audit implementation  
**Prerequisite:** All Phase 0 architecture documents complete

---

## Overview

This roadmap sequences OMINO from architecture audit to launch. The order prioritizes **tenant foundation before features**, **commerce core before AI**, and **preserves live marketing** until the Business OS is ready.

Minor adjustments from the original prompt sequence are noted with rationale.

---

## Phase Map

```
PHASE 0  Architecture Audit                    ← YOU ARE HERE (complete)
    ↓
PHASE 1  Monorepo + Target Architecture Setup
    ↓
PHASE 2  Database + Multi-Tenancy
    ↓
PHASE 3  Authentication
    ↓
PHASE 4  Onboarding
    ↓
PHASE 5  Business OS Shell
    ↓
PHASE 6  Products + Inventory
    ↓
PHASE 7  POS
    ↓
PHASE 8  Orders + Payments
    ↓
PHASE 9  Online Store
    ↓
PHASE 10 CRM
    ↓
PHASE 11 Analytics
    ↓
PHASE 12 AI Agents
    ↓
PHASE 13 Automation
    ↓
PHASE 14 Security + Performance
    ↓
PHASE 15 Marketing Migration (optional polish)
    ↓
LAUNCH
```

---

## PHASE 0 — Architecture Audit ✅

**Status:** Complete  
**Deliverables:**
- `OMINO-ARCHITECTURE-AUDIT.md`
- `OMINO-EXTRACTION-MATRIX.md`
- `OMINO-TARGET-ARCHITECTURE.md`
- `OMINO-DATABASE-BLUEPRINT.md`
- `OMINO-AI-ARCHITECTURE.md`
- `OMINO-DEPENDENCY-CONFLICTS.md`
- `OMINO-IMPLEMENTATION-ROADMAP.md`

**Rules observed:** No application code modified; reference repos read-only.

---

## PHASE 1 — Monorepo + Foundation

**Duration:** ~2 weeks  
**Goal:** Runnable monorepo skeleton with design tokens ported

### Tasks
- [ ] Initialize Turborepo + pnpm workspace
- [ ] Create `apps/api` (NestJS 11 scaffold)
- [ ] Create `apps/web` (Next.js 15 scaffold — minimal, not marketing yet)
- [ ] Create `packages/db` (Prisma 6, empty schema)
- [ ] Create `packages/ui` — port tokens from `main/css/omino.css`
- [ ] Create `packages/shared-types` (Zod base schemas)
- [ ] Docker Compose: PostgreSQL 16, Redis 7
- [ ] CI: lint, typecheck, test on PR

### Reference
- `caratflow-main/turbo.json`, `pnpm-workspace.yaml`
- `main/css/omino.css`

### Exit criteria
- `pnpm dev` starts api + web
- `@omino/ui` exports Button with OMINO tokens
- Postgres connection verified

---

## PHASE 2 — Database + Multi-Tenancy

**Duration:** ~2 weeks  
**Goal:** Core schema live with tenant isolation middleware

### Tasks
- [ ] Prisma schemas: `core.prisma`, `stores.prisma`
- [ ] Migrations: organizations, users, memberships, roles, permissions
- [ ] Migrations: stores, branches, employees
- [ ] Migrations: audit_logs
- [ ] `TenantAwareService` base class (organizationId on every query)
- [ ] Seed: system permissions, default roles (Owner, Admin, Manager, Cashier, Viewer)
- [ ] Founding org cap logic (50 orgs) from `main/js/auth.js`

### Reference
- `caratflow-main/packages/db/prisma/schema/core.prisma`
- `caratflow-main/apps/api/src/common/base.service.ts`
- `Nexus-ERP-main/server/prisma/schema.prisma` (simplified)

### Exit criteria
- Org created in DB with Owner role
- Cross-tenant query impossible in tests
- Audit log writes on org creation

---

## PHASE 3 — Authentication

**Duration:** ~2 weeks  
**Goal:** Replace `main/js/auth.js` localStorage with real API

### Tasks
- [ ] Auth module: register, login, refresh, logout
- [ ] bcrypt/argon2 password hashing (server-side)
- [ ] JWT access (15 min) + httpOnly refresh cookie (14 days)
- [ ] `organizationId` in JWT claims
- [ ] RBAC middleware: `requirePermission('module:action')`
- [ ] API routes: `/api/v1/auth/*`
- [ ] Keep `main/login.html` working via `OMINO_AUTH_ENDPOINT` pointing to new API

### Reference
- `Nexus-ERP-main/server/src/middleware/auth.js` (pattern, not dual-backend)
- `main/js/auth.js` (flow: signup creates org)

### Exit criteria
- Signup creates User + Organization + Owner membership
- Login returns JWT with organizationId
- Founding cap enforced server-side
- `main/login.html` works against real API

---

## PHASE 4 — Onboarding

**Duration:** ~2 weeks  
**Goal:** Post-signup business setup wizard at `/onboarding`

### Tasks
- [ ] Onboarding routes in `apps/web`: business type, country, currency
- [ ] Create first Store + default Branch
- [ ] Plan selection (Starter/Pro/Business from `main/js/config.js`)
- [ ] Founding price lock on Organization
- [ ] Payment handoff (WhatsApp or Stripe — manual OK for MVP)
- [ ] Redirect to `/app` on completion

### Reference
- `main/login.html` signup flow
- `main/js/config.js` plans
- `main/js/order.js` checkout concept

### Exit criteria
- New user completes onboarding → lands in `/app`
- Organization has store, branch, locked plan

---

## PHASE 5 — Business OS Shell

**Duration:** ~2 weeks  
**Goal:** Replace `main/app.html` with real `/app` experience

### Tasks
- [ ] App layout: sidebar, topbar, content area (`@omino/ui` AppShell)
- [ ] Module navigation (Overview, POS, Products, Inventory, Orders, Customers, Payments, Analytics, AI, Automations, Marketing, Team, Settings)
- [ ] RBAC-filtered nav (persisted permissions, not hardcoded)
- [ ] Overview dashboard (placeholder KPIs)
- [ ] EN/AR i18n in app shell
- [ ] Session guard middleware

### Reference
- `Nexus-ERP-main/client/src/app/dashboard/layout.tsx` (structure, not design)
- `caratflow-main/packages/ui/src/layout/app-shell.tsx`

### Exit criteria
- Authenticated user sees module sidebar at `/app`
- Unauthorized modules hidden per role
- `main/app.html` deprecated (redirect to `/app`)

---

## PHASE 6 — Products + Inventory

**Duration:** ~3 weeks  
**Goal:** Catalog and stock management

### Tasks
- [ ] Products API: CRUD, variants, SKUs, categories
- [ ] Prices: minor units, per-variant
- [ ] Inventory API: warehouses, stock levels, movements
- [ ] Low-stock threshold + notification trigger
- [ ] `/app/products` — list, create, edit
- [ ] `/app/inventory` — levels, movement history, adjust

### Reference
- Spree: `product.rb`, `variant.rb`, `stock_level.rb`, `stock_movement.rb`
- CaratFlow: `modules/inventory/`

### Exit criteria
- Product with variants created
- Stock adjustment creates movement record
- Low stock triggers notification

---

## PHASE 7 — POS

**Duration:** ~3 weeks  
**Goal:** In-store sales terminal

### Tasks
- [ ] POS API: `POST /api/v1/pos/sales`
- [ ] Product search by SKU/barcode/name
- [ ] Cart builder, cash/card tender
- [ ] Receipt generation (PDF)
- [ ] Event: `sale.completed` → inventory decrement
- [ ] `/app/pos` — tablet-friendly UI

### Reference
- CaratFlow `retail/`
- Nexus `invoices.js`
- genix `sales/` (concept)

### Exit criteria
- POS sale completes, stock decrements, order created
- Receipt printable

---

## PHASE 8 — Orders + Payments

**Duration:** ~3 weeks  
**Goal:** Order lifecycle and payment processing

### Tasks
- [ ] Cart model (mutable) separate from Order (immutable)
- [ ] Checkout flow: cart → payment session → order placement
- [ ] Orders API: list, detail, cancel, return
- [ ] Payments: provider abstraction (Stripe first)
- [ ] OMINO platform fee (0.3%–0.5%) on transactions
- [ ] `/app/orders`, `/app/payments`

### Reference
- Spree: `cart.rb`, `order.rb`, `workflows/spree/carts/complete.rb`
- Spree: `payment.rb`, `payment_session.rb`

### Exit criteria
- Web checkout creates immutable order
- Payment recorded with platform fee
- POS and web orders in unified list

### Rationale for after POS
POS validates order/inventory flow with simpler UX before adding payment provider complexity.

---

## PHASE 9 — Online Store

**Duration:** ~3 weeks  
**Goal:** Headless storefront for customer-facing commerce

### Tasks
- [ ] Store API: `GET /api/v1/store/products`, categories, cart
- [ ] Public storefront: `{org}.omino.ps` or `/s/{slug}`
- [ ] Cart + checkout (customer-facing)
- [ ] Order confirmation + WhatsApp notify
- [ ] `/app/store` — storefront settings, theme basics

### Reference
- Spree Store API v3 routes
- Nexus `shop.js`
- CaratFlow `storefront/`

### Exit criteria
- Customer can browse, add to cart, checkout
- Order appears in `/app/orders`

---

## PHASE 10 — CRM

**Duration:** ~2 weeks  
**Goal:** Customer profiles and segments

### Tasks
- [ ] Customers API: CRUD, order history, LTV
- [ ] Customer segments (rule-based)
- [ ] WhatsApp thread link on customer profile
- [ ] `/app/customers` — list, detail, segments

### Reference
- Spree `customer.rb`
- Nexus `crm.js`
- CaratFlow `crm/`

### Exit criteria
- Customer created manually or from order
- Segment "ordered in last 30 days" works

---

## PHASE 11 — Analytics

**Duration:** ~2 weeks  
**Goal:** Business intelligence dashboards

### Tasks
- [ ] Analytics API: revenue, orders, top products, trends
- [ ] Event aggregation from orders, payments, inventory
- [ ] `/app/analytics` — charts, date range filter
- [ ] CSV export

### Reference
- Nexus `ai.js` forecast concept
- CaratFlow `reporting/`

### Exit criteria
- Dashboard shows real revenue from orders
- Export downloads CSV

---

## PHASE 12 — AI Agents

**Duration:** ~4 weeks  
**Goal:** AI as core system with approval gates

### Tasks
- [ ] `packages/ai` — orchestrator, domain agents, tool registry
- [ ] Read tools: query_sales, query_inventory, query_orders, query_customers
- [ ] Write tools with approval: adjust_stock, apply_discount (proposed → approved → executed)
- [ ] `ai_runs`, `ai_messages`, `ai_tasks` tables
- [ ] RAG: pgvector ingest for org docs
- [ ] `/app/ai` — chat panel, approval cards
- [ ] SSE streaming
- [ ] Audit log for all AI actions

### Reference
- `OMINO-AI-ARCHITECTURE.md`
- genix `route_turn.go`, `discovery/planner.go` (patterns)
- multi-agent `multi_agent.py`, `services/rag/`

### Exit criteria
- "What were sales yesterday?" returns real data
- "Apply 10% discount" creates approval task; executes on approve
- All tool calls audited

### Rationale for Phase 12 (not earlier)
AI tools require live business data APIs. Building agents before Products/Orders would produce a chatbot, not a business OS.

---

## PHASE 13 — Automation

**Duration:** ~3 weeks  
**Goal:** Event-driven rules and workflows

### Tasks
- [ ] Event bus (BullMQ) with typed event catalog
- [ ] Subscribers: sale.completed → inventory, CRM, analytics
- [ ] Automation rules UI: trigger + conditions + actions
- [ ] Workflow approvals: refund, stock adjustment
- [ ] Scheduled jobs: low-stock alerts, morning briefing
- [ ] `/app/automations`

### Reference
- CaratFlow `event-bus.service.ts`, `events.ts`
- Spree `events.rb`, subscribers
- Nexus `workflows.js`

### Exit criteria
- Sale event triggers inventory decrement + CRM update
- User creates rule: "low stock → WhatsApp alert"
- Refund requires Manager approval

---

## PHASE 14 — Security + Performance

**Duration:** ~2 weeks  
**Goal:** Production hardening

### Tasks
- [ ] Rate limiting on auth and AI endpoints
- [ ] Postgres RLS policies (optional)
- [ ] Security audit: OWASP top 10
- [ ] Load testing: API, POS concurrent sales
- [ ] CDN for static assets
- [ ] Database indexes review
- [ ] Error monitoring (Sentry)
- [ ] Backup and restore procedure

### Exit criteria
- Pen test passes
- 100 concurrent POS sales without data corruption
- RTO/RPO documented

---

## PHASE 15 — Marketing Migration (Optional Polish)

**Duration:** ~3 weeks  
**Goal:** Port `main/` to Next.js when Business OS is stable

### Tasks
- [ ] Port `main/index.html` to Next.js `/main` routes
- [ ] Preserve GSAP animations, orbit nav, design exactly
- [ ] Wire login/signup to production auth API
- [ ] Retire static `main/` when parity achieved
- [ ] Update `vercel.json` routing

### Reference
- `main/` — all files (preserve, do not redesign)

### Exit criteria
- `omino-six.vercel.app/main/` served from Next.js
- Visual parity with current static site
- No regression in EN/AR i18n

### Rationale for last
Marketing site is live and converting. Do not risk it until `/app` is production-ready.

---

## LAUNCH

### Launch checklist
- [ ] 50 founding orgs cap enforced
- [ ] Founding pricing locked
- [ ] POS + Store + CRM functional
- [ ] AI read tools + approval writes
- [ ] WhatsApp integration live
- [ ] EN + AR complete
- [ ] Privacy policy, terms (existing `main/` pages)
- [ ] Monitoring and alerting
- [ ] Support channel (WhatsApp)

---

## Timeline Summary

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 0 Audit | — | — |
| 1 Foundation | 2 weeks | 2 weeks |
| 2 Database | 2 weeks | 4 weeks |
| 3 Auth | 2 weeks | 6 weeks |
| 4 Onboarding | 2 weeks | 8 weeks |
| 5 App Shell | 2 weeks | 10 weeks |
| 6 Products + Inventory | 3 weeks | 13 weeks |
| 7 POS | 3 weeks | 16 weeks |
| 8 Orders + Payments | 3 weeks | 19 weeks |
| 9 Online Store | 3 weeks | 22 weeks |
| 10 CRM | 2 weeks | 24 weeks |
| 11 Analytics | 2 weeks | 26 weeks |
| 12 AI Agents | 4 weeks | 30 weeks |
| 13 Automation | 3 weeks | 33 weeks |
| 14 Security | 2 weeks | 35 weeks |
| 15 Marketing | 3 weeks | 38 weeks |

**Estimated:** ~9 months to full launch (team-dependent)

**MVP launch (earlier):** End of Phase 8 (~19 weeks) — POS + Orders + Payments for founding customers

---

## Sequence Adjustments vs Original Prompt

| Original | Adjusted | Reason |
|----------|----------|--------|
| AI Agents before Automation | Automation after AI | AI tools need event bus; automation extends AI actions |
| Marketing Polish near end | Confirmed last | Live site must not break during build |
| Target Architecture as Phase 1 | Merged into Phase 1 setup | Architecture docs done in Phase 0 |
| Database + Multi-Tenancy combined | Confirmed Phase 2 | Foundation before any feature |

---

## What to Build First (MVP Path)

If accelerating to founding customer value:

1. **Phase 1–3** (6 weeks) — Auth + org
2. **Phase 5** (2 weeks) — App shell
3. **Phase 6–7** (6 weeks) — Products + POS
4. **Phase 8** (3 weeks) — Orders + Payments

**MVP = ~17 weeks:** A founding business can run POS, manage products, and take payments.

Defer: Online Store (Phase 9), AI (Phase 12), Automation (Phase 13), Marketing migration (Phase 15).

---

*See also: `OMINO-TARGET-ARCHITECTURE.md`, `OMINO-ARCHITECTURE-AUDIT.md` §13*
