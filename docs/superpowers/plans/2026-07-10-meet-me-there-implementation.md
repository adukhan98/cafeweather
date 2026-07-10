# Meet Me There Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand Café Weather as Meet Me There and rebuild every public route as the approved warm, art-directed Toronto café discovery experience without regressing data integrity, accessibility, community features, or Cloudflare production behaviour.

**Architecture:** Keep the React Router/Cloudflare Worker/D1 application and typed domain services intact. Introduce a small brand configuration, reusable visual primitives, route-scoped style sheets, and progressively enhanced motion; route features continue to own loaders, URL state, API calls, and mutation lifecycles. Ship the new application on a new Worker hostname, rename the GitHub repository, and leave the old Worker as a permanent path-preserving redirect plus API proxy.

**Tech Stack:** React 19, React Router 8 framework mode, TypeScript 5.9, Tailwind/Vite CSS pipeline, Fraunces Variable, IBM Plex Sans Variable, MapLibre GL, Vitest, Testing Library, Playwright, axe-core, Cloudflare Workers, D1, Turnstile, Wrangler, GitHub Actions.

---

## File map

### New brand and visual primitives

- `app/config/brand.ts` — canonical public name, descriptor, positioning line, URLs, and verification copy.
- `app/features/brand/BrandLockup.tsx` — accessible wordmark variants.
- `app/features/brand/InvitationNote.tsx` — semantic torn-paper surface.
- `app/features/brand/Scene.tsx` — full-background colour and layout boundary.
- `app/features/brand/GraphicMarks.tsx` — decorative cup ring, route line, and location stamp.
- `app/features/brand/MotionReveal.tsx` — progressive reveal with reduced-motion-safe final state.
- `app/features/brand/PlaceInvitation.tsx` — shared café identity, reason, branch, and action surface.
- `app/features/discovery/FilterTab.tsx` — filter selection/removal control.
- `app/features/community/ReactionCoaster.tsx` — reaction presentation and mutation state.
- `app/features/roulette/RouletteDeck.tsx` — result-card stack, match label, actions, and reveal state.
- `app/features/community/FormNote.tsx` — semantic invitation surface for the suggestion form.
- `app/styles/base.css` — reset, typography, focus, shared interaction geometry.
- `app/styles/materials.css` — paper, grain, ring, route, stamp, and invitation treatments.
- `app/styles/motion.css` — reveal, selection, deck, reduced-motion, and view-transition rules.
- `app/styles/shell.css` — navigation, mobile menu, main boundary, footer.
- `app/styles/home.css` — homepage scenes.
- `app/styles/catalogue.css` — filters, results, list/map composition, empty state.
- `app/styles/detail.css` — café hero, information scenes, nearby invitations, reactions.
- `app/styles/roulette.css` — filter stamps, deck, result, reroll.
- `app/styles/community.css` — suggestion form, Turnstile, validation, success and failure.
- `app/styles/legal.css` — privacy, terms, and lost-route compositions.
- `public/favicon.svg` — Meet Me There location-note mark.
- `public/og-meet-me-there.svg` — social preview artwork.
- `public/textures/paper-grain.svg` — local low-opacity texture.

### New route and test files

- `app/routes/privacy.tsx` — plain-language privacy disclosure.
- `app/routes/terms.tsx` — plain-language guide terms.
- `app/routes/not-found.tsx` — branded wildcard recovery route.
- `tests/helpers/style-source.ts` — reads route-scoped CSS as one contract source.
- `tests/unit/brand-system-contract.test.ts` — tokens, fonts, assets, primitives, and motion contract.
- `tests/unit/brand-meta.test.ts` — visible and document-level rename contract.
- `tests/unit/filter-tab.test.tsx` — filter tab semantics.
- `tests/unit/reaction-coaster.test.tsx` — reaction presentation states.
- `tests/unit/legal-routes.test.tsx` — privacy, terms, and recovery routes.
- `tests/e2e/visual.spec.ts` — approved route/state screenshot matrix.
- `tests/e2e/brand-and-motion.spec.ts` — public rename, motion, reduced motion, and focus order.
- `workers/legacy-redirect.ts` — old-host page redirect and API proxy.
- `wrangler.legacy.jsonc` — deployment config for the old Worker.

### Existing files with focused modifications

- `package.json`, `package-lock.json`, `tokens.css`, `app/fonts/latin-wght.css`, `app/root.tsx`, `app/routes.ts`.
- `app/components/AppShell.tsx`, `app/features/navigation/Masthead.tsx`, `app/features/footer/SiteFooter.tsx`.
- `app/features/discovery/DiscoveryHome.tsx`, `app/features/discovery/CafeCatalogue.tsx`, `app/features/cafes/CafeRow.tsx`, `app/features/map/CafeMap.tsx`, `app/features/map/CafeMap.client.tsx`.
- `app/features/cafes/CafeDetailPage.tsx`, `app/features/community/ReactionBar.tsx`, `app/features/community/SuggestionForm.tsx`, `app/features/roulette/RoulettePage.tsx`.
- `app/routes/home.tsx`, `app/routes/cafes.tsx`, `app/routes/cafe-detail.tsx`, `app/routes/roulette.tsx`, `app/routes/suggest.tsx`.
- Existing unit/style/E2E tests, `README.md`, `.env.example`, `.github/workflows/ci.yml`, `wrangler.jsonc`.

---

### Task 1: Establish the brand tokens, fonts, and local art assets

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `tokens.css`
- Modify: `app/fonts/latin-wght.css`
- Create: `public/favicon.svg`
- Create: `public/og-meet-me-there.svg`
- Create: `public/textures/paper-grain.svg`
- Create: `tests/unit/brand-system-contract.test.ts`

- [ ] **Step 1: Write the failing brand-system contract**

```ts
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tokens = readFileSync(new URL("../../tokens.css", import.meta.url), "utf8");
const fonts = readFileSync(
  new URL("../../app/fonts/latin-wght.css", import.meta.url),
  "utf8",
);

describe("Meet Me There brand system", () => {
  it("declares the approved warm palette and typography", () => {
    for (const value of ["#2a1712", "#f7ead2", "#e8694d", "#f3c95f", "#efb6a3", "#8e2f2d"]) {
      expect(tokens.toLowerCase()).toContain(value);
    }
    expect(tokens).toContain('"Fraunces Variable"');
    expect(tokens).toContain('"IBM Plex Sans Variable"');
    expect(fonts).toContain("fraunces-latin-wght-normal.woff2");
    expect(fonts).toContain("fraunces-latin-wght-italic.woff2");
  });

  it("ships local brand artwork", () => {
    for (const path of [
      "../../public/favicon.svg",
      "../../public/og-meet-me-there.svg",
      "../../public/textures/paper-grain.svg",
    ]) {
      expect(existsSync(new URL(path, import.meta.url))).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --run tests/unit/brand-system-contract.test.ts`

Expected: FAIL because the approved tokens, Fraunces faces, and art files do not exist.

- [ ] **Step 3: Install Fraunces and replace the token source**

Run: `npm install @fontsource-variable/fraunces@^5.2.9`

Replace `tokens.css` with the approved semantic values while preserving the existing spacing, target, z-index, and timing scales:

```css
:root {
  --color-espresso: #2a1712;
  --color-cream: #f7ead2;
  --color-terracotta: #e8694d;
  --color-honey: #f3c95f;
  --color-clay: #efb6a3;
  --color-burgundy: #8e2f2d;
  --color-ink: var(--color-espresso);
  --color-paper: var(--color-cream);
  --color-paper-2: #f2ddbf;
  --color-paper-3: #e8ccaa;
  --color-muted: #785f54;
  --color-rule: #a98774;
  --color-rule-strong: var(--color-espresso);
  --color-accent: var(--color-terracotta);
  --color-accent-hover: var(--color-burgundy);
  --color-accent-ink: var(--color-espresso);
  --color-focus: #165dff;
  --color-error: #9f1d20;
  --color-success: #2f6a43;
  --color-shadow: rgb(142 47 45 / 35%);
  --font-display: "Fraunces Variable", Georgia, serif;
  --font-body: "IBM Plex Sans Variable", Arial, sans-serif;
  --font-mono: ui-monospace, "SFMono-Regular", Consolas, monospace;

  --space-2xs: 0.25rem;
  --space-xs: 0.5rem;
  --space-sm: 0.75rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2.5rem;
  --space-2xl: 4rem;
  --space-3xl: 6rem;
  --space-4xl: 9rem;
  --text-xs: 0.64rem;
  --text-sm: 0.8rem;
  --text-base: 1rem;
  --text-md: 1.25rem;
  --text-lg: 1.5625rem;
  --text-xl: 1.9531rem;
  --text-2xl: 2.4414rem;
  --text-3xl: 3.0518rem;
  --text-4xl: 3.8147rem;
  --text-display: clamp(3.5rem, 11vw, 11rem);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.7, 0, 0.84, 0);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-micro: 120ms;
  --dur-short: 264ms;
  --dur-long: 520ms;
  --rule-hair: 1px;
  --rule-strong: 2px;
  --target-min: 2.75rem;
  --page-max: 100rem;
  --page-gutter: clamp(1rem, 3vw, 3rem);
  --z-base: 1;
  --z-raised: 10;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 400;
  --z-toast: 500;
  --z-tooltip: 600;
}
```

- [ ] **Step 4: Add normal and italic Fraunces Latin faces**

Prepend these two complete declarations to `app/fonts/latin-wght.css`, then remove the Newsreader declaration:

```css
@font-face {
  font-family: "Fraunces Variable";
  font-style: normal;
  font-display: swap;
  font-weight: 100 900;
  src: url("@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2") format("woff2-variations");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

@font-face {
  font-family: "Fraunces Variable";
  font-style: italic;
  font-display: swap;
  font-weight: 100 900;
  src: url("@fontsource-variable/fraunces/files/fraunces-latin-wght-italic.woff2") format("woff2-variations");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

- [ ] **Step 5: Create deterministic local SVG assets**

Use these complete local assets as the starting source, then verify them visually without adding external references:

```svg
<!-- public/favicon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path fill="#E8694D" stroke="#2A1712" stroke-width="4" d="M32 4c-14 0-24 10-24 24 0 18 24 32 24 32s24-14 24-32C56 14 46 4 32 4Z"/>
  <path fill="#F7EAD2" stroke="#2A1712" stroke-width="3" d="m19 20 26-2-2 22-24 2Z"/>
  <path stroke="#8E2F2D" stroke-width="3" d="m24 27 14-1M24 33l10-1"/>
</svg>
```

```svg
<!-- public/og-meet-me-there.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#E8694D"/>
  <circle cx="1010" cy="90" r="210" fill="#F3C95F"/>
  <circle cx="170" cy="120" r="105" fill="none" stroke="#8E2F2D" stroke-width="18" opacity=".45"/>
  <path d="M-40 330 1240 220" stroke="#2A1712" stroke-width="18"/>
  <text x="55" y="390" fill="#2A1712" font-family="Georgia,serif" font-size="168" font-weight="700">Meet Me There</text>
  <text x="66" y="500" fill="#2A1712" font-family="Arial,sans-serif" font-size="34" font-weight="700" letter-spacing="5">A TORONTO CAFÉ GUIDE</text>
</svg>
```

```svg
<!-- public/textures/paper-grain.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="4" stitchTiles="stitch"/></filter>
  <rect width="100%" height="100%" filter="url(#grain)" opacity=".16"/>
</svg>
```

- [ ] **Step 6: Run the focused test and core checks**

Run: `npm test -- --run tests/unit/brand-system-contract.test.ts && npm run typecheck`

Expected: the brand contract passes and TypeScript reports no errors.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tokens.css app/fonts/latin-wght.css public tests/unit/brand-system-contract.test.ts
git commit -m "feat: establish Meet Me There brand system"
```

---

### Task 2: Centralize the public brand and update metadata, favicon, and legal routes

**Files:**
- Create: `app/config/brand.ts`
- Modify: `app/root.tsx:1-42`
- Modify: `app/routes.ts:1-25`
- Modify: `app/routes/home.tsx:10-20`
- Modify: `app/routes/cafes.tsx:10-20`
- Modify: `app/routes/cafe-detail.tsx:20-32`
- Modify: `app/routes/roulette.tsx:17-27`
- Modify: `app/routes/suggest.tsx:54-64`
- Create: `app/routes/privacy.tsx`
- Create: `app/routes/terms.tsx`
- Create: `app/routes/not-found.tsx`
- Create: `tests/unit/brand-meta.test.ts`
- Create: `tests/unit/legal-routes.test.tsx`

- [ ] **Step 1: Write failing brand and route tests**

```ts
import { describe, expect, it } from "vitest";
import { brand } from "../../app/config/brand";
import { meta as homeMeta } from "../../app/routes/home";

describe("public Meet Me There identity", () => {
  it("uses one canonical brand record", () => {
    expect(brand).toEqual({
      name: "Meet Me There",
      descriptor: "A Toronto café guide",
      positioning: "A better answer to “where?”",
      canonicalOrigin: "https://meet-me-there.adnaankhan0901.workers.dev",
      legacyOrigin: "https://cafe-weather.adnaankhan0901.workers.dev",
    });
  });

  it("publishes the new homepage title and description", () => {
    expect(homeMeta({} as never)).toContainEqual({ title: "Meet Me There · A Toronto café guide" });
    expect(homeMeta({} as never)).toContainEqual({
      name: "description",
      content: "A better answer to “where?” Find a Toronto café that fits the plan.",
    });
  });
});
```

```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PrivacyPage from "../../app/routes/privacy";
import TermsPage from "../../app/routes/terms";
import NotFoundPage from "../../app/routes/not-found";

describe("legal and recovery routes", () => {
  it("explains anonymous community data", () => {
    render(<PrivacyPage />);
    expect(screen.getByRole("heading", { name: "Privacy, in plain language." })).toBeVisible();
    expect(screen.getByText(/signed anonymous visitor cookie/i)).toBeVisible();
  });

  it("states the guide limitations", () => {
    render(<TermsPage />);
    expect(screen.getByRole("heading", { name: "A guide, not a guarantee." })).toBeVisible();
    expect(screen.getByText(/verify hours and accessibility directly/i)).toBeVisible();
  });

  it("provides three useful recovery paths", () => {
    render(<NotFoundPage />);
    expect(screen.getByRole("link", { name: "Browse every place" })).toHaveAttribute("href", "/cafes");
    expect(screen.getByRole("link", { name: "Open the map" })).toHaveAttribute("href", "/cafes?view=map");
    expect(screen.getByRole("link", { name: "Try roulette" })).toHaveAttribute("href", "/roulette");
  });
});
```

- [ ] **Step 2: Verify both tests fail**

Run: `npm test -- --run tests/unit/brand-meta.test.ts tests/unit/legal-routes.test.tsx`

Expected: FAIL because the brand record and three routes do not exist.

- [ ] **Step 3: Create the canonical brand record**

```ts
export const brand = Object.freeze({
  name: "Meet Me There",
  descriptor: "A Toronto café guide",
  positioning: "A better answer to “where?”",
  canonicalOrigin: "https://meet-me-there.adnaankhan0901.workers.dev",
  legacyOrigin: "https://cafe-weather.adnaankhan0901.workers.dev",
});
```

- [ ] **Step 4: Update root links and route metadata**

In `app/root.tsx`, replace the data-URL favicon and add the social image:

```tsx
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<meta property="og:site_name" content={brand.name} />
<meta property="og:image" content={`${brand.canonicalOrigin}/og-meet-me-there.svg`} />
<meta name="twitter:card" content="summary_large_image" />
```

Each route meta function must import `brand` and use `${page} · ${brand.name}`. The homepage exact title and description must match the failing test.

- [ ] **Step 5: Add legal and wildcard routes**

Register these entries after `/suggest` and before API routes:

```ts
route("privacy", "routes/privacy.tsx"),
route("terms", "routes/terms.tsx"),
route("*", "routes/not-found.tsx"),
```

Implement the three pages with semantic `<article>`, one `<h1>`, direct prose, and the tested links. The privacy page must describe the signed anonymous cookie, hashed visitor identity, reaction and suggestion data, Turnstile, no account system, and contact-through-repository path. The terms page must describe editorial verification, no real-time hours guarantee, external directions, moderation, and respectful use.

- [ ] **Step 6: Run focused and route tests**

Run: `npm test -- --run tests/unit/brand-meta.test.ts tests/unit/legal-routes.test.tsx tests/unit/page-routes.test.ts`

Expected: all focused tests pass.

- [ ] **Step 7: Commit**

```bash
git add app/config/brand.ts app/root.tsx app/routes.ts app/routes/home.tsx app/routes/cafes.tsx app/routes/cafe-detail.tsx app/routes/roulette.tsx app/routes/suggest.tsx app/routes/privacy.tsx app/routes/terms.tsx app/routes/not-found.tsx tests/unit/brand-meta.test.ts tests/unit/legal-routes.test.tsx
git commit -m "feat: publish Meet Me There identity"
```

---

### Task 3: Add reusable material, scene, and motion primitives

**Files:**
- Create: `app/features/brand/BrandLockup.tsx`
- Create: `app/features/brand/InvitationNote.tsx`
- Create: `app/features/brand/Scene.tsx`
- Create: `app/features/brand/GraphicMarks.tsx`
- Create: `app/features/brand/MotionReveal.tsx`
- Create: `app/features/brand/PlaceInvitation.tsx`
- Create: `app/styles/base.css`
- Create: `app/styles/materials.css`
- Create: `app/styles/motion.css`
- Modify: `app/root.tsx`
- Create: `tests/helpers/style-source.ts`
- Modify: `tests/unit/design-system-contract.test.ts`
- Modify: `tests/unit/detail-roulette-style-contract.test.ts`
- Test: `tests/unit/brand-system-contract.test.ts`

- [ ] **Step 1: Extend the failing primitive contract**

```ts
import { render, screen } from "@testing-library/react";
import { BrandLockup } from "../../app/features/brand/BrandLockup";
import { CupRing, LocationStamp, RouteLine } from "../../app/features/brand/GraphicMarks";
import { InvitationNote } from "../../app/features/brand/InvitationNote";
import { Scene } from "../../app/features/brand/Scene";

it("renders semantic brand materials without baking in route logic", () => {
  render(
    <Scene as="section" tone="terracotta" label="Invitation scene">
      <BrandLockup descriptor />
      <InvitationNote as="article" tilt="left">Church Street at five.</InvitationNote>
    </Scene>,
  );
  expect(screen.getByLabelText("Invitation scene")).toHaveAttribute("data-tone", "terracotta");
  expect(screen.getByRole("link", { name: "Meet Me There home" })).toHaveAttribute("href", "/");
  expect(screen.getByText("A Toronto café guide")).toBeVisible();
  expect(screen.getByRole("article")).toHaveAttribute("data-tilt", "left");
});

it("hides decorative marks and exposes informative stamps", () => {
  const { container } = render(
    <><CupRing /><RouteLine /><LocationStamp label="Church–Wellesley" /></>,
  );
  expect(container.querySelector(".cup-ring")).toHaveAttribute("aria-hidden", "true");
  expect(container.querySelector(".route-line")).toHaveAttribute("aria-hidden", "true");
  expect(screen.getByText("Church–Wellesley")).toBeVisible();
});
```

- [ ] **Step 2: Run the brand contract and verify it fails**

Run: `npm test -- --run tests/unit/brand-system-contract.test.ts`

Expected: FAIL because the primitives do not exist.

- [ ] **Step 3: Implement typed semantic primitives**

Use this shared pattern for `Scene` and `InvitationNote`:

```tsx
import { createElement, type ElementType, type ReactNode } from "react";

type SceneProps = {
  as?: ElementType;
  tone: "espresso" | "cream" | "terracotta" | "honey" | "clay" | "burgundy";
  label?: string;
  className?: string;
  children: ReactNode;
};

export function Scene({ as = "section", tone, label, className = "", children }: SceneProps) {
  return createElement(
    as,
    {
      className: `scene ${className}`.trim(),
      "data-tone": tone,
      ...(label ? { "aria-label": label } : {}),
    },
    children,
  );
}
```

`InvitationNote` uses the same `createElement` technique with `data-tilt="left|right|none"`. `BrandLockup` imports `brand` and renders a home link plus optional descriptor. `GraphicMarks` exports `CupRing`, `RouteLine`, and `LocationStamp`; each decorative-only variant sets `aria-hidden="true"`. `MotionReveal` renders a wrapper with `data-motion="reveal"` and never hides SSR content.

- [ ] **Step 4: Implement the shared place invitation**

```tsx
import type { Cafe } from "../../contracts/cafes";

export function PlaceInvitation({ cafe, headingLevel = 2 }: { cafe: Cafe; headingLevel?: 2 | 3 }) {
  const Heading = `h${headingLevel}` as const;
  return (
    <article className="place-invitation">
      <p className="place-invitation__stamp">{cafe.branch ?? "Toronto"} · {cafe.neighborhood}</p>
      <Heading><a href={`/cafes/${cafe.slug}`}>{cafe.name}</a></Heading>
      <p>{cafe.recommendation}</p>
      <div className="place-invitation__actions">
        <a href={`/cafes/${cafe.slug}`}>Meet me there</a>
        <a href={cafe.mapsUrl} target="_blank" rel="noreferrer">Directions</a>
      </div>
    </article>
  );
}
```

- [ ] **Step 5: Add route-independent CSS and import it after `app.css`**

In `app/root.tsx`:

```ts
import "./app.css";
import "./styles/base.css";
import "./styles/materials.css";
import "./styles/motion.css";
```

`base.css` defines body, headings, focus, target size, and `.eyebrow`; `materials.css` defines `.scene[data-tone]`, `.invitation-note`, `.cup-ring`, `.route-line`, `.location-stamp`, and `.place-invitation`; `motion.css` limits animation to `transform`, `opacity`, and `clip-path` and contains a complete `@media (prefers-reduced-motion: reduce)` override.

- [ ] **Step 6: Replace single-file CSS test reads**

```ts
import { readFileSync } from "node:fs";

const files = [
  "../../app/app.css",
  "../../app/styles/base.css",
  "../../app/styles/materials.css",
  "../../app/styles/motion.css",
];

export function readStyleSource(): string {
  return files.map((file) => readFileSync(new URL(file, import.meta.url), "utf8")).join("\n");
}
```

Update style-contract tests to import `readStyleSource()` and assert the new selectors instead of the retired newspaper-masthead selectors.

- [ ] **Step 7: Run primitive, style, and type checks**

Run: `npm test -- --run tests/unit/brand-system-contract.test.ts tests/unit/design-system-contract.test.ts tests/unit/detail-roulette-style-contract.test.ts && npm run typecheck`

Expected: all focused tests and typecheck pass.

- [ ] **Step 8: Commit**

```bash
git add app/features/brand app/styles app/root.tsx tests/helpers tests/unit/brand-system-contract.test.ts tests/unit/design-system-contract.test.ts tests/unit/detail-roulette-style-contract.test.ts
git commit -m "feat: add invitation design primitives"
```

---

### Task 4: Rebuild the application shell, mobile menu, and footer

**Files:**
- Modify: `app/components/AppShell.tsx:1-24`
- Modify: `app/features/navigation/Masthead.tsx:1-121`
- Modify: `app/features/footer/SiteFooter.tsx:1-20`
- Create: `app/styles/shell.css`
- Modify: `app/root.tsx`
- Modify: `tests/unit/app-shell.test.tsx`
- Modify: `tests/browser/app-shell-geometry.mjs`

- [ ] **Step 1: Replace old shell assertions with the approved contract**

```tsx
it("renders the floating receipt navigation and active route", () => {
  renderShell({ pathname: "/roulette" });
  const navigation = screen.getByRole("navigation", { name: "Primary" });
  expect(screen.getByRole("link", { name: "Meet Me There home" })).toBeVisible();
  expect(within(navigation).getByRole("link", { name: "Roulette" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByText("Toronto · 36 places")).toBeVisible();
});

it("opens a full-screen mobile menu and restores focus on Escape", async () => {
  const user = userEvent.setup();
  renderShell({ pathname: "/" });
  const button = screen.getByRole("button", { name: "Open menu" });
  await user.click(button);
  const menu = screen.getByRole("navigation", { name: "Mobile" });
  expect(menu).toHaveAttribute("data-state", "open");
  expect(within(menu).getByRole("link", { name: "Browse" })).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(button).toHaveFocus();
});
```

Change `renderShell` to wrap `AppShell` in a `MemoryRouter` with the requested pathname.

- [ ] **Step 2: Run the shell tests and verify they fail**

Run: `npm test -- --run tests/unit/app-shell.test.tsx`

Expected: FAIL on the new brand, active route, city count, and menu state.

- [ ] **Step 3: Implement the new shell semantics**

Use `useLocation()` in `Masthead`, `BrandLockup` for the wordmark, and this destination record:

```ts
const destinations = [
  { label: "Browse", href: "/cafes", activePath: "/cafes" },
  { label: "Map", href: "/cafes?view=map", activePath: "/cafes" },
  { label: "Roulette", href: "/roulette", activePath: "/roulette" },
  { label: "Suggest", href: "/suggest", activePath: "/suggest" },
] as const;
```

Retain the existing Escape, outside-pointer, first-link focus, toggle focus restoration, and main-focus-on-link behaviour. Render `aria-current="page"` only for the applicable route; Map is current only when `view=map`.

- [ ] **Step 4: Build the concise invitation footer**

The footer must contain the lockup, positioning line, Browse, Map, Roulette, Suggest, Privacy, Terms, source provenance, and “Last verified July 2026.” Do not add additional columns.

- [ ] **Step 5: Add `shell.css` and responsive geometry**

Use fixed/sticky layering from the approved mockup, but keep the skip link above it. At widths below `48rem`, hide the desktop links and display the toggle; the open mobile menu uses `position: fixed`, `inset: 0`, and a cream background. At and above `48rem`, the toggle and mobile menu are hidden.

- [ ] **Step 6: Update the geometry helper**

Replace `.masthead__wordmark` and `.masthead__toggle` queries with `.brand-lockup__home` and `.site-nav__toggle`, retain overflow checks, and add a minimum-target assertion:

```js
const tooSmall = Array.from(document.querySelectorAll("a, button, input, summary"))
  .filter((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
  })
  .map((element) => element.getAttribute("aria-label") || element.textContent?.trim());
assert.deepEqual(tooSmall, []);
```

- [ ] **Step 7: Run shell, accessibility, and geometry checks**

Run: `npm test -- --run tests/unit/app-shell.test.tsx tests/unit/design-system-contract.test.ts && npm run typecheck`

Expected: shell tests, axe assertions, and typecheck pass.

- [ ] **Step 8: Commit**

```bash
git add app/components/AppShell.tsx app/features/navigation app/features/footer app/styles/shell.css app/root.tsx tests/unit/app-shell.test.tsx tests/browser/app-shell-geometry.mjs
git commit -m "feat: rebuild Meet Me There shell"
```

---

### Task 5: Recompose the homepage as seven data-backed scenes

**Files:**
- Modify: `app/features/discovery/DiscoveryHome.tsx:1-319`
- Create: `app/features/discovery/home-view-model.ts`
- Create: `app/styles/home.css`
- Modify: `app/root.tsx`
- Modify: `tests/unit/discovery-home.test.tsx`
- Create: `tests/unit/home-view-model.test.ts`
- Modify: `tests/unit/discovery-layout-contract.test.ts`

- [ ] **Step 1: Write failing view-model and homepage tests**

```ts
import { describe, expect, it } from "vitest";
import { cafes } from "../../app/data/cafes";
import { buildHomeScenes } from "../../app/features/discovery/home-view-model";

it("derives honest mood and neighbourhood counts from the catalogue", () => {
  const scenes = buildHomeScenes(cafes);
  expect(scenes.moods.find((mood) => mood.id === "serious-coffee")?.count).toBeGreaterThan(0);
  expect(scenes.neighborhoods.every((item) => item.count > 0)).toBe(true);
  expect(scenes.neighborhoods.reduce((sum, item) => sum + item.count, 0)).toBe(cafes.length);
});
```

```tsx
it("renders the seven approved homepage scenes", () => {
  renderHome();
  expect(screen.getByRole("heading", { level: 1, name: "Where are we meeting?" })).toBeVisible();
  for (const name of [
    "What does today need?",
    "A few places we could go",
    "Leave it to chance.",
    "Places people keep mentioning",
    "Meet somewhere nearby.",
    "Know a place?",
  ]) expect(screen.getByRole("heading", { name })).toBeVisible();
});
```

- [ ] **Step 2: Verify the focused tests fail**

Run: `npm test -- --run tests/unit/home-view-model.test.ts tests/unit/discovery-home.test.tsx`

Expected: FAIL because the view model and approved headings do not exist.

- [ ] **Step 3: Implement pure home-scene derivation**

```ts
export function buildHomeScenes(cafes: readonly Cafe[]) {
  return {
    moods: occasionOptions.map((option) => ({
      ...option,
      count: filterCafes(cafes, option.filters).length,
    })),
    mapCafes: cafes.filter((cafe) => cafe.verificationStatus === "verified").slice(0, 10),
    cityTrail: byIds(cafes, destinationIds),
    neighborhoods: getDiscoveryFacets(cafes).neighborhoods
      .map((name) => ({ name, count: cafes.filter((cafe) => cafe.neighborhood === name).length }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  } as const;
}
```

Move `occasionOptions`, `byIds`, and editorial ID constants into the same module and export only `buildHomeScenes` plus the option type needed by the component.

- [ ] **Step 4: Rebuild `DiscoveryHome` from semantic scenes**

Render, in order, `Scene` blocks for hero, mood fieldset, `CafeMap`, roulette teaser, horizontal city trail, neighbourhood list, and suggestion finale. Preserve the current controlled mood state, search-to-`/cafes?q=`, browse/roulette query generation, complete map index, source notice, and real data.

The hero search keeps `<form role="search" action="/cafes" method="get">`, label “What kind of place?”, input name `q`, and keyboard submit. The city trail is an `<ol>` with `PlaceInvitation` children. The horizontally scrollable rail receives `aria-label="Places people keep mentioning"` and visible scroll affordance.

- [ ] **Step 5: Add homepage scene CSS**

Implement the approved terracotta hero, asymmetric mood grid, dominant map field, honey roulette scene, clay horizontal trail, burgundy neighbourhood roll, and terracotta suggestion finale. Use `min-height: 100dvh` only for hero and roulette; content scenes use `min-height` plus natural growth. Explicit horizontal overflow is limited to `.city-trail__scroller`.

- [ ] **Step 6: Run homepage, smoke, and accessibility tests**

Run: `npm test -- --run tests/unit/home-view-model.test.ts tests/unit/discovery-home.test.tsx tests/unit/smoke.test.ts tests/unit/discovery-layout-contract.test.ts`

Expected: all focused tests pass, including axe.

- [ ] **Step 7: Commit**

```bash
git add app/features/discovery/DiscoveryHome.tsx app/features/discovery/home-view-model.ts app/styles/home.css app/root.tsx tests/unit/home-view-model.test.ts tests/unit/discovery-home.test.tsx tests/unit/discovery-layout-contract.test.ts tests/unit/smoke.test.ts
git commit -m "feat: compose invitation-led homepage"
```

---

### Task 6: Redesign browse filters and result invitations without changing URL state

**Files:**
- Create: `app/features/discovery/FilterTab.tsx`
- Modify: `app/features/discovery/CafeCatalogue.tsx:1-376`
- Modify: `app/features/cafes/CafeRow.tsx:1-37`
- Create: `app/styles/catalogue.css`
- Modify: `app/root.tsx`
- Create: `tests/unit/filter-tab.test.tsx`
- Modify: `tests/unit/cafe-catalogue.test.tsx`
- Modify: `tests/unit/discovery-params.test.ts`

- [ ] **Step 1: Write the failing filter-tab contract**

```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FilterTab } from "../../app/features/discovery/FilterTab";

it("announces selection and supports removal", async () => {
  const remove = vi.fn();
  const user = userEvent.setup();
  render(<FilterTab label="Quiet work" count={4} selected onRemove={remove} />);
  const button = screen.getByRole("button", { name: "Remove Quiet work filter, 4 places" });
  expect(button).toHaveAttribute("aria-pressed", "true");
  await user.click(button);
  expect(remove).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Verify the filter and catalogue tests fail**

Run: `npm test -- --run tests/unit/filter-tab.test.tsx tests/unit/cafe-catalogue.test.tsx`

Expected: FAIL because `FilterTab` is missing and the old catalogue copy/layout remains.

- [ ] **Step 3: Implement `FilterTab`**

```tsx
type FilterTabProps = {
  label: string;
  count: number;
  selected: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
};

export function FilterTab({ label, count, selected, onSelect, onRemove }: FilterTabProps) {
  const action = selected ? onRemove : onSelect;
  return (
    <button
      className="filter-tab"
      type="button"
      data-state={selected ? "selected" : "idle"}
      aria-pressed={selected}
      aria-label={`${selected ? "Remove" : "Add"} ${label} filter, ${count} ${count === 1 ? "place" : "places"}`}
      onClick={action}
    >
      <span>{label}</span><span aria-hidden="true">{count}{selected ? " ×" : " +"}</span>
    </button>
  );
}
```

- [ ] **Step 4: Recompose `CafeCatalogue`**

Keep `parseDiscoveryParams`, `serializeDiscoveryParams`, debounced search, abort handling, route-key synchronization, active-filter removal, reset, result count, list/map state, empty recovery, and source notice. Replace the old header and disclosure visuals with:

- hero heading “Find somewhere that fits.”;
- an aria-live result count rendered as an oversized decorative number plus readable status;
- search and filter groups using `FilterTab`;
- `PlaceInvitation`/redesigned `CafeRow` result list;
- desktop list/map composition and mobile explicit mode switch.

Do not change query parameter names or push/replace rules.

- [ ] **Step 5: Add catalogue styles and update style contracts**

`catalogue.css` must define selected, focus, hover, disabled, empty, list, map, and mobile states. The base mobile layout is one column; the list/map split begins at `60rem`. Active filters remain visible above results at all widths.

- [ ] **Step 6: Run catalogue and URL-state tests**

Run: `npm test -- --run tests/unit/filter-tab.test.tsx tests/unit/cafe-catalogue.test.tsx tests/unit/discovery-params.test.ts tests/unit/filter-cafes.test.ts`

Expected: all tests pass without changing URL contract expectations.

- [ ] **Step 7: Commit**

```bash
git add app/features/discovery/FilterTab.tsx app/features/discovery/CafeCatalogue.tsx app/features/cafes/CafeRow.tsx app/styles/catalogue.css app/root.tsx tests/unit/filter-tab.test.tsx tests/unit/cafe-catalogue.test.tsx tests/unit/discovery-params.test.ts
git commit -m "feat: redesign café browse experience"
```

---

### Task 7: Make the map a dominant, accessible background composition

**Files:**
- Modify: `app/features/map/CafeMap.tsx:1-106`
- Modify: `app/features/map/CafeMap.client.tsx:1-169`
- Create: `app/styles/map.css`
- Modify: `app/root.tsx`
- Modify: `tests/unit/cafe-map.test.tsx`
- Modify: `tests/unit/cafe-map-client.test.tsx`

- [ ] **Step 1: Add failing map-overlay expectations**

```tsx
it("links selected map state to an invitation note and semantic index", async () => {
  const user = userEvent.setup();
  render(<CafeMap cafes={cafes.slice(0, 3)} />);
  const region = screen.getByRole("region", { name: "Toronto café map" });
  await user.click(within(region).getByRole("button", { name: /show .*larry's place/i }));
  expect(within(region).getByRole("article", { name: "Selected place" })).toHaveTextContent("Larry's Place");
  expect(within(region).getByRole("list", { name: "Cafés on this map" })).toBeVisible();
});
```

- [ ] **Step 2: Verify map tests fail**

Run: `npm test -- --run tests/unit/cafe-map.test.tsx tests/unit/cafe-map-client.test.tsx`

Expected: FAIL because the selected place is not an invitation article.

- [ ] **Step 3: Recompose the map wrapper**

Keep the lazy client import, loading skeleton, error fallback, marker selection, list selection, directions links, and attribution. Render the selected café through `InvitationNote as="article"` with `aria-label="Selected place"`. Pass the same selected ID to the accessible index and client map.

- [ ] **Step 4: Restyle MapLibre without obscuring controls or attribution**

Add a warm custom marker glyph, selected state, cream controls, and route-field fallback. Keep `OpenFreeMap`, `OpenMapTiles`, and `OpenStreetMap` attribution visible. Do not place overlapping notes over zoom controls or attribution at any launch width.

- [ ] **Step 5: Run map, axe, and type checks**

Run: `npm test -- --run tests/unit/cafe-map.test.tsx tests/unit/cafe-map-client.test.tsx tests/unit/discovery-home.test.tsx && npm run typecheck`

Expected: map selection, fallback, index, attribution, axe, and types pass.

- [ ] **Step 6: Commit**

```bash
git add app/features/map app/styles/map.css app/root.tsx tests/unit/cafe-map.test.tsx tests/unit/cafe-map-client.test.tsx
git commit -m "feat: turn map into invitation surface"
```

---

### Task 8: Rebuild café detail pages around the four practical questions

**Files:**
- Modify: `app/features/cafes/CafeDetailPage.tsx:1-167`
- Create: `app/styles/detail.css`
- Modify: `app/root.tsx`
- Modify: `tests/unit/cafe-detail-page.test.tsx`
- Modify: `tests/unit/page-data-authority.test.ts`

- [ ] **Step 1: Add failing detail composition assertions**

```tsx
it("turns the café into an invitation while keeping verification and directions", () => {
  render(<CafeDetailPage cafe={cafe("matcha-matcha-church-street")} />);
  expect(screen.getByRole("heading", { level: 1, name: "MATCHA MATCHA" })).toBeVisible();
  expect(screen.getByText("Meet me at 407 Church Street.")).toBeVisible();
  for (const heading of ["Why meet here?", "What should we order or notice?", "How was this entry checked?", "What else is nearby?"]) {
    expect(screen.getByRole("heading", { name: heading })).toBeVisible();
  }
  expect(screen.getByRole("link", { name: /directions to matcha matcha/i })).toHaveAttribute("href", /^https:\/\//);
});
```

- [ ] **Step 2: Verify the detail test fails**

Run: `npm test -- --run tests/unit/cafe-detail-page.test.tsx`

Expected: FAIL on the new invitation and question headings.

- [ ] **Step 3: Recompose `CafeDetailPage` without changing its props**

Keep `cafe`, `nearby`, `source`, and `reactionBar` props. Render:

1. terracotta hero with exact café name, branch, neighbourhood, address note, and directions;
2. cream “Why meet here?” scene using `recommendation` and limitations;
3. honey “What should we order or notice?” scene using offerings and moods as `LocationStamp` elements;
4. verification scene with exact status, date, source link, and degraded-source notice;
5. nearby `PlaceInvitation` list;
6. reaction region.

Do not invent hours, popularity, ratings, accessibility, or venue imagery.

- [ ] **Step 4: Add detail styles**

Use large cropped Fraunces type, one address invitation, two asymmetric information scenes, circular stamps, and a dark reaction scene. DOM order remains identical to reading order even when desktop visuals overlap.

- [ ] **Step 5: Run detail, authority, and axe checks**

Run: `npm test -- --run tests/unit/cafe-detail-page.test.tsx tests/unit/page-data-authority.test.ts`

Expected: all existing source/verification/degraded-data assertions and new composition assertions pass.

- [ ] **Step 6: Commit**

```bash
git add app/features/cafes/CafeDetailPage.tsx app/styles/detail.css app/root.tsx tests/unit/cafe-detail-page.test.tsx tests/unit/page-data-authority.test.ts
git commit -m "feat: redesign café invitations"
```

---

### Task 9: Present reactions as accessible table coasters

**Files:**
- Create: `app/features/community/ReactionCoaster.tsx`
- Modify: `app/features/community/ReactionBar.tsx:1-296`
- Modify: `app/styles/detail.css`
- Create: `tests/unit/reaction-coaster.test.tsx`
- Modify: `tests/unit/reaction-bar.test.tsx`
- Modify: `tests/unit/community-style-contract.test.ts`

- [ ] **Step 1: Write the failing coaster-state test**

```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReactionCoaster } from "../../app/features/community/ReactionCoaster";

it("exposes active, pending, count, and retry-safe disabled state", () => {
  render(<ReactionCoaster kind="cozy" label="Cozy" count={8} active pending onToggle={vi.fn()} />);
  const button = screen.getByRole("button", { name: "Cozy, 8 reactions" });
  expect(button).toHaveAttribute("aria-pressed", "true");
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("data-state", "loading");
});
```

- [ ] **Step 2: Verify the focused tests fail**

Run: `npm test -- --run tests/unit/reaction-coaster.test.tsx tests/unit/reaction-bar.test.tsx`

Expected: FAIL because `ReactionCoaster` does not exist.

- [ ] **Step 3: Implement the presentation-only coaster**

```tsx
type ReactionCoasterProps = {
  kind: ReactionKind;
  label: string;
  count: number;
  active: boolean;
  pending: boolean;
  onToggle: (kind: ReactionKind, active: boolean) => void;
};

export function ReactionCoaster(props: ReactionCoasterProps) {
  const state = props.pending ? "loading" : props.active ? "active" : "idle";
  return (
    <button
      className="reaction-coaster"
      type="button"
      aria-label={`${props.label}, ${props.count} ${props.count === 1 ? "reaction" : "reactions"}`}
      aria-pressed={props.active}
      data-state={state}
      disabled={props.pending}
      onClick={() => props.onToggle(props.kind, !props.active)}
    >
      <span>{props.label}</span><span aria-hidden="true">{props.count}</span>
    </button>
  );
}
```

- [ ] **Step 4: Integrate without changing mutation lifecycles**

Replace only the inline reaction button JSX in `ReactionBar`. Preserve initial fetch, active scope, abort controllers, optimistic update, rollback, retry state, announcement text, route-change cancellation, and API client contract exactly.

- [ ] **Step 5: Add coaster geometry and states**

Use a circular base with at least `var(--target-min)` dimensions, visible focus, selected honey fill, loading hatch, disabled opacity, and touch-safe spacing. Long labels may wrap inside the circle; remove the old `white-space: nowrap` contract and assert bounded two-line text instead.

- [ ] **Step 6: Run reaction and community checks**

Run: `npm test -- --run tests/unit/reaction-coaster.test.tsx tests/unit/reaction-bar.test.tsx tests/unit/community-api.test.ts tests/unit/community-style-contract.test.ts`

Expected: presentation and all cancellation/idempotency/rollback tests pass.

- [ ] **Step 7: Commit**

```bash
git add app/features/community/ReactionCoaster.tsx app/features/community/ReactionBar.tsx app/styles/detail.css tests/unit/reaction-coaster.test.tsx tests/unit/reaction-bar.test.tsx tests/unit/community-style-contract.test.ts
git commit -m "feat: turn reactions into table coasters"
```

---

### Task 10: Turn roulette into a deterministic card-deck reveal

**Files:**
- Modify: `app/features/roulette/RoulettePage.tsx:1-154`
- Create: `app/features/roulette/RouletteDeck.tsx`
- Modify: `app/features/roulette/roulette-params.ts:1-29`
- Create: `app/styles/roulette.css`
- Modify: `app/root.tsx`
- Modify: `tests/unit/roulette-page.test.tsx`
- Modify: `tests/unit/detail-roulette-style-contract.test.ts`

- [ ] **Step 1: Add failing deck semantics and focus assertions**

```tsx
it("renders filter stamps and a result deck with direct actions", () => {
  renderRoulette({ state: { moods: ["cozy"], neighborhoods: [], offerings: [], attributes: [], search: "", view: "list" } });
  expect(screen.getByText("COZY", { selector: ".roulette-stamp" })).toBeVisible();
  expect(screen.getByRole("article", { name: "Roulette result" })).toHaveAttribute("data-motion", "deck");
  expect(screen.getByRole("button", { name: "Reroll" })).toBeVisible();
  expect(screen.getByRole("link", { name: /directions/i })).toHaveAttribute("href", /^https:\/\//);
});

it("derives a stable decorative match number", () => {
  expect(displayMatchNumber("visual-seed")).toMatch(/^\d{2}$/);
  expect(displayMatchNumber("visual-seed")).toBe(displayMatchNumber("visual-seed"));
});
```

- [ ] **Step 2: Verify roulette tests fail**

Run: `npm test -- --run tests/unit/roulette-page.test.tsx tests/unit/detail-roulette-style-contract.test.ts`

Expected: FAIL on deck article, stamp, and motion contract.

- [ ] **Step 3: Recompose `RoulettePage` while retaining request logic**

Keep filter serialization, previous ID, seed, abort controller, stale response guard, error retry, no-match recovery, navigation, and reroll-focus restoration. Render the result in:

```tsx
type RouletteDeckProps = {
  cafe: Cafe;
  seed: string;
  pending: boolean;
  onReroll: () => void;
};

export function RouletteDeck({ cafe, seed, pending, onReroll }: RouletteDeckProps) {
  return (
    <div className="roulette-deck">
      <article className="roulette-deck__result" aria-label="Roulette result" data-motion="deck" key={seed}>
        <p className="eyebrow">Tonight · match {displayMatchNumber(seed)}</p>
        <h2>{cafe.name}</h2>
        <p>{cafe.recommendation}</p>
        <a href={cafe.mapsUrl} target="_blank" rel="noreferrer">Directions</a>
      </article>
      <button type="button" disabled={pending} onClick={onReroll}>Reroll</button>
    </div>
  );
}
```

Place this code in `RouletteDeck.tsx`; export `displayMatchNumber` from the same file as a pure stable hash-to-`01..99` helper. It is decorative and does not alter selection. `RoulettePage` retains request/navigation state and passes the current café, seed, pending flag, and reroll callback into `RouletteDeck`.

Change `initialRouletteSeed` to `meet-me-there:${serialized || "all"}` and update its exact test expectation. Do not change `buildRouletteParams` or the server selection algorithm.

- [ ] **Step 4: Add deck and reduced-motion CSS**

Use pseudo-element cards behind the result, cream foreground, clay/terracotta backing cards, burgundy offset shadow, and a circular reroll control. Animate only transform and opacity. Under reduced motion, set `animation: none`, `transition-duration: 0.01ms`, `transform: none`, and expose the final card immediately.

- [ ] **Step 5: Run roulette domain, page, and style tests**

Run: `npm test -- --run tests/unit/roulette.test.ts tests/unit/roulette-page.test.tsx tests/unit/detail-roulette-style-contract.test.ts`

Expected: deterministic selection and the new presentation pass.

- [ ] **Step 6: Commit**

```bash
git add app/features/roulette/RoulettePage.tsx app/features/roulette/RouletteDeck.tsx app/features/roulette/roulette-params.ts app/styles/roulette.css app/root.tsx tests/unit/roulette-page.test.tsx tests/unit/detail-roulette-style-contract.test.ts
git commit -m "feat: stage café roulette as a card deck"
```

---

### Task 11: Recompose suggestions as a validated invitation note

**Files:**
- Modify: `app/routes/suggest.tsx:54-113`
- Create: `app/features/community/FormNote.tsx`
- Modify: `app/features/community/SuggestionForm.tsx:1-452`
- Create: `app/styles/community.css`
- Modify: `app/root.tsx`
- Modify: `tests/unit/suggest-route.test.tsx`
- Modify: `tests/unit/suggestion-form.test.tsx`
- Modify: `tests/unit/community-style-contract.test.ts`

- [ ] **Step 1: Add failing suggestion copy and structure assertions**

```tsx
it("presents the moderated form as one invitation note", () => {
  render(<SuggestPage siteKey={null} action="suggestion" turnstileRequired={false} />);
  expect(screen.getByRole("heading", { level: 1, name: "Know a place?" })).toBeVisible();
  expect(screen.getByRole("form", { name: "Suggest a Toronto café" })).toHaveClass("form-note");
  expect(screen.getByLabelText("Exact branch or address")).toBeVisible();
  expect(screen.getByLabelText("Why meet there?")).toBeVisible();
  expect(screen.getByRole("button", { name: "Send the note" })).toBeVisible();
});
```

- [ ] **Step 2: Verify route and form tests fail**

Run: `npm test -- --run tests/unit/suggest-route.test.tsx tests/unit/suggestion-form.test.tsx`

Expected: FAIL on approved headings, form name, labels, and button copy.

- [ ] **Step 3: Recompose `SuggestPage`**

Create the presentation wrapper:

```tsx
import type { ReactNode } from "react";
import { InvitationNote } from "../brand/InvitationNote";

export function FormNote({ children }: { children: ReactNode }) {
  return <InvitationNote as="div" tilt="left" className="form-note">{children}</InvitationNote>;
}
```

Use a burgundy `Scene`, heading “Know a place?”, concise exact-branch guidance, and `FormNote` around `SuggestionForm`. Keep Tim Hortons/Starbucks exclusion and pending moderation disclosure in an adjacent note, not a sidebar card.

- [ ] **Step 4: Update visible form labels without changing payload keys**

Keep input names and `SuggestionInput` fields unchanged. Map labels as follows:

```ts
const suggestionLabels = {
  name: "Café name",
  address: "Exact branch or address",
  mapUrl: "HTTPS map link",
  reason: "Why meet there?",
  recommendation: "What should we order or notice?",
} as const;
```

Set `<form aria-label="Suggest a Toronto café" className="suggestion-form form-note">` and change the submit copy to “Send the note.” Keep the hidden honeypot label “Website,” Turnstile action/token/reset lifecycle, blur validation, first-invalid focus, request cancellation, idempotency conflict handling, retry, and success reset.

- [ ] **Step 5: Integrate validation, bot, success, and failure visuals**

Use stable helper/error space, burgundy error ink plus icon/text, visible disabled state, a “Human check / ready” status, and a stamped success block reading “Pending review.” Never hide Turnstile branding or failure copy.

- [ ] **Step 6: Run suggestion, Turnstile, and style tests**

Run: `npm test -- --run tests/unit/suggest-route.test.tsx tests/unit/suggestion-form.test.tsx tests/unit/turnstile-widget.test.tsx tests/unit/community-style-contract.test.ts`

Expected: validation, focus, cancellation, Turnstile, idempotency, and new presentation pass.

- [ ] **Step 7: Commit**

```bash
git add app/routes/suggest.tsx app/features/community/FormNote.tsx app/features/community/SuggestionForm.tsx app/styles/community.css app/root.tsx tests/unit/suggest-route.test.tsx tests/unit/suggestion-form.test.tsx tests/unit/community-style-contract.test.ts
git commit -m "feat: turn suggestions into invitation notes"
```

---

### Task 12: Finish loading, empty, failure, legal, and lost-route compositions

**Files:**
- Modify: `app/features/discovery/DataSourceNotice.tsx`
- Modify: `app/features/map/CafeMap.tsx`
- Modify: `app/features/discovery/CafeCatalogue.tsx`
- Modify: `app/features/community/ReactionBar.tsx`
- Modify: `app/features/community/SuggestionForm.tsx`
- Modify: `app/routes/not-found.tsx`
- Create: `app/styles/legal.css`
- Modify: `app/root.tsx`
- Modify: `tests/unit/legal-routes.test.tsx`
- Modify: relevant existing component tests

- [ ] **Step 1: Add failing state-copy assertions**

```tsx
it("offers focused empty-state recovery", () => {
  renderCatalogue("/cafes?q=nowhere&mood=cozy");
  expect(screen.getByRole("heading", { name: "Nothing fits all of that." })).toBeVisible();
  expect(screen.getByRole("button", { name: "Remove Search: nowhere" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Reset the whole plan" })).toBeVisible();
});
```

```tsx
it("keeps failure recovery direct", () => {
  render(<NotFoundPage />);
  expect(screen.getByText("We lost the note, not the whole city.")).toBeVisible();
});
```

- [ ] **Step 2: Run focused state tests and verify failures**

Run: `npm test -- --run tests/unit/cafe-catalogue.test.tsx tests/unit/legal-routes.test.tsx tests/unit/cafe-map.test.tsx tests/unit/reaction-bar.test.tsx tests/unit/suggestion-form.test.tsx`

Expected: FAIL on the new recovery copy.

- [ ] **Step 3: Implement the approved state language**

Use these exact headings and actions:

- empty: “Nothing fits all of that.” / per-filter removal / “Reset the whole plan”;
- map failure: “The map missed the meeting.” / retain complete list and directions;
- community unavailable: “The notes are unavailable right now.” / “Try reactions again”;
- 404: “We lost the note, not the whole city.” / Browse, Map, Roulette;
- suggestion success: “Pending review.” / “Suggest another place.”

Preserve existing status codes, API error messages, retry timing, and accessible live regions.

- [ ] **Step 4: Add state and legal styling**

Use composed invitation surfaces and scene colours rather than generic bordered cards. Error and success states include text plus shape/icon; they do not rely on colour alone.

- [ ] **Step 5: Run all component and axe tests**

Run: `npm test -- --run tests/unit/cafe-catalogue.test.tsx tests/unit/legal-routes.test.tsx tests/unit/cafe-map.test.tsx tests/unit/reaction-bar.test.tsx tests/unit/suggestion-form.test.tsx`

Expected: all focused tests and axe assertions pass.

- [ ] **Step 6: Commit**

```bash
git add app/features/discovery/DataSourceNotice.tsx app/features/map/CafeMap.tsx app/features/discovery/CafeCatalogue.tsx app/features/community/ReactionBar.tsx app/features/community/SuggestionForm.tsx app/routes/not-found.tsx app/styles/legal.css app/root.tsx tests/unit/cafe-catalogue.test.tsx tests/unit/legal-routes.test.tsx tests/unit/cafe-map.test.tsx tests/unit/reaction-bar.test.tsx tests/unit/suggestion-form.test.tsx
git commit -m "feat: art direct every product state"
```

---

### Task 13: Remove the legacy visual system and lock responsive, zoom, and motion behaviour

**Files:**
- Rewrite: `app/app.css`
- Modify: `app/styles/*.css`
- Modify: `.hallmark/log.json`
- Modify: `tests/helpers/style-source.ts`
- Modify: `tests/unit/design-system-contract.test.ts`
- Modify: `tests/unit/discovery-layout-contract.test.ts`
- Modify: `tests/unit/detail-roulette-style-contract.test.ts`
- Modify: `tests/unit/community-style-contract.test.ts`
- Modify: `tests/browser/app-shell-geometry.mjs`

- [ ] **Step 1: Extend failing style contracts**

Add assertions that:

```ts
expect(css).toContain("Meet Me There · invitation system");
expect(css).not.toContain("Café Weather · Garden");
expect(css).not.toContain("Newsreader Variable");
expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*animation-duration:\s*0\.01ms/);
expect(css).toMatch(/\.city-trail__scroller\s*\{[^}]*overflow-x:\s*auto/s);
expect(css).not.toMatch(/body\s*\{[^}]*overflow-x:\s*(?:auto|scroll)/s);
```

- [ ] **Step 2: Verify style contracts fail while legacy CSS remains**

Run: `npm test -- --run tests/unit/design-system-contract.test.ts tests/unit/discovery-layout-contract.test.ts tests/unit/detail-roulette-style-contract.test.ts tests/unit/community-style-contract.test.ts`

Expected: FAIL on legacy brand and reduced-motion/global-overflow rules.

- [ ] **Step 3: Reduce `app/app.css` to the import manifest and shared Tailwind theme**

```css
/* Meet Me There · invitation system · variance 9 · motion 7 · density 4 */
@import "tailwindcss" source(".");
@import "../tokens.css";

@theme inline {
  --font-sans: var(--font-body);
  --font-serif: var(--font-display);
  --color-mmt-ink: var(--color-espresso);
  --color-mmt-paper: var(--color-cream);
  --color-mmt-action: var(--color-terracotta);
}
```

Keep route CSS imports in `app/root.tsx`. Delete every obsolete Café Weather selector only after `rg` confirms no JSX references it.

- [ ] **Step 4: Record the approved Hallmark direction**

Replace the first `.hallmark/log.json` entry with the approved values:

```json
{
  "artifact": "Meet Me There full product redesign",
  "macrostructure": "Invitation City",
  "enrichment": "code-native illustration plus MapLibre",
  "design_taste": { "variance": 9, "motion": 7, "density": 4 }
}
```

- [ ] **Step 5: Add 200% zoom and explicit-rail geometry checks**

Extend the geometry helper to assert document overflow at normal size and after `document.documentElement.style.fontSize = "200%"`. Exclude only elements with `[data-horizontal-rail="true"]` from child overflow diagnostics; the document itself must remain within one CSS pixel of viewport width.

- [ ] **Step 6: Run full unit, lint, type, and build gates**

Run: `npm test && npm run lint && npm run typecheck && npm run build && git diff --check`

Expected: all unit/integration tests pass, no lint/type/build errors, and no whitespace errors.

- [ ] **Step 7: Commit**

```bash
git add app/app.css app/styles .hallmark tests/helpers tests/unit tests/browser
git commit -m "refactor: retire Café Weather visual system"
```

---

### Task 14: Add browser, accessibility, screenshot, and performance release gates

**Files:**
- Modify: `tests/e2e/critical-path.spec.ts`
- Modify: `tests/e2e/quality.spec.ts`
- Create: `tests/e2e/brand-and-motion.spec.ts`
- Create: `tests/e2e/visual.spec.ts`
- Modify: `playwright.config.ts`
- Modify: `.github/workflows/ci.yml`
- Create: `scripts/check-client-budget.mjs`
- Modify: `package.json`

- [ ] **Step 1: Update critical paths to durable accessible contracts**

Change only visible copy/selectors, not behavioural assertions. The first flow begins with:

```ts
await expect(page.getByRole("heading", { name: "Where are we meeting?" })).toBeVisible();
await page.getByLabel("Serious coffee").check();
await page.getByRole("link", { name: /browse .* serious coffee/i }).click();
```

The suggestion flow uses labels “Why meet there?” and button “Send the note,” while still asserting a `202` response and pending-review success.

- [ ] **Step 2: Add brand and motion browser tests**

```ts
test("public routes use the Meet Me There identity", async ({ page }) => {
  for (const route of ["/", "/cafes", "/cafes/larrys-place-parkdale", "/roulette", "/suggest", "/privacy", "/terms"]) {
    await page.goto(route);
    await expect(page.getByRole("link", { name: "Meet Me There home" })).toBeVisible();
    await expect(page).toHaveTitle(/Meet Me There/);
  }
});

test("reduced motion keeps final content visible without travel", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const moving = await page.locator('[data-motion]').evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);
      return { opacity: style.opacity, transform: style.transform, animation: style.animationName };
    }),
  );
  expect(moving.every((state) => state.opacity === "1" && state.transform === "none" && state.animation === "none")).toBe(true);
});
```

- [ ] **Step 3: Add deterministic screenshots**

`visual.spec.ts` uses reduced motion, hides the MapLibre canvas only for the homepage screenshot after confirming the accessible map content, and captures:

```ts
const cases = [
  ["home", "/"],
  ["browse", "/cafes?mood=coffee-nerd"],
  ["map", "/cafes?view=map"],
  ["detail", "/cafes/matcha-matcha-church-street"],
  ["roulette", "/roulette?mood=cozy&seed=visual"],
  ["suggest", "/suggest"],
] as const;

for (const [name, route] of cases) {
  test(`${name} matches approved art direction`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    const mapCanvas = page.locator(".maplibregl-canvas");
    await expect(page).toHaveScreenshot(`${name}-1440.png`, {
      fullPage: true,
      animations: "disabled",
      mask: (await mapCanvas.count()) ? [mapCanvas] : [],
      maskColor: "#d8b88c",
    });
  });
}
```

Generate and review baselines once with `npm run test:e2e -- --update-snapshots tests/e2e/visual.spec.ts`; do not auto-update them in CI.

- [ ] **Step 4: Add a deterministic client-budget script**

```js
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../build/client/assets/", import.meta.url);
const files = await readdir(root);
const js = await Promise.all(files.filter((file) => file.endsWith(".js")).map(async (file) => ({
  file,
  bytes: (await stat(new URL(file, root))).size,
})));
const initial = js.filter(({ file }) => !file.includes("maplibre") && !file.includes("CafeMap"));
const oversized = initial.filter(({ bytes }) => bytes > 250_000);
if (oversized.length) throw new Error(`Oversized non-map chunks: ${JSON.stringify(oversized)}`);
console.log(`Checked ${initial.length} non-map chunks; largest ${Math.max(...initial.map(({ bytes }) => bytes))} bytes.`);
```

Add `"check:client-budget": "node scripts/check-client-budget.mjs"` to `package.json` and run it after build in CI.

- [ ] **Step 5: Run and review the browser matrix**

Run: `npm run test:e2e`

Expected: critical paths, axe, keyboard, reduced motion, 320/375/414/768/1280/1440 geometry, 200% zoom, and reviewed screenshots pass.

- [ ] **Step 6: Run the complete local release gate**

Run: `npm test && npm run lint && npm run typecheck && npm run build && npm run check:client-budget && npm run test:e2e && npx wrangler deploy --dry-run && npm audit --audit-level=high && git diff --check`

Expected: all commands succeed, Wrangler upload includes no local secrets, and audit reports zero high-severity vulnerabilities.

- [ ] **Step 7: Commit**

```bash
git add tests/e2e playwright.config.ts .github/workflows/ci.yml scripts/check-client-budget.mjs package.json tests/e2e/visual.spec.ts-snapshots
git commit -m "test: lock Meet Me There release quality"
```

---

### Task 15: Rename local configuration and documentation without touching production

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `.env.example`
- Modify: `wrangler.jsonc`
- Create: `workers/legacy-redirect.ts`
- Create: `wrangler.legacy.jsonc`
- Modify: `tests/unit/community-config.test.ts`
- Create: `tests/unit/legacy-redirect.test.ts`

- [ ] **Step 1: Write failing deployment-config and redirect tests**

```ts
it("targets the new Worker and exact Turnstile hostname", async () => {
  const config = JSON.parse(await readFile(new URL("../../wrangler.jsonc", import.meta.url), "utf8"));
  expect(config.name).toBe("meet-me-there");
  expect(config.vars.TURNSTILE_HOSTNAME).toBe("meet-me-there.adnaankhan0901.workers.dev");
  expect(config.d1_databases[0].database_id).toBe("78498833-1fd9-429e-9ec9-9f1eef756b34");
  expect(JSON.stringify(config)).not.toContain("TURNSTILE_SECRET");
});
```

```ts
import redirect from "../../workers/legacy-redirect";

it("permanently redirects pages with path and query intact", async () => {
  const response = await redirect.fetch(new Request("https://cafe-weather.example/cafes?q=matcha"));
  expect(response.status).toBe(308);
  expect(response.headers.get("location")).toBe("https://meet-me-there.adnaankhan0901.workers.dev/cafes?q=matcha");
});
```

- [ ] **Step 2: Verify deployment tests fail**

Run: `npm test -- --run tests/unit/community-config.test.ts tests/unit/legacy-redirect.test.ts`

Expected: FAIL because the app still targets `cafe-weather` and no redirect Worker exists.

- [ ] **Step 3: Rename the application Worker config but retain the D1 database name and ID**

Set `wrangler.jsonc` name and hostname to `meet-me-there` and `meet-me-there.adnaankhan0901.workers.dev`. Keep D1 binding `DB`, database name `cafe-weather`, and the existing database ID unchanged. Database identity is infrastructure, not public branding.

- [ ] **Step 4: Add the legacy page redirect and API proxy**

```ts
const canonicalOrigin = "https://meet-me-there.adnaankhan0901.workers.dev";

export default {
  async fetch(request: Request): Promise<Response> {
    const source = new URL(request.url);
    const target = new URL(source.pathname + source.search, canonicalOrigin);
    if (!source.pathname.startsWith("/api/")) return Response.redirect(target, 308);

    const headers = new Headers(request.headers);
    headers.set("origin", canonicalOrigin);
    const proxy = new Request(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      redirect: "manual",
    });
    return fetch(proxy);
  },
};
```

`wrangler.legacy.jsonc` contains name `cafe-weather`, `main: "./workers/legacy-redirect.ts"`, the same compatibility date and `nodejs_compat`, `workers_dev: true`, `preview_urls: false`, and no D1 or secret bindings.

- [ ] **Step 5: Update package and documentation names**

Set package name to `meet-me-there`; keep database scripts pointed at D1 database `cafe-weather`. Rewrite README title, product description, live URLs, canonical deployment steps, legacy redirect explanation, test commands, and public/private data model. Update `.env.example` comments only; do not add values.

- [ ] **Step 6: Run config, redirect, build, and dry-run checks**

Run: `npm test -- --run tests/unit/community-config.test.ts tests/unit/legacy-redirect.test.ts && npm run build && npx wrangler deploy --dry-run && npx wrangler deploy --config wrangler.legacy.jsonc --dry-run`

Expected: both Worker bundles build; the application bundle has D1/public Turnstile variables and no secrets; the legacy bundle has no bindings.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json README.md .env.example wrangler.jsonc workers/legacy-redirect.ts wrangler.legacy.jsonc tests/unit/community-config.test.ts tests/unit/legacy-redirect.test.ts
git commit -m "chore: prepare Meet Me There release migration"
```

---

### Task 16: Perform independent review, merge, push, and verify GitHub CI

**Files:**
- Review: all changes against `docs/superpowers/specs/2026-07-10-meet-me-there-redesign.md`

- [ ] **Step 1: Run the complete fresh release gate**

Run: `npm ci && npm test && npm run lint && npm run typecheck && npm run build && npm run check:client-budget && npm run test:e2e && npx wrangler deploy --dry-run && npx wrangler deploy --config wrangler.legacy.jsonc --dry-run && npm audit --audit-level=high && git diff --check`

Expected: every command passes on a clean dependency install.

- [ ] **Step 2: Run three read-only reviews**

Request independent findings for:

1. visual fidelity against the approved companion and spec;
2. behavioural/accessibility regression risk;
3. Cloudflare, secret, D1, Turnstile, redirect, and deployment safety.

Resolve every blocking or high-confidence finding, rerun affected tests, and commit each fix with a focused message.

- [ ] **Step 3: Verify the feature branch is clean and review its complete diff**

Run: `git status --short && git diff --stat main...HEAD && git diff --check && git log --oneline main..HEAD`

Expected: clean status, intentional files only, no whitespace errors, and focused commits.

- [ ] **Step 4: Fast-forward local main**

```bash
git -C /Users/adnaankhan/Desktop/coffee merge --ff-only codex/meet-me-there-redesign
```

Expected: main advances without a merge commit.

- [ ] **Step 5: Push main to the current repository before renaming it**

Run: `git -C /Users/adnaankhan/Desktop/coffee push origin main`

Expected: GitHub receives the exact local main SHA and triggers CI.

- [ ] **Step 6: Wait for and verify CI**

Run: `gh run list --repo adukhan98/cafeweather --branch main --limit 1 --json databaseId,status,conclusion,headSha,url`, then `gh run watch <databaseId> --repo adukhan98/cafeweather --exit-status`.

Expected: CI completes successfully on the local main SHA.

---

### Task 17: Rename GitHub, deploy the new Worker, and activate the legacy redirect

**Files:**
- External: GitHub repository `adukhan98/cafeweather`
- External: Cloudflare Worker `meet-me-there`
- External: Cloudflare Worker `cafe-weather`
- External: Turnstile widget `Café Weather production` (rename it to `Meet Me There production`)
- External: D1 database `cafe-weather` (binding only; do not recreate)

- [ ] **Step 1: Rename the GitHub repository and update the local remote**

```bash
gh api --method PATCH repos/adukhan98/cafeweather -f name=meet-me-there
git remote set-url origin https://github.com/adukhan98/meet-me-there.git
gh repo view adukhan98/meet-me-there --json nameWithOwner,visibility,url,defaultBranchRef
git ls-remote origin refs/heads/main
```

Expected: public repository `adukhan98/meet-me-there`, default branch `main`, and remote SHA equal to local main.

- [ ] **Step 2: Verify GitHub’s old repository redirect**

Run: `curl -sSIL https://github.com/adukhan98/cafeweather | sed -n '1,12p'`

Expected: GitHub redirects to `https://github.com/adukhan98/meet-me-there`.

- [ ] **Step 3: Add the new hostname to Turnstile before deployment**

In Cloudflare Turnstile, rename the widget to `Meet Me There production`, retain the existing old hostname temporarily, and add exactly `meet-me-there.adnaankhan0901.workers.dev`. Keep Managed mode and action `suggestion`. Verify both hostnames are visible in the widget configuration before saving.

- [ ] **Step 4: Provision new Worker secrets without printing them**

Generate a new 32-byte visitor secret directly into Wrangler:

```bash
openssl rand -hex 32 | npx wrangler secret put VISITOR_HMAC_SECRET
```

Copy the existing Turnstile secret from the authenticated dashboard and pipe it without echoing:

```bash
pbpaste | npx wrangler secret put TURNSTILE_SECRET
```

Expected: Wrangler confirms both secrets for Worker `meet-me-there`; neither value appears in shell output, files, Git, or logs.

- [ ] **Step 5: Deploy the new application Worker**

Run: `npm run deploy`

Expected: deployment URL `https://meet-me-there.adnaankhan0901.workers.dev` with D1 binding, public Turnstile key, exact hostname, and action `suggestion`.

- [ ] **Step 6: Verify the new production application end to end**

Check:

```bash
base=https://meet-me-there.adnaankhan0901.workers.dev
for route in / /cafes /cafes/matcha-matcha-church-street /roulette /suggest /privacy /terms; do
  curl -fsS -o /dev/null -w "$route=%{http_code}\n" "$base$route"
done
curl -fsS "$base/api/v1/cafes" | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>console.log(JSON.parse(s).cafes.length))'
```

Expected: every page returns `200` and API returns `36` cafés.

Use Chrome to repeat search → browse → detail, mobile menu, map, roulette, reaction add/remove, and one Turnstile-protected suggestion. Query D1 to prove the suggestion reached pending state, then delete the test suggestion and confirm zero test reactions/suggestions remain.

Run a Chrome DevTools performance trace at 375×812 and 1440×900 on the new homepage and `/cafes?view=map`. Record LCP, CLS, the slowest tested interaction, and long tasks. The release gate is LCP at or below 2.5 seconds, CLS at or below 0.1, tested interaction latency at or below 200 ms, and no application-script long task above 200 ms. If the map route misses a threshold, capture the responsible task or request, fix it, and repeat the trace before continuing.

- [ ] **Step 7: Deploy the old-host redirect only after the new host passes**

Run: `npx wrangler deploy --config wrangler.legacy.jsonc`

Expected: Worker `cafe-weather` is replaced by the redirect/proxy deployment.

- [ ] **Step 8: Verify page redirects and legacy API continuity**

```bash
curl -sSI "https://cafe-weather.adnaankhan0901.workers.dev/cafes?q=matcha"
curl -fsS "https://cafe-weather.adnaankhan0901.workers.dev/api/v1/cafes" | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>console.log(JSON.parse(s).cafes.length))'
```

Expected: page response is `308` with the equivalent new path/query; legacy API proxy returns `36` cafés.

- [ ] **Step 9: Remove the old hostname from Turnstile after redirect verification**

Keep only `meet-me-there.adnaankhan0901.workers.dev` in the production Turnstile widget and save. Re-submit one new-host suggestion to prove Turnstile still passes, then delete the test row.

- [ ] **Step 10: Final completion audit**

Verify all of the following with current evidence:

- local main is clean and equals GitHub main;
- GitHub repository is public and renamed;
- GitHub CI is green on the final SHA;
- every new-host route and API passes;
- every old page URL redirects and legacy API reads continue;
- D1 contains 36 cafés and no launch-test community rows;
- production Turnstile allows only the new hostname;
- no secret value exists in tracked files or upload bundles;
- live Chrome has no console errors or accessibility regressions;
- final screenshots match the approved warm Meet Me There direction.

Only after every item is proven should the redesign be declared complete.
