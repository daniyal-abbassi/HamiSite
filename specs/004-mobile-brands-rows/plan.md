# Implementation Plan: Mobile Brands Row Presentation

**Branch**: `004-mobile-brands-rows` | **Date**: 2026-09-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-mobile-brands-rows/spec.md`

## Summary

Replace the homepage brands section with a mobile-first stack of six full-width brand rows, where exactly one
row at a time can hold emphasis and every row navigates on the first press. The emphasis treatment is a
surface change carrying that brand's mark, its Persian label, and — for three of the six — its existing
written story.

Technical approach: CSS-driven transition with a single animated row at a time, no continuous loops, and no
new dependency. Motion, emphasis and press semantics are bound to `005/FR-038` by `FR-032`.

**One prerequisite blocks acceptance and is not cosmetic:** all eleven brand and category links currently on
the homepage resolve to nothing and silently return the unfiltered catalog. See
[research.md](./research.md) D1 and [data-model.md](./data-model.md) §Brand identity.

## Technical Context

**Language/Version**: TypeScript ^5.5.4, React 19.2.8

**Framework**: Next.js 15.5.25, App Router. *(Note: `CLAUDE.md` states "Next.js 14" — the installed version
is 15.5.25. Documentation drift, not a blocker; flagged for correction.)*

**Primary Dependencies available**: Tailwind ^3.4.19 + tailwindcss-animate, GSAP ^3.15.0,
embla-carousel-react ^8.6.0, motion ^13.2.0, lucide-react. **No new dependency is approved by this plan.**

**Styling constraint**: GSAP is already used by `components/home/Reveal.tsx` via `IntersectionObserver` with a
`prefers-reduced-motion` guard. That is the established house pattern for scroll/entry motion and is reused
rather than replaced.

**Storage**: N/A — no writes. Brand content is static in `lib/content/home.ts`; product/brand truth comes from
`data/hami-products.json` through `lib/catalog.ts` (Principle III).

**Testing**: Vitest ^4.1.10, `environment: "node"`, `include: tests/**/*.test.ts`. **There is no DOM or
component test harness in this repository** — no testing-library, no jsdom. Component behaviour therefore
cannot be asserted by the current suite.

**Verification seam**: the running site observed in a browser, via the connected `browser-use` MCP
(navigate, snapshot, screenshot, evaluate_script, console/network inspection). This is the decision recorded
as D0 in the initiative decision sheet, and it is the only seam that can catch the defects this feature is
about — silent filter failure, RTL mirroring, focus visibility, layout shift under a thumb.

**Target Platform**: mobile browsers first; desktop derived. Persian, `lang="fa" dir="rtl"`.

**Project Type**: web application — frontend surface of an existing Next.js storefront.

**Performance Goals**: no dropped frames while emphasis transitions on a mid-range phone; page responsiveness
unchanged versus today with the section present; nothing animating while off screen.

**Constraints**: one animated element at a time; zero letter-spacing on Persian text (001/FR-057); no new
network requests introduced by this section; backend frozen (Principle III).

**Scale/Scope**: 6 rows, 1 homepage section, 1 destination route already exists (`/shop?brand=…`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate result | Notes |
|---|---|---|
| **I — Honest Interface** | **CONDITIONAL PASS — one real violation found** | The section's own premise fails today: `/shop?brand=apple\|samsung\|xiaomi` match no brand slug, so `ShopClient` omits `brandId` and renders **all 189 products** as if filtered. All eight `/shop?category=…` hrefs fail identically. A row that appears to work and shows the wrong inventory is exactly what Principle I bars. Fixing link resolution is therefore **in scope for this feature**, not a follow-up. Also satisfied: FR-027 leaves no brand visual invented, and the six selected brands all carry real products (49/42/30/3/1/23). |
| **II — Persian RTL by Default** | PASS, with obligations | Rows, index numerals, chevron direction and the expand control are authored right-to-left, not mirrored. Index numbers render in Persian digits (001/FR-011). No letter-spacing on Persian row labels (001/FR-057) — the reference's tight tracking is dropped. |
| **III — Static Data Seam / backend frozen** | PASS with a hard boundary | The link fix is implemented in the **client** layer (`ShopClient` slug resolution) and the **content** layer (`lib/content/home.ts`), never in `app/api/brands/route.ts` or `lib/catalog.ts`'s output shape. If a route change turns out to be unavoidable, that is a Principle III amendment and stops this plan. |
| **IV — Design Is Open** | PASS | No colour, typeface, radius, duration, easing or spacing value is fixed here. The reference's literal values (row heights, `px` sizes, viewport-relative type) are explicitly not adopted. |

**Gate decision: proceed.** The single Principle I violation is in scope and has a frontend-only remedy.

## Project Structure

### Documentation (this feature)

```text
specs/004-mobile-brands-rows/
├── plan.md                                  # this file
├── research.md                              # Phase 0 — 6 decisions with rationale
├── data-model.md                            # Phase 1 — row state, brand identity mapping
├── quickstart.md                            # Phase 1 — browser-verified validation script
├── contracts/
│   └── brand-row-behaviour.md               # Phase 1 — the observable UI contract
├── spec.md
└── checklists/requirements.md
```

### Source Code (repository root)

This feature modifies existing files and adds one component. No new top-level directory is created.

```text
components/home/
├── BrandShowcase.tsx        # MODIFY — the section being replaced (wordmark wall + story card)
├── BrandRows.tsx            # CREATE — the stacked row presentation
├── Reveal.tsx               # READ ONLY — house reduced-motion pattern to reuse
└── SectionHead.tsx          # READ ONLY — section heading, reused unchanged

components/brand/
└── BrandMarks.tsx           # EXTEND — the six real marks + Persian labels become row data

lib/content/
└── home.ts                  # MODIFY — brandWall / brandStories: correct the destination slugs

components/shop/
└── ShopClient.tsx           # MODIFY — brand slug→id resolution must fail loudly, not silently

app/(main)/
└── page.tsx                 # MODIFY only if the section is rewired
public/brand/                # untouched — existing marks stay as authored
data/, app/api/, prisma/     # FROZEN — Principle III
tests/                       # no additions possible; see Testing above
```

**Structure Decision**: single Next.js app, feature-local change. The brands section is one component
(`BrandRows.tsx`) plus a data correction in `lib/content/home.ts`. The link-resolution defect is fixed where
it is caused — `ShopClient`'s silent fallback — because a wrong-but-quiet filter is the failure mode, and
leaving it in place would let this feature ship broken links that look correct.

## Complexity Tracking

No Principle violations require justification. Two deliberate scope additions are recorded rather than
hidden, because both expand the feature beyond the literal spec text:

| Addition | Why required | Simpler alternative rejected because |
|---|---|---|
| Fix brand and category slug resolution in `ShopClient` | Principle I: a row that silently shows the wrong inventory is a false statement to a shopper, and FR-002 cannot pass without it | Shipping rows that link to known-broken destinations, or deferring to a "later cleanup" that the acceptance tests would fail on the first run |
| Report the eight category hrefs even though they belong to feature 005 | They are the same defect in the same function; fixing one brand path while leaving categories broken would leave the silent-fallback bug in place | Narrower diff, but the underlying failure mode survives and will recur on the next surface added |

## Post-Design Re-check

Re-run after Phase 0/1. **Still passing.** Principle I's violation is now specified as in-scope work with a
named file and a loud-failure contract in `contracts/brand-row-behaviour.md`; Principle III's boundary is
stated as a stop condition rather than an assumption. Phase 1 introduced no new dependency, no route change,
and no fixed visual value.

**Next**: `/speckit-tasks` to decompose. Recommend the slug-resolution fix be sequenced **first** — every
row's acceptance test depends on a destination that actually filters.
