# Research: Next.js Multi Design System Architecture

**Feature**: `specs/028-nextjs-multi-design-system`  
**Date**: 2026-10-13  
**Status**: Completed  

---

## Technical Context & Decisions

### 1. Design System Registry & Scoped Root Classes

- **Decision**: Define a single source of truth in `lib/design-system.ts` mapping design system keys to root CSS classes:
  - `default` / `nova` → `style-nova` (Hami Hamrah luxury dark obsidian/champagne)
  - `comfort` / `vega` → `style-vega` (clean comfort warm light / platinum)
  - `glass` / `aether` → `style-glass` (fluid obsidian glassmorphism)
- **Rationale**: Storing the registry in a central TypeScript module allows both Server Components (e.g. root `layout.tsx`) and Client Components (theme picker, bootstrap script) to share identical definitions without drift.
- **Alternatives Considered**:
  - CSS-only data attributes (`data-theme`): Works for simple colors, but classes (`style-*`) allow Tailwind `@custom-variant` or standard ancestor selectors (`.style-vega .lux-card`) to modify typography, borders, and geometry simultaneously.

---

### 2. SSR Persistence & FOUC Prevention Mechanism

- **Decision**: Implement a two-tier synchronization model:
  1. **Server-Side Render (SSR)**: Read `cookies()` in Next.js Server Components / layouts and apply the resolved `style-*` class to the initial `<body>` tag.
  2. **Pre-Paint Blocking Bootstrap**: Place an inline synchronous `<script>` as the immediate child of `<body>` that reads `localStorage.getItem("design-system-preview")`, falls back to cookies, strips existing `style-*` classes, and applies the active class before the browser paints.
- **Rationale**: Waiting for React hydration causes visible FOUC (flash of unstyled content). A blocking inline script executes synchronously prior to rendering tree layout, guaranteeing zero flicker even if the server cookie was absent on the first visit.
- **Alternatives Considered**:
  - `useEffect` after mount: Causes jarring theme flash (FOUC) and layout recalculations.
  - Full page hard reload on theme switch: Degrades UX for administrative previews and live showcases.

---

### 3. Orthogonal Light/Dark Mode Coexistence

- **Decision**: Separate the Design System dimension (`style-*` on `<body>`) from the brightness dimension (`dark` / `light` on `<html>`).
- **Rationale**: An e-commerce user may want a minimal/clean design system (`style-vega`) in dark mode, or the luxury design system in high-contrast light mode. Keeping the mode toggle on `<html>` and the design system on `<body>` guarantees they never overwrite each other's classes.
- **Alternatives Considered**:
  - Embedding light/dark into the design system name (`vega-dark`, `vega-light`): Leads to combinatorial explosion of classes and complicated state management.

---

### 4. Component Preview & Iframe Document Synchronization

- **Decision**: Provide an isolated preview route (`/preview/[style]/[component]` or `/preview?style=...&embed=1`) where the iframe loads as a standalone document with its own `style-*` root class, remounted via `key={activeStyle}` upon parent picker change.
- **Rationale**: Iframes do not share React context with parent windows. Passing the active style in the URL ensures that SSR renders the preview with the exact tokens requested, avoiding cross-window DOM manipulation.
- **Alternatives Considered**:
  - `postMessage` sync without URL parameter: Loses state on iframe reload, causes FOUC inside the iframe, and breaks deep linking.

