# Hami Hamrah — Design System ("Aura")

Persian (RTL) B2C + B2B mobile-phone storefront. **Not dark-only** — the page
alternates paper and wine chapters. This line previously read "Dark-only; there
is no light theme", which was retired after the uniform dark ground measured as
tiring (mean luminance 70.9); see DESIGN.md.
`<html lang="fa" dir="rtl">`, `color-scheme: dark`.

## North star

**An atmosphere, not a fill.** The surface is a near-black ink canvas (`#0D0406`),
never a flat colour field. Depth comes from layered oxblood radial gradients fixed
behind the whole scroll, muted antique-gold accents, and frosted glass content
surfaces floating above. Geometry is fully rounded — pills for every button and
chip, 22–34px radii for cards and panels.

One constant is load-bearing: **RAL 3004 (`#640211`)** is the real physical-store
oxblood and the base of the colour ramp. The muted antique gold (`#C9A227`) is
deliberately **not** the champagne-yellow of an earlier iteration — do not drift
back toward champagne.

## Colour

| Token | Hex | Role |
|---|---|---|
| ink | `#0D0406` | canvas / background |
| ink-2 | `#160709` | card |
| ink-3 | `#1F0A0E` | popover |
| oxblood | `#640211` | brand constant (RAL 3004) |
| oxblood-lite | `#9C0A22` | ramp |
| oxblood-mid | `#7D0417` | ramp |
| oxblood-deep | `#3A010A` | ramp |
| gold | `#C9A227` | primary / ring |
| gold-lite | `#F0DCA0` | highlights, stat figures |
| gold-deep | `#8A6A15` | deep accent |
| foreground | `#F2F4ED` | text |
| success | `#3FBF7F` | positive |
| line | `rgba(242,244,237,0.10)` | hairline |

Text on gold: `#2A0207`. Secondary text is `foreground` at reduced alpha
(`text-muted-foreground/70`, `/62`, `/55`), never a separate grey token.

## Type

- **Sans** — Vazirmatn Variable (self-hosted, wght 100–900, arabic + latin subsets).
- **Mono** — DM Mono 400/500. Used for eyebrows, section indices, and micro-labels
  at 9–13px with `letter-spacing: 0.08–0.14em`, usually in gold.
- Display `clamp(2.25rem, 5vw, 3.75rem)` / 900 / lh 1.3 / tracking -0.02em
- Headline `clamp(1.5rem, 3vw, 2.25rem)` / 900
- Body 0.875rem / 400 / lh 1.8
- **One word per heading** carries a gold gradient shimmer (`.grad.animate-shiny`).
  Exactly one — never two.

## Shape

`sm 12` · `md 16` · `lg 22` (`--radius`) · `xl 28` · `2xl 34` · `full`.
Every button, badge, and chip is a pill. Nothing uses a 0–4px radius.

## Material

- **Glass** — `backdrop-filter: blur(18px)` plus a gradient-masked 1px hairline
  (oxblood-lit on one corner, gold-lit on the other). This is the default
  elevated surface.
- **Atmosphere** — `body::before`, fixed, three radial gradients: oxblood
  top-right, oxblood-lite left, gold bottom. Sections sit above it via
  `.wrap { position: relative; z-index: 2 }`.
- **Shadows** — `card 0 8px 30px rgba(0,0,0,.45)` · `deep 0 40px 90px rgba(0,0,0,.6)` ·
  `glow-oxblood 0 10px 30px rgba(100,2,17,.5)` · `glow-gold 0 10px 30px rgba(201,162,39,.32)`.

## Motion

**One curve, three tiers — no exceptions.** `cubic-bezier(0.2, 0.7, 0.3, 1)` at
`fast 150ms`, `normal 220ms` (default), `slow 300ms`. A hardcoded per-component
duration is a documented regression in this project, not a style choice.

Named keyframes: `pulse-dot`, `fade-up`, `fade-in`, `slide-in-end` /
`slide-in-start` (RTL-correct drawer directions), `bob` (floating stat cards),
`shiny` (the one-word gold sweep), `slide` (marquee ticker).

## Accessibility signatures

- Gold focus ring: `outline: 2px solid #C9A227; outline-offset: 3px` on every
  interactive element.
- Touch targets ≥ 40px; header controls are 36–40px circles.
- RTL is structural — use logical properties (`ms-`, `me-`, `start-`, `end-`),
  never `left`/`right`.

## Do / Don't

- **Do** let the fixed atmosphere show through; keep section backgrounds
  transparent or semi-transparent.
- **Do** use mono micro-labels in gold as the eyebrow device.
- **Don't** paint a flat oxblood fill across a section — that was the retired
  "Two Chapters" world.
- **Don't** introduce champagne yellow, a second accent hue, or a light theme.
- **Don't** add a second shimmer word or a second motion curve.
