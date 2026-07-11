# Meet Me There

A better answer to “where?”

Meet Me There is a warm, curated, branch-aware Toronto café guide. It combines mood-led discovery, search and filters, a real map, café details, café roulette, anonymous community reactions, and moderated café suggestions without inventing ratings, hours, photos, or practical attributes the source data does not support.

Live app: [meet-me-there.adnaankhan0901.workers.dev](https://meet-me-there.adnaankhan0901.workers.dev)

## What ships

- 36 verified or branch-qualified Toronto café records
- mood, neighbourhood, offering, search, list, and map discovery
- shareable filter URLs and honest no-match states
- branch-aware detail pages with source, verification date, directions, and nearby alternatives
- deterministic café roulette with filter preservation and no immediate repeat
- seven anonymous reactions with optimistic updates and reload persistence
- moderated café suggestions accepting an address or HTTPS map link
- responsive editorial UI verified from 320 px through 1440 px

Tim Hortons and Starbucks are explicitly outside the guide’s scope.

## Architecture

| Layer | Choice |
| --- | --- |
| UI and routing | React 19 + React Router 8 |
| Runtime | Cloudflare Workers |
| Database | Cloudflare D1 / SQLite |
| Build | Vite + Cloudflare Vite plugin |
| Map | MapLibre GL + OpenFreeMap/OpenStreetMap |
| Abuse protection | Cloudflare Turnstile + D1-backed rate limits |
| Unit/integration tests | Vitest + Testing Library |
| Browser/accessibility tests | Playwright + axe-core |

The Worker entry point injects Cloudflare bindings into React Router loaders and API routes. D1 is authoritative at runtime; a checked-in verified snapshot remains a transparent read-only fallback if D1 is unavailable.

Anonymous community identity uses a signed, `HttpOnly`, `Secure`, `SameSite=Lax` cookie. Only HMAC-derived hashes reach D1. Suggestion submission UUIDs are also HMAC-derived before storage; exact retries are idempotent and mismatched payload replays return `409`.

## Data provenance

The canonical editorial dataset is [`research/cafes-verified.json`](research/cafes-verified.json). [`scripts/generate-d1-seed.mjs`](scripts/generate-d1-seed.mjs) deterministically produces [`seed/dev.sql`](seed/dev.sql). Each published café carries an address-supporting source URL, a verification date, coordinates, coordinate confidence, and branch-specificity metadata.

To verify the generated seed is current:

```bash
node scripts/generate-d1-seed.mjs > /tmp/cafe-weather-seed.sql
cmp seed/dev.sql /tmp/cafe-weather-seed.sql
```

## Local development

Requirements: Node.js 22.22+ and npm 10+.

```bash
npm ci
cp .env.example .dev.vars
npm run db:migrate:local
npm run db:seed:local
npm run dev
```

Set `VISITOR_HMAC_SECRET` in `.dev.vars` to at least 32 random bytes. Turnstile is optional on localhost, so its local values may remain blank. Never commit `.dev.vars`.

## Verification

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
npx wrangler deploy --dry-run
```

The Playwright suite uses a disposable local community state, a real local D1 binding, Chromium, axe accessibility checks, keyboard interaction, reduced-motion checks, and 320/375/414/768/1280/1440 px geometry coverage.

Visual snapshots are platform-specific. The reviewed baselines are generated on macOS with the repository-pinned Playwright version:

```sh
npm run test:e2e -- --grep "visual contract" --update-snapshots
```

CI runs functional browser coverage on Ubuntu without comparing screenshots, then compares the Darwin baselines in a separate `macos-14` job. CI never updates snapshots. This prevents macOS images from being compared against Linux rendering.

## Cloudflare deployment

The tracked Wrangler config is connected to Meet Me There's canonical
production D1 database and Turnstile widget. Their database ID, site key, and
hostname are public deployment identifiers; the signing and Turnstile secrets
remain encrypted Cloudflare secrets and are never committed.

To deploy the canonical production app:

1. Authenticate with the Meet Me There Cloudflare account:

   ```bash
   npx wrangler login
   ```

2. Apply schema and verified data:

   ```bash
   npx wrangler d1 migrations apply cafe-weather --remote
   npm run db:seed:remote
   ```

3. Provision or rotate production secrets when needed:

   ```bash
   npx wrangler secret put VISITOR_HMAC_SECRET
   npx wrangler secret put TURNSTILE_SECRET
   ```

4. Deploy:

   ```bash
   npm run deploy
   ```

For a fork or a different Cloudflare account, create a new D1 database and a
Managed Turnstile widget first. Replace the tracked `database_id`,
`TURNSTILE_SITE_KEY`, and `TURNSTILE_HOSTNAME` in `wrangler.jsonc` with that
account's public identifiers, allow the exact production hostname in the
widget, then follow the migration, seed, secret, and deploy steps above.

Production suggestions fail closed if visitor signing or Turnstile is missing. The upload dry run verifies `.dev.vars` is not included in the Worker bundle.

The D1 database intentionally retains its existing `cafe-weather` name so the
release does not migrate production data. After the canonical Worker has been
deployed and verified, `wrangler.legacy.jsonc` can deploy the old `cafe-weather`
hostname as a binding-free compatibility Worker: pages receive permanent `308`
redirects and `/api/` requests are proxied to the canonical origin. Validate both
bundles without changing production:

```bash
npx wrangler deploy --dry-run
npx wrangler deploy --dry-run --config wrangler.legacy.jsonc
```

The verified editorial snapshot is public and reviewable; community reactions,
suggestions, rate limits, and anonymous identity hashes remain private in D1.

## Project layout

```text
app/                 routes, UI, contracts, domain logic, Worker-only services
migrations/          ordered D1 schema migrations
research/            verified editorial source dataset
seed/                deterministic D1 seed
tests/unit/          behavior, service, repository, and UI contracts
tests/e2e/           real-browser critical paths and quality gates
workers/             Cloudflare Worker entry point
```
