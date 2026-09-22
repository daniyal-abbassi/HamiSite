# Quickstart: Categories Carousel

**Feature**: [spec.md](./spec.md) | **Contract**: [category-carousel-behaviour.md](./contracts/category-carousel-behaviour.md)

How to run it and how to prove it. No implementation lives here.

## Prerequisites

- Node 24, dependencies installed. **No new package is added** — if `package.json` gains a dependency during
  this feature, that is a plan violation (`research.md` D8), not a convenience.
- Dev server on `http://localhost:3000`. Verify exactly one Next process and one listener on 3000 before
  trusting any browser claim, and check a `/_next/static/chunks/*.js` request returns 200 — an HTML 200
  proves nothing about hydration (Constitution, Definition of Done).
- For the scripted checks: a locally resolvable Playwright, passed as `PLAYWRIGHT_PATH`. It is not an app
  dependency. Pattern and prior art: `specs/002-scroll-atmosphere/tools/ground-sweep.mjs`.

```bash
npm run typecheck
npx vitest run tests/unit          # NOT bare `npm test` — see research.md D8 for the database hazard
```

## §1 — The derived table is honest before anything is drawn

`tests/unit/category-departments.test.ts` asserts, against `data/hami-products.json`:

1. Nine departments, one per populated `kind`, totals summing to 189.
2. Every route slug resolves and reaches ≥1 product.
3. No route is brand-shaped, with `آیفون-استوک` on an explicit deny list — `research.md` D1 explains why
   name-matching against `data.brands` alone lets it through.
4. `productCount` is `null` for `phone` and equals `reachableCount` for every other department that shows a
   count.
5. The three known shortfalls are exactly 8/134, 9/10, 6/7. A new shortfall fails.

Expected: all green. If §1 is red, nothing downstream is worth testing — the surface would be presenting a
taxonomy the data does not support.

## §2 — Two actions from panel to product, on a phone

At 360px, from the section: swipe to a named department, tap the centred panel, confirm you are on that
department's listing and the products there belong to it. Then tap a non-centred panel and confirm it came to
centre instead of navigating.

Expected: A2 and C2 hold for all nine. Every panel visited this way lands on a listing with at least one
product. Record the nine destinations — this is SC-001 and SC-002 and there is no cheaper way to satisfy it.

## §3 — The page still scrolls. This is the gate.

Three devices, one procedure each. Park the pointer or finger over the carousel and scroll the page
vertically. Then start a vertical drag directly on a panel and, mid-drag, turn horizontal.

- Phone / touch (emulate a real device profile, not just a narrow viewport)
- Laptop with a mouse wheel
- Laptop with a trackpad two-finger scroll

Expected: the page scrolls normally in every case, with the cursor over the section (I1–I4). The turn
mid-drag keeps scrolling the page and never becomes a swipe, because intent resolved once (I2). Then run the
capture script: record `window.scrollY` over a fixed 1.5s programmatic scroll with the section present versus
with it removed from the DOM; the traces must agree. A section that steals scroll fails this feature
outright regardless of how the arc looks (G1).

## §4 — Persian labels are real text

Select and copy a category name. Turn on a screen reader and traverse the section: each department announces
by name, with its position and the total. Inspect a label's node type — it must be a text node, not an
`<img>` with alt text. Compare label rendering against the same string rendered at the same size elsewhere on
the page on a high-density device.

Expected: T1–T5. Check the longest name in the set at 360px and at 200% zoom for clipping (T3), and confirm
`letter-spacing` computes to `0`/`normal` on Persian text (T5) — note `getComputedStyle` returns the string
`"normal"` for a zero value, so assert against both.

## §5 — Keyboard and pointer without dragging

Tab to the section. Arrow through all nine, forwards and back, confirming `ArrowRight` moves in reading order
— visually left, in RTL. Activate one with `Enter`. Then, with a mouse only and no drag, advance and retreat
using the click control.

Expected: K1–K5. Same destination set as the swipe route, same number of steps or fewer (SC-005, US4/4).

## §6 — Nothing runs unseen, and the page is no heavier

With the section scrolled out of view, confirm no rAF loop is live and no transition is active (P1, P2). Then
compare the homepage with the section present versus removed, on a CPU-throttled profile, measuring frame
interval during a plain scroll of a region far from the section.

Expected: P1–P5. **Measure on a production build** (`npm run build && npx next start`); dev-mode frame
numbers are not comparable — feature 004 measured 50ms versus 33ms medians that vanished entirely on a
production build.

## §7 — Fallback, motion preferences, and colour forcing

- Load with JS disabled, or read the raw server HTML. Expect a complete list of all nine with working links
  (F1).
- Enable `prefers-reduced-motion`. Expect the same departments, labels and destinations, with movement
  resolving instantly and the arc intact (K6). Compare against `004`'s brand rows under the same setting —
  they must behave identically, which is the reciprocal half of FR-038.
- Enable `forced-colors: active`. Expect F4.
- Expect no reference placeholder imagery anywhere, and no network request to a host that is not this origin
  from this section (G2, F2, SC-007).

## §8 — Coherence with what already shipped

Screenshot the categories section and the brands section together, at 360px and at 1280px, in the same
viewport, plus the hero band. Check them against X1–X6 and against FR-038's five shared behaviours.

Expected: two visually different widgets that move, emphasise, release, and respect reduced motion
identically. Feature 004's rows already define the duration and easing this section must adopt — the check
is that neither invented its own.

Also record it against the homepage's **dark** ground only (FR-039, X6).

## §9 — Judgement gates that cannot be automated

- **SC-010**: 7 of 10 reviewers must find the section at least as premium as the grid it replaces, with no
  more than 2 finding the homepage busier.
- **SC-011**: with categories, brands, the 002 ground and 003's product motion all live, 8 of 10 describe the
  homepage as one coherent experience.
- **SC-012**: 7 of 10 shoppers can state how many departments exist after browsing.

These need people. Note before collecting them: feature 004's equivalent gate (T049) was dropped on
2026-09-22 because the panel could not be assembled, and its owner's own read on the neighbouring brands
surface was "somehow simple, boring, not styled and mis-placed in desktop". SC-011 additionally cannot be run
honestly while feature 002's ground is unbuilt past US1. Do not record any of these three as passed on
inference; if the panel is unavailable, leave the gate visibly unmet, as 004 did.

## Definition of done for this feature

Typecheck and `npm run build` clean; §1–§7 green in a real browser at 360px and 1280px with the client
chunks verified loading; §8 recorded with screenshots; §9 either measured or explicitly unmeasured. And the
Constitution IV clause that outranks all of it: judged as a piece of a branded experience rather than a
correct implementation of a carousel — a bending carousel that is technically flawless and visually ordinary
is not complete.
