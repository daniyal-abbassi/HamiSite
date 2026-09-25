# Feature Specification: Category Vitrine — the categories chapter as a lit cabinet

**Branch**: `Hami-v3` | **Date**: 2026-09-25 | **Spec**: this file
**Input**: owner direction, 2026-09-25 — «بخش دسته‌بندی‌ها زشت و بدترکیب است؛ چیزی خاص‌تر و لوکس‌تر»
**Supersedes**: feature 005 (`specs/005-categories-carousel/spec.md`) for the *presentation* of the
categories section. Feature 005's routing and eligibility decisions (FR-001…FR-004) remain in force.
**Beads**: `HamiSite-basic-structure-hvr` (`.2` this spec → `.3` build)

## Why this feature exists

The categories section is the only place on the homepage where a shopper chooses *where to go next*, and
today it reads as a widget bolted onto a light page. Four separate causes, all verified in source:

1. **The panels have no subject.** `CategoryCarousel.tsx:270-280` renders a flat SVG badge from
   `public/brand/categories/*.svg` at `width={800} height={960}` with `unoptimized` — a 2D logo mark
   floating in a dark card. There is no object, no material, no light.
2. **The section sits in a light chapter and behaves as if it did not.** `CategoryHub.tsx:19` renders
   `category-catalogue band-paper wrap container`. `.band-paper` (`app/(main)/home.css:487-530`) sets
   `--paper: #f4f1ea` and re-points `--aqua`, `--champagne` and `--gold` to oxblood `#640211`
   (`home.css:516-518`), with `:where()` rules at `534-541` force-remapping champagne utility classes.
   A dark panel on ivory is what `home.css:556` calls *"a hole cut in the page"*.
3. **The composition is dishonest because the taxonomy is dishonest.** `lib/category-departments.ts`
   documents it: 11 of 32 stored categories hold no products, and the tree fuses the brand axis into the
   type axis, so `سامسونگ-samsung` and `هدفون` are siblings. The nine departments were derived from
   product *kind* instead — and the phones route reaches **8 of 134** products, which `showsCount`
   exists solely to hide.
4. **The chrome says "carousel".** A 13° `rotateY` arc, a chevron pair, and an `aria-live` readout of
   «۱ از ۹». None of that carries merchandise.

Owner's brief is *luxury*, and Principle IV sets the bar. A section with no object, in the wrong value
relationship to its own band, advertising a count it cannot honour, will not clear that bar however the
CSS is tuned. This feature fixes all four.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — A shopper at 360px browses nine lit cabinets (Priority: P1) 🎯 MVP

A first-time visitor on a phone opens the homepage, reaches the categories chapter, and sees a strip of
photographic panels — each one an object on a lit surface, framed, named. They swipe. The strip moves
under a flick, settles on one panel, and the next panel is already half-visible so it is obvious there
is more. They tap one and are in that department's listing.

**Why this priority**: mobile is the primary experience (`lang="fa" dir="rtl"`, Principle II) and the
owner's standing rule is that desktop is the enhancement. Nothing else in this feature is worth shipping
if the 360px strip does not work.

**Independent test**: render `/` at 360×800, swipe the strip, confirm all nine departments are reachable
and each tap lands on the right `?category=` route. No desktop, no keyboard.

**Acceptance scenarios**:
1. Given the page at 360px, when the shopper flicks the strip, then exactly one or two panels advance —
   never five.
2. Given a panel is centred, when the shopper taps it, then the browser navigates to that department.
3. Given a panel is not centred, when the shopper taps it, then it comes to centre instead of
   navigating — the interaction contract feature 005 established and feature 004's brand rows share.
4. Given a panel's image fails to load, when the shopper reaches it, then the panel still shows its name
   on the ink ground — never a broken-image glyph.
5. Given the shopper is mid-flick and scrolls vertically, when their finger crosses the strip, then the
   page keeps scrolling vertically. The strip never captures it.

### User Story 2 — A desktop visitor reads the row as a cabinet (Priority: P2)

At 1280px the same nine panels sit as a wider row with a firmer light gradient across the group, a
cursor-driven drag, and one elevation change on hover. Nothing rotates. Nothing pins.

**Why this priority**: it is the same component at a different width, so it cannot precede P1, but it is
where the "vitrine" reading either lands or doesn't.

**Independent test**: render at 1280×900; confirm panel width, hover elevation, drag, and that vertical
scroll over the section is never converted to horizontal travel.

**Acceptance scenarios**:
1. Given a cursor over the section, when the wheel scrolls, then the page scrolls vertically and the
   strip does not move.
2. Given a panel under the cursor, when hovered, then it lifts by one elevation step and nothing else
   changes.
3. Given the viewport, when the section renders, then the page's total scroll height is unchanged by the
   section's presence — no pinning, no spacer.

### User Story 3 — A keyboard and screen-reader user reaches every department without a gesture (Priority: P3)

The section is one tab stop. Arrow keys move the active panel in **reading** order — in RTL that means
`ArrowRight` goes back. Home and End jump to the ends. The focused panel shows a visible focus
indicator. A screen reader hears a list of nine links with Persian names.

**Why this priority**: it is a veto on shipping, not a phase. Feature 005 already had this; removing the
chevrons must not silently remove the access.

**Independent test**: unplug the mouse. Tab to the section, reach all nine departments, activate each.

**Acceptance scenarios**:
1. Given the strip, when the user tabs in, then exactly one tab stop is consumed.
2. Given a panel is focused, when `ArrowLeft` is pressed, then the reading-forward panel becomes active
   and focus follows it.
3. Given any focusable element in the section, when focused, then its indicator is **visible** — an
   `sr-only` control that never appears on focus fails WCAG 2.4.7 and will not ship.

### Edge Cases

- **Image missing or 404** → ink ground + name. Never a broken glyph, never an empty frame.
- **`خدمات آنلاین` has one product.** It stays in the set (owner's ruling) but must not be visually
  promoted, and it renders no count.
- **Long Persian labels** («هدفون و ایرپاد و هندزفری») wrap without clipping at 360px.
- **RTL scroll origin.** `scrollLeft` semantics differ; the active-index logic must not assume 0 = left.
- **`prefers-reduced-motion`** → static strip, no inertia, no transition.
- **No JavaScript** → server-rendered plain list of nine working links.
- **Slow connection** → the LCP element of the page must not become a category panel.
- **Embla fails to hydrate** → the markup is already a usable list; the animation layers on top.
- **Viewport boundary crossing** (rotate, resize) destroys and rebuilds Embla; the shopper's position
  must survive it, as it does today.

## Requirements *(mandatory)*

### Functional Requirements

**Set and routing — unchanged, deliberately**
- **FR-065**: The section SHALL present the nine departments produced by `categoryDepartments()`. The
  derivation in `lib/category-departments.ts` remains the single source; this feature adds no category,
  removes none, and changes no route.
- **FR-066**: No panel SHALL render a product count of any kind. `showsCount` and `reachableCount` leave
  the render path. `tests/unit/category-departments.test.ts` is updated to match, and the derivation
  itself is kept because the routes still depend on it.

**The vitrine treatment — decision B**
- **FR-067**: Each panel SHALL be a full-bleed photographic image, framed by a single ink hairline and
  one shallow warm shadow, so a dark panel inside the light chapter reads as an object *placed on* the
  paper rather than a hole cut in it. `home.css:589-593` already specifies this requirement; this
  feature is the first band that needs it.
- **FR-068**: The frame SHALL consume `.band-paper` tokens (`--paper-ink`, `--line`) through CSS
  variables. No new colour literal is introduced, and `app/(main)/home.css` is not edited — the frame
  lives in `components/home/category-carousel.css`.
- **FR-069**: The section SHALL NOT use the 13° `rotateY` arc, the chevron pair, or the «۱ از ۹»
  `aria-live` readout.
- **FR-070**: The category name SHALL be live Persian text in the DOM, never baked into the image.
- **FR-071**: The Hami mark SHALL overlay each panel as a real image element from a transparent cream
  asset. It SHALL NOT be produced by an image model — Persian script rendered by a generator comes out
  as gibberish, and the wordmark plus tagline would be wrong on every panel.

**Mobile-first behaviour**
- **FR-072**: At 360px the section SHALL be a scroll-snap strip of ~66vw panels with a hard peek of the
  next panel, browsable by touch with no JavaScript required to move.
- **FR-073**: Embla SHALL be retained. Research R2 established that CSS scroll-snap covers vertical
  containment but cannot express FR-014's flick-travel cap (`MAX_FLICK_TRAVEL = 2`), so the dependency
  is not removable. `direction: "rtl"`, `loop`, and the after-the-fact bounded re-scroll stay.
- **FR-074**: The component SHALL NOT attach any listener to `window` or `document`, and SHALL NOT
  consume a vertical wheel event over the section. Adding one is a defect, not a design option.
- **FR-075**: The section SHALL NOT pin, scrub, or reserve scroll height. Feature 002 owns the page's
  scroll feel; a pinned horizontal band inside a ~12,000px page under Lenis is a fight this feature
  declines.
- **FR-076**: Off-screen, the carousel SHALL be destroyed rather than paused, as today.

**Accessibility**
- **FR-077**: Keyboard behaviour is unchanged from feature 005: one tab stop, arrows in reading order
  (not screen order), Home/End, roving tabindex, and visual focus never disagreeing with logical focus.
- **FR-078**: Any control that exists only for keyboard or screen-reader users SHALL become visible on
  focus. A permanently `sr-only` control fails WCAG 2.4.7 (research R3).
- **FR-079**: Server-rendered output without hydration SHALL be a plain list of nine working links.

**Assets — measurable floors**
- **FR-080**: Panels SHALL live at `public/images/categories/<kind>.png`, 3:4 portrait, at least
  1086×1448, named by department kind.
- **FR-081**: Every panel SHALL meet a measured legibility floor: mean luminance of the subject band
  (5–60% of height) ≥ 25, with ≥ 10% of its pixels above luma 60. The first probe failed at 8.7 and
  1.9% and was rejected; a beautiful panel nobody can see is a black rectangle.
- **FR-082**: The overlaid label SHALL reach at least 4.5:1 against the image region directly behind it,
  measured, not assumed.
- **FR-083**: No panel SHALL depict a recognisable brand's trade dress or contain invented text, logos,
  watermarks, hands or people. Evidence for why this is a requirement and not a nicety: a prompt for "a
  modern smartphone" returned an unmistakable iPhone — mute switch, two volume keys, pill speaker slit —
  with no logo requested and none produced.

### Key Entities

- **Department** — `kind`, `label`, `slug`, `href`, `image`. Identity is the product kind; the route is a
  real category. Counts are no longer part of what a department presents.
- **Vitrine panel** — one department at one position: image, frame, name, mark overlay, focus state.
- **Frame** — the ink hairline plus shadow that makes a dark object legitimate on an ivory ground. One
  system, applied identically nine times.

## Decisions *(resolved by the owner, 2026-09-25)*

- **Option B over Option A.** Dark vitrine panels inset into the light paper chapter, each framed.
  Rejected A (light still-life on ivory) as too safe for a brief that asked for *خاص‌تر و لوکس‌تر*.
- **Nine departments stay; all counts go.** Rejected regrouping into honest sub-departments and rejected
  reopening the catalog seam for a `?kind=` filter — the backend is frozen.
- **No numerals, no editorial voice.** The owner rejected the first proposal's index-numeral,
  magazine-spread framing outright.
- **Generated imagery is the owner's call, and the tension is recorded rather than buried.** Principle I
  has no exception path and states that missing data must not be filled with "a stock photograph". A
  generated phone is a product Hami does not sell. The owner was told twice and chose generated imagery
  anyway; FR-081/FR-083 are the guardrails that choice makes necessary, and the Hami mark overlay
  (FR-071) is what stops the panels reading as product photography.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-016**: At 360×800 all nine departments are reachable by horizontal swipe alone, and a vertical
  swipe over the section scrolls the page in 10 of 10 attempts.
- **SC-017**: Every one of the nine panels passes FR-081's luminance floor, measured by script, not by
  eye.
- **SC-018**: Every panel's label passes FR-082 at 4.5:1 or better, measured against the actual pixels
  behind it.
- **SC-019**: Zero product counts appear anywhere in the section at any viewport.
- **SC-020**: A keyboard-only user reaches all nine departments in ≤ 8 arrow presses from either end and
  sees a focus indicator on every one.
- **SC-021**: No panel contains a recognisable brand identity, invented text, or a watermark — reviewed
  panel by panel.
- **SC-022**: The page's LCP element is unchanged by this feature, and the strip adds no layout shift.
- **SC-023**: Homepage scroll height at 360px is unchanged within ±2% — proof there is no pinning or
  spacer.

## Assumptions

- The owner supplies the nine panel images and a transparent **cream** Hami mark at ≥ 600px
  (`public/brand/hami-mark-cream-alpha.png`). The only transparent mark in the repo today is 131×240 and
  oxblood, which is the same luminance as the panel ground and disappears on it.
- Feature 005's nine routes remain correct; this feature does not re-litigate eligibility.
- `app/(main)/page.tsx` keeps rendering `<CategoryHub />` in its current position — the wiring is a
  REQUEST to `driver`, never a direct edit.
- Research R1 stands: no Persian or Arabic RTL retail storefront does this. There is no precedent to
  cite, which is why the owner owns the decision explicitly.

## Work Split

- **`qoder-ide`** — everything in FR scope: `CategoryHub.tsx`, `CategoryCarousel.tsx`,
  `category-carousel.css`, `lib/category-departments.ts` render path,
  `tests/unit/category-departments.test.ts`, `public/images/categories/**`.
- **Reviewer (fresh context, not yet assigned)** — SC-017/SC-018/SC-021 are measurement and review tasks
  that should not be performed by the agent who designed the panels.
- **`hermes` (browser/runtime specialist, pending registration)** — SC-016, SC-020, SC-022, SC-023 at
  360 / 390 / 1280 with evidence.
- **`driver`** — the one-line wiring in `page.tsx`, on REQUEST.
