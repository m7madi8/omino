# OMINO Commerce Power Layer

Architecture documentation for the 10 high-value commerce capabilities that extend OMINO from a storefront platform into an intelligent commerce system.

## Overview

The Commerce Power Layer builds on existing OMINO domains (Products, Orders, Payments, Customers, Marketing, AI) without duplicating business logic. All features are tenant-scoped via `Organization` → `Store`.

```
Merchant (/app)                    Customer (/store/[slug])
├── Collections                    ├── Collections pages
├── Promotions (Marketing)         ├── Search + recommendations
├── Store Analytics                ├── Cart + checkout
├── Reviews moderation             ├── Product reviews
├── Custom domains                 ├── Customer accounts
├── AI Store Designer              └── Order tracking
└── AI Merchandising
```

## Database Changes

New Prisma models in `prisma/schema.prisma`:

| Model | Purpose |
|-------|---------|
| `Collection` | Manual/automated product collections |
| `CollectionProduct` | Ordered products in a collection |
| `StorefrontEvent` | Persisted storefront analytics events |
| `StorefrontDailyMetric` | Aggregated daily funnel metrics |
| `SearchQueryLog` | Search intelligence |
| `ProductAffinity` | Co-purchase recommendations |
| `StorefrontAccount` | Customer login linked to `Customer` |
| `StoreDomain` | Custom domain foundation |
| `ProductReview` | Product reviews with moderation |
| `ReviewMedia` | Review images (foundation) |

Extended `MarketingPromotion`:
- `promotionKind`: `PERCENT_OFF` | `FIXED_OFF` | `FREE_SHIPPING`
- `collectionIds`: collection-scoped discounts

## Services

| Service | Path | Responsibility |
|---------|------|----------------|
| `CollectionService` | `collection-service.ts` | CRUD, publish, storefront resolution |
| `PromotionEngine` | `promotion-engine.ts` | Server-side discount calculation |
| `StorefrontAnalyticsService` | `storefront-analytics-service.ts` | Events, funnel, search analytics |
| `SearchService` | `search-service.ts` | Multi-entity search + query logging |
| `RecommendationService` | `recommendation-service.ts` | Related products, affinity |
| `StorefrontCustomerAuthService` | `storefront-customer-auth-service.ts` | Register, login, orders |
| `ReviewService` | `review-service.ts` | Reviews CRUD + moderation |
| `StoreDomainService` | `store-domain-service.ts` | Domain CRUD, DNS instructions |
| `StoreIntelligenceService` | `store-intelligence-service.ts` | AI store + merchandising analysis |

Marketing promotions remain in `marketing/promotion-service.ts`, extended via `PromotionEngine`.

## Events

Unified storefront event pipeline:

```
Storefront action → emitStorefrontEvent() → StorefrontEvent table → StorefrontDailyMetric
```

Event types:
- `STORE_VIEWED`, `PRODUCT_VIEWED`, `SEARCH_PERFORMED`, `SEARCH_NO_RESULTS`
- `CATEGORY_VIEWED`, `COLLECTION_VIEWED`
- `PRODUCT_ADDED_TO_CART`, `CHECKOUT_STARTED`, `ORDER_COMPLETED`
- `REVIEW_CREATED`, `PROMOTION_APPLIED`

Events integrate with existing `BusinessEvent` bus for automations (via domain services).

## API Routes

### Admin (`/api/`)
| Route | Methods | Permission |
|-------|---------|------------|
| `/api/collections` | GET, POST | products.read/write |
| `/api/collections/[id]` | GET, PATCH, DELETE | products.read/write |
| `/api/collections/[id]/publish` | POST | products.write |
| `/api/store/analytics/funnel` | GET | analytics.read |
| `/api/store/intelligence/analyze` | GET | store.read |
| `/api/store/intelligence/merchandising` | GET | products.read |
| `/api/store/domains` | GET, POST, PATCH, DELETE | store.read/write |
| `/api/reviews` | GET, PATCH | products.read/write |

### Storefront (`/api/storefront/[storeSlug]/`)
| Route | Purpose |
|-------|---------|
| `/search` | Advanced search |
| `/recommendations` | Related / FBT products |
| `/events` | Client-side analytics beacon |
| `/auth` | Customer register/login/logout |
| `/account` | Customer profile + orders |
| `/products/[slug]/reviews` | Public reviews |

## Permissions

Uses existing RBAC. Collections use `products.read` / `products.write`. Store intelligence uses `store.read` and `analytics.read`.

## AI Integration

New tools in `server/ai/tools/registry.ts`:

| Tool | Agent | Purpose |
|------|-------|---------|
| `analyze_storefront` | GROWTH | Store experience insights |
| `analyze_product_merchandising` | GROWTH | Product performance insights |

Flow: **Analyze → Recommend → (optional) Confirm → Execute → Publish**

AI tools are read-only for analysis. Write actions require existing confirmation gate via `AiAction`.

## Feature Summary

### 1. AI Store Designer
- `GET /api/store/intelligence/analyze`
- Deterministic checks + real funnel data
- AI tool `analyze_storefront` for conversational access

### 2. Collections Engine
- Admin: `/app/collections`
- Storefront: `/store/[slug]/collections/[collectionSlug]`
- Manual collections with ordered products

### 3. Discounts & Promotions
- Extended `MarketingPromotion` with `promotionKind`, `collectionIds`
- `PromotionEngine` for server-side calculation
- Free shipping support foundation

### 4. Store Analytics & Funnel
- Persisted events replacing console-only logging
- `GET /api/store/analytics/funnel`
- Daily metrics aggregation

### 5. AI Product Merchandising
- `GET /api/store/intelligence/merchandising`
- Views vs add-to-cart analysis from real events
- AI tool `analyze_product_merchandising`

### 6. Product Recommendations
- `GET /api/storefront/[slug]/recommendations?product=slug&type=related|frequently_bought_together`
- Category-based + `ProductAffinity` co-purchase

### 7. Customer Accounts
- `StorefrontAccount` linked to `Customer`
- Cookie-based session per store
- `/api/storefront/[slug]/auth` + `/account`

### 8. Advanced Search
- Multi-entity search (products, categories, collections)
- Query logging + zero-result tracking

### 9. Custom Domains
- `StoreDomain` model with verification states
- DNS instructions (CNAME + TXT)
- Provider-agnostic — no fake SSL status

### 10. Reviews & Social Proof
- `ProductReview` with moderation workflow
- Verified purchase from real order data
- Public display only for `PUBLISHED` reviews

## Security

- All admin APIs use `requireTenantContext` with permission checks
- Storefront APIs resolve store by `publicSlug` — never trust client org/store IDs
- Customer accounts scoped per store (`storeId` + email unique)
- Reviews require moderation before public display
- Promotion calculations server-side only

## Performance

- Analytics writes are fire-and-forget with `keepalive` fetch
- Daily metric upserts avoid full table scans
- Recommendations use indexed affinity lookups
- Search uses Prisma `contains` (FTS upgrade path documented)

## Future Extension Points

- Smart collections (rules engine on `Collection.rules`)
- Full-text search (Postgres FTS / Meilisearch)
- Automatic DNS verification providers
- AI write actions for store experience (with confirmation)
- Review media uploads
- Customer magic-link auth
- Host-based middleware routing for custom domains

## Migration

After pulling these changes, run:

```bash
npx prisma generate
npx prisma db push
```

Restart the dev server if Prisma client generation fails due to file locks.
