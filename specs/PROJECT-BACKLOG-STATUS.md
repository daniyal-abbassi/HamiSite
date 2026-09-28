# What is left — full audit

**Audited**: 2026-09-28 04:50 +0330 · **HEAD**: `f2c15f0` · supersedes nothing; read with `PROJECT-BACKLOG.md`

The backlog-execution plan (`docs/superpowers/plans/2026-09-28-project-backlog-execution.md`) had six tasks.
**Two landed, four never started.** All six are now accounted for below.

| plan task | state | evidence |
|---|---|---|
| 1 — header props | **DONE, and was already done** | `Header.tsx` passes none of the four obsolete props; typecheck clean |
| 2 — digits + error fix | **DONE, better than planned** | digits applied at the display layer, not in the frozen `app/api/` route as the plan said. Committed as `2b85ed1` |
| 3 — verify feature 012 | **IN PROGRESS here** | 6 of 7 surfaces wired; verification not yet run |
| 4 — converge feature 007 | **NOT STARTED** | zero `Phase: Convergence` sections in `specs/007-motion-assembly-band/tasks.md` |
| 5 — reconcile feature 011 | **NOT STARTED** | `FR-006` still reads "All six cards MUST carry one description line each. A card with no line is a defect, not a variant" — and the cards carry none |
| 6 — feature 001 slices | **NOT STARTED** | `app/(main)/page.tsx` and `app/(main)/shop/page.tsx` are untouched; the only dirty file there is `ShopResults.tsx`, and that is 012's marker work, not entrance motion |

## Remaining work, ordered

### R1 — Finish and verify feature 012 (in flight)

Wired: bottom bar, desktop menu, category tiles, pagination, image views, variant chips. **Not wired: the
featured tabs** — the only true tab list on the site, and the one surface that needed a capability the shared
component did not have. That gap is now fixed (`f2c15f0`), so it is unblocked.

Still owed before 012 can be called done:

| gate | why it is not free |
|---|---|
| verify all seven surfaces in a browser | trusted clicks + in-page rAF sampling only; a programmatic click is ignored by Next's Link |
| re-run 008's deck fit gate | the dock's height feeds the stacking cards' budget as a constant |
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

**Left**: T024 header over every tone in both of its appearance states · T025 product-image separation
against the plinth · T026 forced-colours block · T027 sections shorter than the viewport · T028 the
discrete reduced-motion mapping · T029 prove reduced motion is content-identical · T030 prove the layer is
silent to assistive technology · T031 hidden-document behaviour.

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
