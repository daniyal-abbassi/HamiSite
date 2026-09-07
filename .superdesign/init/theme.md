# Theme

## Part 1 — Compact token summary

Brand world: **"Aura"** — near-black ink canvas, RAL 3004 oxblood as *atmospheric
glow* (never a flat fill), muted antique gold as the single accent, fully rounded
glass geometry. Persian RTL (`<html lang="fa" dir="rtl">`), dark-only
(`color-scheme: dark`); there is no light theme.

### Colors

| Token | Value | Role |
|---|---|---|
| `ink` | `#0D0406` | Canvas / `--background` |
| `ink-2` | `#160709` | Elevated surface / `--card` |
| `ink-3` | `#1F0A0E` | `--popover` |
| `oxblood` (DEFAULT) | `#640211` | **RAL 3004 — the one preserved brand constant** |
| `oxblood-lite` | `#9C0A22` | Ramp |
| `oxblood-mid` | `#7D0417` | Ramp |
| `oxblood-deep` | `#3A010A` | Ramp |
| `gold` (DEFAULT) | `#C9A227` | Muted antique gold — `--primary`, `--ring`. Explicitly NOT the older champagne yellow. |
| `gold-lite` | `#F0DCA0` | Highlights, stat figures |
| `gold-deep` | `#8A6A15` | Deep accent |
| `foreground` | `#F2F4ED` | Text |
| `success` | `#3FBF7F` | |
| `line` | `rgba(242,244,237,0.10)` | Default hairline |

Text on gold uses `--primary-foreground: #2A0207`.

### Typography

- Sans: `var(--font-vazirmatn)` → "Vazirmatn Variable" (self-hosted woff2, wght 100–900, arabic+latin subsets), Tahoma fallback.
- Mono: `var(--font-dm-mono)` → "DM Mono" 400/500 — used for eyebrows/labels at 9–13px, letter-spacing 0.08–0.14em.
- Display: `clamp(2.25rem, 5vw, 3.75rem)`, weight 900, line-height 1.3, tracking -0.02em.
- Headline: `clamp(1.5rem, 3vw, 2.25rem)`, weight 900.
- Body: 0.875rem, weight 400, line-height 1.8.

### Radius

`sm 12px` · `md 16px` · `lg 22px` (`--radius`) · `xl 28px` · `2xl 34px` · `full 9999px`.
Every button, badge and chip is a pill. Nothing uses a 0–4px radius.

### Shadows

- `card` — `0 8px 30px rgba(0,0,0,0.45)`
- `deep` — `0 40px 90px rgba(0,0,0,0.6)`
- `glow-oxblood` — `0 10px 30px rgba(100,2,17,0.5)`
- `glow-gold` — `0 10px 30px rgba(201,162,39,0.32)`

### Motion

One curve — `cubic-bezier(0.2, 0.7, 0.3, 1)` — at three named tiers only:
`fast 150ms` · `normal 220ms` (default) · `slow 300ms`. Arbitrary per-component
durations are a documented anti-pattern in this project.

Keyframes: `pulse-dot`, `fade-up`, `fade-in`, `slide-in-end`, `slide-in-start`
(RTL-aware drawer directions), `bob` (floating stat cards), `shiny` (gold
gradient sweep on one word per heading), `slide` (marquee ticker).

### Signature materials

- **Atmosphere, not fill** — `body::before` is a fixed layer of three radial
  gradients (oxblood top-right, oxblood-lite left, gold bottom) behind the whole
  scroll. Sections sit above it via `.wrap { position: relative; z-index: 2 }`.
- **Glass** — `backdrop-filter: blur(18px)` + gradient-masked 1px hairline.
- **Gold focus ring** — `outline: 2px solid var(--gold); outline-offset: 3px`.

### Breakpoints

Tailwind defaults; container centered, padding `1.5rem`, `2xl` capped at `1280px`.

---

## Part 2 — Raw source

### `tailwind.config.ts`

```ts
import type { Config } from "tailwindcss";

/**
 * HAMI brand design system v2 — "Two Chapters" (flat wine + paper) retired.
 * Current world, pinned by the user from a supplied reference
 * (aura-landingSample.html): near-black canvas, atmospheric oxblood-ramp
 * glow, muted antique gold, fully rounded glass surfaces. See the direction
 * contract at the top of app/layout.tsx before touching this file.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        border: "rgb(var(--border) / 0.15)",
        input: "rgb(var(--input) / 0.22)",
        ring: "rgb(var(--ring))",
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        // Brand DNA v2 — literal hex so opacity modifiers (bg-oxblood/10) just
        // work. RAL 3004 (oxblood DEFAULT) is preserved as the real brand hue;
        // everything around it (canvas, gold, radius, glass) changed.
        oxblood: {
          DEFAULT: "#640211", // RAL 3004 — unchanged, the one preserved constant
          lite: "#9C0A22",
          mid: "#7D0417",
          deep: "#3A010A",
        },
        gold: {
          DEFAULT: "#C9A227", // muted antique gold — replaces champagne #d4af6a
          lite: "#F0DCA0",
          deep: "#8A6A15",
        },
        ink: {
          DEFAULT: "#0D0406", // near-black canvas
          2: "#160709",
          3: "#1F0A0E",
        },
        success: "#3FBF7F",
        // Matches --line in globals.css — the world's default hairline.
        line: "rgba(242, 244, 237, 0.10)",
      },
      borderRadius: {
        sm: "12px",
        md: "16px",
        lg: "var(--radius)", // 22px, see globals.css
        xl: "28px",
        "2xl": "34px",
      },
      fontFamily: {
        sans: ["var(--font-vazirmatn)", "Tahoma", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      boxShadow: {
        // Ambient shadow for glass/card surfaces on the near-black canvas —
        // replaces the old flat-wine "card"/"seal" pair, which were tuned to
        // a light-maroon background this world no longer has.
        card: "0 8px 30px rgba(0, 0, 0, 0.45)",
        deep: "0 40px 90px rgba(0, 0, 0, 0.6)",
        "glow-oxblood": "0 10px 30px rgba(100, 2, 17, 0.5)",
        "glow-gold": "0 10px 30px rgba(201, 162, 39, 0.32)",
      },
      /* Motion duration tokens — design-system scale (instant/fast/normal/slow).
         Arbitrary durations outside this scale are not allowed. */
      transitionDuration: {
        DEFAULT: "220ms",
        instant: "100ms",
        fast: "150ms",
        normal: "220ms",
        slow: "300ms",
      },
      // Signature motion curve v2 — pinned from the reference world (a fast
      // -out curve with a touch more energy than the old pure ease-out-expo),
      // still the default for every unqualified transition-* utility.
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.2, 0.7, 0.3, 1)",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(26px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        // Slides from the logical end edge to rest — correct for a start-0
        // positioned drawer under RTL (the panel sits at the physical right
        // edge; +100% pushes it further right, fully off-screen).
        "slide-in-end": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        // Mirror of slide-in-end for an end-anchored (physical left under RTL)
        // panel — the cart drawer enters from the side of its header icon.
        "slide-in-start": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        // Floating stat cards — the hero's signature idle motion.
        bob: {
          "50%": { transform: "translateY(-14px)" },
        },
        // Gold gradient sweep for the single-word text-shimmer emphasis.
        shiny: {
          to: { backgroundPosition: "-220% center" },
        },
        // Marquee — content rendered twice in the DOM, translated by exactly
        // half its own (doubled) width for a seamless loop, no JS measuring.
        slide: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(50%)" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "fade-up": "fade-up 0.85s cubic-bezier(0.2, 0.7, 0.3, 1) both",
        "fade-in": "fade-in 300ms cubic-bezier(0.2, 0.7, 0.3, 1) both",
        "slide-in-end": "slide-in-end 300ms cubic-bezier(0.2, 0.7, 0.3, 1) both",
        "slide-in-start": "slide-in-start 300ms cubic-bezier(0.2, 0.7, 0.3, 1) both",
        bob: "bob 7s ease-in-out infinite",
        shiny: "shiny 6s linear infinite",
        slide: "slide 34s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
```

### `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/**
 * HAMI brand tokens v2 — "Two Chapters" (flat wine canvas + paper trust
 * sections) retired. Current world, pinned by the user from a supplied
 * reference (aura-landingSample.html): near-black canvas throughout, RAL
 * 3004 oxblood as atmospheric glow (not a flat fill), muted antique gold as
 * the singular accent, full glass/pill geometry. See the direction contract
 * at the top of app/layout.tsx.
 */

/* Self-hosted brand fonts — the local-first decision (mirrors
   lib/product-images.ts): builds and rendering stay fully offline-safe, no
   fonts.googleapis.com dependency at build time. Vazirmatn is a variable
   font (weight 100-900) split into arabic/latin subsets via unicode-range. */
@font-face {
  font-family: "Vazirmatn Variable";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/fonts/vazirmatn-arabic-wght-normal.woff2") format("woff2");
  unicode-range: U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0897-08E1, U+08E3-08FF,
    U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC;
}
@font-face {
  font-family: "Vazirmatn Variable";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/fonts/vazirmatn-latin-wght-normal.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
    U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: "DM Mono";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/dm-mono-latin-400-normal.woff2") format("woff2");
}
@font-face {
  font-family: "DM Mono";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("/fonts/dm-mono-latin-500-normal.woff2") format("woff2");
}

:root {
  /* RGB triplets (Tailwind consumes via `rgb(var(--x) / <alpha>)`) */
  --background: 13 4 6;        /* #0D0406 — near-black ink canvas */
  --foreground: 242 244 237;   /* #F2F4ED */

  /* Font stacks — consumed by tailwind.config.ts fontFamily. These custom
     properties were previously emitted by next/font/google; now declared
     here alongside the self-hosted @font-face rules above. */
  --font-vazirmatn: "Vazirmatn Variable", "Vazirmatn", "Tahoma", sans-serif;
  --font-dm-mono: "DM Mono", ui-monospace, "Courier New", monospace;

  --card: 22 7 9;              /* #160709 — ink-2, elevated surface */
  --card-foreground: 242 244 237;
  --popover: 31 10 14;         /* #1F0A0E — ink-3 */
  --popover-foreground: 242 244 237;

  --primary: 201 162 39;       /* #C9A227 muted antique gold */
  --primary-foreground: 42 2 7; /* #2A0207 — near-black-oxblood, for text on gold */

  --secondary: 22 7 9;
  --secondary-foreground: 242 244 237;

  --muted: 22 7 9;
  --muted-foreground: 242 244 237; /* consumed at reduced alpha, e.g. text-muted-foreground/62 */

  --accent: 100 2 17;          /* oxblood */
  --accent-foreground: 240 217 171;

  --destructive: 229 72 77;
  --destructive-foreground: 255 245 245;

  --border: 242 244 237;       /* hairline @ 10%, see --line below */
  --input: 242 244 237;        /* @ 16% */
  --ring: 201 162 39;          /* gold */

  --radius: 22px;

  /* Literal hex, consumed directly (outline, gradients) rather than through
     rgb(var(--x)/alpha). */
  --gold: #C9A227;
  --line: rgba(242, 244, 237, 0.10);
}

@layer base {
  * {
    @apply border-border/10;
  }
  html {
    scroll-behavior: smooth;
  }
  body {
    @apply bg-background text-foreground font-sans antialiased;
    overflow-x: hidden;
  }
  /* Atmospheric oxblood glow layer — the world's signature "material":
     depth comes from layered radial gradients over a near-black canvas,
     never a flat maroon fill. Fixed so it reads as one continuous
     atmosphere behind the whole scroll, not a per-section background. */
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background:
      radial-gradient(900px 520px at 88% -8%, rgba(100, 2, 17, 0.55), transparent 60%),
      radial-gradient(700px 480px at 6% 12%, rgba(156, 10, 34, 0.22), transparent 62%),
      radial-gradient(1000px 700px at 50% 108%, rgba(201, 162, 39, 0.10), transparent 60%);
  }
  ::selection {
    background: rgba(201, 162, 39, 0.35);
    color: #fff;
  }
  /* gold focus ring — brand accessibility signature */
  :where(a, button, input, select, textarea):focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 3px;
  }
}

@layer components {
  /* Every section's content sits above the fixed atmosphere layer. */
  .wrap {
    position: relative;
    z-index: 2;
  }
  /* thin gold hairline */
  .brand-hairline {
    @apply h-px w-full;
    background: linear-gradient(to left, transparent, rgba(201, 162, 39, 0.55), transparent);
  }
  /* Frosted glass surface — the world's default elevated-content material.
     Gradient-masked 1px border simulates a two-tone hairline (gold-lit on
     one corner, oxblood-lit on the other) without an extra DOM layer. */
  .glass {
    position: relative;
    border-radius: var(--radius);
    background: linear-gradient(180deg, rgba(242, 244, 237, 0.055), rgba(242, 244, 237, 0.02));
    border: 1px solid var(--line);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    overflow: hidden;
  }
  .glass::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(140deg, rgba(201, 162, 39, 0.55), transparent 38%, transparent 62%, rgba(156, 10, 34, 0.55));
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
  /* Eyebrow pill — reintroduced by this world's brief. A rounded, bordered,
     dot-led label sitting above a heading. Do not use this pattern outside
     this committed world; the previous world banned it for a reason that
     held there (see DESIGN.md history) and stopped holding only because the
     world itself changed, not because the old reasoning was wrong. */
  .eyebrow {
    @apply inline-flex items-center gap-2 rounded-full text-[12px] tracking-[0.14em];
    color: var(--gold-lite, #F0DCA0);
    border: 1px solid rgba(201, 162, 39, 0.32);
    background: rgba(201, 162, 39, 0.07);
    padding: 7px 14px;
  }
  .eyebrow i {
    @apply block rounded-full;
    width: 6px;
    height: 6px;
    background: var(--gold);
    box-shadow: 0 0 10px var(--gold);
  }
  /* Gradient-shimmer text — reserved for exactly one word per heading. This
     world explicitly wants it; craft-floor's blanket "no gradient text" ban
     is a default for the previous world, not a universal law. */
  .grad {
    background: linear-gradient(100deg, #F0DCA0, #C9A227 40%, #fff 55%, #C9A227 70%, #8A6A15);
    background-size: 220% auto;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  /* sticky glass nav — static, no scroll-based recoloring. The previous
     world's chapter-matching header (HeaderChapterWatcher) is retired along
     with the light/dark chapter system it served: this world has no light
     chapter to match against. */
  .site-header {
    @apply sticky top-0 z-50;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    background: rgba(13, 4, 6, 0.72);
    border-bottom: 1px solid var(--line);
  }
}
```

### `app/(main)/home.css`

```css
/* Home page bespoke editorial styles — the pieces Tailwind can't express
   cleanly. Repainted for the "Aura" world (near-black canvas, oxblood glow,
   muted gold, full rounded geometry) — see the direction contract at the
   top of app/layout.tsx. */

/* ---------- scroll reveal ---------- */
.reveal {
  opacity: 0;
  transform: translateY(26px);
  transition: opacity 0.85s cubic-bezier(0.2, 0.7, 0.3, 1), transform 0.85s cubic-bezier(0.2, 0.7, 0.3, 1);
}
.reveal--visible {
  opacity: 1;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}

/* ---------- category mosaic ---------- */
.cat-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: 200px;
}
@media (min-width: 768px) {
  .cat-grid {
    grid-template-columns: repeat(4, 1fr);
    grid-template-areas:
      "mobile mobile audio charging"
      "mobile mobile watch power"
      "feature party party services";
    grid-auto-rows: 230px;
  }
}
.cat-card {
  position: relative;
  display: flex;
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid var(--line);
  background: var(--card);
  transition: transform 0.35s cubic-bezier(0.2, 0.7, 0.3, 1), border-color 0.35s;
}
.cat-card:hover {
  transform: translateY(-4px);
  border-color: rgba(201, 162, 39, 0.5);
}
.cat-card--mobile { grid-area: mobile; }
.cat-card--audio { grid-area: audio; }
.cat-card--charging { grid-area: charging; }
.cat-card--watch { grid-area: watch; }
.cat-card--power { grid-area: power; }
.cat-card--feature { grid-area: feature; }
.cat-card--party { grid-area: party; }
.cat-card--services { grid-area: services; }
.cat-art {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 70% 30%, rgba(201, 162, 39, 0.16), transparent 55%),
    linear-gradient(150deg, rgba(156, 10, 34, 0.55), rgba(58, 1, 10, 0.85));
  color: rgba(201, 162, 39, 0.75);
}
.cat-art i {
  position: absolute;
  border: 1px solid rgba(201, 162, 39, 0.25);
  border-radius: 50%;
}
.cat-art i:nth-child(1) { width: 46%; aspect-ratio: 1; }
.cat-art i:nth-child(2) { width: 66%; aspect-ratio: 1; opacity: 0.55; }
.cat-art i:nth-child(3) { width: 88%; aspect-ratio: 1; opacity: 0.25; }

/* ---------- why-hami proof compositions ---------- */
.proof-media {
  position: relative;
  min-height: 190px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-bottom: 1px solid var(--line);
  background: linear-gradient(150deg, rgba(156, 10, 34, 0.5), rgba(58, 1, 10, 0.75));
}
.store-architecture i {
  display: block;
  height: 2px;
  background: rgba(201, 162, 39, 0.4);
}
.store-architecture i:nth-child(1) { width: 120px; }
.store-architecture i:nth-child(2) { width: 88px; }
.store-architecture i:nth-child(3) { width: 56px; }
.product-composition b,
.brand-composition b {
  display: block;
  font-family: var(--font-dm-mono), monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: rgba(240, 220, 160, 0.85);
}
.brand-composition { text-align: center; }
.b2b-route { text-align: center; }
.b2b-route i {
  display: inline-block;
  width: 64px;
  height: 1px;
  margin: 10px 0;
  background: rgba(201, 162, 39, 0.6);
}
.b2b-route small {
  display: block;
  font-family: var(--font-dm-mono), monospace;
  font-size: 9px;
  letter-spacing: 0.12em;
  color: rgba(201, 162, 39, 0.7);
}

/* ---------- store experience photo slots ---------- */
.store-slot {
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid var(--line);
  background: linear-gradient(155deg, rgba(156, 10, 34, 0.3), rgba(58, 1, 10, 0.5));
}
.store-slot > div {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.store-slot > div > i {
  width: 90px;
  height: 1px;
  background: rgba(201, 162, 39, 0.45);
}
.store-slot > div > i:nth-child(2) { width: 60px; }
.store-slot > div > span {
  width: 34px;
  height: 46px;
  border-radius: 10px;
  border: 1px solid rgba(201, 162, 39, 0.4);
  background: rgba(201, 162, 39, 0.08);
}

/* ---------- final conversion atmosphere ---------- */
.final-conversion {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}
.final-conversion::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -2;
  background: linear-gradient(170deg, #160709, #0D0406 70%);
}
.final-conversion .beam {
  position: absolute;
  top: -30%;
  right: 12%;
  width: 1px;
  height: 160%;
  z-index: -1;
  background: linear-gradient(to bottom, transparent, rgba(201, 162, 39, 0.55), transparent);
}
.final-conversion .glow {
  position: absolute;
  bottom: -140px;
  left: 50%;
  width: 480px;
  height: 280px;
  transform: translateX(-50%);
  z-index: -1;
  background: radial-gradient(ellipse at center, rgba(100, 2, 17, 0.35), transparent 70%);
  filter: blur(10px);
}

/* ---------- online services FAQ (native details) ---------- */
.faq details {
  border-bottom: 1px solid var(--line);
}
.faq summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 4px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  list-style: none;
}
.faq summary::-webkit-details-marker { display: none; }
.faq details[open] summary { color: var(--gold); }
.faq details > p {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 2;
  color: rgb(var(--foreground) / 0.65);
}
```

