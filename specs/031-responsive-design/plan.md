# Implementation Plan: Responsive Design Audit & Mobile Standards

**Feature**: `specs/031-responsive-design`  
**Date**: 2026-10-13  
**Spec**: [`specs/031-responsive-design/spec.md`](file:///home/lain/lain_projects/hami-site-2/HamiSite-basic-structure/specs/031-responsive-design/spec.md)  

---

## Summary

Audit and reinforce mobile-first responsive architecture across Hami Hamrah. Enforce zero horizontal overflow on compact 320px–390px screens, verify that interactive controls satisfy the 44×44px touch target requirement (WCAG 2.5.5 / 2.5.8), ensure universal adoption of CSS logical properties (`ms-*`, `me-*`, `start-*`, `end-*`) for seamless RTL reflow, and validate safe-area insets on notched devices.

---

## Technical Context

- **Framework**: Next.js 15, React 19 Client Components
- **Styling**: Tailwind CSS v4, CSS Logical Properties (`margin-inline`, `padding-inline`)
- **Testing**: Vitest (`vitest.frontend.config.ts`)
- **Target Breakpoints**: 320px (min mobile), 360px (standard phone), 768px (tablet), 1024px+ (desktop)

---

## Constitution Check

- **I. Veracity & Facts**: Responsive layouts display accurate shop information without hiding or truncating essential facts.
- **II. Reference Code Separation**: Production code only.
- **III. Local-First & Self-Hosted**: Preserves local font scaling and offline assets.
- **IV. Atmosphere & Aesthetics**: Preserves the luxury obsidian/champagne layout across all viewports.
- **V. Verification & Evidence**: Fully verified via automated test suite in `tests/unit/responsive-design.test.ts`.

---

## Project Structure & Deliverables

```text
specs/031-responsive-design/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── responsive-contract.md
└── checklists/
    └── requirements.md
```

### Remediation Targets:
- `components/layout/MobileDock.tsx`: Confirm 44×44px tap targets.
- `components/layout/Header.tsx`: Verify responsive breakpoints and padding.
- `tests/unit/responsive-design.test.ts`: Automated test suite for responsive invariants.
