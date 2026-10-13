# Implementation Plan: WCAG 2.2 Accessibility Compliance (دسترس‌پذیری و استاندارد WCAG)

**Branch**: `027-accessibility-compliance` | **Date**: 2026-10-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/027-accessibility-compliance/spec.md` and [FarsiUI Accessibility Compliance](https://farsiui.ir/skills/accessibility-compliance).

---

## Summary

Implement WCAG 2.2 Level AA accessibility compliance across Hami Hamrah's storefront, admin dashboard, and partner portal following FarsiUI standards. Key deliverables include:
1. Root skip-to-content links and high-contrast, unobscured `:focus-visible` styling indicators.
2. Reusable accessible dialog hooks (`useFocusTrap`) providing focus trapping, Escape key dismissal, and trigger restoration for all modals and drawers.
3. Persian accessible labels (`aria-label`, `.sr-only`) on all icon buttons, descriptive product image alt texts, and programmatic form error announcements (`aria-invalid`, `aria-describedby`, `role="alert"`).
4. WCAG 2.2 touch target compliance (>= 44×44px on mobile), contrast validation, and `prefers-reduced-motion` animation suppression.
5. Automated accessibility verification tests in Vitest.

---

## Technical Context

**Language/Version**: TypeScript 5.6+, Node.js 20+  
**Framework**: Next.js 15 (App Router, React 19)  
**Primary Dependencies**:
- Tailwind CSS (v4) with CSS variables and `@utility` focus classes
- Lucide React (`lucide-react`) for icons with `aria-hidden="true"`
- Custom lightweight React accessibility hooks (`useFocusTrap`, `useReducedMotion`)
**Storage**: N/A (Frontend structural and semantic enhancements only)  
**Testing**: Vitest (`npm run test:unit`) with DOM / React Testing Library checks  
**Target Platform**: All modern desktop & mobile browsers (Chromium, WebKit/Safari, Firefox) supporting screen readers (VoiceOver, TalkBack, NVDA)  
**Project Type**: Next.js E-Commerce Web Application (Storefront + Admin + Partner Portal)  
**Performance Goals**:
- Zero additional third-party runtime package overhead (< 1KB gzip custom hooks)
- 100% keyboard navigable without mouse
- Lighthouse Accessibility score >= 95  
**Constraints**:
- Must preserve Hami Hamrah's luxury dark aesthetic without harsh default browser outlines
- All accessible microcopy must be natural Persian (`fa-IR`)
- Strictly respect `prefers-reduced-motion`

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Honest Interface)**: PASS. Accessible labels and error announcements reflect accurate system states without fabricated feedback.
- **Principle II (Persian RTL by Default)**: PASS. All labels, skip links, and announcements are native Persian, supporting logical CSS navigation flow.
- **Principle III (Database-backed Storefront and Back Office)**: PASS. No database schema or runtime catalog changes needed.
- **Principle IV (Design Is Open — Luxury Is the Quality Bar)**: PASS. Focus indicators are intentionally styled with gold/amber luxury rings (`focus-visible:ring-amber-400`), elevating rather than degrading visual craft.

---

## Project Structure

### Documentation (this feature)

```text
specs/027-accessibility-compliance/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Technical research & WCAG 2.2 decisions
├── data-model.md        # Accessibility audit & state entities
├── contracts/           # Component accessibility standards & contracts
│   └── accessibility-audit-contract.md
├── checklists/
│   └── requirements.md  # Spec quality validation checklist
└── quickstart.md        # End-to-end validation scenarios
```

### Source Code Touched / Created

```text
app/
├── layout.tsx                                 # Root storefront skip-to-content landmark
├── globals.css                                # Global :focus-visible and prefers-reduced-motion rules
└── (tma)/layout.tsx                           # TMA accessibility shell

components/
├── common/
│   └── SkipLink.tsx                           # Reusable high-contrast skip link component
├── admin/
│   └── partners/
│       ├── PartnerApplicationModal.tsx        # Accessible dialog, focus trap, escape key, aria labels
│       └── PartnersAdminClient.tsx            # Accessible table headers, status badges, and search inputs
├── layout/
│   └── Header.tsx                             # Accessible icon buttons, search toggle, cart badge
└── ui/
    └── Dialog.tsx                             # Reusable accessible dialog container

hooks/
└── useFocusTrap.ts                            # Custom lightweight focus trap and escape listener hook

tests/
└── unit/
    └── accessibility-compliance.test.ts       # Automated Vitest accessibility compliance tests
```

---

## Implementation Roadmap

### Phase 1: Global Infrastructure & Focus Indicators
- Create reusable `SkipLink` and inject into `app/layout.tsx`.
- Update `app/globals.css` with global `:focus-visible` ring system and `scroll-margin` clearance.
- Add global `prefers-reduced-motion` animation silencing rule.

### Phase 2: Focus Management & Modal Trapping
- Implement `hooks/useFocusTrap.ts` with Escape dismissal, initial focus transfer, focus trap cycling, and trigger restoration.
- Apply `useFocusTrap` and WCAG dialog semantics to `PartnerApplicationModal.tsx` and admin drawers.

### Phase 3: Screen Reader Labels & Form Semantics
- Audit and add Persian `aria-label` to all icon-only buttons in `Header.tsx`, `AdminSidebar.tsx`, and storefront components.
- Associate form inputs with `<label>` tags and add `aria-invalid` / `role="alert"` live error containers in forms.

### Phase 4: Automated Testing & Verification
- Implement `tests/unit/accessibility-compliance.test.ts`.
- Run `npm run test:unit` and verify all tests pass.
- Execute quickstart scenarios in browser and record evidence.
