# What is left — full audit

**Audited**: 2026-09-28 06:34 +0330 · **HEAD**: `9fd3224` · supersedes nothing; read with `PROJECT-BACKLOG.md`
Re-audited the same evening as the first pass. R1 has moved, R3 is nearly closed, and one new item (R0) was
found by driving the owner's real browser through the Qoder Chrome extension.

The backlog-execution plan (`docs/superpowers/plans/2026-09-28-project-backlog-execution.md`) had six tasks.
**Two landed, four never started.** All six are now accounted for below.

| plan task | state | evidence |
|---|---|---|
| 1 — header props | **DONE, and was already done** | `Header.tsx` passes none of the four obsolete props; typecheck clean |
| 2 — digits + error fix | **DONE, better than planned** | digits applied at the display layer, not in the frozen `app/api/` route as the plan said. Committed as `2b85ed1` |
| 3 — verify feature 012 | **IN PROGRESS here** | all **7 of 7** surfaces now wired (featured tabs landed last); verification still not run — 16 of 46 boxes closed |
| 4 — converge feature 007 | **NOT STARTED** | zero `Phase: Convergence` sections in `specs/007-motion-assembly-band/tasks.md` |
| 5 — reconcile feature 011 | **NOT STARTED** | `FR-006` still reads "All six cards MUST carry one description line each. A card with no line is a defect, not a variant" — and the cards carry none |
| 6 — feature 001 slices | **NOT STARTED** | `app/(main)/page.tsx` and `app/(main)/shop/page.tsx` are untouched; the only dirty file there is `ShopResults.tsx`, and that is 012's marker work, not entrance motion |

## Remaining work, ordered

### R0 — Retracted: the "wrong browser" finding was wrong, and what it really found

**Published at 06:34, retracted at 06:55.** The claim was that the owner's Chrome loads the eased scroller
(`lenis`) and the headless Chromium every gate uses never does. It is false. Headless loads it too — at
**~5.4s after navigation**, because in dev the dynamic import is compiled on first request. Every probe that
disproved it waited 2.5–3s and then reported the absence of something that had simply not arrived yet.

What survives is smaller and still worth having:

1. **A dev-mode startup race inside the gates themselves.** A browser gate that starts walking before the
   scroller lands measures a page that is not the page a shopper gets, and nothing in its output says so.
   `surface-separation.mjs` now waits for `html.lenis` (up to 15s) and **fails the run** if it never appears,
   rather than quietly reporting "native".
2. **The detector was broken, not the environment.** It tested `/(^|\s)lenis(\s|-)/` against
   `documentElement.className`. Lenis sets the bare class `lenis`, which that regex cannot match — so it
   printed "native" on pages that had been eased the whole time. Fixed to `/(^|\s)lenis\b/`.
3. **One real measurement changed once the scroller was actually on.** With Lenis live, the phone-width
   product-edge leg came back **1.01:1** — a card mid-reveal through `Reveal` is transparent but still
   hit-tests, so `elementFromPoint` said "the card is on top" while the pixels were bare ground. The guard now
   requires the whole ancestor chain to be opaque. Re-run clean: **8.57:1 at 360, 16.83:1 at 1280**, floor 3:1.

**Honest coverage limit found on the way:** at 360 the homepage shows product imagery in a horizontal rail
where only about two cards are painted at once, so the phone-width verdict rests on **2 edge reads** (against
25 at desktop). Raising the step count does not help — it is the page's shape, not the sampling. **Left open:**
sample more product edges at phone width, on a surface that stacks them vertically.

### R1 — Finish and verify feature 012 (in flight)

Wired: bottom bar, desktop menu, category tiles, pagination, image views, variant chips **and the featured
tabs** — the last one was the only true tab list on the site and needed a per-item attribute passthrough the
shared component did not have (`f2c15f0`).

Still owed before 012 can be called done:

| gate | why it is not free |
|---|---|
| verify all seven surfaces in a browser | trusted clicks + in-page rAF sampling only; a programmatic click is ignored by Next's Link |
| ~~re-run 008's deck fit gate~~ | **DONE 05:52** — exit 0 at 360×640: C1 6/6 in order, C2 0 bad of 21, FR-008 2.36 screens, D2 116px vs 460px, C8 static, C9 all three arrivals. The dock did not move the deck. Two earlier runs failed on contention, not on the deck. |
| no-JS, reduced-motion, keyboard at each surface | FR-020/021/023 |
| **the wrapped group** | `flex-wrap` landed after the render gate ran and the probe page was retired — the `corner` trip has never been measured |
| **pagination distance** | `MAX_TRAVEL_PX = 320` rests on bottom-bar arithmetic; nobody has counted the shop's real pages |
| at most one marker animating at a time | FR-033, and a laptop home page shows two surfaces at once |
| accessible names unchanged on all seven | SC-010 — needs a before/after diff per surface |
| owner's handset verdict | SC-007, and the only gate that settles whether the glass is right |

`/speckit-converge` then closes whatever it finds.

### R2 — Feature 001: the five unbuilt slices

Never started. All five were verified in the source, not read off a checkbox.

- **T113** — `/shop` has **zero** entrance motion. Confirmed: no reveal, tween or animation in the page or its
  results component. Every other surface on the site has one.
- **T026 / T033** — «انتخاب‌های بی‌نهایت» and three CSS-composition filler panels with pseudo-English labels.
- **T089** — eight authored-filler homepage sections still present.
- **T085** — rebuild the above-the-fold at 360×800.
- **T118** — **ASK THE OWNER**: the two featured tabs cannot show different products. Raised, never answered.

Then the checking tasks: T102–T104 (render all 189 products and 32 categories; first-image visibility),
T106–T110 (coherence note, frozen-directory confirmation, quickstart walk, graph update).

**T098–T101 stay open on purpose** — marked "CLOSED UNMEASURED by decision 7 — do not fill this box".

### R3 — Feature 002: atmosphere verification (partly done here)

**Done**: T022 the contrast sweep, T023 its result. 12 ground-exposed samples per width, 0 failing,
tightest 6.49:1 against a 4.5:1 WCAG AA floor.

**The finding that matters more than the pass**: most of the page's text sits on **opaque** cards, so the
moving ground never reaches it. Product name, price, availability, section headings and the header are all
shielded. The atmosphere works in the margins, eyebrows and footer. That makes this contract's real risk
surface far smaller than its wording implies — and it means the sweep must not be quoted as evidence about
the product grid.

**Done since (`9fd3224`)** — three new instruments, results in `notes/legibility-and-harm.md`:

- **T024** header over every tone in both states: PASS, worst 7.86:1 against 4.5:1. It holds by construction —
  both header states paint an opaque surface, so the ground never reaches header text. The island state only
  exists above scrollY 20, so it is reachable over exactly one tone.
- **T025** product imagery separation: PASS by **rendered pixels**, 8.55:1 at 360 and 16.45:1 at 1280 against
  a 3:1 floor (SC 1.4.11). `.bg-product-stage`, the plinth the task names, is dead CSS with no users left.
- **T026** forced colours: PASS — the block already existed in `page-ground.css`, and under emulation the layer
  computes `display: none` with the content hash unchanged.
- **T029** reduced motion content-identical: PASS — one hash across baseline, reduced, forced colours and a
  deleted layer, with a measured noise floor of zero.
- **T030** silent to assistive technology: PASS — read off `Accessibility.getFullAXTree` over CDP (1700 nodes
  either way, no node for the layer), because `page.accessibility` is gone from this Playwright build.
- **T033** the ground is never load-bearing: PASS — deleting it changes nothing.
- **T028** the discrete reduced-motion mapping was already implemented (`reducedMotionTone`) and unit-tested;
  its A1 half is measured below.

**Still left**: **T031** hidden-document behaviour — mechanism proven (zero colour writes in six idle seconds,
correct colour on the real `visibilitychange`, transition `all 0s`), but headless Chromium here has no tab
occlusion at all, so the browser's own half is assumed rather than seen. Deliberately unchecked. · **T027**
sections shorter than the viewport · **T032** the low-capability fallback and its chosen tone · **T034** the
fifteen-minute soak · **T035–T041** polish, including the human panel T040.

### R4 — Feature 007: find out what is actually left

Shipped, committed, accepted on the owner's phone — and 56 of 63 boxes still read open. Seven are now
marked with evidence. **The other 49 are of unknown truth**, not known work. T004 and T005's before-captures
are confirmed absent. Needs `/speckit-converge`, and note it has **no `plan.md`** — `blueprint.md` is the plan.

### R5 — Feature 011: the spec now contradicts the product

`FR-006` demands a description line on every card and calls a card without one a defect. The owner then
approved six generated artworks and the cards became art-led with no description line. **The spec and the
shipped card now disagree, and the spec is the loser.** Needs `/speckit-clarify` to amend FR-006, then
`/speckit-converge`.

Also: `tasks.md` reads 0 of 34 while T001–T013 landed and 32 tests pass.

### R6 — Small and real

- **004 T053** — the mobile category link reaches 8 products while the export holds 134 phones. A shelf that
  under-reports itself.
- **004 T049** — the SC-011 comparison was never recorded.
- **003 and 006 have no `tasks.md` at all** — built without the task phase, not lost.

## Not work, do not "discover" it again

009's 34 open boxes (feature cancelled, files deleted by 010) · 001's T098–T101 (deliberate) · the two 008
defects the owner parked · the brand card imagery, which is the owner's to regenerate.
