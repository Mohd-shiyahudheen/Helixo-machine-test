# Helixo Countdown Timer + Analytics — Shopify App

Shopify app for creating and displaying customizable countdown timers (Fixed & Evergreen) with impression analytics on product pages via a Theme App Extension and Preact storefront widget.

## Project Structure

- `countdown-timer/` — Shopify CLI 3 embedded app (React Router 7, Polaris, App Bridge, Prisma SQLite session storage)
- `packages/api/` — Node.js + Express REST API (MongoDB, Redis, rate limiting, input sanitization)
- `packages/admin/` — Standalone React + Shopify Polaris admin UI
- `packages/widget/` — Lightweight Preact storefront widget (`dist/countdown.js`, ~18.5 kB raw / ~7.7 kB gzipped)
- `packages/theme-extension/` — Shopify Theme App Extension (`countdown.liquid`, `countdown-embed.liquid`)

## Setup Instructions

### Prerequisites
- Node.js >= 22.12
- MongoDB (`localhost:27017`) and Redis (`localhost:6379`)
- Shopify Partners account + development store + Shopify CLI 3

### Installation & Local Development
1. Install root workspace and embedded app dependencies:
   ```bash
   npm install
   cd countdown-timer && npm install && cd ..
   ```
2. Configure environment variables:
   - `packages/api/.env` (copy from `packages/api/.env.example`): `PORT`, `MONGODB_URI`, `REDIS_URL`, `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `APP_URL`, `SESSION_SECRET`
   - `countdown-timer/.env`: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SCOPES`, `SHOPIFY_APP_URL`, `API_URL`
3. Run Prisma migration for Shopify session storage:
   ```bash
   cd countdown-timer && npx prisma migrate dev --name init && cd ..
   ```
4. Build the storefront widget:
   ```bash
   npm run build:widget
   ```
5. Start services:
   ```bash
   npm run api
   cd countdown-timer && npm run dev
   ```

### Tests & Linting
```bash
npm test
npm run lint -w api
npm run lint -w admin
cd countdown-timer && npm run lint
```

## Architecture Decisions

1. **Theme App Extension over ScriptTag**: Uses Shopify's Theme App Extension (`packages/theme-extension/`) instead of deprecated ScriptTags so merchants control placement in the Theme Editor with zero leftover scripts on uninstall.
2. **MERN + Shopify CLI 3 Hybrid**: `countdown-timer/` handles Shopify OAuth, App Bridge embedding, and Polaris admin routes, delegating timer/analytics persistence to `packages/api/` (Express + MongoDB + Redis) for multi-tenant isolation by `shopDomain`.
3. **Lightweight Preact Widget**: Built with Preact instead of full React to keep the storefront bundle at ~7.71 kB gzipped (well under the 30 kB PRD limit and 15 kB target).
4. **Targeting Priority**: `publicTimers.js` matches active timers in priority order: `product` > `collection` > `all`.
5. **Evergreen Session Persistence**: Evergreen timers store per-visitor start timestamps in `localStorage` (`helixo_timer_<id>_start`) and automatically reset upon expiry.

## API Documentation

Base URL: `http://localhost:3000`

### Health
- `GET /health` — Returns `{ "status": "ok" }`.

### Timers (Authenticated / Multi-tenant via `shopDomain`)
All `/api/timers` routes validate `shopDomain` (`*.myshopify.com`) via query, body, or `X-Shop-Domain` header.
- `GET /api/timers?shopDomain=...` — List all timers for a store, sorted newest first.
- `GET /api/timers/:id?shopDomain=...` — Get single timer by ID.
- `POST /api/timers` — Create a timer (`name`, `description`, `labelText`, `timerType`, `startDate`, `endDate`, `durationHours`, `targetType`, `targetIds`, `design`, `status`).
- `PUT /api/timers/:id` — Update a timer (preserves existing `design` fields on partial updates).
- `DELETE /api/timers/:id?shopDomain=...` — Delete a timer.

### Public Storefront API
- `GET /api/public/timers?shopDomain=...&productId=...&collectionIds=...` — Single optimized call returning the highest-priority active timer for the product/collection/all. Returns `{ "timer": null }` when none match or fixed timer expired.

### Analytics
- `POST /api/analytics/impression` — Body `{ timerId, shopDomain }`. Verifies `timerId` belongs to `shopDomain` and increments daily impression count. Returns `204`.
- `GET /api/analytics?shopDomain=...&from=...&to=...` — Returns daily impression records for the store within the date range.

### Shops
- `GET /api/shops/:shopDomain` — Get shop install metadata.
- `POST /api/shops` — Upsert shop domain and access token.

## Rate Limiting Approach

- `express-rate-limit` is applied globally to `/api/` routes (`windowMs: 60000`, `max: 100` requests per minute per IP), returning HTTP `429` with JSON error message when exceeded.
- Storefront traffic is further shielded by Redis caching and HTTP `Cache-Control` headers so repeated product page loads avoid hitting MongoDB or exhausting rate limits.

## Performance Optimizations & CLS Prevention

- **Bundle Size**: Preact widget compiles to `18.52 kB` raw / `7.71 kB` gzipped (`packages/widget/dist/countdown.js`).
- **Redis Caching**: `publicTimers.js` caches resolved timer payloads in Redis (`TTL = 60s`) keyed by `timer:<shop>:<productId>:<collections>`, with active-window re-validation on cache hit.
- **HTTP Cache Headers**: `GET /api/public/timers` sets `Cache-Control: public, max-age=30, stale-while-revalidate=60`.
- **Zero CLS (Cumulative Layout Shift)**: `countdown.liquid` pre-allocates `style="min-height: 50px;"` on the root container before async script execution, and `Countdown.jsx` uses `fontVariantNumeric: "tabular-nums"` so digit updates do not shift width.
- **Graceful Degradation**: Failed network requests retry once and collapse cleanly (`null`) without throwing errors onto the storefront.

## Security

- **Shop Ownership Validation**: `shopDomainValidator` enforces valid `.myshopify.com` domains on timer, public, and analytics endpoints; `POST /api/analytics/impression` verifies `timerId` belongs to `shopDomain`.
- **XSS Prevention**: All string inputs (`name`, `description`, `labelText`) are stripped of HTML tags via `sanitize-html` (`sanitize.js`).
- **Security Headers**: `helmet` middleware enabled on Express API.

## Assumptions Made

- **Multi-tenant Isolation**: Requests from `countdown-timer/` are authenticated via Shopify OAuth (`authenticate.admin(request)`) and scoped by `session.shop` when calling `packages/api`.
- **Urgency Threshold**: Visual urgency cues (`color_pulse` / `shake`) activate automatically when 15 minutes or less remain on the countdown.
- **Collection Resolution**: Product collection IDs are passed directly from Liquid (`product.collections | map: 'id'`) in `countdown.liquid` to avoid extra Shopify Admin API round-trips on storefront page loads.
