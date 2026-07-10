# Meet Me There Brand and Experience Redesign

## Decision

Rename **Café Weather** to **Meet Me There** and rebuild the complete frontend
experience around one idea: every café recommendation is an invitation between
people. This is a full experience redesign, not a visual reskin. The verified
café catalogue, product capabilities, APIs, Cloudflare architecture, security
controls, and accessibility guarantees remain intact.

The approved direction is warm, playful, art-led, and deliberately expressive.
It uses invitation notes, receipt paper, cup rings, route lines, stamps, table
coasters, and typographic compositions instead of stock café photography. Each
route receives a distinct composition while remaining recognizably part of one
system.

## Approved creative inputs

- The name combines an ownable phrase with a subtle Toronto social ritual.
- The brand centres cafés as meeting places rather than coffee rankings.
- The tone is a playful insider: conversational, culturally sharp, and direct.
- Imagery is art-led, not photography-led.
- Motion combines cinematic scroll scenes with tactile product interactions.
- Existing functionality may be recomposed completely as long as it remains
  fast, legible, accessible, and understandable.
- The warm visual revision is canonical: espresso brown, terracotta, honey,
  cream, soft clay, tactile paper, and human serif typography.

## Brand foundation

### Name and descriptor

- Product name: **Meet Me There**
- Descriptor: **A Toronto café guide**
- Positioning line: **A better answer to “where?”**

The name is the product promise. It frames discovery as making a plan with
someone, not consulting a directory. The descriptor appears where first-time
clarity matters: metadata, search previews, the footer, and compact brand
lockups. It does not need to follow every use of the wordmark.

### Voice

The public voice is concise, playful, and socially observant. It uses real
situations and avoids coffee-industry clichés, corporate language, cuteness,
and exaggerated claims.

Approved examples:

- Homepage: “Where are we meeting?”
- Search prompt: “What kind of place?”
- Browse: “Find somewhere that fits.”
- Map: “Somewhere between here and there.”
- Roulette: “Pick the place. Send the pin.”
- Suggestion: “Know a place?”
- Detail: “Meet me at MATCHA MATCHA.”
- Empty state: “Nothing fits all of that. Loosen one part of the plan.”
- Reaction prompt: “Leave a quick note for the next person.”

Copy stays in sentence case except compact wayfinding labels and stamps.
Exclamation marks, generic enthusiasm, ratings language, and fictional social
proof are excluded.

## Experience principles

1. **The invitation is the interface.** A place, mood, route, or result should
   feel like something one person could send to another.
2. **Art carries meaning.** Overlaps, marks, stamps, and routes correspond to
   actual places, choices, coordinates, states, or actions.
3. **Useful actions remain obvious.** Search, filter, directions, map, roulette,
   reactions, and suggestions never hide behind visual experimentation.
4. **Every page gets one dominant scene.** Pages use strong full-background
   compositions rather than alternating generic white content sections.
5. **Warmth without nostalgia cosplay.** Analog materials feel handled and
   human, while typography, information, and interactions remain contemporary.
6. **Motion communicates state.** Movement represents arrival, selection,
   sending, shuffling, or spatial relationship; it is never ambient noise.
7. **No invented venue imagery.** The site does not imply that generated or
   stock art depicts a listed café.

## Visual system

### Palette

The palette uses one dark anchor and four warm scene colours. Pages may change
dominant background colour, but each scene uses no more than three palette
colours at once.

| Token | Value | Role |
|---|---:|---|
| Espresso ink | `#2A1712` | text, outlines, dark scenes |
| Receipt cream | `#F7EAD2` | paper, forms, light scenes |
| Terracotta red | `#E8694D` | invitations, action, energetic scenes |
| Window-light honey | `#F3C95F` | warmth, selected states, roulette |
| Soft clay | `#EFB6A3` | social and reflective scenes |
| Stamp burgundy | `#8E2F2D` | shadows, verification marks, emphasis |

Focus, disabled, error, success, and map colours derive from these tokens but
must meet WCAG contrast requirements in their final combinations. Colour is
never the only state indicator.

### Typography

- Display and expressive annotation: **Fraunces Variable**, including italic
  and optical-size axes.
- Interface, body, controls, and navigation: **IBM Plex Sans Variable**.
- Coordinates, counts, timestamps, stamps, and technical provenance:
  `ui-monospace` with tabular figures.

Large display text is treated as imagery through scale, cropping, overlap, and
line breaks. Body copy remains conventional, left aligned, and limited to
approximately 65 characters per line. Interface labels use uppercase only at
small sizes with deliberate tracking.

### Graphic materials

The reusable visual vocabulary is:

- torn receipt and napkin edges;
- invitation notes and postcards;
- cup rings and table marks;
- hand-drawn route lines tied to Toronto locations;
- coordinate stamps and branch-verification marks;
- map pins, numbered locations, and selected-place overlays;
- table-coaster reaction controls;
- warm paper grain and print variation;
- oversized typographic masks and horizontal location tickers.

Assets are code-native SVG, CSS, or locally stored textures. There are no
third-party runtime image requests. Grain remains subtle enough to avoid text
noise and banding.

### Motion

The motion model has three behaviours:

1. **Arrive:** text and notes enter through masks or slide into a composed
   resting place with a restrained overshoot.
2. **Choose:** moods, filters, map marks, and reactions respond immediately and
   pull relevant places visually closer.
3. **Send:** roulette and suggestion success states resolve into a shareable
   invitation or stamped confirmation.

Primary transitions use transforms and opacity. Typical interaction duration
is 180–320 ms; orchestrated scene transitions may use 450–650 ms. No custom
smooth-scroll engine is introduced. Scroll-linked effects progressively
enhance native scrolling and never gate content.

`prefers-reduced-motion: reduce` removes parallax, travel, looping tickers, and
card throws. It retains opacity changes and final compositions without delaying
content or interaction.

## Information architecture and page designs

Existing public paths remain stable during the frontend redesign:

- `/`
- `/cafes`
- `/cafes/:slug`
- `/roulette`
- `/suggest`
- versioned `/api/v1/*` endpoints

### Homepage

The homepage is a sequence of distinct full-background scenes:

1. **Invitation hero:** full-screen terracotta composition with the wordmark,
   “Where are we meeting?”, a note-shaped search control, cup rings, and a live
   ticker of real moods and situations.
2. **Mood stage:** asymmetric, full-bleed choices for quiet work, first date,
   catch up, serious coffee, matcha and pastry, and open late. Selection updates
   a direct browse action and the represented place count.
3. **Map scene:** the map becomes the dominant background. Selected café notes
   overlap it while retaining a complete accessible list and map attribution.
4. **Roulette scene:** a honey-coloured full-screen card deck with a single
   decisive action and transparent filter context.
5. **Horizontal city trail:** editorial picks move through a horizontal rail of
   large invitation panels using real café data.
6. **Neighbourhood roll:** a burgundy typographic index shows real result counts
   and provides direct browse links.
7. **Suggestion finale:** a terracotta closing scene asks “Know a place?” and
   leads directly to the moderated suggestion form.

The page never loads misleading venue photography. The visual drama comes from
type, map information, custom illustration, colour, depth, and motion.

### Browse and map

Browse opens with an oversized live result count and the prompt “Find somewhere
that fits.” Filters appear as tactile paper tabs with explicit selected states,
result counts, reset controls, and URL-backed state.

Desktop uses a variable-width list-and-map composition rather than two equal
columns. The list remains the semantic source of truth. The map occupies the
dominant background area and selected cafés appear as overlapping invitation
notes. Mobile uses a clear list/map mode switch and never forces a split view.

Search, filter combination, empty recovery, map failure fallback, and deep
links behave exactly as they do today.

### Café detail

The café name becomes the hero artwork while the exact branch and address sit
on an invitation note. The page then separates four practical questions:

1. Why meet here?
2. What should we order or notice?
3. How was this exact entry verified?
4. What else is nearby?

Moods and offerings use circular verification-style stamps. Community reactions
appear as table coasters with count, active, pending, failure, retry, focus, and
disabled states. Directions remain the clearest action on the page.

### Roulette

Roulette is a full-screen decision-relief experience. Active filters appear as
rubber stamps, and the result resolves from a physical-looking card deck. The
result always exposes the match reason, branch, neighbourhood, directions,
reroll, and return-to-browse actions.

The deterministic algorithm, active-filter contract, previous-result avoidance,
and URL state remain unchanged. Motion enhances the reveal but does not delay
the result for reduced-motion users.

### Suggestion

The form appears as one large torn-paper note on a burgundy scene. Fields use
plain labels and stable helper/error regions. Copy asks for the café name, exact
branch or address, why it is worth meeting there, and an optional order or
detail recommendation.

Honeypot, input validation, address-or-map requirement, request limits, rate
limits, Turnstile, idempotency, pending moderation, and success behaviour remain
unchanged. Bot verification is visually integrated but never disguised.

### Global navigation and footer

Desktop navigation is a compact floating receipt strip with wordmark, core
destinations, city context, and active route. Mobile uses a full-screen warm
paper menu with large direct links and reliable Escape/outside-pointer closing.

The footer becomes a final invitation rather than a link farm. It contains the
descriptor, Browse, Map, Roulette, Suggest, source provenance, verification
date, privacy, and terms. Privacy and terms pages are added before public data
collection expands beyond the current anonymous system.

## Component and code architecture

The backend remains unchanged except where deployment names or metadata require
updates. The frontend is reorganized around small visual primitives and
route-level compositions.

### Shared primitives

- `BrandLockup`: accessible wordmark and descriptor variants.
- `InvitationNote`: torn-paper surface with semantic element selection.
- `Scene`: full-background colour, texture, and layout boundary.
- `RouteLine`: decorative or data-backed path with accessible hiding.
- `LocationStamp`: coordinates, neighbourhood, verification, or count.
- `CupRing`: decorative background mark.
- `MotionReveal`: progressive entrance with reduced-motion support.
- `PlaceInvitation`: reusable café identity, reason, branch, and action.
- `FilterTab`: filter state, count, focus, active, and removal behaviour.
- `ReactionCoaster`: reaction count and mutation state.
- `RouletteDeck`: result reveal and reroll state.
- `FormNote`: semantic form surface with field, error, and success regions.

Visual primitives accept content and state; they do not fetch data. Route
features continue to own loaders, URL state, API calls, and mutation lifecycles.

### Route compositions

- `DiscoveryHome` becomes a composition of hero, mood stage, map scene,
  roulette teaser, city trail, neighbourhood roll, and suggestion finale.
- `CafeCatalogue` keeps its URL-state and request logic while rendering the new
  browse shell, filter tabs, result invitations, and map composition.
- `CafeDetailPage` keeps its verified-data and nearby-place logic while using
  the detail hero, information scenes, and reaction coasters.
- `RoulettePage` keeps deterministic selection and request cancellation while
  rendering the deck interaction.
- `SuggestionForm` keeps validation and Turnstile lifecycles while rendering
  the composed form note.

No visual component duplicates filtering, roulette, validation, reaction, or
repository logic.

## Data flow

The current data contracts remain authoritative:

- loaders request the published catalogue through the shared catalogue service;
- D1 remains authoritative for production catalogue reads and community writes;
- verified seed data remains the local and degraded-read fallback;
- URL search parameters remain the source of truth for browse and roulette
  filters;
- reaction and suggestion clients retain cancellation, timeout, retry, and
  idempotency behaviour;
- visual state derives from existing typed domain results rather than creating
  a parallel presentation data model.

The redesign adds only narrowly scoped derived view models such as display
order, scene colour, short invitation copy, and map-card placement. These are
pure functions covered by unit tests.

## Loading, empty, error, and success states

- **Loading:** use paper-shaped skeletons that match final geometry. Map loading
  uses an illustrated route field and meaningful status text.
- **Empty:** keep the current filters visible, explain which part of the plan is
  too restrictive, and offer focused removal plus a complete reset.
- **Map failure:** retain the full accessible result list, directions links, and
  a composed static city-field background.
- **Community unavailable:** keep café content usable and render a stamped
  unavailable note with retry when appropriate.
- **Mutation failure:** restore the previous reaction state and attach retry to
  the affected coaster.
- **Suggestion validation:** reserve error space, associate errors with fields,
  and focus the first invalid field on submit.
- **Suggestion success:** stamp the note “pending review,” clear sensitive form
  state, and provide one clear “suggest another” action.
- **404:** use a lost-in-the-city invitation with direct Browse, Map, and
  Roulette recovery.

Errors remain direct and specific. They never use jokes that obscure recovery.

## Responsive and accessibility requirements

- Verify 320, 375, 414, 768, 1280, and 1440 CSS-pixel widths.
- Avoid horizontal document overflow; only explicitly labelled rails may scroll
  horizontally.
- Maintain a minimum 44 CSS-pixel interactive target.
- Preserve semantic landmarks, headings, lists, forms, labels, live regions,
  and the skip link.
- Keep DOM order logical when desktop compositions overlap or reorder visually.
- Provide visible focus indicators that fit the visual system.
- Make every hover interaction available by focus and touch.
- Do not place essential text inside decorative SVG or raster assets.
- Maintain zoom and text-resize usability through 200%.
- Keep map controls, list fallback, and attribution accessible.
- Validate all final colour combinations with automated and manual contrast
  checks.

## Performance requirements

- Do not introduce a smooth-scroll framework or a general animation runtime.
- Use CSS transitions, Web Animations, and small route-scoped helpers only where
  they materially improve the interaction.
- Lazy-load MapLibre and non-critical art assets.
- Render the homepage hero and first discovery action without waiting for the
  interactive map.
- Store textures locally, compress them, and prefer SVG/CSS where practical.
- Avoid layout animation that changes width, height, top, or left on every
  frame; animate transforms, opacity, and masks.
- Audit bundle size, LCP, CLS, INP, and long tasks before deployment.

## Public rename and deployment migration

The public rename is completed without breaking existing links:

1. Rename package metadata, document titles, descriptions, structured metadata,
   favicon, social artwork, visible copy, tests, and documentation to Meet Me
   There.
2. Rename the GitHub repository from `cafeweather` to `meet-me-there`; update the
   local remote and verify GitHub’s old-repository redirect.
3. Provision the Cloudflare Worker `meet-me-there` using the existing D1
   database and the same public configuration.
4. Add `meet-me-there.adnaankhan0901.workers.dev` to the production Turnstile
   widget, provision the Worker secrets, and deploy the new application.
5. Verify production routes, APIs, reactions, suggestion submission, Turnstile,
   D1 persistence, responsive layouts, console output, and accessibility.
6. Replace the old `cafe-weather` Worker with a minimal permanent redirect to
   the new hostname while preserving path and query string.
7. Update README and deployment documentation with canonical and legacy URLs.

The old Worker is not removed until the redirect is live and verified. The D1
database is not recreated, copied, or reseeded during the rename.

## Testing and review

### Automated verification

- Preserve all domain, API, repository, rate-limit, idempotency, validation,
  Turnstile, and data-integrity tests.
- Update brand and DOM assertions without weakening behavioural coverage.
- Add unit tests for new pure display-order and scene-state derivations.
- Add component tests for navigation, filter tabs, map overlays, reaction
  coasters, roulette deck, form note, reduced motion, and error recovery.
- Extend Playwright coverage across the complete browse → filter → detail →
  directions flow, roulette, reaction persistence, suggestion validation and
  submission, keyboard navigation, and 404 recovery.
- Keep axe checks and all launch viewport geometry checks.
- Add screenshot comparisons for the approved homepage, browse, detail,
  roulette, suggestion, mobile menu, loading, empty, error, and success states.
- Run lint, typecheck, production build, deterministic seed verification,
  upload dry run, and dependency audit.

### Manual and live verification

- Compare final browser captures with the approved visual companion direction.
- Test Chrome with mouse, keyboard, and touch-sized viewports.
- Verify reduced-motion output as a designed composition, not merely disabled
  animation.
- Check map gestures, attribution, focus, and fallback behaviour.
- Inspect console errors and warnings on every public route.
- Submit and remove production test reactions and suggestions.
- Verify GitHub CI on the final remote commit.
- Run independent design, release, and Cloudflare security reviews before final
  deployment.

## Out of scope

- User accounts, profiles, and synchronized saved lists.
- Public written reviews or star ratings.
- User-uploaded or generated venue photography.
- Automated hours or “open now” claims.
- A public moderation dashboard.
- Replacing the verified café dataset or adding unverified listings as part of
  the visual redesign.
- A custom purchased domain; the new workers.dev hostname is canonical for this
  release.

## Success criteria

- The public product is named Meet Me There everywhere a visitor encounters it.
- The experience feels warm, original, playful, and art-directed across every
  route, not only the homepage.
- Each page uses a distinct full-background composition from the approved
  visual system.
- A first-time visitor understands that the product finds Toronto cafés and can
  reach a relevant result within two interactions.
- Search, filters, map, directions, roulette, reactions, and suggestions retain
  or improve their existing usability.
- No stock or generated image is presented as a real listed venue.
- Keyboard, touch, reduced motion, 200% zoom, contrast, and launch viewports pass
  automated and manual review.
- Performance remains appropriate for mobile discovery despite the richer art
  direction.
- Local and GitHub verification passes on the final commit.
- The new Cloudflare deployment is live and fully verified, and every old public
  URL redirects permanently to the equivalent new URL.
