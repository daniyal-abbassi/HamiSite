# Implementation Plan: Liquid Dock Navigation

**Feature**: `specs/012-liquid-dock-navigation` · **Branch**: `Hami-v3` · **Date**: 2026-09-27
**Spec**: [spec.md](spec.md) — 44 FRs, 11 SCs · **Checklist**: 16/16 · **Tasks**: [tasks.md](tasks.md)

## Summary

Two things the owner asked for, in that order: the cart leaves the mobile bottom bar, and the bar's selection
becomes one body that travels between destinations like the liquid-taffy reference does. The second then
spread — the owner's answer to "how far" was *"everywhere you can"*, so the marker becomes the storefront's
single answer to *"which of these is current"* on the seven surfaces that already ask it.

The reference turned out to be directly usable once its README's self-description was checked against its
files. `PillTabs` **is** the feature: a shared pill that GSAP carries between labels, squashing long and low
mid-flight, leaning into the direction of travel, and ringing back on an elastic. It is not installable —
`"private": true`, no `main`, no build — but it is MIT with the source present, so the files come in and are
adapted. That is the strongest available reading of "install it from GitHub", and it delivers the owner's
actual want: their code and its real motion, not my paraphrase.

The adaptation is where the work is. Upstream is a left-to-right, English, button-only demo on a demo stage
with a palette of its own. This is a right-to-left, Persian, link-based storefront with one palette and seven
surfaces. Nine requirements (FR-060 … FR-068) exist purely to keep that gap from being discovered mid-build.

## Technical Context

| | |
|---|---|
| Language | TypeScript 5, strict |
| Runtime | Node 24, Next.js 15.5 App Router, React 19.2 |
| Styling | Tailwind 3.4 + hand-written CSS blocks in `app/(main)/home.css`; **CSS Modules are new here** and Next supports them natively — keeping them preserves the ported component's fidelity and its comment-to-rule locality |
| Motion | `gsap` ^3.15 — already installed. **No new dependency** (FR-035) |
| Icons | `lucide-react` — already installed |
| Test | Vitest, **node environment only, no DOM harness**. Provable arithmetic goes in pure modules |
| Upstream | `.scratch/liquid-taffy/` (gitignored clone, MIT, © 2026 arknow91) |
| Files taken | `PillTabs.tsx`, `PillTabs.module.css`, `liquid/motion.ts` |
| Files refused | `sfx.ts`, `goo.ts`, `seam.ts`, `stretch.ts`, `springs.ts`, `squircle.ts`, `hues.ts`, `theme.ts`, `select.ts`, `IconMorph`, `RowHover`, `SelectionBurst`, `LiquidAdd`, `LiquidMenu`, `LiquidMorph` |

**The seven surfaces**, found by searching for controls that already publish a current/selected/pressed state —
a reproducible criterion, not taste:

| # | File | Kind | Marker means |
|---|---|---|---|
| 1 | `components/layout/MobileDock.tsx` | links, `aria-current="page"` | which page am I on |
| 2 | `components/layout/PillNav.tsx` | links, `aria-current="page"` | which page am I on (desktop) |
| 3 | `components/home/FeaturedProducts.tsx` | `role="tab"`, `aria-selected` | which product set |
| 4 | `components/shop/CategoryTiles.tsx` | links, `aria-current` | which department |
| 5 | `components/shop/ShopResults.tsx` | links, `aria-current="page"` | which results page |
| 6 | `components/shop/ProductGallery.tsx` | buttons, `aria-pressed` | which view of this product |
| 7 | `components/shop/ProductDetail.tsx` | buttons, option chips | which variant value |

`components/admin/AdminSidebar.tsx` asks the same question and is **excluded** — Constitution III freezes the
back office against frontend work.

## Constitution Check

*Gates active before design*

| Principle | Status | Note |
|---|---|---|
| I — Honest interface | **PASS** | The marker asserts nothing about stock, price or endorsement. The one honesty risk was the cart entry implying stock behind a brand; FR-002/FR-004 keep the cart reachable and its count visible rather than deleting evidence of it. |
| II — Persian RTL by default | **PASS, with a real hazard** | FR-061. The ported component positions with a physical `left`/`offsetLeft` and tweens a physical `x`. That combination is internally consistent; mixing logical positioning into the same row is not. Must be proven on a rendered `dir="rtl"` page, not argued. |
| III — Static data seam | **PASS** | No catalog, API or DB read. `brand-counts`/`catalog` untouched. |
| IV — Luxury is the quality bar | **PASS, and this is the reason for the feature** | "Interactions, hover states, transitions … MUST receive the same level of design attention as static layouts." A travelling body with squash, lean and elastic settle is that attention. FR-063 is the load-bearing line: the marker wears *this* site's tokens or it reads as pasted-in. |

*Constraint check — "prefer editing an existing component over a new dependency"*: **PASS.** Zero dependencies
added. The new files are a port the owner explicitly instructed, not an abstraction someone reached for.

*Constraint check — `docs/inspires/` must not be installed, built or run*: **PASS, and worth stating
plainly.** That clause governs a specific vendored directory, not this instruction; the owner named a GitHub
URL and told me twice to use it. The distinction is recorded here so this plan is not read as precedent for
installing anything else from `docs/inspires/`.

### Post-design re-check

**No violations.** Two things the design deliberately declined, both recorded rather than quiet:

- **FR-034 costs the ported component a line of its own CSS.** Upstream leaves `will-change: transform` on
  the marker permanently. That is one layer on a demo stage and seven-plus on a shop page, so the hint is
  applied only while a trip is in flight.
- **The metaball filter is not adopted**, even though it is what "liquid" usually means. `PillTabs` never
  uses `goo.ts` — its liquidity is pure transform. Taking the filter would have added per-frame rasterisation
  to seven surfaces for a look they do not need.

## Project Structure

### Documentation (this feature)

```
specs/012-liquid-dock-navigation/
├── spec.md                     44 FRs, 11 SCs, 4 stories
├── plan.md                     this file
├── research.md                 the eight decisions, with what was verified
├── tasks.md                    T001 … T0NN
├── checklists/requirements.md  16/16
├── notes/jev-advisory.md       the checkpoint run, both dissents, the defect it caught
└── verification/               measurement scripts and their output
```

### Source code (repository root)

```
components/liquid/                      NEW — the port, one implementation (FR-040)
├── LiquidSelection.tsx                 the marker + the row it travels in
├── liquid-selection.module.css         geometry and colours, on this site's tokens
├── selection-geometry.ts               PURE: slot measurement → {x, width, lean sign, same-slot bail}
├── motion.ts                           prefers-reduced-motion, one implementation
└── UPSTREAM.md                         licence, attribution, what was taken and refused

components/layout/MobileDock.tsx        US1 removes the cart entry; US2 wires the marker
components/layout/PillNav.tsx           US3 — replaces its own rising circle
components/home/FeaturedProducts.tsx    US3
components/shop/CategoryTiles.tsx       US3
components/shop/ShopResults.tsx         US3 — the long-distance case (FR-046)
components/shop/ProductGallery.tsx      US3 — the wrapping case (FR-045)
components/shop/ProductDetail.tsx       US3 — wrapping, and three groups on one product

tests/unit/selection-geometry.test.ts   pure arithmetic, node env
tests/unit/liquid-selection.test.ts     port invariants
```

**Nothing under `data/`, `app/api/`, `prisma/`.** `CartProvider`, `CartButton`, `CartDrawer` and
`app/(main)/cart/page.tsx` are **not** touched — the cart keeps its page, its drawer and its header control.

## The design, in the four decisions that matter

**1. One component, seven configurations.** `LiquidSelection` takes items, the current id, a callback, and
whether the items are links or buttons. It renders the marker itself and never lets a consumer draw one.
Every surface that ends up with its own travel code is a failure of FR-040, and the form most likely to be
argued past review is "looks the same but written separately" — so the check is file count, not appearance.

**2. The marker's meaning is fixed, and that is what killed the drag.** On this site the marker means *"where
you are"*. Upstream's grab-and-pull makes it briefly mean *"where you might go"*. On the primary navigation
control those must not be the same object, so press deforms and travel happens on navigation, never on a
preview (FR-012a). The reference's own "two halves that cannot disagree" principle is what FR-016 enforces:
marker colour and active label colour from one source.

**3. Motion is the whole effect; the filter is not.** Scale, skew, an elastic settle and a width that tweens
alongside x. No blur, no SVG filter, no per-frame rasterisation. This is the single most consequential thing
reading the source instead of the README produced: three requirements (FR-030, FR-031, FR-034) were written
against a cost the adopted component does not have.

**4. Honest degradation is a gate on the rollout, not a follow-up.** The bar must show the current
destination with scripting blocked, with reduced motion, and if the effect throws. Spreading an effect that
cannot degrade across seven surfaces multiplies one defect into seven, so User Story 4's four scenarios pass
on the bar **before** any other surface adopts it.

## Complexity Tracking

No gate violations, so this section records the two risks that are real instead.

| Risk | Why it is real | Mitigation |
|---|---|---|
| **Dock geometry is load-bearing for another feature** | The stacking-card deck's per-card height budget subtracts the dock's bottom inset as a constant, established in feature 008. A few pixels here silently invalidates that gate. | FR-018 / SC-006 pin both values. `specs/008-brands-stacking-cards/verification/measure-deck.mjs` re-runs after any dock change. |
| **The ported component tweens `width`, which is layout** | Upstream's own comment: a flurry of clicks "piles up synchronous reflows". It mitigates per-pill with `killTweensOf`; nothing bounds it across seven surfaces. | FR-033 (at most one travelling anywhere), FR-031 (state how many layout-writing elements can be mid-trip), and the same-slot bail-out kept per FR-068. |

**Not a risk, and said so to stop someone re-litigating it:** the reference's sound is refused outright
(FR-042). It is one import and one call site, so refusing it costs nothing and is not a compromise.
