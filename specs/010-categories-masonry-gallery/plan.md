# Implementation Plan: Categories Masonry Gallery

**Branch**: `010-categories-masonry-gallery` | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-categories-masonry-gallery/spec.md`

## Summary

Replace the homepage's category **carousel** with a **masonry gallery**: nine department tiles in 2/3/4 columns
whose heights follow an authored rhythm, on the light `band-paper` ground, entering once with a staggered
soft-to-sharp arrival and responding to hover and press with a slight inward scale.

The controlling decision is **CSS owns layout, JavaScript owns entrance — and nothing else**. The arrangement is
produced by CSS Grid row-spans (`grid-auto-rows` + per-tier `grid-row: span N`), which exist in the stylesheet
before a single script runs; the only JS in the feature creates the one-time arrival, and it creates it with
`gsap.from()`, so the hidden starting state lives **only in script memory** and never in markup or CSS. A browser
that never runs the script renders the finished composition. That is FR-008 and FR-011 satisfied by the shape of
the code rather than by a fallback path, which is the difference between a guarantee and a hope.

This plan resolves six things the spec leaves as decisions: the layout mechanism and why multi-column CSS is
rejected (D1), the authored rhythm table and its Latin-square property (D2), the arrival's trigger and the
refusal of ScrollTrigger (D3), the blur concurrency bound and why it is arithmetic rather than a feel (D4), the
fate of 009's orphaned `.cat-mosaic` CSS (D6 — deleted, not repurposed), and the six refused behaviours from the
supplied reference, each mapped to the mechanism that prevents it (D7).

**No new dependency.** `gsap@3.15.0` is installed and `node_modules/gsap/ScrollTrigger.js` confirmed present, yet
this plan does not use it (D3). `clsx`/`tailwind-merge` are reached through the existing `cn()`.

### The six refusals, and what replaces each

| Supplied reference does | Why it breaks here | What this feature does |
|---|---|---|
| Reveals the item title on hover | A phone has no hover; the shop's primary audience would never see a department name | Label is permanently visible live text on a scrim plate (FR-005, D7) |
| `window.open(item.link)` | Strands a shopper who wanted to keep browsing; breaks back | `<Link href>` in the same window (FR-007) |
| Computes absolute `top`/`left` in JS, container height from JS | Empty box until scripts run; layout shift; unscrollable without JS | CSS Grid spans authored in the stylesheet; height known at first paint (FR-008, FR-022, D1) |
| `uppercase tracking-[0.3em]` on the label | Persian has no case and takes no letter-spacing; it reads as broken | No `letter-spacing`, no `text-transform` on the label; guard test asserts the absence (FR-006) |
| `filter: blur(10px)` tweened on every item at once | Nine simultaneous blur repaints is the one animation this project cannot verify on its own hardware | Blur capped at **3 tiles at a time** by arithmetic on the constants, on the image layer only, never the text (FR-011, D4) |
| `bg-zinc-950`, `text-white`, hex palette | Tokens this project does not define, on a ground the owner told us to keep | Only `--paper`, `--paper-ink`, `--paper-muted`, `--paper-brand` and the existing scrim recipe (FR-016, D7) |

## Technical Context

**Language/Version**: TypeScript 5.x on Node 24 (Next.js 15.5 App Router, React 19.2)

**Primary Dependencies**: Tailwind CSS 3.4 + the hand-written block in `app/(main)/home.css` for the grid;
`next/image` with `fill`; `gsap@3.15.0` for the arrival only; `lib/category-departments.ts` for the data.
**No new dependency; no package.json change.**

**Storage**: `data/hami-products.json` through `lib/catalog.ts` (Constitution III). Departments, hrefs and counts
stay derived at request time. Two fields are authored in the seed and nothing else: `image` (a filename under
`/images/categories/v3/`) and `rhythm` (the tier per breakpoint).

**Testing**: Vitest, **node environment, no DOM** — `npm run test:unit` (the frontend config, which omits
`setupFiles`; bare `npm test` reaches `tests/setup.ts` and truncates the real dev database). Every claim below
that can be proven without a browser is written as a pure-function assertion; geometry, contrast and motion are
verified in a real browser at exact widths.

**Target platform**: Mobile browsers first at 360 px (the owner's standing rule: *always mobile first*); 768 and
1280 as designed steps, not as compressions of the mobile layout.

**Project Type**: Single Next.js app, frontend-only, one section on one page.

**Performance goals**: Zero CLS from the chapter (SC-007) — track heights are authored, not measured. Blur
applied to at most **3** elements concurrently (D4). No scroll-linked animation, no per-frame JS, no
`setState` during scroll. **No frame-rate target is set and none may be claimed**: this machine cannot measure
smoothness honestly, so the guard is structural — the arrival is one-time, skippable, and never load-bearing.

**Constraints**: FR-001/002 (uneven tiles at three widths, never a matrix), FR-005 (permanent labels), FR-007
(same-window), FR-008 (complete before scripting), FR-009/010/011 (one-time, reduced-motion, reachable end
state), FR-013/013a (rhythm only, and no department is permanently the largest), FR-014 (count honesty),
FR-016 (light ground), FR-019/020 (RTL and keyboard), FR-021 (tonal anchor), FR-022/024 (height known first).

**Scale/Scope**: Nine tiles. One new client component (~45 lines), one new pure module, one new test file, one
field pair added to a model, one stylesheet block replaced, **two components and one stylesheet deleted**.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | How |
|---|---|---|
| **I. Honest Interface** | ✅ PASS | Counts keep coming from `showsCount`, computed not declared (`lib/category-departments.ts:174`): a tile may show only the number its own destination shows, and the phone/charger/powerbank tiles stay silent rather than quote a subset. **The size hierarchy is deliberately stripped of data meaning** (FR-013) — which is the principle working *for* the design: a tall tile can no longer be read as "bigger department". Missing panels stay missing (`image` guarded by an on-disk test), no stand-in photograph. |
| **II. Persian RTL by Default** | ✅ PASS | Grid placement on logical axes; `direction: rtl` puts the first column on the right for free, so the reading side is a property of the document, not of the layout code. The arrival moves on the **block** axis (a rise), so no motion maths ever sees an inline sign (D5). Tab order is DOM order, which RTL does not reorder. No `letter-spacing`, no case, Persian digits wherever a number appears. |
| **III. Static Data Seam** | ✅ PASS | Departments, hrefs and counts stay in `lib/category-departments.ts` over `lib/catalog.ts`. The two authored fields sit in the same seed table as `slug` and `badge` already do. No database, no API round-trip, no consumer outside the homepage. |
| **IV. Luxury is the quality bar** | ✅ PASS | This is the anti-uniform-grid move the principle asks for: composition through proportion and stagger, real photography, one cinematic one-time arrival, hover and press states authored rather than inherited. Restraint is honoured by **deletion** — the arc, the veil, the roving tabindex, the two arrow buttons, the live region and 165 lines of superseded CSS all go away with their reasons. |
| Constraint: prefer editing over new abstraction | ✅ PASS | `CategoryHub.tsx` and `home.css` are edited. Two new files, both necessary: one client boundary (the server component cannot own an entrance) and one pure module (a test needs the constants without importing React). Four files deleted. |
| Constraint: no new dependency | ✅ PASS | Nothing installed. `gsap` is already a dependency and is used for one tween; `ScrollTrigger` is available and **not** used (D3). |
| Definition of Done | ⚠️ **CONDITIONAL — ownership, not design** | `typecheck`, `build`, browser verification at three widths, RTL correctness and no fabricated data are all in scope and in quickstart.md. **`app/(main)/home.css` has two live claimants** and the file must be rewritten, not appended to. See the gate below. |

**Gate result: no principle violations.** One conditional, and it is an ownership problem, recorded as a
requirement of the first implementation task rather than assumed away.

### Ownership gate (blocking, evidence dated today)

`.agent-pair/locks/` at 16:11 on 2026-09-26:

- `app__(main)__home.css.lock` — **qoder**, since 12:17, "add the `.cat-mosaic` grid block". Its pane is parked
  on a pending approval to write `.cat-tile__label` into that file — i.e. it is still building 009's layout,
  which the owner has since rejected.
- `app__home.css.lock` — **hermes**, since 14:19, "008 deck rebuild". Two agents hold locks whose filenames both
  look like `home.css`; whether these collide depends on an ambiguous normalization, and guessing is exactly how
  one agent overwrites another.
- `tests__unit__category-mosaic.test.ts.lock` — **qoder**, since 14:22. That file tests a layout that will not
  exist.
- The five 009 component/model locks were released by the human at 14:46 and sit in `.agent-pair/released/`:
  `CategoryHub.tsx`, `CategoryCarousel.tsx`, `category-carousel.css`, `lib/category-departments.ts`,
  `tests/unit/category-departments.test.ts`. Those five are free — claim before editing.

**Therefore T001 is not optional**: post a board message cancelling 009 Phase 3+ (with the reason: the owner
rejected both rendered variants, so the mosaic work is superseded, not deferred), ask hermes to confirm which
path `app__home.css.lock` names, and obtain a release for `app/(main)/home.css` and
`tests/unit/category-mosaic.test.ts`. No request after ~10 minutes escalates to the owner; it does not become
permission to overwrite.

### Post-design re-check (after Phase 0 and Phase 1)

Still **no violations**, and three things changed shape during design worth recording:

1. **Principle I came out stronger, not protected.** Stripping the size hierarchy (FR-013) removes the one place
   in this chapter where a visual claim could outrun the data — a tall tile reading as "bigger department". The
   count rule was re-derived from the export while writing `data-model.md` and it corrected 009's contract M4:
   **six** tiles show a number, not five (phones 135 vs 134, chargers 12 vs 10, power banks 6 vs 7 all stay
   silent). Writing the number down caught the stale one.
2. **A new failure mode appeared and was closed.** The rhythm could have been derived from render position — one
   line shorter, and it silently re-composes the whole page when a department empties. D2 keys it by `kind` and
   the Latin-square test is what catches a regression, so the edge case "a department that empties" is now a
   requirement with a guard rather than a hope.
3. **The `service` tile stopped being a problem.** At 009 it was the one-product department competing for the
   largest slot; here it is L at exactly one width and S at another, by construction.

The one clause that cannot be closed by design is Q7's honest limit: **no frame-rate claim is available from this
machine in either direction**, so the contract states a bound (≤3 concurrent blurs, asserted) and a prohibition
(no reviewer accepts an fps figure). That is the spec's Assumption about weak hardware, enforced rather than
restated.

## Project Structure

### Documentation (this feature)

```text
specs/010-categories-masonry-gallery/
├── plan.md                          # this file
├── spec.md                          # requirement source (FR-013/013a/023/024 set by the owner today)
├── research.md                      # Phase 0 — D1…D9, each with the rejected alternative
├── data-model.md                    # Phase 1 — department + tier table + what a tile may claim
├── quickstart.md                    # Phase 1 — run it, and prove the nine are really uneven
├── checklists/requirements.md       # spec-quality gate (16/16 passed)
└── contracts/
    └── category-masonry.md          # Phase 1 — Q1…Q9, the acceptance contract

specs/009-categories-editorial-mosaic/   # kept: the record of two rejected layouts
```

`tasks.md` is Phase 2 output from `/speckit-tasks` and is **not** created here.

### Source code (repository root)

```text
lib/
├── category-departments.ts          # EDIT: add `image` + `rhythm` to the seed and to Department
└── category-masonry.ts              # NEW (pure): the authored tier table, span arithmetic,
                                     #     arrival constants, MAX_CONCURRENT_BLUR

components/home/
├── CategoryHub.tsx                  # EDIT: server markup becomes ul.cat-masonry > li > a.cat-card
├── CategoryArrival.tsx              # NEW (client, ~45 lines): IO + reduced-motion + gsap.from
├── CategoryCarousel.tsx             # DELETE — replaced outright, not kept alongside (009's FR-014 carries)
└── category-carousel.css            # DELETE

app/(main)/
├── home.css                         # REPLACE the 165-line `.cat-mosaic` block with `.cat-masonry`/`.cat-card`;
                                     #   delete the band-paper carousel patches it existed to serve
└── page.tsx                         # unchanged: <CategoryHub /> stays mounted at line 210

public/images/categories/v3/         # unchanged: nine 3:4 panels, 1 PNG pair + 7 JPEGs already on disk

tests/unit/
├── category-masonry.test.ts         # NEW: the claims provable without a DOM
├── category-departments.test.ts     # EXTEND: every `image` path exists on disk
└── category-mosaic.test.ts          # DELETE with the layout it guards (its guard moves to
                                     #   category-masonry.test.ts where the claim still applies)

tools/shots/
└── viewport.mjs                     # NEW: exact-width screenshots, promoted from the throwaway
                                     #   .scratch/shot.mjs used for 009's previews (quickstart §2)
```

**Structure decision**: no new directory under `app/` or `components/` and no new layer. The pure module exists
because the test harness is node-only — a client component's constants cannot be asserted without importing
React, so the numbers that make the design provable live where a test can reach them. This mirrors
`lib/brand-deck.ts` in feature 008, which was built for the same reason.

### The authored rhythm (D2 in brief, full arithmetic in research.md)

Tiers are **S / M / L**, defined per breakpoint as a multiple of that width's natural 3:4 tile height, snapped to
whole grid rows. Each breakpoint carries exactly three tiles of each tier, and the assignment is a **Latin
square**: every department holds each tier exactly once across the three widths.

| # | Department | 360 (2 col) | 768 (3 col) | 1280 (4 col) |
|---|---|---|---|---|
| 1 | گوشی موبایل | M 208 px | S 224 px | **L** 512 px |
| 2 | هدفون و ایرپاد | M 208 px | S 224 px | **L** 512 px |
| 3 | شارژر و کابل | **L** 268 px | M 320 px | S 288 px |
| 4 | ساعت هوشمند | S 148 px | M 320 px | **L** 512 px |
| 5 | پاوربانک | **L** 268 px | M 320 px | S 288 px |
| 6 | لوازم کامپیوتر | **L** 268 px | S 224 px | M 400 px |
| 7 | سیم‌کارت | S 148 px | **L** 392 px | M 400 px |
| 8 | شارژر فندکی | S 148 px | **L** 392 px | M 400 px |
| 9 | خدمات آنلاین | M 208 px | **L** 392 px | S 288 px |

Consequence, and the reason for the rotation: **every department is the tall tile at exactly one width and the
small tile at exactly one width.** FR-013a holds by construction and is asserted by test. It also removes the
accident that killed 009's variant B, where خدمات آنلاین — one product — was the largest tile on the page.

**This is not the table planning drafted, and the reason is this plan's most useful finding.** The first draft
was the elegant cyclic rotation — `[L, M, S]` from position 1 at 360, shifted one place per breakpoint. It
satisfies every rule written above, and when it was built it left one column **420 px short at 1280**: a
tallest-to-shortest ratio of **1.59**, plainly visible as an unfinished page. Nine tiles do not divide into three
or four columns, and CSS's auto-placement is greedy, so elegance is not balance. The table above was found by
simulating the browser's own placement algorithm and searching the Latin-square assignments for the one that packs
most evenly — **1.108 / 1.000 / 1.031**, and the live page matched the simulation to the pixel
(`verification/q1-heights.md`). The simulator now runs as a unit guard, so the defect cannot return quietly.

The table is **keyed by `kind`, not by index**. `categoryDepartments()` skips a panel when a slug stops resolving
or a category empties; a tier derived from live index would silently re-shuffle every remaining tile's height
when one department left. Recording the tier per department makes a departure change one tile, not the rhythm.

**Container widths are measured, not read from the config.** `tailwind.config.ts:38` says `container.padding:
"1.5rem"` and `app/globals.css:224-226` overrides it with a fluid `padding-inline` — 20 px at 360, ~31 px at 768,
48 px at 1280 — so columns are **154 / 225 / 281 px**, not the 150/229/293 the config implies. That is the same
arithmetic that produced 009's impossible "≥164 px tile" floor and then its "corrected" 148 px: both derived from
a padding value the CSS does not apply. The real floor at 360 is **154 px**, and `sizes` is expressed in vw
because a fixed px hint is wrong at every width except the one it was measured at.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. Two deferred items, recorded so they are not mistaken for oversights:

| Item | Status | Why deferred |
|---|---|---|
| Panel encoding (`phone.png` 1.5 MB, `audio.png` 1.2 MB, unoptimized) | **Deferred, unchanged from 009** | Re-encoding is a separate decision with its own quality tradeoff; this feature adds no new image weight and must not become the LCP element while carrying it. |
| A `?kind=` route so the phone department reaches 134 products instead of 8 | **Out of scope** | It reopens the catalog seam for a homepage tile — a bigger decision than a layout feature should smuggle in (`lib/category-departments.ts:16-21`). The tile shows no count instead, which is honest. |
