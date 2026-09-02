# OMINO — Security Audit Report

**Phase:** 11 — Security + Performance + Scale  
**Date:** 2026-09-02  
**Scope:** Full application security review across auth, tenancy, API, AI, automation, payments, and infrastructure.

---

## Executive Summary

OMINO enforces multi-tenant isolation primarily through **server-side `requireTenantContext()`** on business APIs, **organization-scoped Prisma queries**, and **RBAC permission checks**. Phase 11 hardened several real vulnerabilities (open cron endpoint, missing AI confirmation permissions, organization PATCH without authorization, automation feedback loops, client-trusted POS/storefront pricing, and missing abuse controls).

**Overall posture:** Suitable for controlled production launch with documented remaining risks below. **No unresolved CRITICAL** issues after Phase 11 fixes. Several **HIGH/MEDIUM** operational gaps remain (distributed rate limiting, RLS deployment verification, marketing API surface incomplete).

---

## Methodology

1. Read architecture docs (Phases 1–10) and inspected source code.
2. Reviewed middleware, auth, tenant helpers, API routes, domain services, AI/automation layers, Prisma schema, and RLS SQL migrations.
3. Ran `npm run test:phase11` (10 security-focused unit tests).
4. Ran `npm audit` for dependency vulnerabilities.
5. Applied fixes where evidence of real risk existed.

---

## Findings & Resolutions

### CRITICAL

| ID | Finding | Area | Status | Fix |
|----|---------|------|--------|-----|
| SEC-C01 | `/api/automations/process` accepted unauthenticated requests when `AUTOMATION_CRON_SECRET` unset | Automation / Cron | **Fixed** | Returns `503 CRON_NOT_CONFIGURED` in production when secret missing; Bearer auth required when secret set |
| SEC-C02 | AI `confirmAction()` executed write tools without re-checking tool permissions at confirmation time | AI | **Fixed** | `hasToolPermission()` enforced in `action-service.ts` before `executeWriteTool()` |
| SEC-C03 | Storefront cart recalculation called `calculateOrderTotals()` without line items — totals could be wrong (financial integrity) | Payments / Storefront | **Fixed** | `recalculateStorefrontCart()` now passes `lines` and `discountAmount` |

### HIGH

| ID | Finding | Area | Status | Fix / Mitigation |
|----|---------|------|--------|------------------|
| SEC-H01 | `PATCH /api/organization` had no `settings.write` permission check; accepted arbitrary `organizationId` in body | Authorization | **Fixed** | Requires `settings.write`; blocks cross-org `organizationId`; Zod validation |
| SEC-H02 | POS checkout could proceed with stale/manipulated `unitPriceMinor` from cart | Payments / POS | **Fixed** | Checkout re-validates prices against `variant.sellingPrice` and updates cart lines |
| SEC-H03 | Automation inventory adjustments could re-trigger automations (infinite loop risk) | Automation | **Mitigated** | `event-bus.ts` skips automation processing when `source === 'automation'`; inventory adjustments tag `referenceType: 'automation'` |
| SEC-H04 | RLS policies exist in SQL migration files but are **not automatically applied** by Prisma migrate | Database | **Open** | Manual deployment required: `prisma/migrations/rls_*.sql`. Application-layer tenant checks are primary defense today |
| SEC-H05 | Rate limiting is **in-memory per process** — ineffective across multiple instances | Abuse protection | **Open** | Documented; use Redis/shared store before horizontal scale |
| SEC-H06 | Signup endpoint had no rate limiting (account enumeration / spam) | Auth | **Fixed** | IP-based limit via `SIGNUP_RATE_LIMIT_PER_HOUR` |
| SEC-H07 | No login / password-recovery rate limiting | Auth | **Open** | NextAuth routes not yet rate-limited; recommend edge/WAF or shared limiter |

### MEDIUM

| ID | Finding | Area | Status | Fix / Mitigation |
|----|---------|------|--------|------------------|
| SEC-M01 | Prompt injection via user messages and business text | AI | **Mitigated** | `prompt-sanitizer.ts` filters common injection patterns; orchestrator sanitizes user messages |
| SEC-M02 | Untrusted business context (customer notes, descriptions) not consistently wrapped | AI | **Partial** | `wrapUntrustedContext()` available; not yet applied to all tool context builders |
| SEC-M03 | `/api/*` business routes not protected by middleware — rely on per-handler auth | API | **Accepted** | Consistent `requireTenantContext()` pattern on sensitive routes; middleware protects `/app` UI only |
| SEC-M04 | `GET/PATCH /api/context` uses `auth()` without `setTenantContext()` | Tenancy / RLS | **Open** | Membership validation exists in `updateUserContext()`; RLS session vars not set on this route |
| SEC-M05 | Marketing domain (Phase 10 schema/services) has no public API routes yet | Marketing | **N/A** | Services scope by `organizationId`; exposure risk low until APIs ship |
| SEC-M06 | No Content-Security-Policy header | Headers | **Deferred** | CSP can break Next.js inline scripts/fonts; other security headers added in `next.config.ts` |
| SEC-M07 | Error responses generally safe (`SERVER_ERROR`) but some routes log full errors to console | Info leakage | **Partial** | `handleApiError()` redacts client responses; structured logger redacts sensitive keys |

### LOW / INFO

| ID | Finding | Area | Status | Notes |
|----|---------|------|--------|-------|
| SEC-L01 | `poweredByHeader` disabled | Headers | **Fixed** | `next.config.ts` |
| SEC-L02 | `/app` and `/api` return `X-Robots-Tag: noindex` | SEO / Privacy | **Fixed** | Prevents accidental indexing |
| SEC-L03 | `public/robots.txt` disallows `/app` and `/api` | SEO | **Fixed** | |
| SEC-L04 | Health endpoint exposes uptime/version only | Observability | **Accepted** | No secrets; DB check is boolean |
| SEC-L05 | `NEXT_PUBLIC_*` vars reviewed — no service role or AI keys exposed | Secrets | **Pass** | AI keys server-side only per `.env.example` |
| SEC-L06 | Payment amounts validated server-side against order totals | Payments | **Pass** | `payment-service.ts` enforces remaining balance |
| SEC-L07 | Refund amounts validated against refundable balance | Payments | **Pass** | `getRefundableAmount()` |
| SEC-L08 | Idempotency keys on payments and POS checkout | Payments | **Pass** | Duplicate prevention via unique constraints |
| SEC-L09 | Inventory checkout uses transactional `adjustStockInTx` | Concurrency | **Pass** | Stock validated inside transaction |
| SEC-L10 | AI tools route through registry + permission layer — no raw SQL | AI | **Pass** | Tool handlers call domain services |
| SEC-L11 | Automation actions require `automations.execute` permission | Automation | **Pass** | Registry-enforced |
| SEC-L12 | Automation per-org execution rate limit | Automation | **Fixed** | `AUTOMATION_EXEC_RATE_LIMIT_PER_MINUTE` |

---

## Multi-Tenant Isolation Review

### Model

```
User → Membership → Organization → Store → Branch → Business Data
```

### Enforcement layers

| Layer | Mechanism | Coverage |
|-------|-----------|----------|
| UI | Middleware redirects unauthenticated users from `/app` | UI only |
| API | `requireTenantContext(permission?)` + `setTenantContext()` | Products, inventory, orders, payments, POS, customers, analytics, AI, automations |
| Services | `organizationId` in every `where` clause | Domain services reviewed |
| Database | RLS policies in `prisma/migrations/rls_phase*.sql` | **Must be applied manually** |

### Per-domain tenant checks

| Domain | Server enforcement | Notes |
|--------|-------------------|-------|
| Products / variants | ✅ `organizationId` + permissions | |
| Inventory | ✅ Org-scoped adjustments | Automation source tagged |
| Orders / payments | ✅ Org-scoped + state guards | Amounts server-validated |
| Customers / CRM | ✅ Org-scoped | |
| Analytics | ✅ `requireTenantContext('analytics.read')` | Read-only aggregation |
| AI conversations / actions | ✅ Org-scoped + user ownership on confirm | Permission re-check added |
| Automations | ✅ Org-scoped executions | Loop protection added |
| Marketing (schema) | ✅ Service-layer org scope | No API routes yet |

### IDOR test strategy

Phase 11 tests verify permission boundaries at the tool/action registry level. Full cross-tenant integration tests require a live database (`DATABASE_URL`); not run in this environment.

---

## Authentication & Authorization

| Control | Status |
|---------|--------|
| `/app/*` requires session + onboarding | ✅ Middleware |
| `/main`, `/store/*` public | ✅ Middleware exclusions |
| `/api/auth/*` public | ✅ Expected |
| `/api/storefront/*` public (store-scoped) | ✅ By design |
| Role permissions centralized | ✅ `lib/permissions/constants.ts` |
| High-risk ops server-checked | ✅ Refunds, inventory, settings, automations |
| Client role not trusted | ✅ Session-derived permissions only |

---

## AI Security

| Control | Status |
|---------|--------|
| No raw DB/SQL from AI | ✅ |
| Tool registry with permissions | ✅ |
| Write tools require confirmation | ✅ |
| Confirm path re-checks permissions | ✅ Fixed |
| Rate limiting on AI messages | ✅ Per-user/org minute limit |
| Prompt injection filtering | ✅ Mitigated |
| Cross-tenant context | ✅ Blocked via tenant context |

---

## Automation Security

| Control | Status |
|---------|--------|
| Tenant isolation on executions | ✅ |
| Action permission checks | ✅ |
| Idempotency keys per event/automation/version | ✅ |
| Loop protection (automation → event → automation) | ✅ Fixed |
| Per-org execution rate limit | ✅ Fixed |
| Cron endpoint protection | ✅ Fixed |

---

## Payment Safety

| Control | Status |
|---------|--------|
| Server-side order total calculation | ✅ Minor units |
| Client prices not trusted at checkout | ✅ POS + storefront |
| Payment amount ≤ remaining balance | ✅ |
| Refund ≤ refundable amount | ✅ |
| Idempotency on payments | ✅ |
| Float arithmetic avoided | ✅ Integer minor units |

---

## Dependency Audit (`npm audit`)

| Package | Severity | Notes |
|---------|----------|-------|
| `deepmerge-ts` (via Prisma) | High | Stack exhaustion on recursive merge — dev/tooling path; monitor Prisma upgrades |
| `postcss` (via Next.js) | High | XSS/path traversal in CSS tooling — affects build pipeline, not runtime request handling |

**Action taken:** No blind `--force` upgrades (would bump Next to 16.x). Documented for scheduled dependency review.

---

## Remaining Risks & Launch Blockers

### Launch blockers (must address before public launch)

1. **Apply RLS policies** to production Postgres and verify with cross-tenant test queries.
2. **Set `AUTOMATION_CRON_SECRET`** in production and restrict cron invoker network access.
3. **Replace in-memory rate limits** with shared store before running multiple app instances.

### Acceptable for MVP with monitoring

- CSP not configured (other headers present)
- Login rate limiting deferred to edge/WAF
- Marketing APIs not yet exposed
- Prompt injection defense is pattern-based (not ML-based)

---

## Files Changed in Phase 11 (Security)

| File | Change |
|------|--------|
| `src/app/api/automations/process/route.ts` | Cron fail-closed |
| `src/server/events/event-bus.ts` | Automation loop skip |
| `src/server/services/inventory-service.ts` | Automation event source tagging |
| `src/server/ai/action-service.ts` | Permission re-check on confirm |
| `src/app/api/organization/route.ts` | RBAC + validation |
| `src/server/services/pos-service.ts` | Price authority at checkout |
| `src/server/services/storefront-service.ts` | Cart totals fix + price validation (existing) |
| `src/lib/security/prompt-sanitizer.ts` | Injection filtering |
| `src/server/ai/orchestrator.ts` | Sanitize user messages |
| `src/lib/security/rate-limit.ts` | Shared rate limiter |
| `src/app/api/auth/signup/route.ts` | Signup rate limit |
| `src/server/automation/execution-service.ts` | Per-org execution limit |
| `next.config.ts` | Security headers |
| `public/robots.txt` | Crawl rules |
| `src/app/api/health/route.ts` | Health check |
| `src/lib/observability/logger.ts` | Structured logging |

---

*End of security audit.*
