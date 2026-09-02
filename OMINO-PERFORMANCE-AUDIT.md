# OMINO — Performance Audit Report

**Phase:** 11 — Security + Performance + Scale  
**Date:** 2026-09-02  
**Scope:** Database, API, frontend, caching, concurrency, and production build readiness.

---

## Executive Summary

OMINO's schema includes **comprehensive indexes** on tenant keys (`organizationId`, `storeId`, `branchId`), status fields, and common query patterns (orders by date, customers by email, stock movements by variant). Domain services use **pagination** on list endpoints and **minor-unit arithmetic** for financial operations.

Phase 11 did **not** introduce a caching layer (intentionally — transactional data must not be stale). Performance work focused on **correctness fixes** that also prevent wasted recomputation (storefront cart totals bug) and **infrastructure foundations** (health check, structured logging, security headers with minimal overhead).

**No synthetic benchmark numbers** are reported — this audit is based on code inspection and build/test results.

---

## Database Performance

### Index coverage (reviewed in `prisma/schema.prisma`)

| Pattern | Indexed | Examples |
|---------|---------|----------|
| `organizationId` on business tables | ✅ | products, orders, customers, automations, AI |
| `storeId` / `branchId` where applicable | ✅ | carts, orders, stock locations |
| Status + org composite | ✅ | `@@index([organizationId, status])` on orders, carts, automations |
| Created-at descending lists | ✅ | orders, payments, stock movements, audit logs |
| SKU / barcode lookup | ✅ | `ProductVariant` |
| Unique business keys | ✅ | order numbers, promotion codes (schema) |

### Query patterns

| Area | Pagination | Limits | Notes |
|------|------------|--------|-------|
| Products API | ✅ page/pageSize | max enforced in services | |
| Customers API | ✅ | | |
| Orders API | ✅ | | |
| Inventory movements | ✅ | | |
| Storefront catalog | ✅ | pageSize max 48 | |
| AI conversations | ✅ limit param | default 50 | |
| Automation executions | ✅ | | |
| Analytics | ✅ date-range scoped | Aggregations in SQL | |

### N+1 queries

| Area | Assessment |
|------|------------|
| Order detail | Uses `include` for items/payments — acceptable for single-record fetch |
| Product list | Stock levels joined per variant — monitor at scale; consider batch stock query |
| Automation execution enrichment | Fetches order/customer on demand per event — acceptable for async processing |
| Analytics | Uses aggregation queries, not per-row loops | ✅ |

**No N+1 fixes applied in Phase 11** — no evidence of production slowness; recommend profiling with real data volume.

### Missing indexes (deferred)

None identified as clearly missing given current query patterns. Re-evaluate when marketing APIs and campaign event tables go live.

---

## API Performance

| Finding | Severity | Action |
|---------|----------|--------|
| List endpoints paginated | ✅ Good | Verified pattern |
| Unbounded `findMany` without `take` | ⚠️ Low risk | Some internal service calls use defaults; audit if adding admin exports |
| Analytics queries can be expensive | Medium | Date-range required; recommend materialized summaries at scale (future) |
| Automation event enrichment does 1–2 extra queries per event | Low | Async; rate-limited per org |
| Health check runs `SELECT 1` | ✅ Minimal | Suitable for load balancers |

---

## Concurrency & Transaction Safety

| Scenario | Mechanism | Status |
|----------|-----------|--------|
| Last-item oversell | Transactional stock adjust + availability check | ✅ |
| Duplicate payment | `idempotencyKey` unique constraint | ✅ |
| Duplicate refund | Validated against refundable balance in transaction | ✅ |
| Order number generation | `orderNumberSequence` upsert in transaction | ✅ |
| POS checkout | Single `$transaction` for order + payment + inventory | ✅ |
| Online checkout | Same pattern in `checkoutOnline()` | ✅ |
| Coupon usage (marketing schema) | Usage counters in schema — verify atomic increment when APIs ship | ⚠️ Future |

---

## Caching

| Candidate | Phase 11 decision |
|-----------|-------------------|
| Product catalog (public) | **Not cached** — correctness over speed for MVP |
| Store settings | **Not cached** — low read volume |
| Analytics summaries | **Not cached** — stale KPIs acceptable risk is medium |
| Session/auth | Handled by NextAuth | ✅ |

**Recommendation:** Add HTTP cache headers on public storefront product pages (`s-maxage`) after CDN deployment, with short TTL and cache-bust on publish.

---

## Next.js / Frontend Performance

### Configuration

| Item | Status |
|------|--------|
| `reactStrictMode` | ✅ Enabled |
| Image formats AVIF/WebP | ✅ `next.config.ts` |
| `poweredByHeader` disabled | ✅ Minor perf/security win |
| Security headers | ✅ No heavy middleware logic |

### Component model

| Surface | Pattern |
|---------|---------|
| `/app/*` dashboard | Mix of server pages + client interactive components (POS, AI chat) |
| `/store/*` | Server-rendered catalog where possible |
| `/main` marketing | Static assets synced to `public/main/` |

### Bundle / hydration

- No broad conversion of server components to client components in Phase 11.
- POS and AI remain client-heavy by necessity — acceptable for operational tools.
- **Not measured:** exact bundle sizes; recommend `next build` analyze in CI when font/network issues resolved.

### Fonts

- App uses `next/font` (Google Fonts: Inter, Archivo, IBM Plex).
- **Build note:** Clean builds in this environment failed fetching Google Fonts (TLS/certificate). Cached builds compile successfully. Production CI with network access should not hit this.

---

## Public Store Performance

| Control | Status |
|---------|--------|
| Paginated catalog | ✅ |
| Product page server render | ✅ |
| Cart operations API-scoped | ✅ |
| Checkout server-side totals | ✅ Fixed cart recalculation |
| Internal data not exposed on storefront | ✅ Store-slug resolution validates org |

---

## Marketing Site (`/main`)

- Preserved as static marketing site (synced via `scripts/sync-main.mjs`).
- Not converted to dashboard.
- SEO: `robots.txt` allows `/main`, disallows `/app`.

---

## Observability (Performance-related)

| Addition | Purpose |
|----------|---------|
| `src/lib/observability/logger.ts` | Structured JSON logs with duration via `withTiming()` |
| `GET /api/health` | DB latency indicator (`responseMs`) |
| Business event logging (dev) | Automation/order event tracing |

**Not added:** APM integration (Datadog, Sentry traces) — document as production follow-up.

---

## Error States & Reliability

| Domain | Loading / empty / error |
|--------|-------------------------|
| Dashboard pages | Generally present from prior phases |
| API errors | Standardized via `handleApiError()` |
| AI failure isolation | Orchestrator errors don't break POS |
| Automation failure isolation | `publishBusinessEvent` catches automation processing errors |

Phase 11 did not do a full UI error-state pass — no regressions introduced.

---

## Load Testing Foundation

**Not created in Phase 11.** Recommended scenarios for future `k6` or `artillery` scripts:

1. Concurrent storefront product reads
2. Concurrent inventory adjustments on same variant
3. Concurrent POS checkouts on last stock unit
4. Concurrent coupon validation (when marketing APIs ship)
5. Analytics dashboard under 90-day range

---

## Build & Test Results

| Command | Result |
|---------|--------|
| `npm run test:phase11` | ✅ 10 passed |
| `npm run build` (typecheck step) | ✅ Compiled + types valid (after storefront fix) |
| `npm run build` (full, clean) | ⚠️ Environment SSL failure fetching Google Fonts |
| `npm run lint` | ⚠️ Interactive ESLint setup prompt (not configured) |
| `npm audit` | ⚠️ 5 vulnerabilities (see security audit) |

---

## Improvements Made in Phase 11

1. **Storefront cart totals bug fix** — prevents incorrect totals and unnecessary client retries.
2. **Health endpoint** — enables load balancer readiness without heavy probes.
3. **Structured logging** — supports latency analysis in log aggregation.
4. **Automation rate limiting** — prevents runaway execution from impacting DB.
5. **Security headers** — minimal overhead, no extra round trips.

---

## Remaining Bottlenecks

| Bottleneck | Impact | Recommendation |
|------------|--------|----------------|
| In-memory rate limits | Incorrect under multi-instance | Redis rate limiter |
| Analytics full-table scans at large scale | Slow dashboards | Summary tables / scheduled rollups |
| AI provider latency | User-perceived slowness | Streaming responses (future) |
| No CDN on storefront | Slower global customers | Deploy behind CDN |
| Google Fonts external fetch at build | CI fragility | Self-host fonts or use `next/font/local` |
| ESLint not configured | No automated style perf lint | Run Next.js ESLint codemod |

---

*End of performance audit.*
