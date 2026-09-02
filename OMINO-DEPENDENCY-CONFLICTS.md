# OMINO — Dependency & Conflict Analysis

**Date:** 2026-09-01  
**Scope:** Current OMINO (`main/`) vs five reference repositories  
**Purpose:** Identify conflicts and lock OMINO's technology choices before implementation

---

## Executive Summary

The five reference repositories represent **five incompatible runtimes** (NestJS/Next.js, Go/SvelteKit, Python/FastAPI/Flutter, Express/Spring/Next.js, Ruby/Rails). OMINO cannot merge any of them. The recommended stack aligns with **CaratFlow + Nexus** patterns (TypeScript, Next.js, PostgreSQL, Prisma) while extracting **domain concepts** from Spree (commerce), **AI patterns** from genix and multi-agent, and **automation patterns** from CaratFlow.

---

## Conflict Matrix

| Dimension | caratflow-main | genix-main | multi-agent-business-os | Nexus-ERP-main | spree-main | **OMINO choice** |
|-----------|----------------|------------|-------------------------|----------------|------------|------------------|
| Backend language | TypeScript (NestJS 11) | Go 1.27 | Python (FastAPI) | JS (Express) + Java (Spring) | Ruby (Rails 8.1) | **TypeScript (NestJS or Fastify)** |
| Frontend | Next.js 15, React 19 | SvelteKit 5 | Flutter 3.x | Next.js 16, React 19 | React Dashboard (TS) | **Next.js 15+, React 19** |
| Current OMINO | Static HTML/JS | — | — | — | — | **Preserve `main/` until Phase 15** |
| Database | MySQL 8 | ScyllaDB | PostgreSQL 16 | PostgreSQL 15 | PostgreSQL (Rails) | **PostgreSQL 16** |
| ORM | Prisma 6 | Custom Scylla ORM | SQLAlchemy 2 | Prisma 5 | ActiveRecord | **Prisma 6** |
| API style | tRPC + REST | Custom handlers | REST OpenAPI | REST Express | REST v3 + SDK | **REST (public) + tRPC (internal)** |
| Auth | JWT + RBAC | Token + YAML ACL | JWT | JWT (dual issuers!) | API keys + JWT | **Single JWT issuer** |
| Multi-tenancy key | `tenantId` | `empresa_id` | `workspace_id` | `tenantId` | `store_id` | **`organizationId`** |
| State (client) | Zustand + TanStack Query | Svelte stores | Riverpod | Zustand + TanStack Query | TanStack Query | **TanStack Query + Zustand** |
| Styling | Tailwind + shadcn | Tailwind v4 | Material | Tailwind 4 | Tailwind + shadcn | **Tailwind + shadcn + OMINO tokens** |
| AI runtime | Recommendations module | Embedded agent loop | LangGraph + Celery | Gemini routes | Agent CLI/skills | **LangGraph or custom + BullMQ** |
| Background jobs | BullMQ + Redis | Exec/cron | Celery + Redis | node-cron | ActiveJob | **BullMQ + Redis** |
| Vector DB | — | Qdrant | FAISS/Milvus | — | — | **pgvector (MVP) → Qdrant (scale)** |
| Mobile | Expo/React Native | — | Flutter | — | — | **Web-first; PWA later** |
| License | Proprietary | **GPL v3** | MIT | Unknown | BSD/MIT | **Proprietary OMINO** |
| Monorepo | Turborepo + pnpm | Single repo | Docker Compose | Separate client/server | Turborepo + pnpm | **Turborepo + pnpm** |

---

## Detailed Conflicts

### 1. Backend Runtime

| | |
|---|---|
| **Source** | All five repos |
| **Conflict** | Five different backend languages/runtimes cannot coexist in one deployable product |
| **Current OMINO** | No backend — client-only static site |
| **Recommended** | TypeScript monolith API (NestJS 11 pattern from CaratFlow) |
| **Reason** | Aligns with Next.js frontend, Prisma ORM, largest reference overlap (CaratFlow + Nexus), team velocity |

**Do not use:** Ruby/Rails (Spree runtime), Go (genix), Python (multi-agent as primary API), Spring Boot (Nexus dual-backend)

---

### 2. Frontend Framework

| | |
|---|---|
| **Source** | caratflow (Next.js 15), genix (SvelteKit 5), multi-agent (Flutter), Nexus (Next.js 16), spree (React Dashboard) |
| **Conflict** | Four different UI frameworks |
| **Current OMINO** | Vanilla HTML/CSS/JS — no framework |
| **Recommended** | Next.js 15+ App Router for `/app` Business OS; preserve static `main/` until migration |
| **Reason** | Nexus and CaratFlow both use Next.js; App Router supports marketing + app in one `apps/web` eventually |

**Do not use:** SvelteKit (genix), Flutter (multi-agent), copying Spree Dashboard UI

---

### 3. React Version

| | |
|---|---|
| **Source** | CaratFlow React 19, Nexus React 19.2.4 |
| **Conflict** | Minor — both on React 19 |
| **Current OMINO** | No React |
| **Recommended** | React 19 |
| **Reason** | Latest stable; both primary TS references agree |

---

### 4. Next.js Version

| | |
|---|---|
| **Source** | CaratFlow Next.js 15, Nexus Next.js 16.2.10 |
| **Conflict** | Version mismatch between references |
| **Current OMINO** | No Next.js |
| **Recommended** | Next.js 15 LTS at project start; upgrade to 16 when stable |
| **Reason** | CaratFlow is more production-complete; avoid bleeding edge for MVP |

---

### 5. Database

| | |
|---|---|
| **Source** | CaratFlow MySQL, genix ScyllaDB, multi-agent/Nexus/Spree PostgreSQL |
| **Conflict** | Three different database engines |
| **Current OMINO** | No database (localStorage only) |
| **Recommended** | PostgreSQL 16 |
| **Reason** | Three of five repos use Postgres; best Prisma support; pgvector for AI RAG MVP |

**Do not use:** MySQL (CaratFlow-specific), ScyllaDB (genix exotic ORM)

---

### 6. ORM

| | |
|---|---|
| **Source** | CaratFlow Prisma 6, Nexus Prisma 5, genix custom ORM, Spree ActiveRecord, multi-agent SQLAlchemy |
| **Conflict** | Four ORM approaches |
| **Current OMINO** | None |
| **Recommended** | Prisma 6 with split schema files |
| **Reason** | CaratFlow's 25-file schema split is the best pattern for OMINO's module count |

---

### 7. API Architecture

| | |
|---|---|
| **Source** | CaratFlow tRPC+REST, Spree REST v3+SDK, Nexus REST Express, multi-agent REST OpenAPI |
| **Conflict** | tRPC vs pure REST vs OpenAPI-first |
| **Current OMINO** | Optional `fetch` to `OMINO_AUTH_ENDPOINT` only |
| **Recommended** | REST v1 (public, OpenAPI, SDK) + tRPC (internal web app) |
| **Reason** | Spree's headless API + SDK pattern for storefront/agents; tRPC for type-safe admin UI |

---

### 8. Authentication

| | |
|---|---|
| **Source** | Nexus dual JWT (Spring + Express), CaratFlow JWT+refresh, genix token+YAML, multi-agent JWT, main localStorage SHA-256 |
| **Conflict** | Nexus has **two user tables and two JWT issuers** — identity fragmentation |
| **Current OMINO** | Client-side SHA-256 + localStorage (`main/js/auth.js`) |
| **Recommended** | Single JWT issuer, httpOnly refresh cookies, bcrypt server-side, org-scoped claims |
| **Reason** | Nexus dual-backend is an anti-pattern; OMINO must have one auth source of truth |

**Do not use:** Nexus Spring Boot layer, client-side password hashing, dual user tables

---

### 9. Multi-Tenancy Terminology

| | |
|---|---|
| **Source** | `tenantId`, `empresa_id`, `workspace_id`, `store_id` |
| **Conflict** | Four different names for the same concept |
| **Current OMINO** | `business` field in localStorage session |
| **Recommended** | `organizationId` everywhere (OMINO product term) |
| **Reason** | Clear product language; maps to User → Organization → Store → Branch hierarchy |

---

### 10. RBAC / Permissions

| | |
|---|---|
| **Source** | Nexus in-memory matrix (lost on restart), CaratFlow persisted Permission model, Spree CanCanCan |
| **Conflict** | Nexus permissions are ephemeral |
| **Current OMINO** | No RBAC |
| **Recommended** | Persisted `roles` + `permissions` + `role_permissions` tables |
| **Reason** | Business OS requires durable permission changes and audit |

**Do not use:** Nexus `admin.js` `tenantMatrixStore`

---

### 11. Commerce Domain Model

| | |
|---|---|
| **Source** | Spree Cart/Order split vs Nexus flat Product.stock vs CaratFlow Sale model |
| **Conflict** | Spree has mutable Cart → immutable Order; Nexus deducts stock directly on invoice |
| **Current OMINO** | `order.js` sessionStorage checkout (no real orders) |
| **Recommended** | Spree-informed Cart → Order with immutable placement |
| **Reason** | Industry best practice; prevents order tampering; supports POS + web channels |

---

### 12. Inventory Model

| | |
|---|---|
| **Source** | Spree Variant→StockLevel per StockLocation; Nexus flat `Product.stock`; CaratFlow StockMovement ledger |
| **Conflict** | Flat stock vs ledger vs location-scoped |
| **Current OMINO** | None |
| **Recommended** | Variant → StockLevel per Warehouse + immutable StockMovement ledger |
| **Reason** | Combines Spree's location model with CaratFlow's movement audit trail |

---

### 13. AI Architecture

| | |
|---|---|
| **Source** | genix UI-automation agent (GPL), multi-agent LangGraph+RAG (no approvals), Nexus Gemini routes (simple), CaratFlow chatbot (jewelry FAQ) |
| **Conflict** | UI-driven vs API-tool-driven vs simple LLM calls |
| **Current OMINO** | Product spec only (`OMINO_README.md`) |
| **Recommended** | API-tool agent with approval gates; genix discovery pattern; multi-agent orchestration |
| **Reason** | OMINO requires business actions with approval — neither genix nor multi-agent alone suffices |

**Do not use:** genix GPL code, multi-agent without approval layer, Nexus simple Gemini forecast

---

### 14. AI License

| | |
|---|---|
| **Source** | genix-main is **GPL v3** |
| **Conflict** | Cannot import genix Go code into proprietary OMINO |
| **Current OMINO** | Proprietary |
| **Recommended** | Study genix patterns only; reimplement in TypeScript |
| **Reason** | Legal requirement — patterns are fine, code is not |

---

### 15. Background Jobs

| | |
|---|---|
| **Source** | CaratFlow BullMQ, multi-agent Celery, Nexus node-cron, Spree ActiveJob |
| **Conflict** | Three job systems |
| **Current OMINO** | None |
| **Recommended** | BullMQ + Redis |
| **Reason** | Aligns with NestJS/Node stack; CaratFlow has production event bus on BullMQ |

---

### 16. Vector / RAG Store

| | |
|---|---|
| **Source** | genix Qdrant, multi-agent FAISS per workspace |
| **Conflict** | Different vector stores and isolation models |
| **Current OMINO** | None |
| **Recommended** | pgvector on PostgreSQL for MVP; migrate to Qdrant at scale |
| **Reason** | Fewer infra dependencies at launch; org-scoped namespaces in both |

---

### 17. Styling / Design System

| | |
|---|---|
| **Source** | OMINO `main/css/omino.css` (Archivo, editorial), CaratFlow shadcn, Nexus Tailwind 4, genix Tailwind v4 |
| **Conflict** | OMINO has unique editorial brand; references use generic shadcn |
| **Current OMINO** | Custom tokens in `omino.css` — live on Vercel |
| **Recommended** | `@omino/ui` package: OMINO tokens + shadcn primitives |
| **Reason** | Preserve brand identity; use shadcn for app density, OMINO tokens for color/type |

**Do not use:** Copying CaratFlow or Nexus visual design wholesale

---

### 18. State Management

| | |
|---|---|
| **Source** | CaratFlow/Nexus Zustand+TanStack Query, genix Svelte stores, multi-agent Riverpod |
| **Conflict** | Three client state approaches |
| **Current OMINO** | localStorage + custom events |
| **Recommended** | TanStack Query (server state) + minimal Zustand (UI state) |
| **Reason** | Both primary Next.js references agree |

---

### 19. Mobile

| | |
|---|---|
| **Source** | CaratFlow Expo, multi-agent Flutter |
| **Conflict** | Two mobile frameworks |
| **Current OMINO** | None |
| **Recommended** | Web-first; responsive `/app` + PWA; native mobile Phase 16+ |
| **Reason** | OMINO MVP is web; avoid parallel mobile investment |

---

### 20. Monorepo Tooling

| | |
|---|---|
| **Source** | CaratFlow/spree Turborepo+pnpm, genix single repo, Nexus separate folders |
| **Conflict** | Turborepo vs flat structure |
| **Current OMINO** | Flat static files |
| **Recommended** | Turborepo + pnpm workspaces |
| **Reason** | CaratFlow and Spree both use it; best for apps+packages layout |

---

### 21. Payment Processing

| | |
|---|---|
| **Source** | Spree PaymentSession abstraction, Nexus Razorpay, CaratFlow Razorpay webhooks, main WhatsApp manual |
| **Conflict** | Different providers and flows |
| **Current OMINO** | Manual WhatsApp/email checkout (`main/js/order.js`) |
| **Recommended** | Provider-agnostic PaymentSession pattern (Spree); Stripe + local MENA providers |
| **Reason** | OMINO 0.3%–0.5% platform fee requires abstraction layer |

---

### 22. Event System

| | |
|---|---|
| **Source** | CaratFlow BullMQ EventBus, Spree ActiveSupport::Notifications, Nexus none |
| **Conflict** | Async queue vs in-process vs none |
| **Current OMINO** | Custom DOM events only (`omino-lang`, `omino-ready`) |
| **Recommended** | BullMQ event bus with typed event catalog (CaratFlow pattern) |
| **Reason** | Required for sale→inventory→CRM automation without cross-module imports |

---

### 23. Naming Conventions

| | |
|---|---|
| **Source** | Mixed: `tenant`, `empresa`, `workspace`, `store`, `organization` |
| **Conflict** | Inconsistent tenant terminology across repos |
| **Current OMINO** | `business` in auth session |
| **Recommended** | OMINO glossary: Organization > Store > Branch; `organizationId` in code |
| **Reason** | Product clarity for MENA business owners |

---

### 24. Package.json / Dependencies

| | |
|---|---|
| **Source** | Five repos with hundreds of dependencies each |
| **Conflict** | Cannot install all five dependency trees |
| **Current OMINO** | No `package.json` |
| **Recommended** | Greenfield `package.json` per app/package; cherry-pick versions from CaratFlow |
| **Reason** | Clean dependency graph; no transitive conflicts from merged repos |

**Rule:** Do not `npm install` from reference repos into OMINO root.

---

## OMINO Stack Decision (Locked)

```
Runtime:     Node.js 20+
Monorepo:    Turborepo + pnpm
Frontend:    Next.js 15 + React 19 + Tailwind + shadcn + @omino/ui
Backend:     NestJS 11 (or Fastify) — TypeScript
Database:    PostgreSQL 16 + Prisma 6
Cache/Queue: Redis 7 + BullMQ
AI:          packages/ai — LangGraph or custom orchestrator
Vector:      pgvector (MVP)
Auth:        JWT + httpOnly refresh — single issuer
API:         REST v1 (public) + tRPC (internal)
Hosting:     Vercel (web) + API host + managed Postgres
License:     Proprietary — no GPL imports
```

---

## What Must Never Be Merged

| Repository | Forbidden |
|------------|-----------|
| spree-main | Entire Rails app, ActiveRecord models, Ruby gems |
| genix-main | Any Go source (GPL v3), ScyllaDB schemas, SvelteKit frontend |
| caratflow-main | Jewelry/India modules, MySQL-specific schemas, 191 admin pages |
| Nexus-ERP-main | Spring Boot backend, dual user tables, in-memory RBAC |
| multi-agent-business-os-main | Flutter app, Python API as primary backend |
| All | Blind copy-paste of any source file |

---

*See also: `OMINO-TARGET-ARCHITECTURE.md` §11, `OMINO-IMPLEMENTATION-ROADMAP.md`*
