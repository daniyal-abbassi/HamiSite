# Phase 0 Research: Categories Editorial Mosaic

Eight decisions. D1 is a defect found in the spec during planning and corrected; the rest are shape decisions,
each with what was rejected. Numbers are measured from the export, the stylesheet or the panel files on disk —
where a figure is derived rather than measured, it says so.

---

## D1 — The spec's tile floor was impossible; corrected to ≥148 px

**Decision.** FR-005 now reads *"the smallest tile MUST still be at least 148 px across at 360 px"*. It said
164 px.

**Rationale.** The container has `padding: "1.5rem"` (`tailwind.config.ts:38`), so content width at a 360 px
viewport is **312 px**. Two columns with the chosen 12 px gutter give `(312 − 12) / 2 = 150 px` each. A 164 px
paired tile would require a **−16 px** gap. The number came from a design sheet that was written without the
container's padding in view, and it was copied into the spec because it looked like a measured figure.

150 px is comfortably above every accessibility floor that matters — WCAG 2.2's 24 × 24 minimum and 44 × 44
enhanced target size — so the requirement's *intent* (a tile you can read and hit with a thumb) is intact. The
corrected floor of 148 px leaves room for the 16 px gutter used at the wider phone step.

**Alternatives considered.** *Shrink the container padding to hit 164* — rejected: the padding is a page-wide
rhythm that this section shares with every other chapter, and trading the whole page's margins for one spec
number is the wrong way round. *Make the small tiles full-width singles* — rejected: that turns nine
departments into a nine-screen scroll and destroys the "all nine visible" property that is the entire point of
the feature.

---

## D2 — Grid structure: 2 columns at 360, 3 at 768, 4 at 1280, with spans doing the hierarchy

**Decision.** One grid, three column counts, and tile size expressed through `grid-column` / `grid-row` spans
rather than through different components or fixed pixel widths.

- **360**: 2 columns; the phone tile spans both (full width, tall); the remaining eight pair up into four rows.
- **768**: 3 columns; hero spans 2; two tiles span 2 (the "medium" tier).
- **1280**: 4 columns; hero spans 2×2; two mediums span 2 each; no trailing orphan.

**Rationale.** Spans keep the hierarchy declarative and the DOM order untouched, which is what makes the
keyboard path and the screen-reader list order fall out for free (they equal visual order by construction).
Nine items do not divide evenly into 4 columns — 9 = 2×2 hero + 2 mediums (2 cols each) + 5 smalls fills 12
cells exactly with the hero counted twice, which is the arithmetic that removes the orphan row the spec forbids.

**Alternatives considered.** *A masonry column layout* — rejected: column-count reorders content visually
against DOM order in ways that break reading-order guarantees. *Explicit pixel widths per tier* — rejected: it
cannot absorb a tenth department without a rewrite, and the spec's edge case demands it can.

---

## D3 — Which departments are big, and why that is a fact rather than a preference

**Decision.** Hero = **گوشی موبایل** (134 products). Medium = **هدفون و ایرپاد** (19) and **شارژر و کابل** (10).
The remaining six — smartwatch (7), powerbank (7), computer accessory (5), sim card (3), car charger (3),
online services (1) — are equal small tiles.

**Rationale.** Measured from the export: `phone=134, audio=19, charger=10, smartwatch=7, powerbank=7,
computer_accessory=5, sim_card=3, car_charger=3, service=1`. The tiers follow the natural break in that
distribution rather than an invented one: there is a 13× gap between phone and audio, and the bottom six sit
within 7:1 of each other, so they are treated alike.

This is also why the honest spread is **134:1** and not the 135:1 the decision sheet carried — the smallest
department has one product, not zero, and the largest has 134.

**Alternatives considered.** *Equal tiles with a badge for size* — rejected by the owner, who chose the mosaic
precisely for its hierarchy. *Weighting by revenue or stock* — no such data exists, and inventing it would
violate Constitution I.

---

## D4 — The `image` field is authored, so its existence is guarded by a test

**Decision.** Add `image` to the seed table in `lib/category-departments.ts` alongside `slug` and `badge`, with
the **real extension** per file (seven `.jpg`, two `.png`), and add a test asserting every `image` path resolves
on disk.

**Rationale.** This file already hand-authors `slug`, and the history is instructive: a hand-typed Latin slug
resolved to nothing and did so **silently** until feature 004 fixed it. The same class of defect is available
for image filenames — a wrong extension renders an empty tile, which in a mosaic of photography is worse than an
empty tile, it is a hole in the composition. The guard is one loop over `existsSync` and it cannot be satisfied
by editing a fixture, because it reads the real directory.

**Alternatives considered.** *Derive the filename from `kind` by convention* (`${kind}.jpg`) — rejected: it
breaks on the two PNGs and would force a file rename to satisfy a naming rule, putting the layout in charge of
the asset store. *A build-time glob* — rejected: it makes a missing panel invisible until someone notices an
empty tile on the live page.

---

## D5 — Panels are `alt=""`, and the rule that flips that decision

**Decision.** Each panel image is decorative (`alt=""`) because the department name sits adjacent as live text.
The rule for anyone who changes this later: **if an image ever carries information the label does not, it loses
`alt=""`.**

**Rationale.** WCAG 1.1.1 asks whether the image conveys something not available in text. Here it does not — a
photograph of a charger next to the word «شارژر و کابل» adds atmosphere, not information, and announcing «تصویر
یک شارژر» nine times in a row is noise that pushes the actual content further from the shopper. The count is
attached with `aria-describedby` so it lands inside the link's announcement instead of floating as a stray list
item.

**Alternatives considered.** *Descriptive alt text per panel* — rejected for the noise reason, and it would also
be a maintenance trap the moment a panel is regenerated and shows something slightly different. *`aria-label` on
the link* — rejected: the visible label already exists, and duplicating it invites divergence (WCAG 2.5.3's
point).

---

## D6 — The scrim plate is what makes the contrast guarantee survive future images

**Decision.** Labels sit on an 88 % `#050101` plate over the panel's deliberately-empty bottom third.

**Rationale.** The panels were generated with a dark, featureless bottom third specifically so text could sit
there; measured bottom-band means are `(2,1,2)` for phone, `(9,2,2)` for audio, `(2,2,2)` for sim card and
`(11,11,9)` for service — the worst sampled. Cream `#F0ECE9` on those measures **16.8:1 minimum**, far above the
4.5:1 floor. The scrim is not what achieves today's contrast; it is what stops a future panel with a bright
bottom third from silently breaking a requirement that reads as satisfied today.

**Alternatives considered.** *Rely on the generation rule alone* — rejected: the rule lives in a spec an image
generator never reads, and the owner regenerates panels. *Text shadow only* — rejected: it is not a contrast
mechanism and does not survive forced-colors modes.

---

## D7 — The carousel is deleted, not kept behind a flag

**Decision.** `components/home/CategoryCarousel.tsx` and `components/home/category-carousel.css` are removed,
along with the band-paper mount patch that existed to serve it, and with them the `role="group"
aria-roledescription="carousel"` and per-slide `aria-roledescription="slide"` semantics.

**Rationale.** A grid that announces itself as a carousel is a lie to a screen reader, and the roving tabindex
currently exposes **one** panel per keyboard visit — a shopper must already know about arrow keys to reach the
other eight. Deleting it improves the keyboard path from nine hidden panels to nine tab stops, and removes the
RTL sign-mapping bug class (feature 005's K1–K3 contracts) by removing the code those contracts existed to
police.

Keeping both presentations behind a flag was rejected on the owner's own terms: the complaint was that the
current way of showing categories is bad, not that a second way might be nicer.

**Alternatives considered.** *Keep the component unused* — rejected: an unreferenced component is how the next
agent rediscovers the old design and assumes it was deliberate. *Remove `embla-carousel-react` from
`package.json`* — rejected as out of scope: `components/home/NewArrivals.tsx` still imports it.

---

## D8 — The pre-existing CSS candidate was audited, and it holds

**Decision.** The ~165 lines already written into `app/(main)/home.css` before this spec existed are **kept as
the starting point**, because each of the properties that matters was checked against the spec rather than
inherited on trust.

**What was checked.** Selectors present: `.cat-mosaic`, `.cat-mosaic__item--hero`, `.cat-tile`,
`.cat-tile--hero`, `.cat-tile--medium`, `.cat-tile__label`, `.cat-tile__count`, plus `:focus-visible`,
`:hover`, `:active`, and blocks for `prefers-reduced-motion`, `prefers-contrast: more`, `forced-colors: active`
and `hover: hover`. Column counts are 2 / 3 / 4 at the three steps D2 specifies, with `grid-column: span` doing
the hierarchy and a 2×2 hero at 1280. Gaps are 12 px rising to 16 px. **No physical `left`/`right`/`top`
appear** in the added block, which is the RTL requirement most often quietly missed. It references no image
path, which is correct — images belong to the markup, not the stylesheet.

**What is still unverified** and therefore remains a task, not a fact: rendered tile widths at 360 (D1's
arithmetic, not a screenshot), the hero's aspect ratio at each step, whether the mount patch it was written
alongside has actually been removed, and whether the whole block survives once the carousel markup is gone.

**Alternatives considered.** *Discard it and restart from the spec* — rejected as wasteful and slightly
dangerous: the candidate came from the same analysis this spec records, and deleting verified work to satisfy
process order would be ritual, not governance.
