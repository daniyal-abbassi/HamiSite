# Implementation Plan: Mobile-First First-Screen Redesign

**Branch**: `044-mobile-first-redesign` | **Date**: 2026-10-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/044-mobile-first-redesign/spec.md`

## Summary

Rebuild the storefront's mobile first screen (390×844) to match the owner-approved mockup: a solid oxblood header carrying the official white logo lockup and four actions, the Telegram channel strip, a hero pairing the real Mashhad store photograph with the two-tone headline, two CTAs, and a 2×2 trust-facts grid with outlined circular icons — all composed over the owner-supplied silk-wave background artwork. Desktop keeps yesterday's approved presentation with no content or function regression; the wide silk banner is applied where it materially improves a desktop band.

## Technical Context

**Language/Version**: TypeScript 5.x on Next.js App Router (React 19), Persian RTL (`lang="fa"`, `dir="rtl"`)

**Primary Dependencies**: Tailwind CSS v4 tokens + `app/(main)/home.css` band styles, `next/image`, lucide-react icons, existing `GlassMenu` (`components/ui/liquid-glass.tsx`), existing button variants

**Storage**: No new storage. Catalog rails stay PostgreSQL/Prisma-backed (Constitution III). Trust facts live in the static verified-facts content source, extended with two owner-confirmed facts (2026-10-25).

**Testing**: `npm run typecheck`, `npm run build`, vitest frontend suite unchanged; visual acceptance via real-browser verification at 390×844 (mockup comparison), 360/430 spot checks, and 1280×800 desktop regression check — per the constitution's Definition of Done.

**Target Platform**: Responsive web, mobile-first (360–430px primary), desktop ≥1024px preserved.

**Performance Goals**: Hero photograph space fully reserved before load (no perceptible layout shift, CLS ≤ 0.05 per project craft rules); first screen interactive without scrolling.

**Constraints**: Honest Interface — only owner-confirmed facts render; official brand files used as supplied (CSS color inversion allowed, no redrawing); dev-server stale-build trap in CLAUDE.md (build is destructive to a running dev server — restart after).

**Scale/Scope**: One page's first screen (header, ticker, hero, CTAs, trust facts) plus homepage background system; shared header restyled on mobile only; other routes unchanged.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Honest Interface | PASS (with owner action recorded) | The mockup's «قیمت برد به برد» / «نمایندگی رسمی» were unverified claims until the owner confirmed them on 2026-10-25 (recorded in spec FR-007). Implementation MUST add them to the verified-facts source; no other new claims introduced. |
| II. Persian RTL by Default | PASS | All new layout uses logical properties; Persian numerals; Persian-first copy. |
| III. Database-backed Storefront | PASS | No catalog/data-layer changes; rails untouched. |
| IV. Design Is Open — Luxury Is the Quality Bar | PASS | Owner-approved mockup is the art direction; mobile is designed (not compressed); background artwork applied as one coherent brand surface. |

## Project Structure

### Documentation (this feature)

```text
specs/044-mobile-first-redesign/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── verified-facts.contract.md
├── mockups/             # Owner-approved art direction inputs (copied 2026-10-25)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
app/(main)/
├── page.tsx             # Hero markup: photo block, headline, CTAs, trust-facts grid
└── home.css             # Hero band background (silk), photo composition, trust-facts restyle, mobile header surface

components/
├── layout/Header.tsx    # Mobile header: solid oxblood bar, white logo lockup, four actions
├── layout/header-glass.css
└── discover-button.tsx  # Category GlassMenu trigger restyled for the oxblood surface (mobile)

lib/content/
└── verified-facts.ts    # Gains two owner-confirmed facts (priceMatch, officialDealership)

public/brand/            # hami-mark-alpha.png, hami-wordmark-fa.png (white-inverted via CSS on the oxblood bar)
public/store/shop-ai-relight.png   # Approved real store photograph (hero)
public/images/hero/      # Silk background artwork copied from specs mockups (mobile + wide banner)
```

**Structure Decision**: Single Next.js App Router project; all changes stay in the existing storefront layout, homepage band, and content modules — no new abstractions, no new dependencies.

## Complexity Tracking

> No constitution violations to justify. The one judged decision — composing the header logo from two alpha brand files with a CSS white inversion instead of a baked-background plate — is recorded in research.md (R2).
