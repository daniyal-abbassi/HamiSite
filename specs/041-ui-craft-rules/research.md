# Research: UI Craft Rules & Quality Enhancement (041-ui-craft-rules)

**Date**: 2026-10-18  
**Feature**: [spec.md](spec.md)  
**Status**: Completed  

---

## 1. Technical Context & Foundations

- **Language / Runtime**: TypeScript 5.x, Node.js >= 20.x, React 19 / Next.js 16 (App Router).
- **Styling Architecture**: Tailwind CSS 3.4 / 4.x, CSS variables for design system tokens (`style-*` body classes, `--radius`, `--background`, `--foreground`, etc.).
- **Typography**: Dual Persian font stack (`Estedad` and `Vazirmatn`), loaded via `next/font` with RTL direction and zero letter-spacing.
- **Icon System**: Lucide React (`lucide-react`) as the single icon provider across all storefront and admin components.
- **Testing**: Vitest fast unit testing (63 test suites, 608 tests), Playwright for visual and browser tests.

---

## 2. Research Dimensions & Decisions

### Dimension 1: Touch Target Discipline (44×44px Min Hit Area)

- **Problem**: Small icon buttons (cart toggles, carousel chevrons, close triggers, filter badges) frequently measure 24px–32px visually, causing mis-taps on mobile devices (360px–390px).
- **Decision**: Keep the visible icon or glyph compact (e.g. 16px–24px) while expanding the interactive hit area using utility classes (`p-2.5`, `min-h-[44px] min-w-[44px]`, `relative before:absolute before:-inset-2`).
- **Rationale**: Complies with WCAG 2.2 Success Criterion 2.5.8 (Target Size - Minimum) and Apple/Google Human Interface Guidelines without requiring oversized visible controls.
- **Alternatives Considered**: Enlarging all visual button icons to 44px (rejected: makes headers and chips visually loud and clumsy).

---

### Dimension 2: Space Reservation & Layout Shift (CLS <= 0.05)

- **Problem**: Async images in product grids, carousel slides, and hero banners cause visible layout reflows as images decode and hydrate.
- **Decision**: Enforce explicit aspect ratio classes (`aspect-square`, `aspect-[4/3]`, `aspect-[16/9]`) or explicit `width`/`height` on all image containers and Next.js `<Image />` tags.
- **Rationale**: Setting `aspect-ratio` on parent wrappers guarantees the browser allocates the exact container height before network requests finish, eliminating layout shift.
- **Alternatives Considered**: Relying solely on `next/image` automatic dimensions (insufficient for dynamic responsive grid wrappers where image sizes adjust to fluid column widths).

---

### Dimension 3: Typography Scale & Line-Height Role Discipline

- **Problem**: Ad-hoc font sizes (e.g. `text-[13px]`, `text-[15px]`, `text-[17px]`) and uniform line-heights make Persian text either cramped (headings colliding with ascenders/descenders) or excessively loose in cards.
- **Decision**:
  - Enforce a 6-step type scale: `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-xl` (20px), `text-2xl` (24px), `text-3xl` (30–32px).
  - Role-based line heights: Persian body copy: `leading-relaxed` (1.7–1.9); Headings: `leading-tight` (1.2–1.3); Buttons/badges: `leading-snug` (1.4–1.5).
  - `letter-spacing: 0` (`tracking-normal`) across all Persian text.
- **Rationale**: Persian cursive glyphs require vertical clearance for dots and diacritics; letter-spacing disconnects cursive connections.

---

### Dimension 4: Layout-Matched Skeletons vs Generic Spinners

- **Problem**: Isolated spinners (`<LoadingSpinner />`) fail to communicate what structure is loading, leading to cognitive friction.
- **Decision**: Replace isolated spinners in product grids and rails with layout-matched skeleton components (`ProductCardSkeleton`, `OfferRailSkeleton`) using the project's standard `Skeleton` primitive.
- **Rationale**: Teaches the shopper what is about to appear and preserves visual continuity during streaming.

---

### Dimension 5: Automated UI Craft Auditing Scanner (`tools/craft/audit.mjs`)

- **Problem**: Manual reviews miss sporadic arbitrary Tailwind classes (`p-[13px]`, `text-[15px]`) or missing touch target padding.
- **Decision**: Provide a zero-dependency Node.js CLI script (`tools/craft/audit.mjs`) that parses `.tsx` and `.jsx` files in `components/` and `app/`, reporting:
  - Arbitrary pixel values in Tailwind (`\[\d+px\]`).
  - Images missing `aspect-` or explicit width/height.
  - Interactive buttons with touch targets < 44px.
  - Hardcoded hex codes (`#[0-9a-fA-F]{3,8}`).
- **Rationale**: Fast (< 2 seconds), runs locally or in CI, provides immediate actionable feedback without heavy external dependencies.

