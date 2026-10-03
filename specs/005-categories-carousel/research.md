# Phase 0 Research: Categories Carousel

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-09-22

Every number below was measured against `data/hami-products.json` on 2026-09-22, not copied from the spec.
The reproduction command is at the bottom of this file; where a measurement disagrees with the spec, the
disagreement is stated rather than reconciled quietly.

---

## D1. What the nine departments are, and what each one actually reaches

**Decision**: The category set is the nine populated product **kinds**, one panel each, and each panel routes
to the single non-brand category whose products are entirely of that kind. Encoded as a derived table in
`lib/category-departments.ts`, pinned by `tests/unit/category-departments.test.ts`.

Measured, from the export itself:

| kind | products | route category slug | reached by that route | badge on disk |
|---|---|---|---|---|
| `phone` | 134 | `موبایل` | **8** | `mobile.svg` |
| `audio` | 19 | `هدفون-ایرپاد-و-هندزفری` | 19 | `audio.svg` |
| `charger` | 10 | `آداپتور-کابل-و-شارژر` | 9 | `charger.svg` |
| `smartwatch` | 7 | `ساعت-و-مچ-بند-هوشمند` | 7 | `smartwatch.svg` |
| `powerbank` | 7 | `پاور-بانک` | 6 | `power-bank.svg` |
| `computer_accessory` | 5 | `تجهیزات-کامپیوتر-و-لبتاب` | 5 | — needs new |
| `sim_card` | 3 | `سیمکارت` | 3 | — needs new |
| `car_charger` | 3 | `شارژر-فندکی` | 3 | — needs new |
| `service` | 1 | `خدمات-آنلاین` | 1 | `online-services.svg` |

Eight of nine routes are complete or off by one. The kind totals are 189, which is every product in the
export, so nothing is invisible on the homepage's main orientation surface — the property the spec's
Assumptions section says the eight-badge option would have failed.

**Rationale**: FR-001's resolved answer defines eligibility by what has products, and the tree fails that
test structurally — measured here, **11 of 32 categories are empty**, seven of the fourteen top-level ones
including `موبایل-و-تبلت`, `لوازم-جانبی`, `گوشی-موبایل` and `کالای-دیجیتال`. The kind axis is the only
taxonomy in this data that is simultaneously fully populated, free of brands, and free of duplicate labels.
Deriving rather than hand-listing also follows the precedent feature 004 set with
`lib/shop-category-tiles.ts`, which fixed its dead tiles by deriving from the catalog.

The route is a category rather than a kind because that is what the existing listing accepts.
`ShopClient.tsx:70` resolves `?category=<slug>` to a `categoryId`, and `lib/catalog.ts:251` filters on
`p.category?.id === input.categoryId || p.other_categories.some(...)`. A `?kind=` destination would need a
new optional field on `CatalogQuery`, a filter line, a zod key and a route passthrough — four edits across
two files the frontend initiative does not own. It is the *better* answer and it is recorded as such in
D1-alt below.

**Alternatives considered**:

- **The eight badge-shaped departments** (the spec's Assumptions default). Rejected: it drops
  `computer_accessory`, `sim_card` and `car_charger` — three populated kinds — and its `feature-phone` and
  `speaker` badges are slices of `phone` and `audio`, not departments, so it would double-list the phone
  range across two panels.
- **The raw category tree.** Rejected by FR-001/FR-002 outright: 11 dead doors.
- **A reduced shopping-first set** — phones, audio, wearables, power, accessories. Rejected: it is the
  weakest form of the same argument as the eight-badge option, and it hides SIM and service departments
  that the shop genuinely sells.
- **Add a `kind` filter to the catalog seam.** Deferred, not dismissed. It would raise the phones route from
  8 to 134 in one filter line. It is out of scope here because the owner accepted the 8-product phones
  route for feature 004's equivalent tile on 2026-09-22 ("accept 8"), and reopening `lib/catalog.ts` and
  `app/api/products/route.ts` for a homepage tile is a bigger decision than this feature should smuggle in.
  If it is ever taken, only `phone` changes and this table absorbs it as a one-row edit.

### The phones row, stated plainly

`موبایل` reaches 8 products. **Of those 8, one is purchasable** (`stock.purchasable`), which is consistent
with the wider export: 162 of 189 products are out of stock, and `lib/catalog.ts:240` deliberately does not
filter on availability for exactly that reason. So the largest department on the homepage — 134 phones —
opens to a panel of 8, and one of those reads «تماس بگیرید»-adjacent at best.

FR-005 requires the panel "represent it accurately and MUST NOT imply breadth it does not have". Applying
that to phones honestly means **not** claiming "۱۳۴ گوشی" on the panel, because the destination cannot hold
that. The panel therefore states the department name and no count for `phone`, while the seven complete
routes and the two one-short routes may show a count. This asymmetry is a decision, and `contracts/` pins it
so an implementer cannot "improve" it into a lie.

### Badge detection caveat, found while building this table

Filtering brand-shaped categories by matching category names against `data.brands` names **does not work
reliably**: the top phone category is `آیفون-استوک` (45 products) and "آیفون" is not one of the 39 brand
names, so a naive name match admits it as a department route and the phones panel would become a
refurbished-iPhone panel. The drift test therefore asserts an explicit deny list as well as a resolvable
slug, and `تجهیزات-کامپیوتر-و-لبتاب` shows the converse problem — it legitimately has one brand and is not
a brand category, so "spans more than one brand" is not a valid discriminator either.

---

## D2. Drag, snap, loop and input boundaries come from Embla — the arc is the only thing written here

**Decision**: Build on `embla-carousel-react@8.6.0`, which is **already a dependency of this project and
already running on this page** — `components/home/NewArrivals.tsx:22` configures it with
`direction: "rtl"`, so RTL Embla is proven in this codebase. Adopt `axis: "x"`, `align: "center"`,
`loop: true`, `containScroll: "trimSnaps"`. Write no pointer, touch or wheel listener of any kind.

**Rationale — and this reverses the decision made earlier in this planning pass, on evidence.** A first
reading of this plan rejected a carousel library on the grounds that the initiative holds a dependency
ceiling. That ground is false: the ceiling is `package.json` as it stands, and Embla is inside it. The only
surviving argument for hand-rolling was "none of them ship an arc", and that argument concerns the arc alone
— it says nothing about drag, inertia, snapping, looping, resize handling and RTL scroll physics, which are
the parts with the most ways to be subtly wrong and which Embla already does.

The decisive factor is FR-016. The reference's disqualifying property is that it attaches wheel and pointer
listeners to the **document**, so a cursor crossing the section converts page scroll into carousel movement.
Embla structurally cannot exhibit that: it listens inside its own viewport node, it only claims movement
along its own axis, and it does not `preventDefault()` a vertical gesture. Its wheel handling lives in a
separate plugin (`embla-carousel-wheel`) which is **not installed**, so FR-016, I2 and I4 hold by
construction rather than by the correctness of intent-detection code that would otherwise have to be written
and then trusted. On a 16,566px homepage (measured in
`specs/002-scroll-atmosphere/baseline/ground-record.json`), "cannot exhibit the bug" beats "should not
exhibit the bug".

**What still has to be written**, because Embla does not do it:

- The arc: per-slide transforms derived from Embla's own scroll progress (D3).
- Keyboard arrows and the click controls mapped to `emblaApi.scrollNext() / scrollPrev() / scrollTo()`
  (FR-027…FR-029). Embla ships no keyboard binding.
- `aria-activedescendant`, position and total announced from Embla's `select` event (FR-030).
- Suspending the carousel off-screen through `emblaApi.destroy()` and re-init inside an
  `IntersectionObserver` (D5), rather than leaving a live scroll snap running unseen.
- The intent cap on a hard flick (FR-014): watch Embla's `select` event `skipped` count and re-snap to the
  bounded target. Embla's inertia is physical and will happily skip three panels.

**Alternatives considered**:

- **Hand-rolled pointer + inertia + snap** — the original decision here. Rejected on cost and risk, and note
  that rejecting Embla never saved a dependency: hand-rolling adds nothing to `package.json` either, so the
  stated reason was not even the real trade. The real trade is ~200 lines of gesture state whose principal
  liability, scroll capture, Embla does not have. Retained nowhere.
- **CSS scroll-snap on an overflow container.** Cheapest of all, free touch physics — but there is no way to
  address a child by its distance from the container's centre in pure CSS, so the arc has no hook. It also
  re-implements Embla's wheel and vertical behaviour with less control.
- **`motion`, also installed and used in `components/home/FeaturedProducts.tsx`.** Right tool for a state
  transition, wrong tool for a drag surface. Not used for the carousel.
- **GSAP ScrollTrigger / ScrollSmoother, also installed.** Explicitly not used here — a document-level scroll
  easer and a section that must never touch page scroll are opposing requirements, and FR-016 forbids the
  tool at this site. See the note at the end of this section: the same fact points the other way for
  feature 002.

### A correction the owner should see, because it changes feature 002

`node_modules/gsap/ScrollSmoother.js` exists in this project, and GSAP's club plugins became free at 3.13 —
this is 3.15. `specs/002-scroll-atmosphere/research.md` D2 rejects "GSAP, `motion`, embla and any
smooth-scroll library" as though adopting one were a cost. It is not a cost; they are installed and three of
them are in use. That matters because 002's Question 1 was reopened on 2026-09-22 precisely for scroll
physics — the owner's "smooth and heavy". ScrollSmoother's inertia/lerp is the direct, already-paid-for
answer to that, and 002's plan and research should be re-derived knowing this. Feature 005 is not that place.

---

## D3. The arc is a per-panel transform derived from Embla's scroll progress

**Decision**: On Embla's `scroll` event, compute each slide's signed distance from the viewport centre in
panel units and write it to one custom property on that slide. `translate3d` along the inline axis,
`rotateY` for the bend, `scale` for depth, brightness falloff and `z-index` all derive from that property in
CSS. The numeric values come from D6.

**Rationale**: This is Embla's documented slide-transform pattern and the only way to bend panels while the
track itself scrolls natively. FR-036 forbids the *spec* fixing curvature, sizes and durations; it does not
forbid this document fixing them, and D6 does. Panels remain ordinary DOM inside Embla's track — real links,
real text, real focus order — because the arc is applied to elements Embla already positions, which is what
makes FR-022 and FR-027 achievable at all. Sign convention follows the inline axis, not physical left/right,
so the bend reads correctly in RTL without mirroring the component (FR-026).

Nothing here measures layout in JS per frame, which is FR-020's failure mode: Embla already knows the
progress, and a transform on a node it is already compositing is the cheap direction.

**Alternatives considered**: canvas (loses live text, which is this feature's correctness requirement); CSS
`offset-path` along an arc (unsettled support, no RTL semantics, no per-panel depth ordering); a 3D library
(nothing installed does this, and the arc does not need it).

---

## D4. One property write per slide, on Embla's own frame tick

**Decision**: The only thing JS writes during movement is a custom property per slide. There is no second
animation loop: the arc updates ride Embla's `scroll` event, which is already its rAF cadence, and do nothing
else.

**Rationale**: FR-011 (settle onto exactly one panel), FR-014 (bounded inertia) and FR-020 (do not degrade the
rest of the page) follow from this. One property write per frame cannot trigger layout, and there is no
independent loop to spin out of sync with the track — a carousel whose arc lags its own scroll by a frame is
the specific jitter FR-020 is guarding against.

Inertia itself is Embla's, which is also why FR-014 needs an explicit cap rather than a tuned constant:
Embla's physics are velocity-driven and a hard flick will skip. The cap is applied by intercepting the `select`
event's `skipped` count and re-issuing `scrollTo(target)` bounded to a fixed maximum panel travel.

**Alternatives considered**: driving the arc from `requestAnimationFrame` independently of Embla, rejected
because two loops reading the same scroll position disagree on exactly one of the frames and that shows;
CSS-only `scroll-driven animations` (`animation-timeline: view()`), attractive for its zero-JS cost and kept
as a progressive enhancement note only — it cannot express a distance-from-centre function reliably across
nine looping slides, and Firefox support was not yet settled enough to build the section's headline visual on.

---

## D5. Off-screen cost, and no entrance replay

**Decision**: An `IntersectionObserver` on the section gates the carousel's life. When the section leaves the
viewport, Embla is torn down with `emblaApi.destroy()` — which removes its scroll watch, its resize
interpreter and its snap loop in one call — and the panels drop to `transition: none`. The section never
plays an entrance animation at all, on first paint or after. Re-entry re-initialises Embla at the stored
index without animating.

**Rationale**: FR-019 and SC-008. The reference animates continuously whether or not anyone is watching and
duplicates its item list to fake the loop; both are cost with no shopper-facing benefit here. Choosing "no
entrance" over "no entrance when returning" removes the whole class of bug rather than guarding one
condition of it, and a section that appears mid-page on a 16,000px document has no business announcing
itself anyway.

Looping is implemented by index arithmetic with wrap-around, not by duplicating the panel list. Nine
panels, nine nodes, each one focusable exactly once — a duplicated list would make `Tab` visit every
department twice, which fails FR-027 and SC-005.

**Alternatives considered**: pausing on `document.visibilitychange` as well — kept, it is two lines, and it
covers the case where the section is on screen in a background tab.

---

## D6. Visual direction — delegated by FR-035, decided here

FR-035 makes these the implementer's to decide and forbids escalating them. They are recorded with reasons
so that a later reviewer can disagree with a specific value rather than with an absence.

**Surface.** The section sits on the homepage's dark ground, which FR-039 requires it be proven against, and
`app/globals.css` gives that ground red-noir radial glows that alternate side per section. A carousel that
introduces its own coloured light would be the sixth light source on the page and FR-005's busyness finding
in `specs/002-scroll-atmosphere/notes/busyness.md` is the warning about exactly that. So the panels carry no
glow of their own: the stage is a near-black lacquer (#120104, one step off the page ground so the region
reads as placed rather than floating) and depth comes from a single top-lit falloff on each panel.

**Panel.** 4:5 portrait, corner radius derived from the existing `.tray-field` family rather than a new one,
badge artwork centred with generous padding, and no card border — the falloff does the separation. The
inactive panels are dimmed by a `filter: brightness()` tied to their distance from centre, which is the
depth cue, so the arc reads as depth rather than as three positions on a line.

**Labels.** Real text below the artwork, outside the panel, not over it — over-artwork Persian on a badge
with an unknown silhouette is a contrast gamble, and Principle I does not allow "probably legible".
Typeface and weight follow the existing home.css heading stack. Active panel: cream `#F0ECE9` at the
section's large label size. Inactive: `#B9B3B0`. Both stay above 4.5:1 against the stage by construction and
the check is in `quickstart.md`, not assumed. Persian digits for any count, and per D1 the phones panel
shows no count.

**Motion, shared with feature 004.** FR-038 binds the two surfaces to one motion vocabulary, and 004 already
shipped `220ms cubic-bezier(0.2, 0.7, 0.3, 1)` for its row emphasis. The carousel adopts that curve and that
duration for every non-drag state change — snap-settle, focus move, hover lift — so the two neighbouring
surfaces move with the same body. Drag response is exempt because it is direct manipulation, not a
transition; a 220ms lag on a finger would be a defect.

**Interaction contract, from FR-038.** A press on the active panel navigates. A press on any other panel
brings it to centre. This is the same semantics 004's C24 established for the brand rows: a destination
press always navigates and is never intercepted to reveal decoration first.

**Rationale**: Constitution IV asks for restraint and for every element to earn its place. The single
expensive-feeling gesture here is the arc itself; everything else — colour, glow, gradient — is held down so
the arc is the only thing competing for attention.
**Alternatives considered**: a glass/light stage under the panels, rejected because it introduces a second
light world on a page that already argues about having one; panels with individual coloured backgrounds per
department, rejected as the "uniform grid of generic cards" failure Constitution IV names.

---

## D7. Reduced motion and non-visual equivalence

**Decision**: Under `prefers-reduced-motion: reduce`, panels keep their arc positions and their ordering but
carry no transition and no inertia: a swipe, a click on an off-centre panel, or an arrow key moves the
carousel instantly. Every department, label and destination is identical to the animated version.

**Rationale**: FR-031 requires identical content with settled rather than travelling movement, and FR-038
requires the reduced-motion behaviour be *the same* in this surface and 004's rows — 004 resolves that by
removing transitions and keeping state, so this does the same. Dropping the arc entirely was considered and
rejected: the arc is layout, not motion, and the shopper who cannot have motion is not the shopper who
cannot have depth.

**Keyboard and screen reader.** The section is a listbox-shaped widget: one tab stop, arrow keys move the
active panel (mapping `ArrowRight` to the reading-order-forward direction, which in RTL is visually left —
FR-026 and FR-028 together), `Enter`/`Space` activates the destination, and each panel exposes its name,
its position and the total (FR-030). `aria-activedescendant` on the container carries the active state, so
the off-centre panels are still reachable as content and are not seven separate tab stops fighting the
shopper.

**Alternatives considered**: a roving tabindex. Rejected only for the carousel; 004's rows use a holder
pattern appropriate to a list, whereas here the widget has a single current item, which is the listbox case.

---

## D8. No new dependency, no DOM test harness

**Decision**: Zero packages added — but as a consequence of the arc needing nothing else, not as a rule. The
owner ruled on 2026-09-22 that **dependency cost is not a constraint on this initiative and quality is the
priority**, so "it would add a package" is not a valid objection anywhere in these specs. `package.json`
already holds `embla-carousel-react@8.6.0`, `gsap@3.15.0` and `motion@13.2.0`, and Embla is chosen because it
does the risky parts better than hand-written code would, not because it is free. Tests are pure-function tests
over the derived department table plus browser scripts under `tools/`, with the visual contract checked by a
Playwright-driven script the way feature 002's `tools/ground-sweep.mjs` works — Playwright resolved from
`PLAYWRIGHT_PATH` so it never becomes an app dependency.

**Rationale**: `002/research.md` D6 established that vitest here runs with `environment: "node"` and that no
jsdom/happy-dom harness exists; adding one to exercise drag behaviour would still not prove a real touch
gesture works, whereas Embla's behaviour under a real pointer is exactly what `quickstart.md` §3 tests in a
browser. The no-DOM-testing position is a tooling judgement and survives the owner's ruling; the
no-new-packages position was a constraint that has been explicitly lifted.

**Known harness hazard, recorded so nobody re-discovers it the hard way**: bare `npm test` runs
`dotenv -e .env.test -- vitest run`, `.env.test` does not exist, and `tests/setup.ts` truncates all 19
tables of the development database in a global `beforeEach`. Run `npx vitest run tests/unit`. The owner
accepted this hazard on 2026-09-22; it is not a reason to be careless anyway.

---

## Reproducing the measurements

```bash
node -e '
const d=JSON.parse(require("fs").readFileSync("data/hami-products.json","utf8"));
const kc={};for(const p of d.products)kc[p.kind]=(kc[p.kind]||0)+1;
console.log("kinds:",kc,"total:",d.products.length);
const reach=id=>d.products.filter(p=>p.category?.id===id||(p.other_categories||[]).some(o=>o.id===id));
for(const s of ["موبایل","هدفون-ایرپاد-و-هندزفری","آداپتور-کابل-و-شارژر","ساعت-و-مچ-بند-هوشمند",
  "پاور-بانک","تجهیزات-کامپیوتر-و-لبتاب","سیمکارت","شارژر-فندکی","خدمات-آنلاین"]){
  const c=d.categories.find(x=>x.slug===s); const r=reach(c.id);
  console.log(c.name, r.length, "buyable:", r.filter(p=>p.stock?.purchasable).length);
}
console.log("empty categories:", d.categories.filter(c=>!reach(c.id).length).length, "of", d.categories.length);
'
```
