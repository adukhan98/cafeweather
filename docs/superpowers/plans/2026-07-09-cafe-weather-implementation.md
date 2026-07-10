# Café Weather Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a production-ready, Cloudflare-native Toronto café discovery app with mood-led exploration, map/list browsing, deterministic roulette, café details, structured reactions, and moderated suggestions.

**Architecture:** A React Router 8 framework-mode application renders indexable café routes through SSR on one Cloudflare Worker. Route loaders/actions call shared server services directly, while `/api/v1/*` resource routes adapt the same services for external JSON clients. Seeded café data guarantees a complete read experience without credentials; D1 stores idempotent anonymous reactions and pending suggestions.

**Tech Stack:** React 19, React Router, Vite, TypeScript, Tailwind CSS v4, Cloudflare Workers, D1, MapLibre GL, Zod, Phosphor Icons, Vitest, Testing Library, Playwright.

---

## File map

- `package.json` — commands and dependency lock.
- `vite.config.ts`, `react-router.config.ts`, `tsconfig.json`, `wrangler.jsonc` — framework, Worker, bindings, and D1 configuration.
- `tokens.css`, `app/app.css` — Hallmark tokens and application styles.
- `app/data/cafes.ts` — verified launch catalogue.
- `app/contracts/*` — café, filter, reaction, and suggestion contracts.
- `app/domain/filter-cafes.ts` — pure search/filter logic.
- `app/domain/roulette.ts` — Web-Crypto seeded, filter-aware selection.
- `app/root.tsx`, `app/routes.ts`, `app/components/AppShell.tsx` — route registry and shared chrome.
- `app/routes/*` — pages plus JSON resource routes.
- `app/features/discovery/*` — homepage surfaces and catalogue filters.
- `app/features/map/*` — client-only MapLibre map and accessible fallback.
- `app/features/cafes/*` — café entity rows and detail page.
- `app/features/roulette/*` — roulette state and reveal UI.
- `app/features/community/*` — reactions and suggestion form.
- `app/.server/*` — D1 repositories, services, Turnstile, visitor cookie, origin checks, and HTTP errors.
- `workers/app.ts` — generated React Router request-handler adapter only.
- `migrations/0001_initial.sql` — D1 schema and constraints.
- `tests/unit/*`, `tests/components/*`, `tests/worker/*` — Vitest suites.
- `e2e/*.spec.ts` — real browser paths.
- `README.md` — product, local setup, data provenance, and deployment.

### Task 1: Scaffold and prove the test harness

**Files:** Create all root config files, `app/root.tsx`, `app/routes.ts`, `app/app.css`, `workers/app.ts`, `tests/setup.ts`, and `tests/unit/smoke.test.ts`.

- [ ] Write `tests/unit/smoke.test.ts` first with an import of `app/contracts/cafes.ts` and an assertion that a minimal café record preserves its slug.
- [ ] Run `npm test -- tests/unit/smoke.test.ts` and confirm it fails because the module does not exist.
- [ ] Add the React/Vite/Worker scaffold and the minimal `Cafe` type required by the test.
- [ ] Install only dependencies declared in `package.json`; verify Tailwind v4 uses `@tailwindcss/vite` and icons use `@phosphor-icons/react`.
- [ ] Run the focused test, `npm run typecheck`, and `npm run build`; expected: all exit zero.
- [ ] Commit: `chore: scaffold Cafe Weather app`.

### Task 2: Implement the catalogue domain with TDD

**Files:** Create `app/data/cafes.ts`, `app/domain/filter-cafes.ts`, `app/domain/roulette.ts`, `tests/unit/filter-cafes.test.ts`, and `tests/unit/roulette.test.ts`.

- [ ] Write failing filter tests covering combined mood/neighbourhood/offering filters, accent-insensitive search, reset behavior, and empty results.
- [ ] Run the filter suite and confirm failures are missing-export failures.
- [ ] Implement `filterCafes(cafes, filters)` as a pure function and make the suite green.
- [ ] Write failing roulette tests proving active filters are respected, the same seed is deterministic, and an excluded previous ID is avoided when more than one result exists.
- [ ] Implement `selectCafe(cafes, filters, seed, previousId?)` and make the suite green.
- [ ] Add normalized verified café records; records with branch ambiguity must explicitly use `verificationStatus: "branch-unspecified"`.
- [ ] Run unit tests and `git diff --check`.
- [ ] Commit: `feat: add verified cafe catalogue and discovery domain`.

### Task 3: Implement Worker/D1 APIs with TDD

**Files:** Create `app/.server/db/*`, `app/.server/services/*`, `app/.server/http/*`, `app/contracts/validation.ts`, versioned resource routes, `migrations/0001_initial.sql`, and `tests/worker/api.test.ts`.

- [ ] Write failing tests for `GET /api/cafes`, café 404, reaction validation, idempotent reactions, valid suggestion creation, honeypot rejection, and unavailable-D1 fallback.
- [ ] Run `npm test -- tests/worker/api.test.ts` and confirm the routes return missing-handler failures.
- [ ] Add schema tables `reactions` and `suggestions`, including the unique reaction constraint and pending-only suggestion default.
- [ ] Implement JSON response helpers, Zod validation, request-size limits, visitor hashing, and D1 repositories behind a narrow interface.
- [ ] Make the API suite green and run local migration verification against Miniflare/Wrangler.
- [ ] Commit: `feat: add D1 reactions and suggestion API`.

### Task 4: Build the Hallmark design system and app shell

**Files:** Create `tokens.css`, `.hallmark/preflight.json`, `.hallmark/log.json`, `app/components/AppShell.tsx`, `app/features/navigation/Masthead.tsx`, and component tests.

- [ ] Write failing component tests for skip navigation, visible masthead destinations, mobile menu disclosure, keyboard focus restoration, and footer source disclosure.
- [ ] Run the tests and confirm the shell is absent.
- [ ] Implement Garden tokens, editorial roman display typography, sans UI typography, leaf-green accent, 4px spacing scale, systemic z-index scale, reduced-motion handling, and the Hallmark stamp.
- [ ] Implement the N6-derived masthead without decorative issue numbering, plus a compact mobile disclosure and Ft1-derived footer.
- [ ] Verify every interactive primitive has default, hover, focus, active, disabled, loading, error, and success treatment where applicable.
- [ ] Run component tests and axe checks.
- [ ] Commit: `feat: establish Cafe Weather design system`.

### Task 5: Build discovery, filters, and map/list views

**Files:** Create `src/features/discovery/*`, `src/features/cafes/CafeRow.tsx`, `src/features/map/CafeMap.tsx`, routes for `/` and `/cafes`, and related tests.

- [ ] Write failing component tests for mood selection, combined filters, URL query synchronization, search, reset, result counts, list/map switch, and no-results recovery.
- [ ] Implement the homepage as an Ecosystem Index: mood rail, editor picks, neighbourhood index, and complete-catalogue entry.
- [ ] Implement the catalogue with open rows rather than a generic equal-card grid.
- [ ] Lazy-load MapLibre; synchronize map markers with the filtered list and provide an always-available semantic list fallback.
- [ ] Add skeleton loading and inline map-error recovery.
- [ ] Run component tests, typecheck, and build.
- [ ] Commit: `feat: add mood-led cafe discovery`.

### Task 6: Build café details and roulette

**Files:** Create `src/features/cafes/CafeDetailPage.tsx`, `src/features/roulette/RoulettePage.tsx`, route entries, and tests.

- [ ] Write failing tests for exact address disclosure, branch ambiguity, recommendation rendering, source/verification display, directions URL, filter-aware roulette, reroll, and no-match recovery.
- [ ] Implement detail pages with honest source and verification language.
- [ ] Implement roulette as a deliberate single-result reveal using transform/opacity only, respecting reduced motion and avoiding immediate repeats.
- [ ] Make focused tests green; run the whole unit/component suite.
- [ ] Commit: `feat: add cafe details and roulette`.

### Task 7: Build community reactions and suggestions

**Files:** Create `src/features/community/ReactionBar.tsx`, `SuggestionForm.tsx`, API client helpers, and component tests.

- [ ] Write failing tests for optimistic reaction updates, duplicate idempotency, rollback/retry on failure, blur validation, stable helper/error space, pending-success state, and Turnstile-optional behavior.
- [ ] Implement accessible controls with 44px targets, live-region status, and no celebratory toast for visible success.
- [ ] Implement the suggestion form with labels above fields, honeypot, request timeout, inline errors, and pending moderation copy.
- [ ] Run component and Worker tests together.
- [ ] Commit: `feat: add moderated community input`.

### Task 8: End-to-end verification, review, documentation, and publishing

**Files:** Create `playwright.config.ts`, `e2e/discovery.spec.ts`, `e2e/community.spec.ts`, `README.md`, and `.github/workflows/ci.yml`; modify any files required by verified defects.

- [ ] Write Playwright tests for browse → mood filter → detail → directions; search → empty recovery; roulette → reroll; reaction; and suggestion success/error.
- [ ] Run each e2e test before the final fix when it represents a discovered defect, then confirm red → green.
- [ ] Verify keyboard-only use, reduced motion, no console errors, and layouts at 320, 375, 414, 768, 1280, and 1440 px.
- [ ] Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, Playwright, and `git diff --check` fresh.
- [ ] Run the Hallmark 58-gate audit; fix every failure and stamp the pre-emit critique at 3 or higher on all six axes.
- [ ] Compare the accepted concept image with the final browser screenshot using `view_image`; continue until agency-signoff fidelity is reached.
- [ ] Perform an independent code review, resolve actionable findings, and rerun the full verification matrix.
- [ ] Document local D1 setup, seed provenance, environment variables, Cloudflare deployment, and moderation workflow.
- [ ] Create the GitHub repository, push `main`, confirm the remote commit, then deploy with Wrangler if Cloudflare authentication is available.
- [ ] Commit: `docs: prepare Cafe Weather for launch`.

## Plan self-review

- Every launch requirement in the product spec maps to Tasks 2–8.
- Domain logic and API behavior are test-first; generated configuration is the only scaffolding exception.
- The seeded read path keeps the product usable without credentials; D1-dependent writes degrade explicitly.
- User accounts, public reviews, photo uploads, automated hours, and a public admin interface remain deferred.
- No production claim can be made until the complete fresh verification matrix in Task 8 passes.
