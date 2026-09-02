# OMINO Launch Checklist

**Product:** OMINO — AI Business OS  
**Last updated:** 2026-09-02 (Phase 12)

Use this checklist before presenting OMINO to real businesses or opening production signups.

---

## Product

- [x] Core flows implemented (Phases 1–11)
- [x] Marketing funnel CTAs route to `/signup` and `/login` (not legacy `login.html`)
- [x] Branded 404 and global error pages
- [x] New-business getting-started guidance on overview
- [x] Onboarding completion step before Business OS
- [x] Empty states for inventory (mobile), team
- [ ] Full end-to-end QA on production database (signup → sale → analytics)
- [ ] Mobile QA at 320–1280px+ on all critical surfaces
- [ ] Accessibility spot-check (keyboard, focus, forms, dialogs)

---

## Security

- [x] Auth middleware on `/app/*`
- [x] RBAC permission checks on APIs
- [x] AI tool confirmation + permission re-check
- [x] Automation execute permission
- [x] Signup rate limiting
- [x] Phase 11 security tests pass (`npm run test:phase11`)
- [ ] **RLS policies applied to production Postgres** (`prisma/migrations/rls_phase*.sql`)
- [ ] Cross-tenant isolation verified on production DB
- [ ] `AUTOMATION_CRON_SECRET` set in production
- [ ] Login rate limiting (deferred from Phase 11)
- [ ] Secrets rotated; no dev credentials in production

---

## Performance

- [x] Production build passes (`npm run build`)
- [x] Typecheck passes (`npm run typecheck`)
- [x] Security headers configured (`next.config.ts`)
- [x] `/app/*` and `/api/*` noindex headers
- [ ] Bundle review on slow 3G (marketing GSAP page)
- [ ] Database query review under real load
- [ ] Shared rate limiter if multi-instance deployment

---

## Infrastructure

- [ ] Production environment (Vercel or equivalent) deployed
- [ ] `DATABASE_URL` — production Supabase/Postgres
- [ ] `NEXTAUTH_SECRET`, `NEXTAUTH_URL` configured
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] Auth redirect URLs configured in provider
- [ ] **Database backups** enabled and tested restore
- [ ] Cron job for `/api/automations/process` with secret header
- [ ] Domain + HTTPS verified
- [ ] Monitoring/alerting configured (errors, failed payments, auth failures)

---

## Marketing

- [x] Homepage hero communicates what / who / why / CTA
- [x] Primary CTA → `/signup`
- [x] SEO metadata on root layout + marketing `index.html`
- [x] `sitemap.xml` via `src/app/sitemap.ts`
- [x] `robots.txt` disallows `/app/`, `/api/`
- [x] Legacy checkout/confirm redirect to `/signup`
- [ ] Founding cap enforced server-side (currently messaging only)
- [ ] OG images verified on social previews

---

## QA Browsers

- [ ] Chrome (desktop)
- [ ] Safari (desktop)
- [ ] Edge
- [ ] Mobile Safari
- [ ] Mobile Chrome

### Critical paths to verify

1. Signup → Onboarding → Dashboard
2. Product → Variant → Inventory
3. POS session → Sale → Order → Inventory update
4. Storefront → Cart → Checkout → Order
5. Customer profile → Orders → Tags → Notes
6. Analytics overview + workspace
7. AI question → tool → confirm → result
8. Automation create → activate → execute
9. Marketing audience → promotion → campaign

---

## Rollback plan

| Item | Procedure |
|------|-----------|
| **Previous deployment** | Vercel: promote previous deployment from dashboard |
| **Database migrations** | Never run destructive migrations on prod without backup; roll forward with fix migration |
| **RLS changes** | Keep SQL scripts versioned; test on staging first |
| **Critical failure** | 1) Roll back app deployment 2) Verify health `/api/health` 3) Pause cron 4) Communicate outage |

---

## Launch recommendation

**Status: NOT READY TO LAUNCH** — see `OMINO-PHASE-12-IMPLEMENTATION.md` for blockers and scorecard.
