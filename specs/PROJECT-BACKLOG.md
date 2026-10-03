# Project backlog — unbuilt work, with the command to start each one

**Written**: 2026-09-27 ~07:00 +0330 · **Branch**: `Hami-v3` · **HEAD**: `383d8e9` (pushed to `origin/Hami-v3`)
**How to use this file**: each numbered workstream is self-contained. Open a fresh chat, paste the
`Start with:` block, and that session needs nothing from this one.

Everything below was checked against the code, not against a checkbox. Where a task list is
untrustworthy it says so and why.

---

## State of the twelve features

| # | feature | real state | task list trustworthy? |
|---|---|---|---|
| 001 | premium RTL storefront | shipped, **21 items genuinely open** | yes — boxes match reality |
| 002 | scroll atmosphere | shipped, **27 open**, several are harness work | yes |
| 003 | floating product presentation | shipped | **no `tasks.md` exists** |
| 004 | mobile brands rows | shipped, 2 open | yes |
| 005 | categories carousel | shipped, superseded by 006/010 | yes (42/42) |
| 006 | category showcase | shipped | **no `tasks.md` exists** |
| 007 | motion assembly band | **shipped and accepted**, 56 boxes still open | **no — unknown truth** |
| 008 | brands stacking deck | shipped, accepted on the owner's phone | yes (38/38) |
| 009 | editorial mosaic | **cancelled** — owner rejected both variants | **void**, 34 boxes are dead |
| 010 | categories masonry | shipped, accepted on the owner's phone | yes (32/32) |
| 011 | brand card identity | **parked, then partly overtaken** | **no — 0/34 marked, T001–T013 landed** |
| 012 | liquid dock navigation | **bar wired, 6 of 7 surfaces open** | yes, in flight now |

**Why some lists lie**: `/speckit-implement` step 8 is the only component in the chain that writes
`[X]`. `speckit-analyze` never reads the codebase; `speckit-converge` reads it but is append-only by
design and must not re-mark a box. Work routed through the worker-dispatch lane therefore had **no
writer at all**; the dispatcher was patched to carry a mandatory task write-back rule (that lane was
retired on 2026-10-04, so the hazard now applies to anything built without `/speckit-implement`).
Read the headers inside `specs/007*/tasks.md`,
`specs/009*/tasks.md` and `specs/011*/tasks.md` before acting on any box in them.

---

## W1 — Finish feature 012 across the remaining six surfaces

**In flight as of this writing** — two workers were on it, before the worker lane was retired. Check before
starting: `git log --oneline -5` and `grep -c '^- \[ \]' specs/012-liquid-dock-navigation/tasks.md`.

**What exists**: the cart is gone from the mobile bar (five destinations), and
`components/liquid/LiquidSelection.tsx` is a working vendored marker — proven on a real `dir="rtl"`
page at 360/390 px: one body crossing four slots at peak `scaleX 1.250`, elastic overshoot and settle,
`will-change` present in flight and `auto` at rest, server HTML emitting `left:80%;width:20%` for RTL
index 0, current tab still marked with scripting blocked, bar still 62 px tall with a 12 px inset.

**What remains**: six consumers — `PillNav`, `FeaturedProducts`, `CategoryTiles`, `ShopResults`,
`ProductGallery`, `ProductDetail` (tasks.md Phase 6, T029–T040), then the polish phase T041–T046.

**Two things not yet re-measured:**
- **FR-045, the wrapped group.** `flex-wrap: wrap` was added to `.group` *after* the render gate last
  ran, and the probe route that made it measurable was retired. The `corner` trip is unproven.
- **FR-046, pagination distance.** `MAX_TRAVEL_PX = 320` is justified by arithmetic on the bottom bar
  only. Nobody has measured how many pages `/shop` really has or whether the control ellipsises.

```
Start with:
  /speckit-implement        (feature 012; continue at Phase 6 of specs/012-liquid-dock-navigation/tasks.md)
Then:
  /speckit-converge         (012 — appends whatever the six surfaces did not finish)
  /speckit-analyze          (012 — cross-checks spec.md against tasks.md)
```

**Gate that must not be skipped**: FR-018/SC-006 pin the dock at 62 px + 12 px. The stacking-card deck
(008) subtracts that clearance as a constant. After any dock change, re-run
`node specs/008-brands-stacking-cards/verification/measure-deck.mjs`.

**Design decisions already made — do not relitigate without the owner**: drag-to-select is declined
(FR-012a, the marker means *where you are*, not *where you might go*); the reference's synthesised
sound is refused (FR-042); the back office is excluded (FR-043); the surface is soft liquid glass,
dialed back twice on the owner's instruction.

---

## W2 — Feature 011: the brand cards, waiting on artwork

**Blocked on the owner**, not on code. They are regenerating six brand card images and said the phones
stay in them because the shop does carry those products.

**The complication nobody should discover by accident**: 011 went two ways at once. The owner parked it
to regenerate artwork, and separately approved six generated cards on the phone and **overwrote the
no-AI-imagery rule** for this surface. A qoder side session holds live locks on
`components/home/BrandRows.tsx`, `lib/brand-identity.ts` and `app/(main)/home.css` under that order.
The artwork is now the card; what survives of the identity work is the count's colour.

**Known stale artifact**: `specs/011-brand-card-identity/spec.md` FR-006 requires a description line on
every card. The rendered cards carry none. Amend the spec or the cards — not neither.

**Also open**: `tasks.md` shows 0/34 but T001–T013 landed (32 tests green). Reconcile before trusting it.

**Facts about the catalogue that constrain any brand claim** — verified, re-check before repeating:
only **5 of 189** products are purchasable today. Of the six deck brands, **Xiaomi, Nokia and TCH have
exactly one purchasable phone each; Apple, Samsung and Realme have zero** despite 49, 42 and 1 catalogue
rows. The deck already hides the count where there is no stock, which is why all six can carry an image
without lying.

```
Start with:
  /speckit-clarify          (011 — reconcile FR-006 and the artwork decision into the spec)
  /speckit-converge         (011 — appends the genuinely unbuilt remainder as new tasks)
  /speckit-implement        (then work the appended phase)
```

---

## W3 — Feature 007: find out what is actually left

The band shipped, was committed and was accepted on the owner's phone, yet 56 of 63 boxes are open.
Seven are now marked with evidence. **The other 49 are of unknown truth** — some done and unmarked, some
genuinely missing. T004 and T005's before-captures are confirmed absent from `verification/`.

Do not re-implement anything here until a converge run says what is missing.

```
Start with:
  /speckit-converge         (007 — assesses code against spec + blueprint + tasks, appends the real remainder)
```

Note 007 has **no `plan.md`** — the owner-approved `blueprint.md` is the plan and is load-bearing.
Converge expects `plan.md`; if it refuses, run `/speckit-plan` first or point it at the blueprint.

---

## W4 — Feature 001: the homepage and `/shop` work that is genuinely open

Task list is accurate. Real items, spot-verified:

- **T113 — `/shop` has zero entrance motion.** Confirmed: 0 matches for any reveal/tween/animation in
  `app/(main)/shop/page.tsx` and `components/shop/ShopResults.tsx`. Every other surface has one.
- **T089 — eight authored-filler homepage sections** still present (`MobileQuickRoutes`,
  `OnlineServices`, `ShopWindow`, `NewArrivals`, `BrandTicker`, …).
- **T085 — rebuild the above-the-fold at 360×800** for FR-014.
- **T033 / T026 — remove the CSS-composition filler panels and «انتخاب‌های بی‌نهایت».**
- **T118 — ASK-HUMAN: the two featured tabs cannot show different products.** Raised, never answered.
- **T102–T104 — SC-015, SC-006, SC-010**: render all 189 products / 32 categories without breakage, and
  measure first-image visibility on a mobile connection.
- **T098–T101 are marked "CLOSED UNMEASURED by decision 7 — do not fill this box."** They are
  deliberately open. Leave them.

```
Start with:
  /speckit-analyze          (001 — cross-checks spec/plan/tasks before you touch code)
  /speckit-implement        (001 — work T026, T033, T085, T089, T113 in that order)
Ask the owner first:
  T118                      (the two featured tabs cannot show different products)
```

---

## W5 — Feature 002: the atmosphere verification harness

27 open, and most are **measurement, not styling**: a contrast-sweep Playwright harness (T022/T023),
the fixed header over every tone in each of its states (T024), product-image separation (T025),
forced-colors support (T026), short-section tone resolution (T027), and the reduced-motion mapping plus
its content-identity proof (T028–T030).

```
Start with:
  /speckit-implement        (002 — Phase US3 verification tasks first; they gate the rest)
```

---

## W6 — Small, real, and cheap

- **004 T053** — `categoryLinks.mobile` reaches 8 products but the export holds 134 phones. A link that
  under-reports its own shelf. Worth a look before it becomes a customer complaint.
- **004 T049** — SC-011 comparison never recorded in `notes/reception.md`.
- **001 T111** — `app/api/orders/route.ts:42-46` renders order ids in Latin digits. Persian numerals are
  a Constitution II MUST.
- **001 T110** — `graphify update .` has not been run since 010/011/012 landed.

```
Start with:
  /speckit-analyze          (004, for T053 — it is a data/link consistency question, not a UI one)
  direct fix                (001 T111 — one file, one digit-locale call)
```

---

## Hazards a fresh session will hit and should not have to learn twice

1. **Never run bare `npm test` or bare `npx vitest run`.** `tests/setup.ts` is in `setupFiles` and
   `resetDb()` truncates **nineteen tables in the real `hami_site_api` database**. Use
   `npm run test:unit`. This has already happened once; the forensic log is in `.scratch/`.
2. **`npm run build` breaks the running dev server.** Documented in `CLAUDE.md`. Symptom is
   `reactKeys: 0` and components that will not animate while the code is correct. Restart `hh-dev`
   after every build.
3. **The dev server lives in tmux session `hh-dev`, bound `-H 0.0.0.0 -p 3000`.** Note the flag is
   `-H`; `--host` is not a `next dev` option. Locally generated traffic bypasses `INPUT`, so curling
   your own LAN address proves nothing about whether a phone can connect.
4. **The LAN address changes constantly and the firewall rules go stale behind it.** Read
   `ip -br addr` fresh — **not** `ip route get 1.1.1.1`, because the tunnel interface owns the default
   route and lies about the source. Fixing phone access needs root; this box's `sudo` and `pkexec` were
   both unavailable from the agent session on 2026-09-27.
5. **The owner keeps uncommitted work in this tree.** One agent works here as of 2026-10-04 — the
   `.agent-pair/` coordination layer, its locks and its board are retired — but that does not make the tree
   yours alone. Never `git restore`, `git checkout --`, `git stash`, or `git add -A`; stage by explicit path
   and re-read `git status --short` before you commit.
6. **An untrusted click is not a click.** `el.click()` inside `page.evaluate()` is ignored by Next's
   `<Link>`; use `page.mouse.click()` at the element centre. This has already produced one false
   "the effect does not work".
7. **A Playwright round-trip is slower than a 620 ms animation.** To see a marker travel, sample with
   `requestAnimationFrame` inside the page. Sampling from outside shows a stationary object.
8. **`scroll-behavior: smooth` is set globally**, so scroll-then-measure needs `behavior: "instant"`
   plus ~120 ms, or you sample a page still gliding.
9. **This machine cannot judge motion.** No fps or smoothness claim made from it is valid; the owner's
   handset is the gate (SC-007 in 012).
10. **Beads (`bd`) is unreachable from an agent Bash session** despite `.beads/` existing, so the
    instruction to use `bd` for task tracking cannot be followed here. Spec-kit `tasks.md` is what
    survives; commit your checkbox changes.
11. **`data/`, `app/api/`, `prisma/` are frozen** (Constitution III). Auth, cart, checkout and the back
    office must not be modified to unblock a frontend decision.
12. **`docs/inspires/` must never be installed, built or run.** Distinct from the 012 case, where the
    owner named a specific GitHub repo and told me to vendor it.

---

## What is deliberately NOT work

- **009's 34 open boxes.** The feature was cancelled, not unfinished. Its files were deleted by 010.
- **001's T098–T101.** Marked "CLOSED UNMEASURED by decision 7 — do not fill this box."
- **The two 008 defects the owner parked**: the brands empty-frame issue and the online-services
  shortening. Both are owner decisions to defer, not bugs to rediscover.
- **`specs/003` and `specs/006` have no `tasks.md`** — they were built without the task phase, not that
  their tasks were lost.
