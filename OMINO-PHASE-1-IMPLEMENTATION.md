# OMINO — Phase 1 Implementation Report

**Date:** 2026-09-01  
**Status:** Complete — foundation ready for Phase 2

---

## Summary

Phase 1 establishes the **OMINO Business OS foundation** as a Next.js 15 application with PostgreSQL, multi-tenant data isolation, Auth.js credentials authentication, RBAC, organization/store/branch hierarchy, onboarding flow, and a premium app shell — while **preserving the static marketing site** at `/main`.

---

## Architecture

```
OMINO/
├── main/                    # UNCHANGED — static marketing (source of truth)
├── public/main/             # Generated mirror for Next.js static serving
├── prisma/
│   ├── schema.prisma        # Core + catalog schema (catalog = Phase 2 prep)
│   ├── seed.ts              # Demo org + roles
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── login/           # /login
│   │   ├── signup/          # /signup
│   │   ├── onboarding/      # /onboarding
│   │   ├── app/             # /app/* Business OS
│   │   └── api/             # Auth, org, context, onboarding
│   ├── components/
│   │   ├── ui/              # OMINO-styled primitives
│   │   ├── marketing/       # Auth shell
│   │   └── app/             # App shell (sidebar, topbar)
│   ├── features/            # (reserved for feature modules)
│   ├── lib/
│   │   ├── auth/            # NextAuth config
│   │   ├── db/              # Prisma client + tenant helpers
│   │   └── permissions/     # RBAC constants + checks
│   ├── server/
│   │   ├── services/        # Auth, organization, catalog services
│   │   └── repositories/    # User session builder
│   └── types/
└── scripts/
    ├── sync-main.mjs        # Copies main/ → public/main/
    └── test-phase1.ts       # Smoke tests
```

---

## Route Structure

| Route | Purpose | Auth |
|-------|---------|------|
| `/main/*` | Marketing website (static) | Public |
| `/login` | Sign in | Public |
| `/signup` | Create account | Public |
| `/onboarding` | Business setup wizard | Authenticated |
| `/app` | Overview dashboard | Authenticated + onboarded |
| `/app/team` | Team members list | Authenticated + `team.read` |
| `/app/settings` | Organization settings | Authenticated + `settings.read` |
| `/app/{module}` | Placeholder modules | Authenticated |

**Marketing separation:** `/main` is served from static files. Next.js does not intercept `/main/*` (middleware excluded).

---

## Database Tables

### Phase 1 Core

| Table | Purpose |
|-------|---------|
| `users` | Accounts (email, password hash, profile) |
| `accounts` | NextAuth OAuth accounts (future) |
| `sessions` | NextAuth DB sessions (adapter-ready) |
| `verification_tokens` | NextAuth email verification |
| `organizations` | Tenant boundary |
| `memberships` | User ↔ Organization ↔ Role |
| `roles` | OWNER, ADMIN, MANAGER, STAFF per org |
| `permissions` | Global permission keys |
| `role_permissions` | Role ↔ Permission mapping |
| `stores` | Organization stores |
| `branches` | Store branches |
| `user_contexts` | Active org/store/branch per user |

### Relationships

```
User
 └── Membership ──► Organization
                      ├── Role (OWNER/ADMIN/MANAGER/STAFF)
                      └── Store
                            └── Branch
```

### Phase 2 Prep (schema only)

Catalog tables (`products`, `product_variants`, `categories`, `stock_levels`, etc.) are defined in schema for forward compatibility. Partial UI/API exists but is **not part of Phase 1 deliverables**.

---

## Multi-Tenancy Strategy

1. **Application layer (primary):** Every query filters by `organizationId` from JWT session. `assertOrgAccess()` validates tenant boundaries in API routes.
2. **Membership gate:** Users can only access organizations they belong to via `memberships` table.
3. **Context switching:** `user_contexts` stores active org/store/branch. Updated via `/api/context`.
4. **RLS (defense-in-depth):** `prisma/migrations/rls_policies.sql` provides PostgreSQL Row Level Security policies. Apply manually after migration when using direct SQL with session variables.

---

## Authentication Flow

```
Signup (/signup)
  → POST /api/auth/signup (creates user, bcrypt hash)
  → signIn(credentials) → JWT session cookie

Login (/login)
  → signIn(credentials) → JWT session cookie
  → Redirect /app (middleware checks onboarding)

Onboarding (/onboarding)
  → POST /api/onboarding
  → Creates Organization + OWNER role + default Store + Branch
  → session.update() → /app

Logout
  → signOut() → redirect /main
```

**Technology:** NextAuth v5 (Auth.js) with Credentials provider, JWT sessions, bcrypt password hashing.

---

## RBAC Strategy

### System Roles (per organization)

| Role | Scope |
|------|-------|
| OWNER | All permissions |
| ADMIN | All except `ai.execute` |
| MANAGER | Operations (products, inventory, orders, customers, analytics read) |
| STAFF | Limited read/write (orders, basic reads) |

### Permission Keys (seeded)

`products.read/write`, `inventory.read/write`, `orders.read/write`, `customers.read/write`, `payments.read/write`, `analytics.read`, `settings.read/write`, `team.read/write`, `ai.use`, `ai.execute`

Permissions are stored in DB and linked to roles via `role_permissions`. Nav items filter by `sessionHasPermission()`.

---

## App Shell Features

- Collapsible sidebar (mobile drawer)
- Module navigation with permission filtering
- Top bar: search placeholder, notifications placeholder, user menu
- Organization / store / branch context chips
- OMINO design tokens (Archivo, ink/paper palette)
- Responsive desktop + mobile

---

## Files Created (Phase 1)

### Config & Infrastructure
- `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`
- `docker-compose.yml`, `.env.example`, `.gitignore`
- `scripts/sync-main.mjs`, `scripts/test-phase1.ts`
- `vercel.json` (updated for Next.js + static /main)

### Database
- `prisma/schema.prisma`, `prisma/seed.ts`
- `prisma/migrations/rls_policies.sql`

### Application
- `src/middleware.ts` — route protection
- `src/lib/auth/index.ts` — NextAuth
- `src/lib/db/*`, `src/lib/permissions/*`
- `src/server/services/auth-service.ts`
- `src/server/services/organization-service.ts`
- `src/server/repositories/user-repository.ts`
- `src/app/login/page.tsx`, `signup/page.tsx`, `onboarding/page.tsx`
- `src/app/app/layout.tsx`, `page.tsx`, `team/page.tsx`, `settings/page.tsx`
- `src/app/app/{pos,store,orders,...}/page.tsx` — placeholders
- `src/components/app/app-shell.tsx`
- `src/components/marketing/auth-shell.tsx`
- `src/components/ui/{button,input,select,card}.tsx`
- API routes: `auth`, `signup`, `onboarding`, `context`, `organization`

---

## Files Modified

- `vercel.json` — Next.js framework + /main static serving

## Files NOT Modified (protected)

- `main/index.html` and all marketing pages
- `main/css/omino.css`, `main/js/*`
- `omino/` reference repositories

---

## Development Setup

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Configure environment
cp .env.example .env
# Edit AUTH_SECRET: openssl rand -base64 32

# 3. Database
npm run db:migrate
npm run db:seed

# 4. Run
npm run dev
```

### Demo Accounts (after seed)

| Email | Password | Role |
|-------|----------|------|
| owner@demo.omino.test | Demo1234! | OWNER |
| admin@demo.omino.test | Demo1234! | ADMIN |
| manager@demo.omino.test | Demo1234! | MANAGER |
| staff@demo.omino.test | Demo1234! | STAFF |

---

## Security Implementation

- [x] `/app` requires authentication (middleware)
- [x] `/onboarding` requires authentication
- [x] API routes validate session server-side
- [x] `organizationId` from JWT — never trusted from request body alone
- [x] `assertOrgAccess()` on organization mutations
- [x] bcrypt password hashing (12 rounds)
- [x] `AUTH_SECRET` server-side only
- [x] RLS policies documented for PostgreSQL
- [x] No secrets in repository

---

## Tests Performed

- [x] `npm run build` — compiles successfully
- [x] Marketing `/main/` path excluded from auth middleware
- [x] Unauthenticated `/app` redirects to `/login`
- [x] API endpoints return 401 without session

### Manual Tests Required

1. Sign up User A → complete onboarding → access `/app`
2. Sign up User B → verify cannot access User A's organization
3. Test demo role permissions (STAFF vs OWNER nav visibility)
4. Test logout → `/main` still works
5. Test responsive shell on mobile

Run: `npm run test:phase1` (with dev server running)

---

## Known Limitations

1. **Single org per user flow** — onboarding creates one org; multi-org switching UI is placeholder
2. **Context switcher** — displays current context but switching requires API call (no dropdown UI yet)
3. **Google OAuth** — not wired (credentials only)
4. **RLS** — policies in SQL file; Prisma uses app-level filtering primarily
5. **Email verification** — not implemented
6. **Team invites** — team page is read-only; no invite flow
7. **Catalog/Inventory UI** — partial Phase 2 code exists in repo; not Phase 1 scope

---

## Next Recommended Phase

**Phase 2 — Commerce Core:**
1. Products CRUD (complete catalog module)
2. Inventory engine with stock movements
3. Cart → Order checkout flow
4. Founding pricing lock on Organization
5. Payment provider abstraction

---

*Phase 1 foundation supports scaling from 1 to thousands of organizations without architectural rewrite.*
