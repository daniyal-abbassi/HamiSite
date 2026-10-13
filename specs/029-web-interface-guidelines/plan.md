# Implementation Plan: Web Interface Guidelines Compliance & Audit

**Feature**: `specs/029-web-interface-guidelines`  
**Date**: 2026-10-13  
**Spec**: [`specs/029-web-interface-guidelines/spec.md`](file:///home/lain/lain_projects/hami-site-2/HamiSite-basic-structure/specs/029-web-interface-guidelines/spec.md)  

---

## Summary

Audit and align Hami Hamrah's Next.js application with standard **Web Interface Guidelines** across accessibility, focus states, interactive forms, performance, typography, and motion safety. Remediate anti-patterns such as bare `outline-none` on interactive elements, unoptimized `transition-all` utilities, and unhandled paste restrictions, while establishing an automated unit test suite to enforce guidelines continuously.

---

## Technical Context

- **Framework**: Next.js 15 (App Router, React 19, Server & Client Components)
- **Styling**: Tailwind CSS v4, Vanilla CSS custom properties (`app/globals.css`)
- **Testing**: Vitest (`vitest.frontend.config.ts`), `@testing-library/react`
- **Language**: TypeScript 5.6 (Strict Mode)
- **Guidelines Source**: Vercel Labs / FarsiUI Web Interface Guidelines (`command.md`)

---

## Constitution Check

- **I. Veracity & Facts**: Auditing and fixing interface compliance preserves honest user-facing facts and creates zero fictitious data.
- **II. Reference Code Separation**: Changes are strictly applied to production code (`app/`, `components/`, `tests/`), leaving reference archives untouched.
- **III. Local-First & Self-Hosted Assets**: Self-hosted fonts and assets remain offline-safe.
- **IV. Atmosphere & Aesthetics**: Accessibility, contrast, and focus indicator standards harmonize with Hami Hamrah's signature champagne/obsidian visual palette.
- **V. Verification & Evidence**: Every remediated component and rule is validated via `tests/unit/web-interface-guidelines.test.ts`.

---

## Project Structure & Deliverables

### Design & Spec Artifacts
```text
specs/029-web-interface-guidelines/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── web-interface-contract.md
└── checklists/
    └── requirements.md
```

### Source Code Remediation Targets
- `components/ui/badge.tsx`: Fix bare `outline-none` with `:focus-visible` styling.
- `app/globals.css`: Verify focus indicator rings, safe-area insets, and reduced-motion overrides.
- `tests/unit/web-interface-guidelines.test.ts`: Automated test suite enforcing guidelines.
