# OMINO — Architecture & Repository Intelligence Audit

**Date:** 2026-09-01 (updated with product-surface clarification)  
**Scope:** `main/` (current OMINO) + `omino/` (five reference repositories)  
**Status:** Analysis only — no application code was modified.

**Production marketing URL:** [https://omino-six.vercel.app/main/](https://omino-six.vercel.app/main/)

---

## Executive Summary

OMINO today has **one live public surface** and **one unfinished authenticated surface**:

| Surface | Current | Target route | Role |
|---------|---------|--------------|------|
| **Public Marketing Website** | `main/` static pages (live on Vercel) | `/main` | Brand, positioning, pricing, resources, login entry |
| **Authenticated Business OS** | `main/app.html` placeholder only | `/app` | POS, Store, Inventory, CRM, AI, etc. — **not built yet** |

The marketing site at `/main` is the **primary public website**. It is **not** the business dashboard and must **not** be redesigned or replaced during early implementation phases.

The product OS described in `main/OMINO_README.md` will live at **`/app`** — a separate experience with its own layout, navigation, and UX concerns. The five imported repositories are **architectural reference only**, not merge candidates.

**Recommended direction:** Build a **greenfield Business OS** at `/app` + API backend, while **preserving** the existing `/main` marketing site. Share **design tokens and brand identity** across both surfaces via `@omino/ui` — not shared layouts or navigation.

**Target user journey:**

```
Marketing (/main) → Sign Up (/signup) → Create Business → Choose Plan → Onboarding (/onboarding) → Business OS (/app)
```

---

## 0. Product Surfaces & Routing (Locked)

OMINO is **two products sharing one brand** — not one app with a landing page bolted on.

### 0.1 Public Marketing Experience — `/main`

**Purpose:** Acquire, educate, convert. No business data. No authenticated modules.

**Live today:** `https://omino-six.vercel.app/main/` → static files in `main/`

**Includes (current + planned marketing pages):**
- Brand presentation, hero, system story
- Product positioning, features, solutions
- AI capabilities showcase
- Pricing, founding offer, social proof
- Documentation / resources (FAQ, About, legal)
- Login entry, Get Started / Sign Up CTAs
- Contact, WhatsApp

**Current files (marketing only):**
- `main/index.html` — homepage
- `main/about.html`, `main/faq.html`, `main/contact.html`
- `main/privacy.html`, `main/terms.html`
- `main/login.html` — auth UI (transitional; target route `/login`)
- `main/checkout.html`, `main/confirm.html` — founding plan purchase (transitional)

**Layout:** Editorial marketing shell — orbit nav, GSAP motion, section anchors (`#business`, `#ai`, `#pricing`).

**Navigation:** Product, AI, Pricing, About, Login, Start for free.

**Rule:** Do **not** redesign or replace this experience during the audit or Phase 1–4 implementation.

---

### 0.2 Authenticated Business OS — `/app`

**Purpose:** Operate the business. Entered **after** registration, plan selection, and onboarding.

**Current state:** `main/app.html` is a **temporary placeholder** (welcome + sign out). It is **not** the marketing site and **not** the final Business OS.

**Target modules (future `/app` shell):**

| Module | Description |
|--------|-------------|
| Overview | Business health at a glance |
| POS | In-store sales |
| Store | Online catalog & checkout |
| Products | SKU, variants, pricing |
| Inventory | Stock, movements, alerts |
| Orders | Sales, returns, fulfillment |
| Customers / CRM | Profiles, segments, WhatsApp |
| Payments | Tenders, fees, reconciliation |
| Analytics | Revenue, profit, trends |
| AI | Agent chat, recommendations, approvals |
| Automations | Rules, triggers, scheduled jobs |
| Marketing | Campaigns, channels (org-level, not public site) |
| Team | Users, roles, invites |
| Settings | Org, billing, locales, integrations |

**Layout:** Application shell — sidebar/module nav, data-dense tables, forms, dashboards.

**Navigation:** Module-based sidebar (reference: Nexus `dashboard/layout.tsx`, CaratFlow `(dashboard)/`), **not** marketing nav.

**Rule:** Build `/app` as a **new greenfield experience**. Do not extend marketing pages into the dashboard.

---

### 0.3 Auth & Onboarding Routes (Transitional → Target)

| Target route | Current file | Purpose |
|--------------|--------------|---------|
| `/login` | `main/login.html` | Sign in |
| `/signup` | `main/login.html#signup` | Account + business creation |
| `/onboarding` | *(not built)* | Business setup wizard post-signup |
| `/app` | `main/app.html` (placeholder) | Business OS entry |

**Onboarding steps (target):**
1. Create account (name, email, phone, password)
2. Create business (name, vertical, market)
3. Choose plan (Starter / Pro / Business; founding pricing)
4. Payment or WhatsApp confirmation
5. Initial setup (currency, tax, first product optional)
6. Redirect → `/app`

---

### 0.4 Separation Rules

| Concern | Marketing (`/main`) | Business OS (`/app`) |
|---------|---------------------|----------------------|
| Layout | Editorial, full-bleed sections | App shell, sidebar, content area |
| Navigation | Top nav + mobile drawer | Module sidebar + top bar |
| Motion | GSAP cinematic intro | Functional micro-interactions |
| Auth | Login / Sign up CTAs only | Full session required |
| Data | None (static + forms) | All business entities |
| i18n | EN/AR via `OminoNav` | EN/AR via shared `@omino/ui` |
| Design tokens | `main/css/omino.css` | Same tokens, different components |
| Brand | Archivo, editorial serif, ink/paper | Same fonts/colors, denser UI |

**Shared:** `@omino/ui` tokens, logo, tone of voice, EN/AR support.  
**Not shared:** Layout components, nav structure, page templates, GSAP marketing sequences.

---

### 0.5 Target Route Map

```
/                          → redirect to /main
/main                      → Marketing Website (PRIMARY PUBLIC SITE)
/main/about                → About (current: about.html)
/main/faq                  → FAQ
/main/contact              → Contact
/main/pricing              → Pricing anchor or page
/login                     → Authentication (sign in)
/signup                    → Account + business creation
/onboarding                → Post-signup business setup wizard
/app                       → OMINO Business OS (authenticated)
/app/pos                   → POS module
/app/store                 → Online store admin
/app/products              → Product catalog
/app/inventory             → Inventory
/app/orders                → Orders
/app/customers             → CRM
/app/payments              → Payments
/app/analytics             → Analytics
/app/ai                    → AI agent & insights
/app/automations           → Automation rules
/app/marketing             → Org-level marketing tools
/app/team                  → Team & roles
/app/settings              → Organization settings
```

**Vercel today:** `vercel.json` rewrites `/` → `/main/index.html` and `/:path` → `/main/:path`. Marketing remains at `/main/*` until routing is explicitly migrated.

---

## 1. Current OMINO Architecture (`main/`)

### 1.1 Framework & Runtime

| Aspect | Current state |
|--------|---------------|
| Framework | **None** — static multi-page HTML |
| Build | No `package.json`, no bundler, no SSR |
| Hosting | Static files; `vercel.json` rewrites `/` → `main/index.html` |
| Animation | GSAP 3.12.5 (CDN) on marketing pages |

### 1.2 Routing

**Important:** Everything under `main/` today serves the **public marketing website** except `app.html`, which is an early **Business OS placeholder** — not part of the marketing experience.

- **Marketing MPA:** file-based static HTML at `/main/*`
- **Auth flows:** `login.html` with hash modes (`#signup`, `#forgot`) — target standalone `/login`, `/signup`
- **Checkout:** `checkout.html?plan=…&billing=…` — founding plan purchase (pre-`/app` journey)
- **Business OS placeholder:** `app.html` — session gate only; will be replaced by greenfield `/app`

| Current path | File | Surface | Purpose |
|--------------|------|---------|---------|
| `/main/` | `main/index.html` | **Marketing** | Homepage — hero, system, verticals, AI, pricing |
| `/main/about` | `main/about.html` | **Marketing** | Brand story |
| `/main/faq` | `main/faq.html` | **Marketing** | FAQ |
| `/main/contact` | `main/contact.html` | **Marketing** | Contact → WhatsApp |
| `/main/login` | `main/login.html` | **Auth** | Sign in / sign up / forgot |
| `/main/checkout` | `main/checkout.html` | **Conversion** | Founding plan purchase |
| `/main/confirm` | `main/confirm.html` | **Conversion** | Order confirmation |
| `/main/privacy`, `/main/terms` | `main/privacy.html`, `main/terms.html` | **Marketing** | Legal |
| `/main/app` | `main/app.html` | **Business OS (placeholder)** | Temporary post-login shell — **not marketing** |

### 1.3 UI System & Design System

**Primary tokens** (in `main/css/omino.css` and inline in `main/index.html`):

- Colors: `--ink`, `--paper`, `--stone`, `--accent`, `--hairline`, etc.
- Typography: Archivo (display), Inter (body), Instrument Serif (editorial), IBM Plex Mono (data), Zain + IBM Plex Sans Arabic (AR)
- Motion: `--ease`, GSAP timelines, `prefers-reduced-motion` respected
- Patterns: `.wrap`, `.btn`, `.idx`, `.reveal`, editorial hero, dark bands

**No component library.** Nav/footer duplicated per page. `OminoNav.init()` provides shared i18n + mobile menu.

### 1.4 Component Architecture

| Layer | Implementation |
|-------|----------------|
| Shared JS | `main/js/config.js`, `auth.js`, `order.js`, `omino-nav.js`, `omino-cookies.js`, `omino-loader.js`, `places.js` |
| Global APIs | `window.OMINO`, `window.OminoAuth`, `window.OminoNav`, `window.OminoLoader` |
| UI | Hand-written HTML + CSS; no Web Components / React |

### 1.5 State Management

| Key | Storage | Module |
|-----|---------|--------|
| `omino-lang` | localStorage | `omino-nav.js` |
| `omino.session` | localStorage | `auth.js` |
| `omino.founding.users` | localStorage | `auth.js` |
| `omino.lastOrder` | sessionStorage | `order.js` |
| `ominoCookieConsent` | localStorage | `omino-cookies.js` |
| `omino.booted` | sessionStorage | `omino-loader.js` |

Events: `omino-lang`, `omino-consent`, `omino-ready`.

### 1.6 Database

**None.** Users and orders exist only in browser storage.

### 1.7 Authentication

**File:** `main/js/auth.js`

- Local demo: SHA-256 password hash, founding cap of 50 users
- Optional remote: `OMINO_AUTH_ENDPOINT` for `/signin` and `/signup`
- Session: `{ email, business, fullname, phone, at }` in localStorage
- Google OAuth: stub only (`OMINO_GOOGLE_CLIENT_ID` unwired)
- Reset password: local-only

### 1.8 API Architecture

**No server in `main/`.** Client integrations:

- `mailto:` / WhatsApp (`main/js/config.js`)
- Optional auth `fetch` POST
- Card checkout: UI only, no charge API

### 1.9 Server / Client Boundaries

100% client-side. Optional backend via globals not defined in repo.

### 1.10 Existing Modules & Business Entities

| Entity | Source | Fields |
|--------|--------|--------|
| User | `auth.js` | email, business, fullname, phone, salt, hash |
| Session | `auth.js` | email, business, fullname, phone, at |
| Plan | `config.js` | starter / pro / business (monthly + yearly prices) |
| Order | `order.js` | ref, plan, billing, contact, address, payment method |
| Contact | `config.js` | hello@omino.ps, WhatsApp 970599000000 |

### 1.11 Business OS Placeholder (`app.html`)

`main/app.html` is a **temporary authenticated shell** — not the marketing site, not the final Business OS.

- Session-gated welcome screen only
- Will be **fully replaced** by greenfield `/app` (Next.js or similar)
- Must not receive marketing nav, GSAP hero, or editorial layout patterns
- Future `/app` gets its own app shell (sidebar, module nav) — see §0.2

### 1.12 Marketing Navigation

`main/js/omino-nav.js`: i18n (`data-i18n`), RTL, mobile menu with scroll lock, `.scrolled` nav state.

Primary links: Product → `#business`, AI → `#ai`, Pricing → `#pricing`, About, Login, Start for free.

**This navigation is marketing-only.** The Business OS at `/app` will use a separate module sidebar.

### 1.13 Product Vision Document

`main/OMINO_README.md` defines the target product (AI Business OS, MENA-first, modules: POS, Store, Inventory, CRM, Payments, Analytics, AI Agents). **This is specification, not implementation.**

---

## 2. Repository Analysis

### 2.1 caratflow-main

**Stack:** Turborepo monorepo — NestJS 11 API, Next.js 15 admin + storefront, Expo mobile, Prisma 6 / MySQL, tRPC, BullMQ, Redis, Meilisearch.

**Strengths for OMINO:**
- Production-grade **multi-tenant ERP module layout** (27 domain routers)
- **Event-driven cross-module workflows** (BullMQ, no cross-imports)
- **POS + retail + inventory + CRM + finance** in one system
- **TenantAwareService** pattern (`tenantId` on every query)
- Split Prisma schemas per domain (~166 models)
- Integer money storage, shared `@caratflow/ui` design system (shadcn/Tailwind)

**Weaknesses for OMINO:**
- Jewelry/India-specific domain (girvi, HUID, karat) — wrong vertical
- Massive scope (~191 admin pages) — overkill for MVP
- MySQL + NestJS + tRPC — different stack than current OMINO

**Key paths:**
- `omino/caratflow-main/apps/api/src/trpc/trpc.router.ts`
- `omino/caratflow-main/apps/api/src/event-bus/event-bus.service.ts`
- `omino/caratflow-main/packages/db/prisma/schema/`
- `omino/caratflow-main/packages/shared-types/src/events.ts`
- `omino/caratflow-main/docs/architecture.md`

---

### 2.2 genix-main

**Stack:** Go 1.27 monolith, SvelteKit 5 frontend, ScyllaDB (custom ORM), Qdrant vectors, OpenRouter LLM.

**Strengths for OMINO:**
- **AI agent that operates the live ERP UI** via browser bridge (`get_page`, `navigate`, `invoke_batch`)
- Full ERP domains: sales/POS, logistics/inventory, finance, business/customers
- **Tool-calling loop** with discovery planner (`backend/agent/discovery/planner.go`)
- Multi-tenant `empresa_id` partition
- Delta-sync client cache pattern

**Weaknesses for OMINO:**
- GPL v3 license — **cannot import code directly** into proprietary OMINO
- ScyllaDB + custom ORM — exotic for OMINO team
- Pre-alpha; storefront incomplete
- Go/Svelte stack conflicts with likely Next.js direction

**Key paths:**
- `omino/genix-main/backend/agent/chat_loop.go`
- `omino/genix-main/backend/agent/llm/prompts.go`
- `omino/genix-main/backend/agent/discovery/planner.go`
- `omino/genix-main/backend/sales/` (POS)
- `omino/genix-main/backend/logistics/types/product-stock.go`
- `omino/genix-main/frontend/core/agent/`

---

### 2.3 multi-agent-business-os-main

**Stack:** FastAPI, LangGraph, Celery, PostgreSQL, FAISS RAG, Flutter mobile.

**Strengths for OMINO:**
- **Modular AI agent architecture** — one capability = router + service + graph + worker
- **LangGraph supervisor pattern** for multi-step business actions
- Workspace-scoped RAG pipeline (ingest → chunk → embed → retrieve)
- Sync vs async split (fast chat inline, heavy jobs to Celery)
- Clear agent modules: research, invoice extraction, meeting summarizer, report generator

**Weaknesses for OMINO:**
- Flutter-only client — no web dashboard
- No commerce/POS/ERP — AI platform only
- FAISS per-workspace — needs production hardening for OMINO scale

**Key paths:**
- `omino/multi-agent-business-os-main/backend/app/agents/multi_agent.py`
- `omino/multi-agent-business-os-main/backend/app/agents/research_agent.py`
- `omino/multi-agent-business-os-main/backend/app/services/rag/`
- `omino/multi-agent-business-os-main/backend/app/workers/celery_app.py`
- `omino/multi-agent-business-os-main/docs/ARCHITECTURE.md`

---

### 2.4 Nexus-ERP-main

**Stack:** Next.js 16 client, Express + Prisma, Spring Boot identity layer, PostgreSQL 15.

**Strengths for OMINO:**
- **Closest stack overlap** to a modern OMINO app (Next.js + Node API + Postgres)
- **Tenant-scoped JWT** with `tenantId` on all queries
- ERP modules: inventory, CRM, HR, finance, POS, workflows, audit logs
- AI routes with Gemini (`server/src/routes/ai.js`)
- Dashboard layout with role-based nav (`client/src/app/dashboard/layout.tsx`)
- Shop storefront per tenant domain

**Weaknesses for OMINO:**
- **Dual backend** (Spring + Express) with parallel user tables — architectural debt
- Permissions matrix in-memory only (lost on restart)
- No dedicated reports module
- Demo-quality; inconsistent Express route enforcement

**Key paths:**
- `omino/Nexus-ERP-main/server/prisma/schema.prisma`
- `omino/Nexus-ERP-main/server/src/middleware/auth.js`
- `omino/Nexus-ERP-main/server/src/routes/inventory.js`
- `omino/Nexus-ERP-main/server/src/routes/shop.js` (POS + storefront)
- `omino/Nexus-ERP-main/client/src/app/dashboard/layout.tsx`

---

### 2.5 spree-main

**Stack:** Ruby on Rails 8.1 (`spree_core`, `spree_api`), TypeScript monorepo (SDK, React Dashboard), headless commerce API v3.

**Strengths for OMINO:**
- **Best-in-class commerce domain model** (Cart/Order separation, Product/Variant, StockLevel, Fulfillment)
- Headless API-first with OpenAPI + TypeScript SDKs + Zod validation
- **Event-driven architecture** (`Spree::Events`) for webhooks and automation
- **Workflow pattern** for multi-step business processes
- Multi-tenant Store, Channel, Market, Seller (marketplace-ready)
- Payment session abstraction (provider-agnostic)
- B2B primitives (companies, catalogs, price lists)
- Built-in agent tooling (`@spree/cli`, agent skills)

**Weaknesses for OMINO:**
- Ruby/Rails — **cannot merge into JS stack**
- Massive (200+ models, 258 migrations) — reference only
- Storefront is external repo (Next.js separate)

**Key paths:**
- `omino/spree-main/spree/core/app/models/spree/`
- `omino/spree-main/spree/core/app/services/spree/`
- `omino/spree-main/spree/core/lib/spree/events.rb`
- `omino/spree-main/spree/core/lib/spree/workflow.rb`
- `omino/spree-main/spree/api/config/routes.rb`
- `omino/spree-main/packages/sdk/`

---

## 3. Feature Classification (A / B / C / D)

### Legend
- **A — MUST IMPORT:** Pattern or small adapter worth carrying into OMINO design (not blind copy)
- **B — SHOULD REBUILD:** Concept is right; implement fresh in OMINO stack
- **C — ARCHITECTURAL REFERENCE:** Study domain model / API shape only
- **D — DO NOT USE:** Wrong stack, license, vertical, or quality

| Feature | Best source | Class | Rationale |
|---------|-------------|-------|-----------|
| OMINO brand / marketing UI | `main/` (excluding `app.html`) | **A (keep)** | Primary public site — do not replace |
| Design tokens (Archivo, editorial) | `main/css/omino.css` | **A (keep)** | Shared brand; separate layout components |
| Marketing ↔ App separation | §0 Product Surfaces | **A (locked)** | `/main` ≠ `/app` |
| Founding signup flow (concept) | `main/login.html`, `auth.js` | **B** | Rebuild at `/signup` with real backend |
| Onboarding wizard | *(not built)* | **B** | New `/onboarding` route |
| Business OS app shell | Nexus `dashboard/layout.tsx` | **B** | New `/app` only — not marketing |
| Multi-tenant org model | Nexus, CaratFlow, Spree Store | **B** | Rebuild `Organization` + `tenantId` |
| JWT auth + RBAC | Nexus `auth.js`, CaratFlow `auth/` | **B** | Single auth layer, not dual Spring+Express |
| Product / Variant / SKU | Spree `product.rb`, `variant.rb` | **C** | Gold-standard domain shape |
| Cart → Order checkout | Spree Cart/Order split | **C** | Immutable order after completion |
| Stock levels + movements | Spree `stock_level.rb`, CaratFlow inventory | **C** | Ledger pattern |
| POS sale flow | CaratFlow `retail/`, Nexus `shop.js` | **C** | Event-driven sale → inventory |
| CRM customers + deals | Nexus `crm.js`, Spree `customer.rb` | **B** | Simpler than Spree B2B for MVP |
| Payments (platform fee) | `main/config.js` + Spree PaymentSession | **B** | OMINO 0.3%–0.5% + provider plugin |
| AI chat with business context | genix `chat_loop.go`, multi-agent `chat.py` | **B** | OMINO-specific prompts + tools |
| AI tool registry | genix `llm/prompts.go`, multi-agent `tools.py` | **B** | `get_metrics`, `recommend_action`, etc. |
| LangGraph orchestration | multi-agent `multi_agent.py` | **C** | Pattern for approval workflows |
| RAG over business docs | multi-agent `services/rag/` | **B** | Workspace/org-scoped knowledge |
| Agent operates UI | genix browser bridge | **C** | Inspire OMINO in-app agent, not copy |
| Event bus (domain events) | CaratFlow `event-bus.service.ts`, Spree `events.rb` | **B** | BullMQ or in-process events |
| tRPC internal API | CaratFlow `trpc.router.ts` | **C** | Type-safe internal API pattern |
| REST + OpenAPI public API | Spree API v3, CaratFlow Swagger | **B** | Headless + agent access |
| Dashboard shell + nav | Nexus `dashboard/layout.tsx`, CaratFlow `web/app` | **B** | **`/app` only** — separate from marketing nav |
| Audit logs | Nexus `audit.js`, CaratFlow `AuditLog` | **B** | Required for business OS |
| Workflow approvals | Nexus `workflows.js` | **B** | PO/leave pattern → OMINO actions |
| Jewelry / India compliance | CaratFlow `india/`, `compliance/` | **D** | Wrong vertical |
| ScyllaDB / genix-orm | genix-main | **D** | Wrong DB stack |
| GPL agent code | genix-main | **D** | License conflict |
| Spring Boot identity layer | Nexus `backend/` | **D** | Dual-backend anti-pattern |
| Flutter mobile client | multi-agent `mobile/` | **D** | OMINO is web-first |
| Full Spree Rails monolith | spree-main Ruby | **D** | Wrong runtime; use as domain reference |

---

## 4. Conflicts Between Repositories

| Dimension | caratflow | genix | multi-agent | Nexus-ERP | spree | **OMINO should keep** |
|-----------|-----------|-------|-------------|-----------|-------|----------------------|
| Backend language | TypeScript/NestJS | Go | Python | JS + Java | Ruby | **TypeScript/Node** (aligns with Next.js ecosystem) |
| Frontend | Next.js 15 | SvelteKit 5 | Flutter | Next.js 16 | React Dashboard | **Next.js** + **OMINO design tokens** from `main/` |
| Database | MySQL | ScyllaDB | PostgreSQL | PostgreSQL | PostgreSQL | **PostgreSQL** (broadest reference overlap) |
| ORM | Prisma 6 | Custom Scylla ORM | SQLAlchemy | Prisma 5 | ActiveRecord | **Prisma** |
| API style | tRPC + REST | Custom handlers | REST OpenAPI | REST Express | REST v3 + SDK | **REST (public) + tRPC or RPC (internal)** |
| Auth | JWT + RBAC | Token + YAML ACL | JWT | JWT (dual issuers!) | API keys + JWT | **Single JWT issuer**, org-scoped |
| Multi-tenancy | `tenantId` | `empresa_id` | `workspace_id` | `tenantId` | `store_id` | **`organizationId`** (OMINO term) |
| State (client) | Zustand + TanStack Query | Svelte stores | Riverpod | Zustand + TanStack Query | TanStack Query | **TanStack Query + minimal Zustand** |
| Styling | Tailwind + shadcn | Tailwind v4 | Material | Tailwind 4 | Tailwind + shadcn | **Tailwind + shadcn** styled with **OMINO tokens** |
| AI runtime | Recommendations module | Embedded agent loop | LangGraph + Celery | Gemini routes | Agent CLI/skills | **Dedicated AI service layer** (LangGraph or custom), approval-gated |
| Background jobs | BullMQ | Exec/cron | Celery | node-cron | ActiveJob | **BullMQ** (aligns with NestJS/CaratFlow pattern) |
| License | Proprietary | GPL v3 | MIT | Unknown | BSD/MIT | **Proprietary OMINO** — no GPL imports |

**Critical conflict:** Five repos cannot share one runtime. OMINO must **standardize on one greenfield stack** and treat all five as **read-only intelligence sources**.

**OMINO must preserve:** `main/` marketing brand, design language, copy, and bilingual UX patterns.

---

## 5. Target OMINO Architecture

```
OMINO/
├── apps/
│   ├── marketing/              # Next.js — public site (migrate from main/); routes /main/*
│   ├── app/                    # Next.js — authenticated Business OS; routes /app/*
│   ├── api/                    # NestJS or Fastify — modular monolith
│   └── worker/                 # BullMQ jobs (ingest, AI, webhooks, reports)
├── packages/
│   ├── db/                     # Prisma schema (split by domain)
│   ├── ui/                     # OMINO design system (tokens from main/css/omino.css)
│   ├── shared-types/           # Zod schemas, domain events
│   ├── sdk/                    # Typed client for Store/Admin API
│   └── ai/                     # Agents, tools, prompts (isolated package)
└── main/                       # LEGACY static site (live until apps/marketing parity)
```

**Two Next.js apps, one monorepo.** `apps/marketing` and `apps/app` share `@omino/ui` tokens but have **different layouts, navigation, and route guards**. Do not merge them into a single dashboard shell.

### Module map

```
OMINO Platform
├── Core                    # Config, feature flags, audit, file storage
├── Organizations           # Tenant boundary, settings, markets (MENA)
├── Users                   # Accounts, profiles, sessions
├── Roles & Permissions     # RBAC matrix (persisted, not in-memory)
├── POS                     # In-store sales, receipts, cash drawer
├── Store                   # Online catalog, cart, checkout (headless)
├── Products                # SKU, variants, categories, pricing
├── Inventory               # Stock levels, movements, reservations, alerts
├── Orders                  # Immutable orders post-checkout; returns
├── Customers / CRM         # Profiles, segments, WhatsApp thread link
├── Payments                # Provider plugins; OMINO platform fee 0.3%–0.5%
├── Analytics               # Revenue, profit, trends, vertical KPIs
├── Automation              # Rules, triggers, scheduled jobs
├── AI Agents               # Business agent, approval workflows
├── AI Tools                # query_sales, stock_alert, recommend_action, …
├── Workflows               # Multi-step approvals (refunds, PO, AI actions)
├── Notifications           # Email, WhatsApp, in-app
├── Integrations            # Instagram, payment providers, export
└── Settings                # Org, billing, locales, founding pricing lock
```

### Principles
1. **Two surfaces, one brand** — `/main` (marketing) and `/app` (Business OS) are separate products; share tokens via `@omino/ui`, not layouts or nav
2. **One design system** — extend `main/css/omino.css` tokens into `@omino/ui`; marketing uses editorial components, app uses dense data UI
3. **API-first** — every module exposed via versioned REST; agents use same API as UI
4. **Org-scoped everything** — `organizationId` on all tenant data
5. **Cart ≠ Order** — mutable cart, immutable order (from Spree 6.0)
6. **AI never acts without approval** — recommend → approve → execute (from OMINO_README)
7. **Events over imports** — modules publish domain events; no cross-module direct DB access (from CaratFlow/Spree)

---

## 6. Database Strategy

**Primary:** PostgreSQL 16+

**ORM:** Prisma with **split schema files** (pattern from `caratflow-main/packages/db/prisma/schema/`)

**Proposed schema files:**
- `core.prisma` — Organization, User, Role, Permission, AuditLog
- `catalog.prisma` — Product, Variant, Category, Price
- `inventory.prisma` — StockLocation, StockLevel, StockMovement
- `commerce.prisma` — Cart, Order, LineItem, Fulfillment
- `crm.prisma` — Customer, Segment, Interaction
- `payments.prisma` — Payment, PaymentMethod, PlatformFee
- `ai.prisma` — AgentSession, Message, ToolRun, Approval
- `automation.prisma` — Rule, Trigger, Job

**Conventions:**
- UUID primary keys
- `organizationId` on all tenant tables
- Money as integer minor units
- Soft delete where appropriate
- `metadata` JSON for extensibility (Spree pattern)
- Public IDs with prefixes (`ord_`, `prod_`, `cus_`) for agent-friendly APIs

**Do not:** Run five databases or import Scylla/MySQL schemas verbatim.

---

## 7. AI Architecture

```
┌─────────────────────────────────────────────────────────┐
│  OMINO App (Next.js)                                     │
│  Chat panel │ Approval cards │ Context from current page │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  AI Service (packages/ai)                                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Orchestrator│  │ Tool Registry │  │ Prompt templates│ │
│  │ (LangGraph  │  │ (business API│  │ (EN/AR, OMINO   │ │
│  │  or custom) │  │  wrappers)   │  │  voice)         │ │
│  └─────────────┘  └──────────────┘  └─────────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   OMINO REST API      Vector DB (RAG)     LLM Provider
   (same as UI)        per organization    (OpenAI / etc.)
```

**Patterns to adopt:**
- **genix:** Tool-calling loop with business context; UI-aware commands (rebuild, not GPL code)
- **multi-agent:** Supervisor graph for multi-step tasks; Celery for heavy jobs
- **Spree:** Agent-friendly prefixed IDs and OpenAPI for tool definitions

**OMINO-specific rules:**
- Tools read live business data via API — never hallucinate numbers
- All write actions require explicit user approval
- Conversation + tool runs stored per `organizationId` + `userId`
- Arabic prompts use Zain/IBM Plex Sans Arabic tone — not translated English

---

## 8. Commerce Architecture

**Reference:** Spree 6.0 Cart/Order model (`omino/spree-main/spree/core/app/models/spree/cart.rb`, `order.rb`)

| Stage | Entity | Mutability |
|-------|--------|------------|
| Browse | Product, Variant | Read |
| Shop | Cart, LineItem | Mutable |
| Checkout | Cart + PaymentSession | Mutable until complete |
| Complete | Order (immutable) | Read + fulfillment actions |
| Post-sale | Fulfillment, Return | Workflow-driven |

**Storefront:** Headless — Next.js storefront app consuming OMINO Store API (like Spree SDK pattern).

**POS:** Shares Product/Inventory/Order modules; channel = `pos` (Spree Channel pattern).

**Founding pricing:** Lock plan price on Organization while active (from `main/config.js` + `OMINO_README.md`).

---

## 9. POS Architecture

**References:** CaratFlow `retail/`, Nexus `shop.js` POS routes, genix `sales/`

```
POS Terminal (web, tablet)
    → POST /api/v1/pos/sales
    → Event: sale.completed
        → Inventory: decrement stock
        → Payments: record tender
        → CRM: update customer LTV
        → Analytics: aggregate metrics
        → AI: optional insight subscriber
```

**MVP scope:** Product search, cart, cash/card tender, receipt, offline-tolerant queue (phase 2).

---

## 10. Multi-Tenant Strategy

**Model:** Shared database, shared schema, row-level isolation via `organizationId`.

| Concern | Approach |
|---------|----------|
| Isolation | JWT claim `organizationId`; middleware rejects cross-tenant access |
| Onboarding | Signup creates Organization + Owner user (extend `main/login.html` flow) |
| Founding 50 | Cap at org creation; lock pricing on `Organization.foundingPlan` |
| Markets | `Market` entity for Palestine → MENA expansion (Spree Market pattern) |
| Storefront | Subdomain or path: `{org}.omino.ps` or `/s/{slug}` |
| Data export | Per-org export job (GDPR / business portability) |

**Avoid:** Nexus dual `users`/`tenants` tables; in-memory permission matrix.

---

## 11. Security Considerations

| Area | Requirement |
|------|-------------|
| Auth | Single JWT issuer; refresh tokens; httpOnly cookies for web |
| Passwords | bcrypt/argon2 server-side (replace client SHA-256 demo) |
| RBAC | Persisted roles + permissions; not hardcoded in layout.tsx |
| Tenant | Never accept `organizationId` from request body — JWT only |
| AI | Tool calls scoped to org; no cross-tenant RAG retrieval |
| Payments | PCI via provider tokens only; no raw card storage |
| Audit | Log auth, permission changes, AI approvals, payment events |
| Secrets | Env-based; never in `main/js/config.js` client bundle |
| Rate limit | On auth and AI endpoints (multi-agent pattern) |

---

## 12. Migration Strategy

### Phase 0 — Preserve (now)
- Keep `main/` static site live on Vercel
- Keep `omino/` as read-only reference (add to `.gitignore` for deploy if needed)
- No merges from reference repos into `main/`

### Phase 1 — Foundation (weeks 1–4)
- Initialize monorepo (`apps/api`, `apps/app`, `packages/db`, `packages/ui`)
- Port design tokens from `main/css/omino.css` → `@omino/ui`
- PostgreSQL + Prisma: Organization, User, Role, Session
- Replace `auth.js` localStorage with real API
- Greenfield `/app` shell replaces `app.html` placeholder
- **Do not migrate or redesign** `main/` marketing pages in this phase

### Phase 2 — Commerce core (weeks 5–10)
- Products, Inventory, Cart, Order (Spree-informed models)
- Checkout API replaces `order.js` sessionStorage flow
- Founding pricing + cap from `auth.js` logic

### Phase 3 — POS + CRM (weeks 11–16)
- POS module, Customer CRM, basic Analytics dashboard

### Phase 4 — AI layer (weeks 17–22)
- Agent chat, tool registry, approval workflow
- RAG for org documents; morning briefing / insights

### Phase 5 — Marketing migration (weeks 23–26, optional)
- Port `main/` static pages → `apps/marketing` (Next.js)
- Retire static `main/` only when visual/UX parity is verified
- `/app` Business OS is unaffected; marketing migration is a separate deploy surface

---

## 13. Implementation Phases (Summary)

| Phase | Deliverable | Primary reference |
|-------|-------------|-------------------|
| 0 | This audit + matrix | — |
| 1 | Monorepo, auth, org, `/app` shell | Nexus auth, CaratFlow tenant pattern |
| 2 | Products, inventory, orders, payments | Spree models, CaratFlow events |
| 3 | POS, CRM, analytics v1 | CaratFlow retail, Nexus CRM |
| 4 | AI agents + automation | multi-agent, genix (patterns only) |
| 5 | Marketing site in `apps/marketing` | `main/` (preserve design; `/main` stays live) |

---

## 14. Files Analyzed (Inventory)

### Current OMINO (`main/`) — 23 runtime files
- `main/index.html`, `about.html`, `login.html`, `app.html`, `checkout.html`, `confirm.html`, `contact.html`, `faq.html`, `privacy.html`, `terms.html`
- `main/css/omino.css`
- `main/js/config.js`, `auth.js`, `order.js`, `places.js`, `omino-nav.js`, `omino-cookies.js`, `omino-loader.js`
- `main/OMINO_README.md`, `README.md`

### Reference repos — sampled key paths (not exhaustive; ~8,400+ files in `omino/`)
- **caratflow-main:** ~500+ source files under `apps/`, `packages/`
- **genix-main:** ~300+ under `backend/`, `frontend/`
- **multi-agent-business-os-main:** ~80+ under `backend/app/`
- **Nexus-ERP-main:** ~150+ under `client/`, `server/`, `backend/`
- **spree-main:** ~7,000+ (full Spree Commerce monorepo)

---

## 15. Files Recommended for Extraction (Patterns Only)

See `OMINO-EXTRACTION-MATRIX.md` for the full table.

**High-priority study paths:**
- Spree: `spree/core/app/models/spree/{cart,order,product,variant,stock_level}.rb`
- CaratFlow: `event-bus/event-bus.service.ts`, `packages/db/prisma/schema/core.prisma`
- Nexus: `server/prisma/schema.prisma`, `server/src/middleware/auth.js`
- multi-agent: `backend/app/agents/multi_agent.py`, `backend/app/services/rag/`
- genix: `backend/agent/llm/prompts.go`, `backend/agent/chat_loop.go` (pattern only — GPL)

---

## 16. Files That Must NOT Be Touched

| Path | Reason |
|------|--------|
| `main/index.html` (until Phase 5) | Live marketing; brand-critical |
| `main/css/omino.css` | Design system source of truth |
| `main/js/omino-nav.js` | Shared i18n/menu; works across pages |
| `main/login.html` | Recently refined auth UX |
| `omino/**` (entire tree) | Reference only — do not modify or merge |
| `vercel.json` | Production routing |

---

## 17. Dependencies That May Be Reused (Greenfield)

| Package / Tool | From | Use in OMINO |
|----------------|------|--------------|
| Next.js 15+ | caratflow, Nexus | `apps/marketing` + `apps/app` |
| NestJS 11 | caratflow | `apps/api` |
| Prisma 6 | caratflow, Nexus | `packages/db` |
| BullMQ | caratflow | `apps/worker` |
| TanStack Query | caratflow, Nexus | Client data fetching |
| Zod | caratflow `shared-types` | Validation |
| shadcn/ui + Tailwind | caratflow | UI primitives (OMINO-themed) |
| LangGraph | multi-agent | AI orchestration |
| GSAP | `main/index.html` | Marketing motion (keep) |

**Do not reuse:** Rails, Go/genix-orm, ScyllaDB, Flutter, Spring Boot, GPL genix code.

---

## 18. Architecture Decisions (Locked for Next Phase)

1. **`/main` ≠ `/app`** — marketing website and Business OS are separate products, layouts, and nav systems
2. **Greenfield API** — no merging of reference codebases
3. **PostgreSQL + Prisma** — single database
4. **TypeScript monorepo** — Turborepo (CaratFlow pattern)
5. **Preserve OMINO brand** — tokens and copy from `main/`; marketing URL stays live through Phase 1–4
6. **Headless commerce** — Spree-informed domain, OMINO API
7. **AI approval gate** — non-negotiable from product spec
8. **`organizationId` tenancy** — one term across all modules
9. **Marketing stays static** until `apps/app` is production-ready; marketing migration is Phase 5 only

---

---

## 19. Phase 0 Deliverables (Complete)

| Document | Purpose |
|----------|---------|
| `OMINO-ARCHITECTURE-AUDIT.md` | This file — current state + repository analysis |
| `OMINO-EXTRACTION-MATRIX.md` | File-level feature mapping with recommendations |
| `OMINO-TARGET-ARCHITECTURE.md` | Greenfield module design + monorepo structure |
| `OMINO-DATABASE-BLUEPRINT.md` | Conceptual schema, entities, RLS requirements |
| `OMINO-AI-ARCHITECTURE.md` | Agent orchestrator, tools, approvals, RAG |
| `OMINO-DEPENDENCY-CONFLICTS.md` | Stack conflicts and locked technology choices |
| `OMINO-IMPLEMENTATION-ROADMAP.md` | Phased build sequence to launch |

*End of audit. No application code was modified.*
