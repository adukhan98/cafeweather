# Toronto Café Discovery Product Design

## Product decision

Build a mobile-first Toronto café guide organized around moods and occasions. The guide launches with the cafés collected from the source X thread, treats editorial curation as the source of truth, and uses community suggestions and quick reactions as moderated inputs rather than open reviews.

The working brand is **Café Weather**: a place for answering “what kind of café fits today?” The final name may change only if the brand-conflict check finds a material collision.

## Audience and job

The primary audience is someone choosing a Toronto café on a phone, either immediately or while planning an afternoon. The primary job is: **find a café that fits the moment**. Secondary jobs are exploring neighbourhoods, finding a specific drink or amenity, and accepting a serendipitous roulette choice.

## Experience principles

1. Mood leads; map, neighbourhood, and offering filters support it.
2. Every recommendation explains why the café belongs.
3. Exact address, branch ambiguity, source, and verification date are visible.
4. No fabricated ratings, reviews, venue photography, opening status, or popularity claims.
5. Community input is structured and moderated.
6. The useful action is never more than two taps away on mobile.

## Launch scope

### Included

- Homepage with mood-led discovery surfaces.
- Search and filters for mood, neighbourhood, offering, and practical attributes.
- Catalogue/list and map views of the same filtered result set.
- Café detail routes with address, directions, editorial note, recommendations, tags, source, and last verification date.
- Deterministic Café Roulette that respects active filters and avoids immediate repeats.
- Anonymous quick reactions for structured attributes.
- Café suggestion form protected by validation, honeypot, rate limiting, and optional Turnstile in production.
- Loading, empty, error, success, disabled, hover, focus, and active states.
- Mobile layouts verified at 320, 375, 414, and 768 CSS pixels.
- Cloudflare Worker API, D1 schema, seed data, and local-development fallback.

### Deferred

- User accounts and profiles.
- Written public reviews and star ratings.
- Saved lists synchronized across devices.
- User-uploaded venue photography.
- Automated hours ingestion or “open now” claims.
- Public admin interface; moderation starts through D1/CLI workflows.

## Information architecture

### `/`

Editorial masthead, compact search, mood-led rails, neighbourhood index, selected editor picks, catalogue entry point, map entry point, and roulette trigger.

### `/cafes`

Filterable complete catalogue with list/map switch, active-filter summary, result count, reset action, and meaningful no-results recovery.

### `/cafes/:slug`

Café identity, precise branch/address, directions link, why it fits, what to order, moods, offerings, practical notes, verification/source disclosure, quick reactions, and nearby alternatives.

### `/roulette`

Filter-aware selection flow with one clear result, reason for the match, directions, reroll, and return-to-browse actions.

### `/suggest`

Structured submission form for name, address or map URL, reason, and optional recommendation. Successful submissions enter a pending moderation state and are never published automatically.

## Design system

Hallmark macrostructure: **Ecosystem Index**. Theme: **Garden**. Navigation: **N6 Newspaper Masthead**. Footer: **Ft1 Mast-headed**. Design Taste settings: variance 8, motion 6, density 4.

The visual system uses warm paper neutrals, charcoal ink, and one restrained leaf-green accent. Typography pairs an editorial roman display face with a clean sans-serif UI/body face. Layout is asymmetric on desktop and strictly single-column below 768 px. Cards appear only for café entities; collections use open rails, rules, type, and negative space.

The first load uses one orchestrated entrance. Filter changes use short opacity/transform transitions and layout continuity. Roulette uses a deliberate card-reveal transition. Reduced-motion mode removes spatial movement. No emoji, neon, purple gradients, fake browser chrome, fake metrics, italic headings, generic three-card feature rows, or decorative glass panels.

## Data model

### Café

- `id`, `slug`, `name`, `branchName`
- `address`, `city`, `province`, `postalCode`
- `latitude`, `longitude`, `neighbourhood`
- `summary`, `recommendation`, `limitations`
- `moods[]`, `offerings[]`, `attributes[]`
- `sourceUrl`, `mapsUrl`, `verifiedAt`, `verificationStatus`
- `featured`, `published`, `createdAt`, `updatedAt`

### Reaction

- `id`, `cafeId`, `attribute`, `visitorHash`, `createdAt`
- Unique constraint on `(cafeId, attribute, visitorHash)` to make reactions idempotent per visitor/attribute.

### Suggestion

- `id`, `name`, `address`, `mapUrl`, `reason`, `recommendation`
- `status`, `visitorHash`, `createdAt`, `reviewedAt`

## API contract

- `GET /api/cafes` returns published cafés and structured filter metadata.
- `GET /api/cafes/:slug` returns a published café or 404.
- `POST /api/cafes/:id/reactions` validates an allowed attribute and performs an idempotent insert.
- `POST /api/suggestions` validates and stores a pending suggestion; it never publishes directly.
- Errors use `{ error: { code, message, field? } }` and appropriate HTTP status codes.

Static seed data remains the build-time catalogue fallback. D1 becomes authoritative for community writes and can later become authoritative for café reads without changing the public API.

## Architecture

- React Router v7 framework application with TypeScript.
- Tailwind CSS v4 for utility styling, backed by Hallmark CSS tokens.
- Cloudflare Workers for SSR/static assets and API routes.
- Cloudflare D1 for reactions, suggestions, and future catalogue administration.
- R2 is reserved for future licensed venue media; it is not required for launch.
- MapLibre renders the interactive map with a configurable tile style and an attribution-compliant provider.
- Zod validates shared form/API inputs.
- Vitest and Testing Library cover units/components; Playwright covers critical browser paths.

## Error and abuse handling

- Read failures retain the seeded catalogue and disclose degraded community features.
- Reaction failures restore the previous count and show an inline retry action.
- Suggestion validation occurs on blur and submit with stable helper/error space.
- A honeypot, visitor hash, request-size limit, and per-IP time bucket reduce abuse locally; Turnstile verification is enabled when production secrets exist.
- Map failure falls back to the complete accessible list and directions links.

## Verification

1. Unit tests for filtering, tag normalization, deterministic roulette, validation, and visitor-reaction idempotency.
2. Component tests for filter state, empty recovery, roulette controls, and form states.
3. Worker integration tests for API success, validation errors, idempotency, and unavailable-binding fallback.
4. Playwright tests for browse → filter → detail → directions, roulette, reaction, and suggestion paths.
5. Production build, TypeScript, lint, and `git diff --check` must pass.
6. Browser QA at desktop plus 320, 375, 414, and 768 px, including keyboard-only navigation and reduced motion.
7. Hallmark 58-gate slop review and direct comparison between the accepted concept image and the final browser screenshot.

## Success criteria

- A visitor can find a relevant café by mood in under two interactions.
- Every published café has a precise or explicitly qualified location and source.
- Roulette never returns a café outside active filters.
- Community submissions remain pending and cannot alter the public catalogue.
- The complete critical path works locally without Cloudflare credentials.
- The repository is published to GitHub with setup, test, and deployment documentation.
