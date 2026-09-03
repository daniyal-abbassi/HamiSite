# HAMI Design System

> Inspired by the Contentsquare design-system skill
> (`.claude/skills/design-system/SKILL.md`). Its **methodology** — semantic
> tokens, full component state matrices, WCAG 2.2 AA, testable acceptance
> criteria — is adopted in full. Its **literal Contentsquare palette and
> Inter typography are deliberately NOT adopted**: the HAMI brand DNA
> (wine RAL 3004 + champagne, Vazirmatn/DM Mono) is the source of truth per
> `CLAUDE.md` and `docs/inspires/HamiHamrah-DNA-Brand-Color/`.

## 1. Context and goals

- Persian/RTL storefront, editorial visual language, dark burgundy default
  theme with warm-paper (`.light`) surfaces for forms and light chapters.
- Goals: one consistent token system across home/shop/partners; every
  interactive component implements the complete state matrix; accessibility
  is testable, not aspirational; no one-off visual exceptions.

## 2. Design tokens and foundations

### Color (semantic — never raw hex in components)

| Token | Value | Use |
|---|---|---|
| `background` | `#640211` wine RAL 3004 | page base (dark theme) |
| `card` | `#51030f` | elevated surfaces |
| `foreground` | `#f4efe8` | primary text |
| `primary` / `champagne` | `#d4af6a` (+ `champagne-light #f0d9ab`) | accent, CTAs, focus ring |
| `wine-dark` / `wine-ink` | `#42040d` / `#280107` | image wells, overlays |
| `destructive` | `#e5484d` | errors, destructive actions |
| `paper` (+ `deep`) | `#f2f4ed` / `#e9e2d8` | `.light` surfaces |
| `border` | champagne hairline @ 15% | default borders |

**Contrast rule (must):** meaningful text on `card` uses
`text-foreground/60` or stronger; `/55` is the absolute floor for small
text (≈4.6:1). `/45` and below are reserved for decorative `aria-hidden`
glyphs only. Champagne text on wine passes as large/bold accent text.

### Typography

- Sans: Vazirmatn (`--font-vazirmatn`); Mono: DM Mono (`--font-dm-mono`)
  for editorial labels (`HAMI / SHOP`, section indexes).
- Scale: editorial headings `text-3xl/4xl/5xl font-black tracking-tight`;
  body `text-sm leading-7/8`; UI labels `text-xs font-bold`;
  mono eyebrows `text-[9px]–[10px] tracking-[0.08–0.14em]`.

### Spacing, radius, elevation, motion

- Spacing: Tailwind scale; section rhythm `py-20`, card padding `p-4`–`p-8`.
- Radius: `rounded-sm` (2px) everywhere — sharp editorial corners; `rounded-full`
  only for dots/pills.
- Elevation: `shadow-card` (default), `shadow-seal` (hero frames) — no other shadows.
- Motion (must use tokens, no arbitrary durations):
  - `duration-instant` 100ms — color/opacity micro-feedback
  - `duration-fast` 150ms — hovers, toggles, reveals of small surfaces
  - `duration-normal` 220ms — default for unqualified `transition-*`
  - `duration-slow` 300ms — card lift, image zoom, large transforms
  - Signature curve: `cubic-bezier(0.23, 1, 0.32, 1)` (Tailwind DEFAULT).

## 3. Component rules — anatomy, variants, states

**State matrix (must):** every interactive component implements
`default / hover / focus-visible / active / disabled / loading / error`.
Non-interactive surfaces (Card, Badge) declare N/A states explicitly.

### Button (`components/ui/button.tsx`)
- Variants: `default` (champagne), `wine`, `outline`, `secondary`, `ghost`,
  `paper`, `link`, `destructive`. Sizes: `sm | default | lg | icon`.
- States: hover (variant-defined), focus-visible (global champagne ring),
  `active:translate-y-px`, `disabled:opacity-50 pointer-events-none`,
  `loading` prop → spinner + `aria-busy` + disabled.
- Acceptance: keyboard-operable; `aria-busy` present while loading.

### Input (`components/ui/input.tsx`)
- States: hover border lift, focus-visible ring, disabled, `aria-invalid`
  → destructive border + ring (error state), placeholder `/muted-foreground`.
- Acceptance: label associated via `htmlFor`; error text `role="alert"`.

### Product card (grid + list)
- Anatomy: media well (`bg-wine-dark/40`, badge, favorite), brand eyebrow,
  title link, category, compare-at + price, stock dot + label, CTA.
- States: card hover lift + image zoom (`duration-slow`), favorite pressed
  (`aria-pressed`), loading = Skeleton, empty & error states defined.

### Filter controls (sidebar, selects, toggles)
- All state lives in the URL; every control is `aria-pressed`/`aria-checked`
  labelled; active state = champagne border + tint; "clear all" always
  reachable.

### Forms (PartnerForm)
- Field wrapper: label + required mark + inline error `role="alert"`.
- File fields: dashed champagne drop zone, filename + size preview, remove
  action, client-side MIME/size validation mirroring the server.

## 4. Accessibility requirements (testable acceptance criteria)

1. Focus must be visible on every interactive element (global
   `:focus-visible` champagne ring) — test by tabbing through each page.
2. All meaningful text must meet WCAG 2.2 AA contrast (4.5:1 normal,
   3:1 large) — test with a contrast checker against blended colors.
3. Icon-only controls must carry `aria-label`; stateful controls expose
   `aria-pressed`/`aria-checked`/`aria-current`/`aria-busy`.
4. Async regions announce politely (`aria-live="polite"` on result counts,
   `aria-busy` on loading containers, Skeleton placeholders during fetch).
5. Forms: errors reference their field, are announced, and block submit.
6. Touch targets ≥ 32×32px; keyboard order follows visual order (RTL-aware
   logical properties `start/end`, `ms/pe` only — no physical `left/right`).

## 5. Content and tone standards

- Persian copy: concise, confident, customer-respectful; no exclamation
  stacking. Numbers render via `toFaDigits`/`fa-IR` locale.
- Mono English eyebrows are archival labels (`HAMI / CAMPAIGN 01`), not UI copy.
- Actions are descriptive verbs («مشاهده محصولات», not «کلیک کنید»).

## 6. Anti-patterns (prohibited)

- Raw hex in components (tokens only), arbitrary `duration-[…]`/one-off
  spacing, hidden focus indicators, `/40–/45` on meaningful text, physical
  direction utilities in RTL UI, low-contrast placeholder status labels on
  meaningful content, blocking submits without a loading state.

## 7. QA checklist

- [ ] `npm run typecheck` && `npm run build` clean
- [ ] Keyboard-only walkthrough of every interactive element on the page
- [ ] Contrast spot-check on new text/color pairings
- [ ] All four async states verifiable (loading/empty/error/success)
- [ ] RTL layout intact at 360px, 768px, 1280px widths
- [ ] No `duration-<number>` classes, no raw hex, no physical direction
      utilities in touched files
