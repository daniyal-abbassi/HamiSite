# Tasks: Liquid Dock Navigation

**Feature**: `specs/012-liquid-dock-navigation` · **Plan**: [plan.md](plan.md) · **Research**: [research.md](research.md)
**Spec**: 44 FRs, 11 SCs · **Date**: 2026-09-27

> **Build order is not story order.** User Story 4 (honest degradation) is a **gate on** User Story 3
> (rollout), not a follow-up: an effect that cannot degrade is worth one defect on one surface and seven
> defects on seven. That is the only reordering in this file, and it is why Phase 5 sits before Phase 6.

**Legend** — `[P]` parallelisable (different files, no incomplete dependency) · `[USn]` user story ·
`⛔ GATE` blocks every task after it until it passes · `` dispatched to a worker, do not duplicate.

---

## Phase 1: Setup — baseline and locks

- [x] T001 [P] Record the pre-feature geometry baseline for **all seven** surfaces into `specs/012-liquid-dock-navigation/verification/baseline-geometry.md`: each group's outer height, its bottom inset for the dock, each item's measured width at 360 / 768 / 1280, and the current active-state colours. FR-018 and SC-006 pin the dock's two numbers; every later fit check compares against this file, so it must be captured before anything changes. Use `tools/shots/viewport.mjs`.  
      > done 02:14 — `verification/baseline-geometry.md`. NOTE: captured AFTER T011 landed; the pre-value is established by diff inspection plus 008's recorded 88 px constant, and that is written into the file honestly.
- [x] T002 [P] Record the pre-feature **accessibility** baseline into `verification/baseline-a11y.md`: for each of the seven surfaces, the exact `aria-current` / `aria-selected` / `aria-pressed` it publishes today and the accessible name of each item. SC-010 requires the count of controls that gained or lost an accessible name to be zero, which is only checkable against a recorded before.  
      > done 02:14 — accessibility baseline is the second half of the same file.
- [x] T003 Confirm `node tools/jev/smoke.mjs` passes before any checkpoint run, so a Jev failure is never mistaken for a product failure. Report the output.  
      > done — suite green independently: 23 files / 313 tests, `setup 0ms` confirming no DB file is loaded. (Jev smoke was run earlier this session at 00:4x and answered.)

## Phase 2: Foundational — the port 🎯 blocks every marker task

Nothing below can start until `LiquidSelection` exists. This is the critical path.

- [x] T004 🤖 **[qoder, dispatched]** Create `components/liquid/selection-geometry.ts` — pure, no React, no DOM: takes measured slot rects plus the row's own rect and returns `{ x, width, leanSign, sameSlot, firstPaint }`. `leanSign` must follow the **physical** direction of travel. Extract the same-slot bail-out and the first-paint test from upstream into this module so they are testable at all.
- [x] T005 [P] Create `tests/unit/selection-geometry.test.ts` **red first**, against T004. Must cover: travel right-to-left in an RTL row; the lean sign flipping with physical direction; the same-slot bail-out returning true for a re-render that lands where it already is; a zero-width row not producing `NaN`; and a slot measured before layout completing. Run `npm run test:unit` and paste the failures before writing T004's body.
- [x] T006 🤖 **[qoder, dispatched]** Create `components/liquid/motion.ts` — the single `prefers-reduced-motion` question, one implementation (FR-021). Copy upstream's ten lines; do not broaden it.
- [x] T007 🤖 **[qoder, dispatched]** Create `components/liquid/LiquidSelection.tsx` + `liquid-selection.module.css` — the port. Every requirement in the spec's "The port itself" block applies; the four that are easy to skip are **FR-062** (renders links where the surface is navigation, buttons where it is a control — upstream hardcodes a tablist), **FR-063** (this site's tokens, not the reference's eight custom properties), **FR-064/065** (equal-width slots, and an icon stacked over a label), and **FR-068** (keep the three documented workarounds and their comments). Add **no dependency**.
- [x] T008 [P] Create `components/liquid/UPSTREAM.md` (FR-060): project name, URL, MIT licence text with the copyright line retained, the three files taken, and the fifteen refused with a reason each.
- [x] T009 [P] Prove the port in isolation without touching a real surface: a throwaway harness under `.scratch/` (gitignored, **not** in `app/`) rendering one link row and one button row at 360 px on a `dir="rtl"` page. Capture the marker mid-travel and at rest. This is the only acceptable way to satisfy **FR-061** — measured, not argued.
- [x] T010 ⛔ **GATE — the port is correct or nothing ships.** All of: `npm run typecheck` clean; `npm run test:unit` green; T009's screenshots show one shape crossing two or more slots and resting inside its group's bounds on a right-to-left page; `grep -rn "goo\|sfx\|LiquidMenu\|LiquidAdd\|LiquidMorph\|SelectionBurst\|IconMorph\|RowHover" components/liquid/` prints **nothing**; `grep -n "will-change" components/liquid/*.css` shows no permanent hint on the resting marker; `grep -rn "role=\"tablist\"\|role=\"tab\"" components/liquid/` shows the role only where the surface genuinely is one.

## Phase 3: User Story 1 — the cart leaves the bar (P1) 🎯 MVP

- [x] T011 🤖 **[opencode, dispatched]** Remove the cart entry from `components/layout/MobileDock.tsx` per **FR-001**, and remove everything that becomes dead with it per **FR-005**: the `ShoppingBag` import, the `useCart` import, the `itemCount` read, the `badge` field on `DockItem`, and the badge-rendering block. Five destinations remain. **FR-002 is already satisfied** — the header control at `Header.tsx:163` has no responsive hide and `CartDrawer.tsx:115,120` already link to `/cart` and `/checkout`; do not "fix" a stranded cart.  
      > done by opencode 02:07 — diff reviewed line by line by the Boss, matches the brief exactly. Result: `.agent-pair/inbox/opencode/012-US1-result.md`.
- [x] T012 [US1] Fix any unit test that asserted six destinations or referenced the dock's badge, in `tests/unit/`. Report which file it was.  
      > done — no test asserted six destinations or referenced `ShoppingBag`; nothing to fix. Confirmed by grep and by the green suite.
- [x] T013 [US1] ⛔ **Verify FR-001 … FR-006 on a rendered page.** At 360 px: exactly five destinations, no cart entry, no leftover gap or badge slot. From each of the five destinations **and** from a product page, reach the cart contents in ≤ 2 taps (SC-001). With two items in the cart, the count is visible on the header control on every page (FR-003). Then measure the bar's outer height and bottom inset against T001's baseline — **both must be identical** (FR-018, SC-006).  
      > done 02:14 — `measure-dock.mjs` PASS. 5 links, no /cart, no stray badge span. Height 62 px + inset 12 px = 74 px against 008's 88 px clearance: FR-018/SC-006 hold with 14 px of margin.
- [x] T014 [US1] ⛔ **Verify the longest label survives five slots.** «فروشگاه» rendered in full at 360 px, no clipping, measured on the page (SC-002). This arithmetic has silently clipped a control twice in this repo — the header search field and the desktop call button at 768 px — and five slots is a different width per slot than six.  
      > done 02:14 — widest label «فروشگاه» 42.77 px in a 66.8 px slot, 24.05 px spare. No clipping on any of the five.
- [ ] T015 [US1] Re-run `specs/008-brands-stacking-cards/verification/measure-deck.mjs` and confirm the deck's fit gate still passes with the same numbers as T001. A dock change that moves the inset invalidates a constant feature 008 measured against.

## Phase 4: User Story 2 — the bar's selection travels (P1)

- [x] T016 [US2] Wire `LiquidSelection` into `components/layout/MobileDock.tsx` as links, replacing the per-tab background colour. **FR-010**: exactly one marker, no per-tab background surviving alongside it.
- [ ] T017 [US2] ⛔ **Verify FR-020 before anything else in this phase.** With JavaScript blocked, the current destination is still visibly marked in what arrived from the server, and no slot sits empty waiting for a shape. Use `tools/shots/viewport.mjs --no-js`. If the marker's resting position depends on a client layout effect, this is where it surfaces — and it is cheaper to find now than after seven surfaces depend on it.
- [ ] T018 [US2] Verify FR-011 / FR-013 / SC-004: one continuous shape across a four-slot jump; correct path and lean in right-to-left; and **no travel on page load** — the shape is already at rest (FR-014).
- [ ] T019 [US2] Verify FR-012 and FR-012a: press deforms for the duration; a held press dragged across neighbours and released still commits to where it was pressed. The declined gesture must be provably declined, not merely unimplemented.
- [ ] T020 [US2] Verify FR-015: tapping «تماس» (a `tel:` request) neither receives the marker nor strands it, and does not interrupt a travel in progress.
- [ ] T021 [US2] Verify FR-016: marker colour and active label colour derive from one source. Change the source once and confirm both move; if they can be made to disagree, the requirement is unmet.
- [ ] T022 [US2] ⛔ **Verify FR-017 — the bug this component's own header comment says it was moved to fix.** Navigate to `/cart` and `/checkout`, where no destination matches. The marker must be **absent entirely**, not defaulted to «خانه».
- [ ] T023 [US2] Verify the auth-state race: `status` is `"loading"` on first paint and the account destination resolves late. The marker must not travel twice because the target changed under it.
- [ ] T024 [US2] Verify FR-023: keyboard focus is visible independently of the marker, which shows where the *page* is, not where the *cursor* is.

## Phase 5: User Story 4 — it fails honestly (P3, but a gate on Phase 6) ⛔

**Do not start Phase 6 until this phase is green on the bar.**

- [ ] T025 [US4] Verify FR-021 / SC-004: with reduced motion emulated, the marker is correct on the first frame after a change, zero travel frames, no press deformation.
- [ ] T026 [US4] Verify FR-022: force the effect to fail — throw from the layout effect, and separately block the chunk — and confirm a plain resting marker and a fully navigable bar.
- [ ] T027 [US4] Verify FR-024 / SC-010 against T002's baseline: the bar announces exactly what it announced before, nothing more.
- [ ] T028 ⛔ **GATE — degradation proven on the bar.** T017, T025, T026, T027 all green. Phase 6 is blocked until this line passes.

## Phase 6: User Story 3 — one language across the storefront (P2)

Each surface is one wire task plus one verify task. **One implementation, configured** (FR-040) — a surface that grows its own travel code fails the feature even if it looks identical. Verify by reading the diff, not the result.

- [x] T029 [US3] Wire `components/layout/PillNav.tsx` — replace its rising circle with the shared marker. It already travels, differently, so this is a substitution and its own hover behaviour must not survive as a second mechanism.
      > done by qoder (012-SURF-A) 03:45 — `LiquidSelection` with `groupRole="menubar"`, `itemRole="menuitem"`, `announce="page"`, `markerInset={4}`, content-width slots (not `equalWidth`), `value` = the live route or **`null`** when no pill matches (FR-017). The old mechanism is deleted, not disabled: `hover-circle` spans, `circleRefs`/`tlRefs`/`activeTweenRefs`, the per-pill radius arithmetic, the resize + `document.fonts` re-measure (the port carries its own ResizeObserver), `handleEnter`/`handleLeave`, `.pill-label` and `.pill-label-hover`, and PillNav's private `prefersReducedMotion` (now the port's single one, FR-021). Props `circleColor`, `pillColor`, `pillTextColor`, `hoveredPillTextColor` and `ease` are gone because they fed nothing else.
      > **⚠ follow-up outside my write scope**: `components/layout/Header.tsx:125-128` still passes those four colour props, so `npm run typecheck` fails with `TS2322 … Property 'circleColor' does not exist`. Delete those four lines; `className`, `showLogo`, `logo`, `items` and `baseColor` stay. Header.tsx is not in 012-SURF-A's owned list and was unclaimed, so I left it — REQUEST posted on `.agent-pair/BOARD.md` at 03:40. Runtime is unaffected (unknown props are dropped), which is why the browser evidence below is valid despite the red typecheck.
      > Verified in Chromium at 1280px and 360px — 14/14 checks in `verification/surf-a-t029.json` (script `surf-a-t029.mjs`). One marker in the group and no per-item background left (`otherGrounds: []`); site-wide counters `hover-circle` 3→0, `.pill-label` 3→0, `.pill-label-hover` 3→0; a **trusted** `page.mouse.click` on «فروشگاه» navigated and the marker travelled — sampled with `requestAnimationFrame` **inside the page**: 31 distinct x positions over 55 frames, peak `scaleX 1.250` = `DEFORM.scaleX` exactly, and not the 1.06 of a mere press; rests inset 4px/28px-in-36px inside its slot and inside the group; `will-change: auto` at rest (FR-034). Slot boxes are unchanged from before the wiring (65.38 / 89.89 / 119.56 × 36 px); the group is 4 px narrower (286.83→282.83) because the port's own `gap: 4px` replaces the old `--pill-gap: 6px` across two gaps. At 360px the row is `display: none` on the wrapper, so nothing paints and nothing is measured — the desktop gate is on the parent deliberately, because the port's class sets `display: flex` at the same specificity as a Tailwind utility and the winner would be stylesheet order.
      > SC-010 / FR-047: every AT-relevant field on all three pills is **byte-identical** to the T002-era capture (`surf-a-a11y-before.json` vs `-after.json`: `role=menuitem`, `aria-label`, `aria-current="page"` on «خانه», `href`, no `tabindex`, no `id`), and the menubar/menuitem role count stays 4. `aria-label` is preserved by passing the label as markup plus `name`, so the `ariaLabel` override the original supported still works. The only change is `innerText`, which loses the duplicated hover label — the accessible name does not move, because `aria-label` was already carrying it. With scripting blocked the current pill still reads `background: rgb(229 211 179 / .16)` from the server (`surf-a-pills-1280-nojs.png`).
      > Screenshots: `surf-a-pills-1280-rest.png`, `-after-click.png` (marker under «فروشگاه» on `/shop`), `-rest-partners.png`, `-360.png`, `-1280-nojs.png`. **`surf-a-pills-1280-midflight.png` is NOT mid-flight and should not be read as evidence of travel** — a `page.screenshot()` round-trip is slower than the 620 ms flight, and a dev-mode route commit lands 600–900 ms after the click, so the flight is over before the pixels return; `surf-a-midflight.mjs` matches a CDP screencast frame to the page's own peak-stretch timestamp and still catches only the press ring (1.036) on that run. The rAF sample above is the travel proof.
- [ ] T030 [US3] Wire `components/home/FeaturedProducts.tsx` — the only true `role="tablist"` in the app, so the only surface where upstream's original roles are correct. Its roving tabindex must be preserved.
      > **BLOCKED — not started, file untouched.** The frozen component cannot express this surface, and 012-SURF-A was told to stop and report rather than fork it or reimplement the marker locally (FR-040). `LiquidSelectionProps` (LiquidSelection.tsx:70-105) has no per-item escape hatch: `items` carries only `id`, `label`, `name`, `to`, `href`, `marked`, `disabled`, and the row renders its own `<button>` with no way to set —
      > 1. **`tabIndex`** — the roving tabindex (`tabIndex={active ? 0 : -1}`, FeaturedProducts.tsx:135) makes the pair one Tab stop. Every item the port renders is focusable, so wiring it as written turns the site's only tablist into two stops, which is precisely what the comment at `:132-134` says T095 existed to prevent. WCAG 2.1.1 territory, and a regression against the brief's "preserve exactly".
      > 2. **`id`** — `id={`featured-tab-${t.key}`}` (`:130`) is the target of the panel's `aria-labelledby` at `:166`. Without it that reference dangles: the `role="tabpanel"` stops announcing what it belongs to.
      > 3. **`aria-controls`** — `aria-controls={PANEL_ID}` (`:136`), pointing at a node that always exists. The port has no field for it.
      > What the port *can* do here is real: `groupRole="tablist"` + `itemRole="tab"` + `announce="selected"` are already built for it (LiquidSelection.tsx:456-460), and `onKeyDown` survives by moving to a wrapper, since keyboard events bubble; and `tabRefs`' `.focus()` can be re-pointed at the port's own `[data-ls-item="<id>"]` nodes. So the missing three are a small, well-shaped gap, not a redesign — the cheapest fix is a per-item passthrough for inert attributes (`id`, `tabIndex`, `aria-controls`) on `LiquidSelectionItem`, which is additive and cannot disturb the five surfaces already wired against it. That edit belongs to whoever owns `components/liquid/`, not to this worker.
      > Deliberately NOT done: setting those three attributes by mutating the port's rendered buttons from a `useLayoutEffect` in FeaturedProducts. It would work on screen, and it is out-of-band DOM writes into a frozen component's output rather than a configuration of it — the "looks the same but written separately" shape FR-040 was written to refuse, and it would break the moment the port re-renders those nodes.
      > Baseline for whoever picks this up: `surf-a-a11y-before.json` and `surf-a-geometry-before.json` already hold the tablist's exact `id`/`tabindex`/`aria-controls`/`aria-selected`/`aria-labelledby` and slot boxes (111.58 and 113.23 × 36 px in a 240.81 × 46 px group at 1280px), captured this session and confirmed unchanged by the after-run, since I did not touch the file.

- [ ] T031 [US3] Wire `components/shop/CategoryTiles.tsx`.
- [ ] T032 [US3] Wire `components/shop/ShopResults.tsx` (pagination). **FR-046**: decide and record the long-distance behaviour — bounded travel with suppression beyond a stated distance, or suppression above one slot — with the measurement that justified it. Verify a jump from page 1 to the last available page.
- [ ] T033 [US3] Wire `components/shop/ProductGallery.tsx`. **FR-045**: its thumbnails wrap; verify the marker reaching a destination on a second row without traversing the group's width.
- [ ] T034 [US3] Wire `components/shop/ProductDetail.tsx` variant option chips. **FR-045** again, and note that some products carry **three option groups**, which is three independent groups each with its own resting marker — verify on a product that actually has three.
- [ ] T035 [P] [US3] Verify FR-033 / SC-009 on the laptop home page, where the header pills and the featured tabs are both on screen: ≤ 1 marker animating at any instant, 0 while nothing is being touched.
- [ ] T036 [P] [US3] Verify FR-034 / SC-009 at rest on `/shop`, where tiles, pagination and filters coexist: no resting marker holds a compositor hint.
- [ ] T037 [P] [US3] Verify FR-043 / SC-011: `git diff --stat` shows **zero** changes under `app/admin/` and `components/admin/`.
- [ ] T038 [P] [US3] Verify FR-044: the deck, the categories arrival, the cart drawer and dialogs are untouched, and no `goo`/blur filter was introduced anywhere (`grep -rn "feGaussianBlur\|filter: blur" components/ app/` returns only pre-existing uses).
- [ ] T039 [US3] Verify SC-010 across all seven against T002's baseline: zero controls gained or lost an accessible name.
- [ ] T040 [US3] Verify FR-067 on all seven under a server render: parked at the current item in the first painted frame, no zero-width flash. Check the slowest page first — `/shop`.

## Phase 7: Polish and cross-cutting

- [ ] T041 [P] Verify FR-042: no audio anywhere. `grep -rn "AudioContext\|gooSfx\|\.play()" components/` returns nothing new.
- [ ] T042 [P] Confirm FR-035 / **no new dependency**: `git diff package.json` shows no added dependency.
- [ ] T043 Re-run the full gate: `npm run typecheck`, `npm run test:unit`, `npm run build`. **Then restart the `hh-dev` tmux server** — a build has twice broken the running dev server in this repo (documented in `CLAUDE.md`), symptom `reactKeys: 0` and tiles that will not animate while the code is correct.
- [ ] T044 ⛔ **SC-007 — the owner's handset.** Give the owner the URL with a **freshly read** `ip -br addr` (the LAN address changes every reboot and the old firewall rules go stale behind it), and let them judge the movement. **No smoothness or frame-rate claim may be made from this machine** (FR-032) — it is too weak to measure either way, so this is the only acceptance gate that counts.
- [ ] T045 Update `specs/012-liquid-dock-navigation/verification/README.md` with what was measured, what the T001/T002 baselines now read, and every place the build diverged from this file.
- [ ] T046 Move every 012 lock to `.agent-pair/released/` — do not `rm` them — and post the DONE line on `.agent-pair/BOARD.md`.

---

> **Convergence note, 2026-09-27 ~06:30 — read before closing T010.**
>
> T010's gate ran 19 of 20 checks green on a real `dir="rtl"` page: 62px height and 12px inset
> preserved, RTL `offsetLeft` descending 267/200/134/67/0, one shape crossing 4 slots at peak
> `scaleX 1.250`, resting inset-6 inside its slot, `will-change` present in flight and `auto` at
> rest, server HTML emitting `left:80%;width:20%` for RTL index 0, and the current tab still
> identifiable with scripting blocked. The 20th check — **FR-045, the wrapped group — FAILED** and
> was a genuine gap: `.group` had no `flex-wrap`, so the `corner` trip was unreachable. The worker
> has since added `flex-wrap: wrap`. **That fix is NOT re-measured**, because the probe route was
> retired with the gate run. T010 is marked done on the strength of the 19; re-prove the wrap before
> wiring ProductGallery or the variant chips.
>
> T016 (wire the dock) was done by the driver, not the worker, and verified on the live bar with a
> real touch tap: `/` → `/shop`, 16 distinct positions, peak `scaleX 1.250`.

## Dependencies & execution order

```
T001 T002 T003 ─┬─> T004..T009 ──> T010 ⛔ port gate ──┬─> T016..T024 (US2) ──> T025..T028 ⛔ degradation gate ──> T029..T040 (US3)
                │                                      │
                └─> T011..T015 (US1, independent) ─────┘─> T041..T046
```

- **US1 (T011–T015) needs nothing from Phase 2** — it is a deletion. It is dispatched and can finish first.
- **T010 is a hard gate.** Wiring a surface to an unproven port means debugging seven surfaces at once.
- **T028 is a hard gate.** Phase 6 must not start until degradation is proven on one surface.
- T015 depends on T013 (the geometry must have changed before the deck is re-measured).

### Parallel opportunities

- T001 and T002 (read-only baselines, different files).
- T004/T006/T007/T008 are one worker's unit; T005 is red-first against T004 so it cannot join them.
- T029–T034 are six surfaces in six different files — the widest parallelism in the feature, **but only after
  T028**, and each one's verify task belongs to whoever did not wire it.
- T035–T040 read-only verifications, parallelisable across workers.

## Implementation strategy

**MVP = Phase 3 alone** (T011–T015). The cart leaves the bar, the cart stays reachable, geometry is proven
unchanged. Shippable on its own, independently demonstrable, and it is already dispatched.

**Then the port, then the bar.** T004–T010 then T016–T024. At this point the feature does what the owner
asked in their first message, and it is a complete thing.

**Then the gate, then the spread.** T025–T028 decide whether the marker is allowed to leave the bar. If it
fails, the feature stops here with one honest surface rather than shipping seven that cannot degrade.

**Currently dispatched** 🤖: **qoder** owns T004–T008 (`012-PORT`); **opencode** owns T011 (`012-US1`).
Both are running under `.scratch/approve-012.sh`, which approves file edits and read-only inspection and
refuses destructive, git-mutating and bare-test commands.

## Notes

- **Never run bare `npm test` or bare `npx vitest run`.** `tests/setup.ts` is in `setupFiles` and `resetDb()`
  truncates nineteen tables in the real `hami_site_api` database. `npm run test:unit` only.
- **Never `git restore`, `git checkout --`, `git stash`, or `git add -A`.** Shared worktree; stage explicit
  paths. Feature 011's uncommitted brand-card work is parked and must not be swept up.
- **Do not restart `:3000` without announcing it** — shared restarts have already silently invalidated
  another agent's measurements.
- **The Vitest harness is node-only.** Any assertion about rendered geometry belongs in a `verification/`
  script against a real browser, not in a unit test. This is the same split feature 010 used.
- Feature **011 is parked** by the owner pending regenerated brand imagery. Nothing in this file touches
  `BrandRows.tsx`, `lib/brand-identity.ts` or the deck's CSS.
