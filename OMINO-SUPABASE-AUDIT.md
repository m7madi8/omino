# OMINO — Supabase Architecture Audit

**Date:** 2026-03-02  
**Status:** Foundation layer implemented; full migration in progress  
**Auditor:** OMINO engineering (automated codebase audit)

---

## Executive Summary

OMINO currently runs on **PostgreSQL + Prisma + NextAuth + local filesystem storage**. There was **zero Supabase integration** in the codebase before this audit (no `@supabase/*` packages, no env vars, no Supabase client utilities).

This document records the **as-is architecture**, gaps vs. the target Supabase-first SaaS model, and the **phased migration plan** already started in this branch.

| Capability | Current State | Target State |
|------------|---------------|--------------|
| Database | Docker Postgres + Prisma | Supabase PostgreSQL (Prisma-compatible) |
| Auth | NextAuth credentials + JWT | Hybrid → Supabase Auth (phased) |
| Realtime | None (page refresh only) | Supabase Realtime (scoped) |
| Storage | `public/uploads/` local disk | Supabase Storage |
| RLS | SQL files exist, app-layer primary | RLS + app-layer defense-in-depth |
| Mock data | AI mock provider only | Real DB analytics everywhere |

---

## 1. Current Supabase Architecture

### 1.1 Before This Audit

```
Next.js App
    ↓
API Routes / Server Actions
    ↓
Domain Services (29 services)
    ↓
Prisma Client
    ↓
PostgreSQL (Docker :5434)
```

- **No** `@supabase/supabase-js`
- **No** `NEXT_PUBLIC_SUPABASE_*` env vars
- **No** Supabase Auth, Realtime, or Storage

### 1.2 After Foundation Implementation (This Branch)

```
Next.js App
    ↓
API / Domain Services
    ├── Prisma → PostgreSQL (primary writes/reads)
    ├── Supabase Admin (service role) → Storage uploads
    └── Business events → PostgreSQL

Browser (authenticated /app)
    ↓
GET /api/realtime/token (NextAuth session → signed JWT)
    ↓
Supabase Realtime (postgres_changes, org-scoped filters)
    ↓
Targeted UI refresh (e.g. orders list)
```

**New files:**

| Path | Purpose |
|------|---------|
| `src/lib/supabase/config.ts` | Env helpers, feature flags |
| `src/lib/supabase/client.ts` | Browser client |
| `src/lib/supabase/admin.ts` | Service-role client (server-only) |
| `src/lib/supabase/jwt.ts` | Realtime JWT for NextAuth users |
| `src/lib/realtime/*` | Channel naming, hooks, event types |
| `src/server/services/media-service.ts` | Storage abstraction |
| `src/app/api/realtime/token/route.ts` | Issues scoped realtime JWT |
| `supabase/migrations/20260302100000_omino_foundation.sql` | Buckets, realtime publication, RLS |
| `scripts/test-supabase-integration.ts` | Integration test scaffold |

---

## 2. Existing Database Schema

**ORM:** Prisma (`prisma/schema.prisma`)  
**Migrations:** Prisma `db push` / manual SQL RLS files (no standard `prisma/migrations/*/migration.sql` history)

### 2.1 Core Multi-Tenant Hierarchy

```
User
  └── Membership (roleId → Role)
        └── Organization
              ├── Store
              │     └── Branch
              ├── Products, Categories, Inventory...
              ├── Orders, Payments, Customers...
              └── AI, Automations, Marketing...
```

### 2.2 Table Inventory (70+ models)

| Domain | Tables |
|--------|--------|
| **Identity** | `users`, `accounts`, `sessions`, `verification_tokens` |
| **Tenancy** | `organizations`, `memberships`, `roles`, `permissions`, `role_permissions`, `user_contexts` |
| **Commerce** | `stores`, `branches`, `shipping_methods` |
| **Catalog** | `categories`, `products`, `product_variants`, `product_images`, `product_options`, `bundle_items`, `collections`, `collection_products` |
| **Inventory** | `stock_locations`, `stock_levels`, `stock_movements`, `stock_transfers` |
| **POS** | `registers`, `pos_sessions`, `carts`, `cart_items` |
| **Orders** | `orders`, `order_items`, `order_adjustments`, `order_events`, `order_number_sequences` |
| **Payments** | `payments`, `payment_attempts`, `refunds`, `refund_items` |
| **CRM** | `customers`, `customer_addresses`, `customer_tags`, `customer_notes`, `customer_events` |
| **AI** | `ai_conversations`, `ai_messages`, `ai_tool_calls`, `ai_actions`, `ai_memories`, `ai_usage` |
| **Automation** | `business_events`, `automations`, `automation_executions`, `internal_notifications` |
| **Marketing** | `marketing_audiences`, `marketing_promotions`, `marketing_campaigns`, `marketing_conversions` |
| **Storefront Power** | `storefront_events`, `storefront_daily_metrics`, `search_query_logs`, `product_affinities`, `storefront_accounts`, `store_domains`, `product_reviews`, `review_media` |
| **Audit** | `audit_logs` |

### 2.3 Relationships (Key FKs)

- Every tenant table carries `organization_id`
- Store-scoped: `store_id` on orders, products (optional), stock locations, etc.
- Branch-scoped: `branch_id` on POS sessions, stock locations, orders
- `memberships` links `user_id` + `organization_id` + `role_id`

### 2.4 Money Representation

- All monetary values use **integer minor units** (`totalMinor`, `unitPriceMinor`, etc.)
- `formatMoney()` in `src/lib/money` for display
- POS checkout uses Prisma `$transaction` — **safe from float errors**

---

## 3. Existing RLS Policies

RLS SQL lives in `prisma/migrations/rls_*.sql` (manual apply, not Prisma-managed):

| File | Tables Covered |
|------|----------------|
| `rls_policies.sql` | organizations, memberships, stores, branches, roles, user_contexts |
| `rls_phase2_policies.sql` | catalog + inventory |
| `rls_phase4_policies.sql` | orders, payments, POS, audit |
| `rls_phase6_policies.sql` | CRM |
| `rls_phase8_policies.sql` | AI tables |
| `rls_phase9_policies.sql` | automation + business_events |

**Mechanism:** `app_current_organization_id()` reads `set_config('app.current_organization_id', ...)` set by `requireTenantContext()` in `src/lib/api/tenant.ts`.

**Gap:** Prisma connects as DB superuser → **RLS is bypassed** unless using a restricted DB role. RLS is defense-in-depth; **application-layer checks are currently the real security boundary**.

**New (Supabase migration):** `auth_organization_id()` reads JWT `organization_id` claim for realtime clients.

---

## 4. Existing Realtime

| Area | Status |
|------|--------|
| Supabase Realtime | **Not present** before this branch |
| Business events | `publishBusinessEvent()` → `business_events` table (Postgres only) |
| Automations | Triggered from business events (async) |
| Storefront analytics | `StorefrontEvent` persisted when schema migrated |
| UI updates | Server Components + manual refresh |

**Polling:** No `setInterval(fetch)` anti-patterns found for business data.

**Implemented:** `useRealtimeSubscription` hook + `OrdersLiveRefresh` on `/app/orders`.

---

## 5. Existing Storage

| Asset Type | Current Backend | Path Pattern |
|------------|-----------------|--------------|
| Store logo/favicon/hero | Local filesystem | `public/uploads/organizations/{orgId}/stores/{storeId}/...` |
| Product images | Local filesystem | `public/uploads/organizations/{orgId}/products/{productId}/...` |
| Review media | DB URL field | Not yet wired to uploader |

**Upload flow:** `MediaUploader` → API routes → `saveStoreAssetFile` / `saveProductImageFile`

**After foundation:** `media-service.ts` uses **Supabase Storage** when `SUPABASE_SERVICE_ROLE_KEY` is set; falls back to local disk for dev without Supabase.

**Bucket:** `omino-media` (public read, tenant-scoped write paths)

---

## 6. Authentication

| Aspect | Implementation |
|--------|----------------|
| Merchant auth | **NextAuth v5** credentials provider |
| Password hashing | bcrypt via `auth-service` |
| Session | JWT (30-day), enriched with `SessionUser` |
| Signup | `POST /api/auth/signup` → creates `User` only |
| Onboarding | `POST /api/onboarding` → org + membership (OWNER) + store + branch |
| Storefront customers | Separate `StorefrontAccount` (not NextAuth) |

**Supabase Auth:** Not integrated. Realtime uses **custom JWT** signed with `SUPABASE_JWT_SECRET` bridging NextAuth sessions.

**Routes preserved:** `/main`, `/login`, `/signup`, `/onboarding`, `/app`, `/store/[storeSlug]`

---

## 7. Domain Services (Existing)

All business logic correctly flows through services — **no raw Prisma in React components**:

```
OrganizationService, StoreService, ProductService, InventoryService,
OrderService, PaymentService, CustomerService, AnalyticsService,
PosService, MediaService (new), CollectionService, ReviewService, ...
```

**AI path (correct):**

```
Gemini → AI Orchestrator → Tool Registry → Permission Layer → Domain Service → Prisma
```

Gemini never receives DB credentials.

---

## 8. Mock / Local / Fake Data Audit

| Location | Type | Risk | Action |
|----------|------|------|--------|
| `src/server/ai/providers/mock-provider.ts` | AI mock when `AI_PROVIDER=mock` | Low (dev only) | Keep; production uses real provider |
| `announcement-bar.tsx` | `localStorage` dismiss flag | None (UI only) | OK |
| `prisma/seed.ts` | Demo org/user/products | Dev only | OK for local dev |
| Dashboard analytics | Real queries via `analytics-service` | None | Already real |
| Storefront | Real Prisma queries | None | Already real |

**No** hardcoded product arrays, fake order lists, or mock JSON APIs found in production paths.

---

## 9. API Routes Pattern

```
UI → fetch('/api/...') → requireTenantContext(permission) → Domain Service → Prisma
```

`setTenantContext()` called on every authenticated API request for RLS session vars.

**Transactional operations:** POS checkout in `pos-service.ts` uses `prisma.$transaction` for order + payment + inventory.

---

## 10. Required Changes (Migration Roadmap)

### Phase A — Foundation ✅ (This Branch)

- [x] Supabase client utilities
- [x] Env vars in `.env.example`
- [x] Media service with Supabase Storage backend
- [x] Realtime JWT bridge for NextAuth
- [x] Orders page live refresh
- [x] Supabase SQL migration (buckets, realtime, RLS helpers)
- [x] Integration test scaffold

### Phase B — Database on Supabase Postgres

- [ ] Create Supabase project
- [ ] Point `DATABASE_URL` to Supabase (pooler) + `DIRECT_URL` for migrations
- [ ] Run `npx prisma db push` against Supabase
- [ ] Apply `prisma/migrations/rls_*.sql`
- [ ] Apply `supabase/migrations/20260302100000_omino_foundation.sql`
- [ ] Migrate existing local uploads to Supabase Storage

### Phase C — Realtime Expansion

- [ ] Inventory page live updates (`stock_levels`)
- [ ] POS dashboard live order feed
- [ ] Dashboard today-metrics via `business_events` (not full analytics recalc)
- [ ] AI activity feed (`ai_actions`)
- [ ] Connection status UX (subtle, non-distracting)

### Phase D — Auth (Optional, High Impact)

- [ ] Evaluate Supabase Auth vs. keep NextAuth + custom JWT
- [ ] If migrating: sync `users` table with `auth.users`, update signup/onboarding
- [ ] Password reset, email verification via Supabase

### Phase E — Hardening

- [ ] Restrict Prisma DB role (non-superuser) so RLS applies on server path
- [ ] IDOR integration tests with two orgs
- [ ] Realtime tenant isolation tests
- [ ] Idempotency keys for POS checkout
- [ ] Storage unauthorized access tests

---

## 11. Migration Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Prisma bypasses RLS | High | Restricted DB role + app-layer checks (current) |
| Auth migration breaks sessions | High | Phased; keep NextAuth until Supabase Auth tested |
| Local upload URLs in DB | Medium | Migration script to re-upload to Supabase Storage |
| Realtime volume | Medium | Scoped filters (`organization_id`, `store_id`) |
| `prisma db push` vs Supabase migrations | Medium | Use Prisma for schema; Supabase SQL for RLS/realtime/storage |
| Power Layer tables not pushed | Medium | User must run `prisma db push` |
| Service role key exposure | Critical | Server-only; never `NEXT_PUBLIC_*` |
| Concurrent inventory | Medium | Existing `$transaction` + `adjustStockInTx`; add row locking audit |

---

## 12. Environment Variables

```env
# Required for Supabase production
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # server-only
SUPABASE_JWT_SECRET=your-jwt-secret       # server-only, from Supabase dashboard

# Database (Supabase Postgres)
DATABASE_URL=postgresql://...pooler...:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://...:5432/postgres

# Existing (unchanged)
AUTH_SECRET=...
AUTH_URL=...
```

---

## 13. Verifying Realtime in Production

1. Deploy with all Supabase env vars set
2. Apply `supabase/migrations/20260302100000_omino_foundation.sql` on Supabase SQL editor
3. Log in as two users in **different organizations**
4. Open `/app/orders` in Org A — complete a POS sale
5. Confirm order appears **without manual refresh**
6. Confirm Org B user does **not** receive the event
7. Check browser Network → `/api/realtime/token` returns `enabled: true`
8. Check Supabase Dashboard → Realtime → inspect active channels

---

## 14. Indexes (Existing + Recommended)

**Already in schema:** FK indexes via Prisma `@@index`

**Added in Supabase migration:**

- `orders (organization_id, store_id, created_at DESC)`
- `payments (organization_id, store_id, created_at DESC)`
- `customers (organization_id, created_at DESC)`
- `products (organization_id, status)`
- `business_events (organization_id, type, created_at DESC)`

---

## 15. What Was NOT Duplicated

- Single Prisma client (`src/lib/db/index.ts`)
- Single media abstraction (`media-service.ts`)
- Existing domain services reused
- Existing RLS SQL files preserved
- Existing event bus (`publishBusinessEvent`) — not replaced with a second system

---

## 16. Remaining Issues

1. **Supabase project not provisioned** — user must create and configure
2. **RLS SQL files may not be applied** to local Docker Postgres
3. **Auth still NextAuth** — not Supabase Auth
4. **Realtime only on orders page** — inventory/POS/dashboard pending
5. **Power Layer schema** may need `prisma db push`
6. **Prisma uses superuser** — RLS not enforced on server writes
7. **No idempotency keys** on POS checkout yet
8. **Integration tests** are scaffold only — need live Supabase for full coverage

---

## 17. Architecture Target (Final)

```
                    OMINO
                      │
                Next.js App
                      │
             Server / Domain Layer
                      │
              ┌───────┴────────┐
              │                │
         Supabase            Gemini
              │                │
      ┌───────┼───────┐        │
      │       │       │        │
 PostgreSQL Auth   Storage     AI
      │
   Realtime
      │
      └───────────────┐
                      │
              Live OMINO Experience
```

**Supabase owns:** persistence, auth (future), realtime sync, media storage  
**OMINO owns:** business logic, permissions UX, analytics, workflows, AI orchestration  
**Gemini owns:** reasoning only — never direct DB access
