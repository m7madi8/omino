# OMINO — Target Architecture

**Date:** 2026-09-01  
**Status:** Design document — no implementation in this phase  
**Prerequisite:** `OMINO-ARCHITECTURE-AUDIT.md`, `OMINO-EXTRACTION-MATRIX.md`

---

## 1. Vision

OMINO is a **modular, multi-tenant AI Business Operating System** for MENA-first businesses. One platform runs POS, online store, inventory, CRM, payments, analytics, marketing, automations, and AI agents — with strict separation between the public marketing site and the authenticated Business OS.

---

## 2. Product Surfaces (Locked)

```
OMINO
│
├── Public Marketing          /main          (preserve existing static site until migration)
├── Authentication          /login, /signup
├── Onboarding              /onboarding
└── Business OS               /app
    │
    ├── Core
    ├── Organizations
    ├── Users
    ├── Roles & Permissions
    ├── Stores
    ├── Branches
    ├── Products
    ├── Inventory
    ├── POS
    ├── Orders
    ├── Customers / CRM
    ├── Payments
    ├── Analytics
    ├── Marketing             (org-level campaigns — not public site)
    ├── Automations
    ├── Workflows
    ├── AI Agents
    ├── AI Tools
    ├── Notifications
    ├── Integrations
    └── Settings
```

### Surface rules

| Surface | Route | Auth | Layout | Data |
|---------|-------|------|--------|------|
| Marketing | `/main` | None | Editorial, GSAP, orbit nav | Static + forms only |
| Auth | `/login`, `/signup` | Optional | Minimal branded shell | Credentials |
| Onboarding | `/onboarding` | Required | Wizard steps | Org + store setup |
| Business OS | `/app/*` | Required | App shell, sidebar | All business entities |

**Shared across surfaces:** design tokens (`@omino/ui`), logo, EN/AR i18n, tone of voice.  
**Not shared:** layouts, navigation, page templates, GSAP marketing sequences.

---

## 3. Monorepo Structure

```
OMINO/
├── apps/
│   ├── web/                    # Next.js 15+ — marketing migration + /app Business OS
│   ├── api/                    # NestJS or Fastify — modular monolith API
│   └── worker/                 # BullMQ — ingest, AI, webhooks, reports, automations
├── packages/
│   ├── db/                     # Prisma — split schema files per domain
│   ├── ui/                     # OMINO design system (tokens from main/css/omino.css)
│   ├── shared-types/           # Zod schemas, domain events, enums
│   ├── sdk/                    # Typed Store + Admin API client
│   └── ai/                     # Agents, tools, prompts (isolated package)
├── main/                       # LEGACY static marketing (live until web parity)
└── omino/                      # REFERENCE ONLY — never merge
```

**Pattern source:** CaratFlow Turborepo (`omino/caratflow-main/turbo.json`, `pnpm-workspace.yaml`)

---

## 4. Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENTS                                                         │
│  Marketing (static → Next.js)  │  Business OS (/app)  │  Store  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│  API GATEWAY / EDGE                                              │
│  Rate limit │ Auth │ Tenant resolution │ CORS                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  apps/api — MODULAR MONOLITH                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Core     │ │ Commerce │ │ CRM      │ │ AI       │           │
│  │ Org/User │ │ Products │ │ Customers│ │ Agents   │           │
│  │ RBAC     │ │ Orders   │ │ Segments │ │ Tools    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│  │ POS      │ │ Payments │ │ Automation│                        │
│  └──────────┘ └──────────┘ └──────────┘                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
   PostgreSQL            Redis/BullMQ          Object Storage
   (Prisma)              (events, jobs)        (files, exports)
        │
        ▼
   Vector DB (per-org RAG) — optional Phase 12+
```

---

## 5. Module Specifications

### 5.1 Core

**Purpose:** Platform primitives shared by all modules.

| Concern | Responsibility |
|---------|----------------|
| Config | Feature flags, environment, founding plan caps |
| Audit | Immutable activity log per organization |
| Files | Upload, storage, signed URLs |
| Health | Liveness, readiness probes |

**Reference:** Nexus `server/src/routes/audit.js`, CaratFlow `platform.prisma`

---

### 5.2 Organizations

**Purpose:** Top-level tenant boundary. One business owner may own multiple stores.

| Entity | Key fields |
|--------|------------|
| Organization | `id`, `name`, `slug`, `country`, `currency`, `foundingPlan`, `planLockedUntil` |
| Membership | `userId`, `organizationId`, `roleId`, `status` |

**Tenancy rule:** Every business table carries `organizationId`. JWT claim is the only source of tenant context — never accept from request body.

**Reference:** Nexus `Tenant` model, Spree `Store`, CaratFlow `TenantAwareService`

---

### 5.3 Users

**Purpose:** Human accounts that may belong to multiple organizations.

| Entity | Key fields |
|--------|------------|
| User | `id`, `email`, `passwordHash`, `fullname`, `phone`, `locale` |
| Session | `userId`, `refreshToken`, `expiresAt` |

**Reference:** Rebuild from `main/js/auth.js` flow with server-side bcrypt/argon2 (not client SHA-256).

---

### 5.4 Roles & Permissions

**Purpose:** Persisted RBAC — not in-memory matrices.

| Entity | Key fields |
|--------|------------|
| Role | `id`, `organizationId`, `name`, `isSystem` |
| Permission | `id`, `module`, `action` (e.g. `orders:read`, `pos:write`) |
| RolePermission | `roleId`, `permissionId` |

**System roles:** Owner, Admin, Manager, Cashier, Viewer (extensible per org).

**Anti-pattern to avoid:** Nexus `admin.js` in-memory `tenantMatrixStore`.

**Reference:** CaratFlow `Permission` model, Nexus `UserRole` enum (as starting point)

---

### 5.5 Stores & Branches

**Purpose:** Commercial units within an organization.

```
Organization
  └── Store (brand, currency, timezone, storefront slug)
        └── Branch (physical location, address, POS terminal)
```

| Entity | Key fields |
|--------|------------|
| Store | `organizationId`, `name`, `slug`, `currency`, `timezone` |
| Branch | `storeId`, `name`, `address`, `isDefault` |

**Reference:** Spree `Store`, `Channel` (POS vs web), CaratFlow `Location`

---

### 5.6 Products

**Purpose:** Catalog with variants, SKUs, categories, pricing.

| Entity | Key fields |
|--------|------------|
| Product | `organizationId`, `storeId`, `name`, `status`, `description` |
| ProductVariant | `productId`, `sku`, `barcode`, `trackInventory` |
| Category | `storeId`, `name`, `parentId` |
| Price | `variantId`, `amount` (minor units), `currency`, `priceListId` |

**Reference:** Spree `product.rb`, `variant.rb`, `price.rb` — ARCHITECTURAL REFERENCE only

---

### 5.7 Inventory

**Purpose:** Stock levels, movements, reservations, alerts.

| Entity | Key fields |
|--------|------------|
| Warehouse | `branchId`, `name` |
| StockLevel | `variantId`, `warehouseId`, `quantityOnHand`, `quantityReserved` |
| StockMovement | `variantId`, `warehouseId`, `quantity`, `reason`, `referenceType` |

**Pattern:** Ledger-style movements (never mutate quantity without a movement record).

**Reference:** Spree `stock_level.rb`, `stock_movement.rb`, CaratFlow `inventory.event-handler.ts`

---

### 5.8 POS

**Purpose:** In-store sales terminal.

**Flow:**
```
POS Terminal → POST /api/v1/pos/sales
  → Event: sale.completed
    → Inventory: decrement stock
    → Payments: record tender
    → CRM: update customer LTV
    → Analytics: aggregate
```

**Channel:** `pos` (Spree Channel pattern).

**Reference:** CaratFlow `retail/`, Nexus `invoices.js`, genix `sales/`

---

### 5.9 Orders

**Purpose:** Immutable sales records post-checkout.

| Stage | Entity | Mutability |
|-------|--------|------------|
| Shop | Cart, CartItem | Mutable |
| Checkout | Cart + PaymentSession | Mutable until complete |
| Complete | Order, OrderItem | Immutable |
| Post-sale | Fulfillment, Return | Workflow-driven |

**Critical rule:** Cart ≠ Order (Spree 6.0 split).

**Reference:** Spree `cart.rb`, `order.rb`, `workflows/spree/carts/complete.rb`

---

### 5.10 Customers / CRM

**Purpose:** Customer profiles, segments, interaction history.

| Entity | Key fields |
|--------|------------|
| Customer | `organizationId`, `name`, `email`, `phone`, `whatsapp` |
| CustomerSegment | `organizationId`, `name`, `rules` (JSON) |
| Interaction | `customerId`, `channel`, `content`, `at` |

**Reference:** Spree `customer.rb`, Nexus `crm.js`, CaratFlow `crm/`

---

### 5.11 Payments

**Purpose:** Provider-agnostic payment processing + OMINO platform fee.

| Entity | Key fields |
|--------|------------|
| Payment | `orderId`, `amount`, `status`, `provider`, `providerRef` |
| PaymentMethod | `organizationId`, `type`, `config` (encrypted) |
| PlatformFee | `paymentId`, `rate`, `amount` |

**Fee model:** 0.3%–0.5% per `main/js/config.js` and `OMINO_README.md`.

**Reference:** Spree `payment.rb`, `payment_session.rb`

---

### 5.12 Analytics

**Purpose:** Revenue, profit, trends, vertical KPIs.

**Data sources:** Order events, payment events, inventory movements (materialized views or event aggregation).

**Reference:** Nexus `ai.js` forecast patterns, CaratFlow `reporting/`

---

### 5.13 Marketing (org-level)

**Purpose:** Campaigns, channels, abandoned cart — **not** the public `/main` site.

| Entity | Key fields |
|--------|------------|
| Campaign | `organizationId`, `name`, `channel`, `status` |
| AutomationRule | `trigger`, `conditions`, `actions` |

**Reference:** CaratFlow `crm.notification.service.ts`, `abandoned-cart.service.ts`

---

### 5.14 Automations

**Purpose:** Event-driven rules and scheduled jobs.

**Architecture (from CaratFlow):**
```
Layer 1: Event Bus (BullMQ pub/sub + retry)
Layer 2: Workflow Definitions (state machines + triggers)
Layer 3: Action Executors (domain service adapters)
Layer 4: Schedulers (cron + delayed jobs)
Layer 5: Notification Router (template + channel)
```

**Reference:** `caratflow-main/apps/api/src/event-bus/event-bus.service.ts`, `packages/shared-types/src/events.ts`

---

### 5.15 Workflows

**Purpose:** Multi-step approvals (refunds, PO, AI write actions).

| Entity | Key fields |
|--------|------------|
| WorkflowDefinition | `organizationId`, `type`, `steps` (JSON) |
| WorkflowRun | `definitionId`, `status`, `currentStep`, `context` |

**Reference:** Spree `workflow.rb`, Nexus `workflows.js`

---

### 5.16 AI Agents & AI Tools

**Purpose:** Business intelligence and action — not a chat page.

See `OMINO-AI-ARCHITECTURE.md` for full design.

**Summary:**
- Agent Orchestrator routes to domain agents (Sales, Inventory, CRM)
- Tools wrap the same REST API the UI uses
- All write actions require approval

**Reference:** genix discovery→execution pattern, multi-agent LangGraph supervisor, OMINO_README AI rules

---

### 5.17 Notifications

**Purpose:** Email, WhatsApp, in-app alerts.

| Channel | Use case |
|---------|----------|
| In-app | Low stock, order updates, AI approvals |
| WhatsApp | Customer contact, order confirm (MENA-first) |
| Email | Reports, auth, billing |

**Reference:** CaratFlow `crm.notification.service.ts`, `main/js/config.js` WhatsApp helpers

---

### 5.18 Integrations

**Purpose:** External service connectors.

| Integration | Priority |
|-------------|----------|
| WhatsApp | P1 (MENA) |
| Payment providers (Stripe, local) | P1 |
| Instagram / social | P3 |

---

### 5.19 Settings

**Purpose:** Org config, billing, locales, founding plan lock.

---

## 6. API Architecture

### Public REST API (versioned)

```
/api/v1/store/*     — Headless storefront (Spree Store API pattern)
/api/v1/admin/*     — Business OS CRUD
/api/v1/pos/*       — POS terminal
/api/v1/ai/*        — Agent chat, tool runs, approvals
```

### Internal API

- **tRPC or typed RPC** for web app ↔ API (CaratFlow pattern)
- Same business logic; REST is the external contract

### Conventions

- UUID primary keys internally; prefixed public IDs externally (`ord_`, `prod_`, `cus_`)
- Money as integer minor units
- Zod validation on all inputs
- OpenAPI spec generated for SDK and AI tool definitions

---

## 7. Cross-Cutting Concerns

### 7.1 Multi-Tenancy

See §5.2 and `OMINO-DATABASE-BLUEPRINT.md`. Strategy: **shared database, shared schema, row-level `organizationId`**.

### 7.2 Security

| Area | Approach |
|------|----------|
| Auth | Single JWT issuer, httpOnly refresh cookies |
| Tenant | `organizationId` from JWT only |
| RBAC | Persisted permissions, middleware on every route |
| AI | Tool calls scoped to org; approval gate on writes |
| Audit | All auth, permission, payment, AI actions logged |

### 7.3 Events

Modules publish domain events; subscribers react without direct cross-module DB access.

**Event shape (from CaratFlow):**
```typescript
{
  id: string;
  organizationId: string;
  userId?: string;
  type: string;        // e.g. 'sale.completed'
  payload: unknown;
  timestamp: Date;
  correlationId?: string;
}
```

### 7.4 i18n

- EN / AR from day one
- `locale` on User and Organization
- RTL layout in `@omino/ui`
- Arabic copy authored natively — not machine-translated English

---

## 8. Deployment Topology

| Environment | Components |
|-------------|------------|
| Production | Vercel (web) + API host + PostgreSQL + Redis + S3 |
| Staging | Same topology, separate DB |
| Local | Docker Compose: postgres, redis, api, web |

**Marketing today:** Static `main/` on Vercel — unchanged until Phase 15 migration.

---

## 9. Compatibility with Current OMINO

| Current | Target | Migration |
|---------|--------|-----------|
| Static HTML marketing | Next.js `/main` routes | Phase 15 — preserve design |
| `auth.js` localStorage | Server auth API | Phase 3 |
| `app.html` placeholder | Greenfield `/app` shell | Phase 5 |
| `config.js` plans | Organization billing | Phase 4 |
| `omino.css` tokens | `@omino/ui` CSS variables | Phase 1 |

---

## 10. What Must NOT Be Built From Reference Repos

| Source | Do not copy |
|--------|-------------|
| spree-main | Rails monolith, ActiveRecord models |
| genix-main | Go backend, ScyllaDB, GPL code |
| caratflow-main | Jewelry/India domain (girvi, HUID, karat) |
| Nexus-ERP-main | Spring Boot dual backend, in-memory RBAC |
| multi-agent-business-os-main | Flutter client, FAISS-only vector store |

---

## 11. Architecture Decision Records (Locked)

1. **Greenfield API** — no merging reference codebases
2. **PostgreSQL + Prisma** — single database, split schema files
3. **TypeScript monorepo** — Turborepo
4. **Preserve OMINO brand** — tokens from `main/css/omino.css`
5. **Headless commerce** — Spree-informed domain, OMINO API
6. **AI approval gate** — non-negotiable
7. **`organizationId` tenancy** — one term everywhere
8. **Marketing stays static** until app shell is ready
9. **Cart ≠ Order** — immutable order after completion
10. **Events over imports** — no cross-module direct DB access

---

*See also: `OMINO-DATABASE-BLUEPRINT.md`, `OMINO-AI-ARCHITECTURE.md`, `OMINO-IMPLEMENTATION-ROADMAP.md`*
