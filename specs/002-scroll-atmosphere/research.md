# Research: Scroll-Driven Atmosphere

Phase 0 output. Six decisions, each with what was chosen, why, and what was rejected. Nothing here
fixes a colour, a stage count, a duration or a curve — FR-027 reserves those to the design phase, and
Constitution IV says the same. What these decisions constrain is the *mechanism*, because the mechanism
is where the accessibility and performance requirements actually live.

---

## D1 — The ground responds through one CSS custom property, not through JS styling

**Decision:** a single fixed, full-viewport layer sits beneath all content. A scroll listener throttled
to one `requestAnimationFrame` per frame writes exactly one number — the document's normalized scroll
progress — onto `documentElement` as a custom property. Everything else (which tone, how it blends,
where the seams are) is resolved in CSS from that number. The stage table and the interpolation live in a
pure module so they can be tested without a browser.

**Rationale:** this keeps the whole effect off the layout and paint paths that scroll can't afford. One
custom-property write per frame is a style recalculation on one element; it cannot cause layout, and it
cannot be observed by the shopper as lag because it never blocks the scroll. It also gives FR-007 for
free — the tone is a pure function of position, so entering the page at an arbitrary point, after a
reload, or after back/forward is correct on the first frame with no catch-up animation, which is
SC-009's requirement. And FR-025 falls out of the same property: when the page is hidden, no scroll
events fire, so nothing runs.

**Alternatives considered:**
- *Writing `background-image` or gradient stops from JS each frame* — rejected: string-building a
  five-stop gradient per frame allocates and forces a full repaint of the largest element on the page.
- *Cross-fading N stacked opaque layers, toggling `opacity` per section* — rejected as the primary
  mechanism: N layers means N paints at the boundary and a visible midpoint where two overlap, which is
  exactly the "seam" FR-004 forbids. Retained as the fallback expression for reduced motion, where
  discrete settled tones per region are the requirement anyway (FR-020).
- *CSS-only, no JS at all* — see D2; the modern form of this is genuinely better where it is supported,
  and the support floor is the reason it is not the only path.

**Resolves:** FR-001, FR-004, FR-007, FR-010, FR-014, SC-006, SC-009, SC-010.

---

## D2 — No scroll library, and scroll-driven CSS animations are progressive enhancement only

> **Corrected 2026-09-22, on two factual errors in this decision, both found while planning feature 005.**
> They do not overturn the conclusion — a colour that tracks scroll position still should not cost a
> library — but the reasoning as written below is partly built on things that are not true, and Question 1
> has been reopened for scroll *physics*, where this decision is directly load-bearing.
>
> 1. **"GSAP … would be a runtime"** — `gsap@3.15.0` is already a dependency and already imported in
>    `components/ui/CardSwap.tsx` and `components/layout/PillNav.tsx`. `node_modules/gsap/ScrollSmoother.js`
>    is present; GSAP's club plugins became free at 3.13. So the option rejected here was not an addition to
>    the thirteen-package ceiling; it was already inside it.
> 2. **"`motion` is not used anywhere on this page today"** — false.
>    `components/home/FeaturedProducts.tsx:4` imports `motion` from `motion/react`, and that component is
>    mounted on the homepage at `app/(main)/page.tsx:177`. The competing-choreography risk this paragraph
>    claims `motion` would *create* already exists and has to be managed regardless.
>
> The consequence for the reopened Question 1: the owner's "smooth and heavy" is scroll physics, and
> `ScrollSmoother` — installed, licensed, unused — is the canonical implementation of exactly that. D2's
> rejection was argued for a colour-tracking scalar and does not extend to it. 002's plan should be re-derived
> with that on the table rather than inheriting this paragraph's conclusion. See
> `specs/005-categories-carousel/research.md` D2 for the same fact applied the other way round: at a section
> that must never touch page scroll, a document-level scroller is the wrong tool on merit.

**Decision:** neither GSAP ScrollTrigger nor `motion` is used in this feature. `animation-timeline:
scroll()` is used only as an enhancement behind a feature test, with the D1 custom property as the path
that always runs.

**Rationale:** the requirement is one scalar — where in the document are we — consumed by CSS. That is
the smallest possible job, and every library here would be a runtime, a cleanup obligation and a second
animation idiom on a page that Constitution IV and feature 004's C22 both punish. GSAP's value is
timelines, scrubbing and physics; none of it is needed to move a colour. `motion` is not used anywhere on
this page today and would create exactly the competing-choreography problem 004 recorded as unsolved
until 002 lands.

On the CSS-native route: scroll-driven animations run off the main thread and are the correct long-term
answer, but the shopper base here is Iranian Android on a mix of Chrome versions and WebView, where the
support floor is uneven enough that it cannot be the only path. Running it as an enhancement over a
working baseline is the honest ordering; running it as the only path is a feature that silently does
nothing for part of the audience, which is the same failure as not shipping it.

**Alternatives considered:** *Lenis or a similar smooth-scroll library* — rejected outright and
specifically: Q1 = A says the shopper's own scrolling stays native and is not intercepted, eased or
substituted. A smooth-scroll library does precisely that. It is also the technique most likely to break
keyboard scrolling, caret browsing, screen-reader scroll anchoring, and RTL scroll restoration, which is
what FR-011 and FR-012 exist to prevent. *GSAP ScrollTrigger* — rejected, see above.

**Resolves:** FR-010 … FR-014, FR-028, and keeps the dependency set frozen.

---

## D3 — The layer mounts in `app/(main)/layout.tsx`, never inside a section

**Decision:** `PageGround` renders as a sibling of `.noir-stars` and `.gradient-blur` in the main layout,
outside `<main>`.

**Rationale:** this is the constraint that would otherwise be discovered the hard way. **A transformed
ancestor becomes the containing block for `position: fixed` descendants**, so a fixed layer placed inside
any section wrapped by `Reveal` — which animates `transform: translateY(26px)` on every homepage section
— stops being viewport-anchored and starts being section-anchored. The page has already been bitten by
exactly this: `app/globals.css` records that `background-attachment: fixed` failed inside the tray field
because "a transformed ancestor makes a fixed attachment resolve against that ancestor instead of the
viewport", and the fix was to remove the second layer rather than fight it. Mounting at layout level puts
the ground above every transform in the tree.

`.site-shell` is `position: relative`, which does **not** create a containing block for fixed descendants
— only transform, filter, perspective, will-change on those properties, and `contain` do — so the layout
level is safe. `body::before` already proves the point: it is fixed, inset 0, and behaves.

**Alternatives considered:** *styling `body` itself* — rejected, because Q2 = C forbids altering the
existing five-glow field on `body`, and a per-frame custom property on `body` would recalculate the
largest paint on the page. *A portal into `<main>`* — rejected, it reintroduces the transform problem it
was meant to avoid. *`position: sticky` on a tall wrapper* — rejected; it couples the ground to document
height and fights the footer seam FR-008 cares about.

**Resolves:** FR-006, FR-018, FR-008, and prevents the single most likely implementation failure.

---

## D4 — The progression is expressed as a stage table keyed to real section anchors

**Decision:** the tonal progression is declared as an ordered table of stages, each naming the homepage
section it anchors to, and the pure module resolves "what tone at position p" from that table. The
section anchors come from the existing homepage order, which is already stable and enumerable: hero,
mobile quick routes, featured products, categories, brands, new arrivals, B2B, accessories, online
services, store experience, trust, final conversion.

**Rationale:** FR-002 requires the shift to read as belonging to the page's structure rather than as an
independent animation, and the only way to get that is for the stage boundaries to *be* the section
boundaries rather than arbitrary fractions of document height. Deriving anchors from the DOM also means
the progression survives content changes: FR-027 forbids fixing the stage count, and a table keyed to
sections can grow or shrink without touching the mechanism. It is also what makes the resize and
orientation edge cases tractable — anchors are recomputed from layout, not remembered as pixels.

**Alternatives considered:** *fixed fractions of document height* — rejected: a section shorter than the
screen then owns a fraction that does not match what the shopper sees, which is US3's scenario 4 failure.
*One stage per section* — rejected as an implementation mandate: the spec's own coherence assumption says
three or four closely-related stages beat many contrasting ones, and the grouping is a design decision
FR-027 reserves. The table supports either.

**Resolves:** FR-002, FR-003, FR-006, FR-027, and the resize/orientation and late-content edge cases.

---

## D5 — The legibility guarantee is a bounded lightness range, verified by sampling

**Decision:** the progression is constrained so that every intermediate tone stays inside a lightness band
whose worst case is measured, rather than so that each stage endpoint passes and the middle is assumed
fine. Verification is a script that steps the scroll position across the whole document and, at each
step, samples the rendered ground colour behind a fixed set of representative text nodes and computes
contrast.

**Rationale:** FR-015 and SC-004 are the highest-probability failure of this feature and the one ordinary
review cannot see — a midpoint that drops below threshold only exists while the page is moving. The spec
says it plainly: "zero failing measurements, not an average." A sampled sweep is the only instrument that
can produce that claim, and bounding the band at design time is what makes the sweep pass rather than
merely report.

The existing page already has the reference numbers to protect: the cream-on-wine marks measure 10.08:1,
the brand-ticker band 12.19:1, and 004 measured the emphasised brand row at 5.66:1 for the smallest text.
Any progression that pushes the ground outside the range those were measured against will fail some text
somewhere.

**Alternatives considered:** *checking each stage's endpoints* — rejected, that is precisely the
assumption SC-004 was written to forbid. *A runtime contrast adjustment* — rejected as over-engineering
that would also make the ground's appearance depend on the shopper's viewport, breaking FR-006's "one
continuous environment".

**Resolves:** FR-015, FR-016, FR-017, FR-019, FR-023, SC-004.

---

## D6 — No DOM test harness; the browser is the instrument, and the pure half is unit-tested

**Decision:** no jsdom, happy-dom or testing-library is added. `lib/atmosphere/progression.ts` is pure
and unit-tested in the existing Vitest node environment — tone at position, monotonicity of the band,
the reduced-motion discrete mapping, and the fallback tone. Everything that only exists when rendered is
verified through `browser-use` and scripted Playwright runs against a live server.

**Rationale:** same reasoning as feature 004's D6, and stronger here: the requirements that matter in
this feature are *measured in rendered pixels* — contrast at every scroll increment, no seam, no dropped
frame, correct tone after reload. A DOM simulation would assert that a style string was set, which is not
the promise. Adding a DOM harness would be a new dependency and a new convention to prove a thing it
cannot prove.

**Consequence to record honestly:** the contrast sweep and the frame-pacing check are scripts in the
validation step, not tests in the suite. They can regress without failing `npm test`. The mitigation is
that the quickstart makes them a gate, and the pure module's band-monotonicity test catches the class of
change most likely to break contrast — someone editing a stage value.

**Also recorded:** `npm test` in this repository is currently unsafe to run casually. It is
`dotenv -e .env.test -- vitest run`, `.env.test` does not exist, so `DATABASE_URL` falls through to the
development database and `tests/setup.ts` truncates 19 tables in a global `beforeEach` — including for
pure unit tests. Use `npx vitest run tests/unit`. This is a pre-existing harness defect, not something
this feature introduces or fixes.

**Resolves:** the verification strategy for every FR; SC-004, SC-005, SC-007, SC-008, SC-009, SC-010.

---

## Open items carried into tasks

| Item | Owner | Note |
|---|---|---|
| FR-005 vs Resolved Q2 = C | Owner | Q2 = C is the option the spec itself labels "likely to reproduce the busyness the request objects to". This plan honours C and constrains the new layer to shift value rather than add light sources. **If the FR-005 gate fails in validation, the correct response is to revisit Q2 toward B, not to weaken FR-005.** |
| Stale spec line | Docs | `spec.md` Assumptions still says "Question 2 is unresolved … the design phase cannot lock the ground", contradicting Resolved Clarifications. Not edited during planning. |
| Feature 004's C22/C24 obligations | 002 design | 004 committed to 220ms and `cubic-bezier(0.2, 0.7, 0.3, 1)` and recorded it in `specs/004-mobile-brands-rows/notes/coherence.md`. 002's ground transition is a different kind of motion (continuous, position-linked) so it does not take the 220ms figure, but it MUST use the same easing family wherever it has a discrete transition, and it must not become the page's second travelling element. |

---

## D9 — Scroll easing: GSAP ScrollSmoother, desktop-only (added 2026-09-22 for Resolved Q1 = C)

**Decision**: `components/atmosphere/ScrollSmooth.tsx` wraps `<main>` and `<Footer>` in
`#smooth-wrapper` / `#smooth-content` and creates `ScrollSmoother` with `smooth: 1.5`, gated on
`(pointer: fine) and not (any-pointer: coarse) and not (prefers-reduced-motion: reduce)`.

**Rationale — the library's default already is option C.** `node_modules/gsap/ScrollSmoother.js:121`
computes the smoothing duration as
`isTouch === 1 ? parseFloat(smoothTouch) || 0 : parseFloat(smooth) || 0.8`. An unset `smoothTouch`
parses to `0`, so on a touch device the lerp is zero and the OS's own momentum scroll is untouched.
The desktop/touch split the owner asked for is therefore the library's out-of-the-box behaviour rather
than a guard to write and then defend. `smoothTouch` is deliberately not passed, and the component says
so in a comment, because setting it would be the way to break this quietly.

Licensing is not a question: `package.json` reports GSAP's *"Standard 'no charge' license"* at 3.15.0,
and `node_modules/gsap/ScrollSmoother.js` is present in the installed package. Club plugins became free
at 3.13, which is what invalidated D2's cost argument — see the correction at the head of D2.

**The constraint that dictated the layout change, and it is the one to remember.** ScrollSmoother
animates by writing a `transform` to `#smooth-content`. A transformed ancestor becomes the containing
block for `position: fixed` descendants, so any fixed element inside the wrapped subtree stops sticking
to the viewport and starts travelling with the page. The page ground, `.noir-stars`, `.gradient-blur`,
the header island and the mobile dock are therefore **siblings** of `#smooth-wrapper` in
`app/(main)/layout.tsx`, and only document flow goes inside. This is the same mechanism as D3 and the
same one `.tray-field` records about `background-attachment: fixed` inside a `Reveal` wrapper. It will
look correct in a static screenshot either way, which is how it ships.

**Measured, 2026-09-22, headless Chromium at 1280×900.** After a single `wheel(0, 1200)`:

| t (ms) | `scrollY` | content `translateY` | lag |
|---|---|---|---|
| 0 | 0 | 0 | 0 |
| 90 | 1200 | 350 | **850** |
| 270 | 1200 | 954 | 246 |
| 450 | 1200 | 1170 | 30 |
| 810 | 1200 | 1199 | 1 |
| 1080 | 1200 | 1200 | 0 |

The scroll target is reached at once and the rendered content settles toward it over ~1s — that is the
"smooth and heavy" the brief names. **`window.scrollY` is the driver, not the experience**: a first
probe measured `scrollY` and reported "not eased" because it was reading the quantity ScrollSmoother
does not delay. The lag between `scrollY` and the content transform is the only honest signal.

Also verified: on an emulated iPhone the smoother is never created (`#smooth-content` computed
`transform: none`, `scrollTo` lands instantly); under `prefers-reduced-motion` the same; the fixed
ground and blur layers hold at viewport top `0` while content sits at 4000px; and `--hami-ground` still
tracks position through the smoother (`#180205` at 4000 → `#0e0205` at 11000).

**What this costs the rest of the page, and what it does not fix.** The easing is a rAF-driven transform
on the whole document subtree. Feature 004 measured this homepage at 33.3ms median frames on a
production build under CPU throttle; a permanently-running lerp on a 19,134px document is the kind of
change that has to be re-measured rather than assumed cheap, and that measurement is an open task.
FR-005's busyness finding is untouched by all of this — it was about the background, it still fails as
measured, and easing the scroll does not make the glow field quieter.
