# Feature Specification: Responsive Design Audit & Mobile Standards

**Feature Directory**: `specs/031-responsive-design`  
**Created**: 2026-10-13  
**Status**: Draft  
**Skill Reference**: `https://farsiui.ir/skills/responsive-design`  

---

## Executive Summary

Audit and reinforce **Responsive Design** standards across Hami Hamrah. Ensure strict mobile-first architecture (`sm:`, `md:`, `lg:`, `xl:`), complete elimination of horizontal scrolling regressions on 320px–390px viewports, minimum 44×44px touch targets on all mobile interactive controls (WCAG 2.5.5 / 2.5.8), full adoption of CSS logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) for seamless RTL reflow, and robust safe area insets on notched phones.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Zero Horizontal Overflow on Narrow Screens (Priority: P1) 🎯 MVP

As a phone shopper using a 360px or 390px device (or compact 320px screen), I want all catalog sections, tables, banners, and modals to fit within the viewport without horizontal wobble or accidental side-scrolling.

**Why this priority**: Unintended horizontal scroll is one of the most frustrating mobile usability flaws. It breaks gesture navigation, misaligns headers, and makes pages feel broken.

**Independent Test**: Load the storefront homepage, shop listing, and partner application at 360×800 and 320×568 viewports in DevTools; verify that `document.documentElement.scrollWidth === document.documentElement.clientWidth` and horizontal scrollbar is never present.

**Acceptance Scenarios**:
1. **Given** any storefront page (home, shop, product details, partners), **When** rendered at viewport widths from 320px to 428px, **Then** no elements cause horizontal overflow (`scrollWidth <= clientWidth`).
2. **Given** flex containers with long Persian titles or badges, **When** rendered on narrow screens, **Then** children have `min-w-0` and truncate gracefully without pushing container boundaries.
3. **Given** wide data tables or product comparisons, **When** rendered on mobile, **Then** they scroll inside isolated overflow containers without blowing out the page width.

---

### User Story 2 - Mobile Touch Targets & Hit Area Resilience (Priority: P1)

As a customer shopping on a mobile touchscreen, I want buttons, navigation tabs, inputs, and close icons to have at least 44×44px of tappable hit area so I never tap the wrong link or experience dead clicks.

**Why this priority**: Small buttons cause mis-taps, user frustration, and checkout drop-offs. WCAG 2.5.5 Level AAA and 2.5.8 Level AA require minimum 44×44px or 24×24px with clearance.

**Independent Test**: Inspect all touch controls in `Header.tsx`, `MobileDock.tsx`, `CartButton.tsx`, and modal close buttons; verify that the calculated computed size or hit target padding is at least 44×44px.

**Acceptance Scenarios**:
1. **Given** mobile dock tabs and header buttons, **When** inspected on mobile viewports, **Then** each item has `min-h-[44px]` and `min-w-[44px]` or adequate padding to guarantee 44×44px touch targets.
2. **Given** modal close buttons and remove items in cart, **When** tapped, **Then** the interactive surface spans at least 44×44px without encroaching on adjacent content.
3. **Given** form checkboxes and radio buttons, **When** tapped, **Then** the label and control share a single contiguous hit target.

---

### User Story 3 - CSS Logical Properties & RTL Fluidity (Priority: P2)

As a Persian user navigating right-to-left UI, I want all margins, paddings, and alignment properties to use CSS logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) so layouts reflow naturally without hardcoded left/right anomalies.

**Why this priority**: Hardcoded `ml-*` or `mr-*` classes break RTL flow, cause inverted margins, and lead to fragile responsive styles when elements reorder at breakpoints.

**Independent Test**: Audit CSS classes across components for physical directional properties (`ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`); confirm that directional margins and paddings map strictly to logical inline properties.

**Acceptance Scenarios**:
1. **Given** UI components with directional margins/paddings, **When** styled, **Then** classes use logical inline utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`) exclusively.
2. **Given** absolute positioning on badges or drawer anchors, **When** positioned, **Then** classes use `start-*` and `end-*` rather than `left-*` or `right-*`.
3. **Given** breakpoint shifts (e.g. `md:flex-row`), **When** adapting from column to row, **Then** inline spacing aligns naturally according to RTL reading order.

---

## Edge Cases & Defensive Constraints

- **Phone Notches & Home Indicators**: Mobile Dock and sheet footers must include `env(safe-area-inset-bottom)` to clear gesture bars on modern iOS/Android devices.
- **Fluid Font Sizing**: Persian headline text must use responsive clamp scaling (or responsive breakpoint sizes) to avoid line-breaking single short words onto new lines awkwardly.

---

## Requirements Checklist

- [ ] Zero horizontal overflow (`scrollWidth <= clientWidth`) on 320px, 360px, 390px, and 414px viewports.
- [ ] Minimum 44×44px touch targets on mobile interactive controls.
- [ ] No hardcoded physical directional classes (`ml-`, `mr-`) in shared UI components.
- [ ] Viewport fit cover enabled and safe-area insets applied to bottom docks and footers.

