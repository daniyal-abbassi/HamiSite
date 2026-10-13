# Implementation Plan: Next.js Multi Design System (پشتیبانی از چند دیزاین سیستم)

**Branch**: `028-nextjs-multi-design-system` | **Date**: 2026-10-13 | **Spec**: [specs/028-nextjs-multi-design-system/spec.md](spec.md)

**Input**: Feature specification from `specs/028-nextjs-multi-design-system/spec.md`

---

## Summary

Implement clean multi-design-system support for Hami Hamrah following the FarsiUI `nextjs-multi-design-system` architecture. The solution provides a single source of truth for design system mapping (`style-*`), eliminates flash of wrong theme (FOUC) through cookie SSR reading and an inline pre-paint blocking script, maintains orthogonal light/dark mode separation, and isolates component previews inside iframes.

---

## Technical Context

**Language/Version**: TypeScript 5.6+ / Next.js 15+ (App Router)  
**Primary Dependencies**: React 19, Tailwind CSS v3/v4 tokens, Lucide React, Motion  
**Storage**: Client cookies + `localStorage` for visual preference persistence  
**Testing**: Vitest (`vitest.frontend.config.ts`), Playwright for E2E / browser validation  
**Target Platform**: Desktop & mobile web browsers across modern operating systems  
**Project Type**: Next.js E-Commerce Full-Stack Storefront & Admin Back Office  
**Performance Goals**: Zero FOUC (<0ms style flash delay); switching theme updates styles in <50ms  
**Constraints**: Keep Hami Hamrah luxury dark obsidian/champagne as primary default; strictly logical CSS properties; no regression on existing commerce features  
**Scale/Scope**: Sitewide layouts (`app/layout.tsx`, `app/(main)/layout.tsx`, `app/(admin)/layout.tsx`, `app/(tma)/layout.tsx`), preview route/widgets  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Authentic Data & Catalog)**: Passes — The multi design system handles presentation and styling tokens; does not fabricate or modify any catalog or pricing data.
- **Principle II (RTL & Persian First)**: Passes — All design systems preserve RTL layout direction, Persian typography, and Estedad font metrics.
- **Principle III (Commerce & Checkout Seam)**: Passes — Payment, cart settlement, and Zarinpal transactions remain untouched.
- **Principle IV (Million-Dollar Perceived Luxury)**: Passes — Ensures Hami Hamrah's primary dark luxury aesthetic remains untouched as default (`style-nova`), while offering clean, deterministic token support for alternate styles (`style-vega`, `style-glass`).

---

## Project Structure

### Documentation (this feature)

```text
specs/028-nextjs-multi-design-system/
├── plan.md              # This file
├── research.md          # Technical research & architectural decisions
├── data-model.md        # Entities, registry map & state transitions
├── quickstart.md        # Verification and testing scenarios
├── contracts/
│   └── multi-design-system-contract.md # Cookie, bootstrap & preview contracts
└── checklists/
    └── requirements.md  # Quality validation checklist
```

### Source Code (repository root)

```text
lib/
└── design-system.ts     # Single source of truth: registry, resolver, cookie helper

components/
├── common/
│   ├── DesignSystemBootstrap.tsx # Pre-paint blocking script for FOUC prevention
│   └── DesignSystemPicker.tsx    # Interactive UI control to toggle active design system
└── preview/
    └── ComponentPreviewIframe.tsx # Isolated iframe renderer with embed support

app/
├── layout.tsx           # Injects cookie reading and DesignSystemBootstrap
└── (main)/
    └── preview/
        └── page.tsx     # Dedicated component preview route (?style=...&embed=1)

tests/unit/
└── multi-design-system.test.ts # Unit tests for resolver, cookies, and isolation
```

---

## Phases & Deliverables

1. **Phase 0: Outline & Research** — Complete ([research.md](research.md)).
2. **Phase 1: Design & Contracts** — Complete ([data-model.md](data-model.md), [contracts/](contracts/multi-design-system-contract.md), [quickstart.md](quickstart.md)).
3. **Phase 2: Tasks Breakdown** — To be executed via `/speckit-tasks`.
