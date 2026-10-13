# Feature Specification: Next.js Multi Design System (پشتیبانی از چند دیزاین سیستم)

**Feature Directory**: `specs/028-nextjs-multi-design-system`  
**Created**: 2026-10-13  
**Status**: Draft  
**Input**: User request: "check, install(CLI) and implement this: https://farsiui.ir/skills/nextjs-multi-design-system"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi Design System Style Isolation & Token Scoping (Priority: P1) 🎯 MVP

As an administrator, developer, or shopper experiencing Hami Hamrah, I want the application to cleanly support distinct, isolated Design System appearances (such as the default luxury obsidian/champagne theme, a clean comfort/light theme, or a glass/aether theme) through deterministic scoped root styling without token collision or style leakage.

**Why this priority**: When an application introduces multiple design themes or allows switching between visual styles, CSS tokens and typography must be strictly isolated to avoid conflicting variable definitions or partial style corruption across views.

**Independent Test**: Switch between available design system styles or assign distinct style classes to different route groups (e.g. storefront vs admin vs TMA vs component preview). Verify that only one active `style-*` class exists on the document root at any given time, and that tokens resolve exclusively from the active design system scope.

**Acceptance Scenarios**:

1. **Given** the application root, **When** a design system style is active (e.g., `style-nova` for default luxury dark, `style-vega` for comfort/warm light, or `style-glass` for fluid glassmorphism), **Then** exactly one `style-*` class is attached to the body or designated root element.
2. **Given** any component consuming CSS variables or design tokens, **When** styled under an active design system, **Then** colors, radii, borders, and typography derive strictly from the active design system's variables without leaking values from inactive themes.
3. **Given** a user changes or toggles the active design system, **When** the change applies, **Then** previous `style-*` classes are stripped before the new class is added, preventing multiple competing design system classes.

---

### User Story 2 - SSR Persistence & FOUC Prevention (Priority: P1)

As a user loading or refreshing any page with a customized or route-specific design system, I want the correct design system styling to be rendered immediately on the server and painted without a flash of unstyled content (FOUC) or hydration mismatch errors.

**Why this priority**: Flashing the wrong design system during initial paint creates an unpolished, flickering experience that undermines brand trust. Server-side persistence via cookies coupled with pre-paint bootstrap guarantees instant visual consistency.

**Independent Test**: Set a custom design system in cookie/localStorage, perform a hard browser reload, and observe first-paint behavior. Verify that the server sends the correct `style-*` class in the initial HTML response and that an inline blocking bootstrap script ensures zero FOUC before paint.

**Acceptance Scenarios**:

1. **Given** an active design system preference stored in a cookie, **When** Next.js renders the root layout on the server, **Then** the initial HTML output includes the corresponding `style-*` class on the `<body>` element.
2. **Given** a client browser where `localStorage` holds the design system preference, **When** the page loads, **Then** a blocking inline script at the top of the body syncs `localStorage` into cookies and updates `body.classList` prior to the first visual paint.
3. **Given** React hydration occurs, **When** client components mount, **Then** no React hydration mismatch warnings or layout shifts occur due to style class synchronization.

---

### User Story 3 - Orthogonal Light/Dark Mode Coexistence (Priority: P2)

As a user browsing under any selected design system, I want the system's light/dark mode preference (`light`, `dark`, or `system`) to operate orthogonally to the chosen Design System, so that switching color modes does not corrupt or reset the design system theme.

**Why this priority**: Design Systems define visual geometry, typography, and aesthetic identity (e.g., luxury obsidian, modern minimal, or soft glass), while light/dark modes adjust brightness/contrast. They must operate as orthogonal axes without overwriting each other.

**Independent Test**: Activate a specific design system (e.g., `style-vega` or `style-glass`), then toggle the dark/light mode toggle. Verify that the `style-*` class remains intact on `body` while `class="dark"` or `class="light"` toggles smoothly on `html`.

**Acceptance Scenarios**:

1. **Given** an active design system on `<body>`, **When** the user toggles dark or light mode, **Then** the `dark` or `light` class updates on `<html>` while the `style-*` class on `<body>` is preserved.
2. **Given** a design system with dark-default traits (e.g., Hami Hamrah's signature obsidian palette), **When** initialized, **Then** the user's prior mode choice is stored so they can explicitly choose light mode without being permanently locked into dark.
3. **Given** automated system theme changes (`prefers-color-scheme`), **When** the OS switches theme, **Then** the design system tokens adapt their surface lightness without altering the active design system layout rules.

---

### User Story 4 - Isolated Component Previews & Iframe Synchronization (Priority: P2)

As a developer or admin viewing component showcases, demo blocks, or partner widgets embedded within an iframe, I want the preview document to load its own isolated design system context and synchronize cleanly with parent theme controls.

**Why this priority**: Iframes represent completely separate browser documents that cannot inherit React context from parent windows. Previews must be self-contained, receiving the active design system via URL parameters, cookies, or remount keys.

**Independent Test**: Load an embedded component preview route (`/preview/...` or `?embed=1`) within an iframe. Change the design system on the parent controller. Verify that the iframe re-renders with the exact same design system and tokens without layout leakage.

**Acceptance Scenarios**:

1. **Given** an embedded component preview inside an iframe, **When** rendered, **Then** the preview document applies its own independent `style-*` class and CSS token sheet matching the specified theme.
2. **Given** an embed URL with query parameter `?style=...` or route segment `/view/[style]/[component]`, **When** loaded, **Then** the preview renders cleanly without site navigation chrome (`embed=1` mode).
3. **Given** the parent picker updates the active design system, **When** the state changes, **Then** the iframe is updated or remounted with the new style key, ensuring 100% visual parity between parent and preview.

---

## Functional Requirements *(mandatory)*

- **FR-001**: Single Source of Truth — The system MUST maintain a centralized registry mapping Design System identifiers (e.g., `default`, `comfort`, `glass`) to corresponding unique root classes (e.g., `style-nova`, `style-vega`, `style-glass`).
- **FR-002**: Root Class Isolation — Only one `style-*` class MUST be active on the root document element at any time; applying a new design system must strip all other `style-*` classes.
- **FR-003**: Server-Side Persistence — The active design system MUST be readable on the server via an HTTP cookie (e.g., `design-system-preview` or `hami-design-system`), enabling SSR injection into the initial HTML document.
- **FR-004**: Pre-Paint FOUC Prevention — A blocking inline bootstrap script MUST execute at the very start of the `<body>` element to synchronize client preferences from `localStorage` to cookies and classList before the browser paints.
- **FR-005**: Orthogonal Mode Separation — Design System style (`style-*`) MUST be attached to `<body>`, while color mode (`light` / `dark`) MUST reside on `<html>`, preventing collision between visual style and contrast mode.
- **FR-006**: Embedded Preview Isolation — Component preview routes MUST support standalone embed mode (`embed=1`) that accepts the active design system parameter and renders isolated preview documents.
- **FR-007**: Hydration Safety — The synchronization mechanism MUST avoid causing React hydration mismatch errors between server-rendered HTML and client hydration.

---

## Success Criteria *(mandatory)*

- **SC-001**: **Zero Flash of Wrong Theme (FOUC)**: On initial page load or hard refresh, 100% of page renders display the active design system on first paint with zero momentary flickering or style resets.
- **SC-002**: **Hydration Parity**: 0 React hydration mismatch warnings logged in the browser console when loading any page with a saved design system preference.
- **SC-003**: **Deterministic Style Switching**: Switching design systems updates all token variables across the viewport in under 50ms without requiring a full page refresh.
- **SC-004**: **Preview Visual Parity**: Component previews rendered in iframes achieve 100% visual token parity with the parent shell's active design system.
- **SC-005**: **Quality Gate Compliance**: All automated unit tests pass (`npm run test:unit`) and TypeScript compiles with 0 errors (`npm run typecheck`).

---

## Assumptions & Boundaries

- **Assumptions**:
  - Hami Hamrah's primary storefront theme remains the signature obsidian/champagne luxury aesthetic (`default` / `style-nova`).
  - Additional design systems (e.g., `style-vega` for comfort/warm light, `style-glass` for fluid transparency) coexist as switchable or previewable styles without breaking existing e-commerce functionality.
  - The browser supports modern cookie and localStorage APIs.
- **Boundaries**:
  - Does NOT alter backend commerce transactions, database models, or Zarinpal payment logic.
  - Does NOT replace Tailwind CSS or the existing Estedad font family.

