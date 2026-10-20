# Feature Specification: UI Craft Rules & Quality Enhancement (041-ui-craft-rules)

**Feature Branch**: `041-ui-craft-rules`  
**Created**: 2026-10-18  
**Status**: Draft  
**Input**: User description: "use for enhancment https://farsiui.ir/skills/ui-craft-rules"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Storefront UI Craft, Touch Targets & Layout Stability (Priority: P1) 🎯 MVP

As a customer browsing Hami Hamrah on a mobile device (360px–390px viewport) or desktop, I want a visually stable, refined, and effortless shopping interface where images and cards load without layout jumps, touch targets are comfortable and responsive, and interactive controls never feel cramped, broken, or misaligned.

**Why this priority**: Layout shift and broken touch targets directly degrade shopper trust, increase cart abandonment, and violate both Constitution Principle IV ("million-dollar luxury experience") and WCAG/Core Web Vitals criteria.

**Independent Test**: Can be independently tested by inspecting public storefront views (Homepage, Shop listing, Product detail, Header) across 360px, 375px, 390px, and desktop viewports, verifying that every image has an explicit aspect ratio, all tappable controls meet >= 44×44px hit areas, and zero layout shift occurs during data/image loading.

**Acceptance Scenarios**:

1. **Given** a shopper on a 360px mobile viewport, **When** they view product cards, filters, and floating headers, **Then** no horizontal overflow, label collisions, or clipped text occurs, and all buttons/icons provide a minimum 44×44px interactive tap area.
2. **Given** slow or throttled network conditions, **When** product cards and hero media load asynchronously, **Then** space is reserved in advance using `aspect-ratio` or explicit dimensions, preventing layout jumps (Cumulative Layout Shift < 0.05).
3. **Given** product cards in grid or carousel views, **When** they render, **Then** they use consistent padding, radii, and border tokens from the design system rather than arbitrary one-off Tailwind pixel values.

---

### User Story 2 - Typography Scale, Semantic Color & Layout-Matched Skeletons (Priority: P2)

As a shopper reading product specifications, prices, and campaign rails, I want clear typographic hierarchy with natural Persian line heights, high-contrast readable text, deliberate semantic colors, and layout-matched skeleton loaders that teach me what content is about to appear.

**Why this priority**: Inconsistent type scales, poor line-heights, arbitrary hex colors, and generic spinning loaders make an AI-built storefront look unfinished, template-driven, and visually fatiguing.

**Independent Test**: Can be independently verified by inspecting typography and loading states: font sizes conform to a disciplined ~6-step scale, Persian body text maintains comfortable line heights (1.7–1.9) with zero letter spacing, colors derive from semantic theme tokens (`bg-background`, `text-foreground`, `text-muted-foreground`), and async loading renders layout-matched skeletons instead of generic spinners.

**Acceptance Scenarios**:

1. **Given** product details and descriptions, **When** rendered in Persian (`fa-IR`), **Then** typography uses the project's canonical Persian font (`Estedad` / `Vazirmatn`), line height is set by typography role (body ~1.7–1.9, headings ~1.2–1.4), and `letter-spacing` is 0 (no Latin-style uppercase or arbitrary tracking).
2. **Given** any component in light or dark theme, **When** rendering borders, backgrounds, and text, **Then** all styling uses semantic theme tokens (`border-border`, `bg-card`, `text-muted-foreground`) with no hardcoded hex codes or arbitrary one-off colors.
3. **Given** async content loading (such as product rails, category filters, or search results), **When** data is pending, **Then** a skeleton matching the final card dimensions and layout is displayed rather than an isolated spinning indicator.

---

### User Story 3 - Automated UI Craft Auditing & Agent Quality Guardrails (Priority: P3)

As a developer and engineering agent working on Hami Hamrah, I want automated diagnostic tools and explicit repository rules that detect and flag arbitrary styling, missing touch targets, unproportional icons, and missing aspect ratios before code is committed.

**Why this priority**: Without automated scanning and explicit agent instructions, future feature work will quietly reintroduce arbitrary Tailwind classes (`p-[13px]`, `text-[15px]`) and break visual discipline.

**Independent Test**: Running `node tools/craft/audit.mjs` scans frontend component files (`components/`, `app/`) and outputs a structured violation report categorizing arbitrary pixel values, missing image aspect ratios, and touch target risks against the 35-item UI Craft Done Checklist.

**Acceptance Scenarios**:

1. **Given** frontend source code in `app/` and `components/`, **When** `node tools/craft/audit.mjs` is executed, **Then** it scans for arbitrary Tailwind brackets (e.g. `p-[*]`, `gap-[*]`, `text-[*px]`), inline hardcoded hex colors, and missing `aspect-ratio` on images, reporting violations with file paths and line numbers.
2. **Given** the agent instruction files (`AGENTS.md` and `CLAUDE.md`), **When** reviewed, **Then** the UI Craft Rules agent block and the 35-item Done Checklist are recorded as binding constraints.
3. **Given** any development-only panel or debugging overlay, **When** packaged or built for production, **Then** it is strictly guarded with `process.env.NODE_ENV !== "production"` and never renders in production bundles.

---

### Edge Cases

- **Narrow Mobile Viewports (360px–375px)**: Persian product titles with compound brand names (e.g., «گوشی موبایل اپل مدل آیفون ۱۳ دو سیم کارت») must wrap gracefully without truncation ellipses that hide essential model storage or color details.
- **Directional Icons in RTL Portals**: Back/forward navigation chevrons, carousel arrows, and accordion expanders inside Radix/floating portals must point in the correct reading direction under `dir="rtl"` without double-reversing.
- **Icon Stroke Weight vs Typography**: Lucide icons displayed alongside regular body text must use `strokeWidth={1.5}` or `1.75`; icons next to bold headlines or primary buttons may use `strokeWidth={2}` to preserve visual balance.
- **Reduced Motion Preferences**: When a user's operating system requests `prefers-reduced-motion: reduce`, all transitions and micro-interactions must instantly complete without animated motion or stagger delays.
- **Touch Target Padding vs Visual Size**: An icon or close button may visually be 16×16px or 20×20px, but its effective hit area (`padding`, pseudo-elements, or wrapper) must measure at least 44×44px.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Storefront components MUST NOT use arbitrary Tailwind pixel values (such as `p-[13px]`, `text-[15px]`, `gap-[17px]`, `rounded-[11px]`) when existing design tokens and the 4px spacing scale cover the need.
- **FR-002**: Every image and media component MUST define an explicit `aspect-ratio` (e.g. `aspect-square`, `aspect-[4/3]`, `aspect-[16/9]`) or explicit `width` and `height` attributes to prevent layout shift during loading.
- **FR-003**: Every interactive button, selector, icon button, pagination control, and touch trigger MUST provide a minimum touch target area of 44×44px on mobile viewports.
- **FR-004**: Responsive layouts MUST be tested and verified at narrow mobile viewports (360px, 375px, 390px) with zero horizontal overflow, broken buttons, or clipped labels.
- **FR-005**: Typography MUST adhere to a disciplined ~6-step scale (e.g. 12, 14, 16, 20, 24, 32px), with role-based line heights (body ~1.7–1.9, headings ~1.2–1.4, buttons ~1.4–1.6) and zero letter spacing (`tracking-normal` / `0`) for Persian text.
- **FR-006**: Colors MUST derive from semantic theme tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-card`, `bg-primary`, `bg-accent`) rather than hardcoded hex codes or arbitrary palettes.
- **FR-007**: Each screen section MUST have at most one dominant visual accent, avoiding competing bright highlights or artificial gradients.
- **FR-008**: Icons MUST come from a single consistent icon library (Lucide), with icon size and stroke weight proportional to adjacent text.
- **FR-009**: Asynchronous data loading states MUST render layout-matched skeletons that mimic the final content structure rather than isolated spinning indicators.
- **FR-010**: Micro-interactions and motion MUST use named patterns (cross-fade, stagger 30–60ms, scale, slide) with durations between 150ms and 300ms, and MUST respect `prefers-reduced-motion`.
- **FR-011**: Content MUST use realistic Persian product copy, genuine numbers, and proper Persian currency/date formatting, strictly banning lorem ipsum and fake statistics.
- **FR-012**: An automated diagnostic audit tool (`tools/craft/audit.mjs`) MUST inspect storefront files and report arbitrary Tailwind classes, missing image aspect ratios, and touch target risks.

---

### Key Entities

- **CraftRule**: A codified UI quality standard defined in `ui-craft-rules` (e.g. `TOUCH_TARGET_MIN_44`, `NO_ARBITRARY_VALUES`, `RESERVE_ASPECT_RATIO`, `ONE_TYPE_SCALE`).
- **CraftAuditReport**: The structured JSON / terminal diagnostic report generated by the audit tool, detailing scanned files, rule violations, severity (`error` | `warning`), and line numbers.
- **LayoutMatchedSkeleton**: A loading component whose aspect ratio, padding, grid columns, and typographic placeholders exactly mirror the hydrated component to achieve zero CLS.
- **TouchTargetSpecification**: The geometry of an interactive control ensuring a minimum bounding box of 44×44px regardless of visible glyph dimensions.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of interactive controls (buttons, links, icon toggles, cart buttons, filter chips) on storefront screens measure >= 44×44px in clickable hit area.
- **SC-002**: Cumulative Layout Shift (CLS) on the public homepage and catalog listing remains <= 0.05 during initial and client-side data loads.
- **SC-003**: Zero instances of arbitrary Tailwind spacing (`p-[*px]`, `m-[*px]`, `gap-[*px]`) or arbitrary font sizes (`text-[*px]`) remain in audited storefront components.
- **SC-004**: All 63 Vitest unit test suites (608/608 tests) and TypeScript typechecks (`tsc --noEmit`) pass with 0 errors.
- **SC-005**: Running `node tools/craft/audit.mjs` completes in < 5 seconds and provides actionable line-by-line feedback with zero false positives on standard semantic utilities.

---

## Assumptions

- The project's existing Tailwind CSS configuration and theme tokens in `app/globals.css` provide the canonical token set for colors, spacing, and typography.
- The primary Persian font stack (`Estedad` and `Vazirmatn`) configured in Next.js layout is preserved as the single typographic foundation.
- Lucide React (`lucide-react`) is the single canonical icon library for the application.
- Development-only panels and debugging aids (if any) are strictly gated behind `process.env.NODE_ENV !== "production"`.
