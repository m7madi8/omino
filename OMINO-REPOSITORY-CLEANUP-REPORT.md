# OMINO Repository Cleanup Report

**Date:** 2026-09-02  
**Re-verified:** 2026-09-02 (full validation re-run)  
**Operation:** Safe production cleanup — remove reference projects, dead code, unused dependencies  
**Scope:** No feature changes, no architecture changes, no `/main` or `/app` logic changes

---

## Removed

### Reference projects (entire trees)

| Path | Files | Size | Runtime dependency |
|------|-------|------|-------------------|
| `omino/caratflow-main/` | ~1,800+ | — | **None** |
| `omino/genix-main/` | ~1,500+ | — | **None** |
| `omino/multi-agent-business-os-main/` | ~800+ | — | **None** |
| `omino/Nexus-ERP-main/` | ~2,000+ | — | **None** |
| `omino/spree-main/` | ~3,100+ | — | **None** |

**Total removed:** `omino/` directory — **9,256 files, ~155.5 MB**

Verification performed before deletion:
- Zero imports in `src/`
- Zero references in `scripts/`
- Zero path aliases or build config dependencies
- `tsconfig.json` only excluded `omino/` (not included)
- `.gitignore` already ignored `omino/`

All concepts from these repositories were previously extracted into OMINO’s own `src/`, `prisma/`, and `main/` code. Historical provenance remains in `OMINO-CODE-EXTRACTION-LOG.md` and related architecture docs.

---

## Reference Projects Removed

| Project | Status |
|---------|--------|
| `caratflow-main` | **REMOVED** — not required by OMINO |
| `genix-main` | **REMOVED** — not required by OMINO |
| `multi-agent-business-os-main` | **REMOVED** — not required by OMINO |
| `Nexus-ERP-main` | **REMOVED** — not required by OMINO |
| `spree-main` | **REMOVED** — not required by OMINO |

---

## Dead Code Removed

| File | Reason |
|------|--------|
| `src/components/pos/pos-terminal.tsx` | Duplicate of `commerce/pos-terminal.tsx`; zero imports (`PosClient` is the active POS UI) |
| `src/components/commerce/order-detail.tsx` | `OrderDetailClient` never imported; order detail rendered inline in `app/orders/[id]/page.tsx` |
| `src/components/commerce/orders-list.tsx` | `OrdersListClient` never imported; orders list rendered inline in `app/orders/page.tsx` |
| `src/server/ai/rate-limit.ts` | Unused re-export barrel; callers import `@/lib/security/rate-limit` directly |
| `src/app/app/_modules.ts` | Unused module registry (Phase 12) |
| `src/components/app/placeholder-module.tsx` | Unused placeholder component (Phase 12) |

**Kept (intentionally):**
- `src/components/pos/void-order-button.tsx` — used by order detail page
- `src/lib/observability/logger.ts` — Phase 11 infrastructure; documented for production observability (not yet wired everywhere)
- `src/server/services/analytics-service.ts` — legacy AI context service; actively imported by AI tools

---

## Dependencies Removed

| Package | Reason |
|---------|--------|
| `@auth/prisma-adapter` | Never imported; auth uses JWT + Credentials provider (`src/lib/auth/index.ts`), not database sessions |

Lockfile regenerated via `npm install`.

**No dependency upgrades performed.**

---

## Assets Removed

No OMINO production assets were removed.

The `main/` marketing site and `public/main/` mirror were **not modified** in this cleanup (per instructions). Dev artifacts inside `main/img/` (Python GLB conversion scripts, `__pycache__`) were left in place to avoid changing the marketing site source.

---

## Configuration Cleaned

| File | Change |
|------|--------|
| `.gitignore` | Removed obsolete `omino/` ignore entry (directory deleted) |
| `tsconfig.json` | Removed `omino` from `exclude` array |
| `package.json` | Removed unused `@auth/prisma-adapter` |
| `package-lock.json` | Regenerated after dependency removal |

**Unchanged:** `next.config.ts`, `middleware`, `vercel.json`, `docker-compose.yml`, `.env.example`, Prisma migrations, RLS SQL files.

---

## Documentation Cleaned

### Kept (OMINO documentation — all retained)

- All `OMINO-PHASE-*-IMPLEMENTATION.md` reports
- `OMINO-ARCHITECTURE-AUDIT.md`, `OMINO-TARGET-ARCHITECTURE.md`, `OMINO-DATABASE-BLUEPRINT.md`
- `OMINO-AI-ARCHITECTURE.md`, `OMINO-SECURITY-AUDIT.md`, `OMINO-PERFORMANCE-AUDIT.md`
- `OMINO-LAUNCH-CHECKLIST.md`, `OMINO-CODE-EXTRACTION-LOG.md`, `OMINO-EXTRACTION-MATRIX.md`
- `OMINO-IMPLEMENTATION-ROADMAP.md`, `OMINO-DEPENDENCY-CONFLICTS.md`

### Removed

- No OMINO documentation was deleted.
- Reference-project READMEs were removed with their parent directories under `omino/`.

Historical docs still mention `omino/spree-main/...` paths as **extraction provenance** — this is intentional and does not require the reference code to remain on disk.

---

## Environment / Git Safety

| Check | Result |
|-------|--------|
| `.env.local` tracked by Git | **No** — not in repository |
| `.env.example` | Present (untracked); no secrets committed |
| Secrets printed in this report | **None** |

---

## Validation

| Check | Result | Notes |
|-------|--------|-------|
| **Typecheck** | **PASS** | `npm run typecheck` — 0 errors (re-verified 2026-09-02) |
| **Lint** | **SKIP** | `next lint` prompts interactive ESLint setup (pre-existing); build-time lint in `next build` passed |
| **Tests** | **PASS** | `npm run test:phase11` — 10/10 (re-verified 2026-09-02); full `npm run test` not run (requires live DB for integration phases) |
| **Build** | **PASS** | `npm run build` — all 59 routes compiled (re-verified 2026-09-02) |
| **Route verification** | **PASS** | Production server on port 3010 (re-verified 2026-09-02) |

### Route verification detail

| Route | Status |
|-------|--------|
| `/main/index.html` | 200 |
| `/login` | 200 |
| `/signup` | 200 |
| `/onboarding` | 200 |
| `/app` | 307 → `/login` (unauthenticated; expected) |
| `/app/products` | 307 → `/login` |
| `/app/inventory` | 307 → `/login` |
| `/app/pos` | 307 → `/login` |
| `/app/orders` | 307 → `/login` |
| `/app/customers` | 307 → `/login` |
| `/app/analytics` | 307 → `/login` |
| `/app/ai` | 307 → `/login` |
| `/app/automations` | 307 → `/login` |
| `/app/marketing` | 307 → `/login` |
| `/app/store` | 307 → `/login` |
| `/app/team` | 307 → `/login` |
| `/app/settings` | 307 → `/login` |
| `/sitemap.xml` | 200 |
| `/api/health` | 503 (DB unavailable locally — expected) |
| `/main` | 404 (pre-existing: static site served at `/main/index.html`; not introduced by cleanup) |

---

## Remaining Warnings

1. **`src/lib/observability/logger.ts`** — unused at runtime today; kept as Phase 11 observability foundation.
2. **`src/server/services/analytics-service.ts`** — parallel to `analytics/analytics-service.ts`; both actively used (AI vs dashboard); consolidation deferred.
3. **`main/img/png_to_glb.py`, `svg_to_glb.py`, `__pycache__/`** — dev tooling inside marketing assets; not removed to avoid changing `/main`.
4. **`public/main/`** — gitignored generated mirror; rebuilt by `scripts/sync-main.mjs` on build.
5. **`.next/`** — build cache; gitignored; not deleted (regenerated on build).
6. **Documentation references to `omino/*` paths** — historical only; code no longer on disk.
7. **ESLint** — not fully configured; interactive `next lint` setup pending.
8. **`@auth/prisma-adapter` schema models** (`Account`, `Session`) — remain in Prisma schema for future OAuth; adapter package removed because unused.

---

## Final Repository Status

**CLEAN WITH WARNINGS**

The repository now contains only OMINO production code, documentation, and development tooling. The five reference projects (~155 MB) and verified dead code are removed. Build, typecheck, and security tests pass. Minor pre-existing warnings remain (logger not wired, `/main` vs `/main/index.html`, ESLint setup).

**OMINO functionality was not broken by this cleanup.**
