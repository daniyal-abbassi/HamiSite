---
name: Hami Hamrah
description: Persian (RTL) B2C+B2B mobile phone & accessories storefront — "Aura" world: near-black canvas, RAL 3004 oxblood atmosphere, muted antique gold, full glass/pill geometry
colors:
  ral-3004-oxblood: "#640211"
  oxblood-lite: "#8E0A1E"
  oxblood-mid: "#75040F"
  oxblood-deep: "#3A010A"
  bone: "#C9C2BE"
  bone-lite: "#E8E4E1"
  bone-deep: "#8B8482"
  ink: "#1B0A0E"
  ink-2: "#2A1116"
  ink-3: "#3A1A20"
  foreground: "#E2DEDB"
  muted-foreground: "#A59E9C"
  signal: "#E4573F"
  success: "#6FBF9B"
typography:
  display:
    fontFamily: "Vazirmatn, Tahoma, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 900
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Vazirmatn, Tahoma, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 900
    lineHeight: 1.3
  body:
    fontFamily: "Vazirmatn, Tahoma, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "DM Mono, monospace"
    fontSize: "9px, 10px, 11px, 13px"
    fontWeight: 500
    letterSpacing: "0.08em-0.14em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "14px"
  "2xl": "18px"
  full: "9999px"
spacing:
  section: "5rem"
  card: "16px-28px"
  container: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "#2A0207"
    rounded: "{rounded.full}"
    padding: "13px 24px"
  button-oxblood:
    backgroundColor: "{colors.ral-3004-oxblood}"
    textColor: "#FFFFFF"
    rounded: "{rounded.full}"
    padding: "13px 24px"
  card-glass:
    backgroundColor: "rgba(242,244,237,0.04)"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "24px-28px"
---

# Design System: Hami Hamrah

## Overview

**Creative North Star: "Aura" — an atmosphere, not a fill**

This world replaced the previous "Two Chapters" system (flat wine canvas + paper trust sections) in full — pinned by the user from a supplied reference implementation (`aura-landingSample.html`), not derived from a discovery round. The default surface is a near-black ink canvas (`#0D0406`), never a flat color field: depth comes from layered oxblood radial-gradient glow fixed behind the whole scroll, muted antique-gold accents, and frosted glass content surfaces (backdrop-blur + a gradient-masked hairline border) floating above it. Geometry is fully rounded — pills for every button and chip, 22-34px radii for cards and panels — the opposite of the previous world's near-sharp language, and that reversal is deliberate, not a regression: this world explicitly wants softness and glow where the last one wanted precision and flatness.

One constant survives the replacement: **RAL 3004 (`#640211`)** — the real, physical-store oxblood — remains the base of the color ramp. Everything built *around* it (the near-black canvas instead of a flat oxblood fill, the muted gold instead of champagne, the full rounding) changed; the one real brand constant did not.

Business facts stay exactly as confirmed (see `PRODUCT.md`) — this is a visual-world change, not a positioning change. Twenty years of operating history, Redmi/TCH certifications, and the Mashhad location are unchanged; the "12 years / since 1393" claim in the reference sample was explicitly rejected by the user as inaccurate and never entered the copy.

**Key Characteristics:**
- Near-black canvas (`#0D0406`) with a fixed, layered oxblood-glow atmosphere behind the entire scroll — never a flat color fill.
- Frosted glass (`backdrop-filter: blur(18px)` + gradient hairline border) is the default elevated-surface material, not a flat card fill.
- Full rounded geometry: pills (`rounded-full`) for every button/chip, 22-34px radii for cards/panels. No sharp corners anywhere.
- Eyebrow pills and one-word gold gradient-shimmer text are back, used per-section — both were banned in the previous world; that ban held there and stopped holding here because the world itself changed.
- One motion signature (`cubic-bezier(0.2, 0.7, 0.3, 1)`) across every transition, at one of three named durations (fast 150ms / normal 220ms / slow 300ms).

## Colors

**One hue, and greys.** RAL 3004 is fixed, so instead of hunting an accent to
pair with it, the whole page moved *inside* its hue: the ground is `#1B0A0E`, a
burgundy darkened almost to black, and every surface above it is a step of the
same wine. There is no second colour to clash with, because there is no second
colour — the only other family is warm grey.

This is the fourth palette attempt and the first that holds. Three accents were
tried and rejected — champagne, antique gold, amber — all of which sat inside
RAL 3004's own hue and muddied it. A cyan complement was tried next and rejected
for the opposite reason: maximum separation on the wheel reads as a clash, not
as harmony. The resolution was to stop looking for a partner hue at all.

**The whites are not white.** Body text is `#E2DEDB` and the accent is `#C9C2BE`
— warm greys, deliberately short of pure white. On a wine ground, true white
glares and pulls the eye away from the brand red; grey lets the oxblood stay the
brightest-feeling thing on the page even though it is darker than the text.

### Primary
- **Bone** (`#C9C2BE`): The one accent — a warm grey, not a colour — primary CTAs (as a full pill fill), prices, active states, eyebrow dots, icon glyphs. `--primary` resolves here now (it resolved to wine in the previous world's `.light` scope — that scope no longer exists).
- **Bone Lite** (`#E8E4E1`) / **Bone Deep** (`#8B8482`): Gradient stops for the gold button fill and the gradient-shimmer text.

### Secondary
- **RAL 3004 Oxblood** (`#640211`) and its ramp — **Lite** (`#8E0A1E`), **Mid** (`#75040F`), **Deep** (`#3A010A`): The real brand hue, now used as atmosphere (radial-gradient glow layers), gradient-fill buttons (`variant="oxblood"`), and elevated dark surfaces — never as a flat full-bleed canvas fill.

### Signal
- **Signal Ember** (`#E4573F`): The red-noir second accent, adopted from a supplied reference. Deliberately **not** a replacement for RAL 3004 — oxblood remains the brand and the atmosphere. Signal is confined to *live* and *edge* treatments: the spinning conic rim on a primary conversion action (`.shiny-edge`), a pulsing "live" dot, and small emphases. Using it as a surface fill puts it in direct competition with the brand red, which is the failure mode this restriction exists to prevent.

### Neutral
- **Ink** (`#1B0A0E`): The canvas — burgundy darkened to near-black, every page's base background.
- **Ink 2** (`#2A1116`) / **Ink 3** (`#3A1A20`): Elevated surfaces (popovers, footer, mobile dock) — one step lighter than canvas, still near-black.
- **Foreground** (`#E2DEDB`): Primary text — cool white. 16.9:1 on the canvas.
- **Muted Foreground** (`#A59E9C`): A real cool grey for secondary text, 7.6:1 on the canvas. Previously this token just repeated the foreground at low alpha, which made secondary copy read as faded white instead of as its own tier.

### Named Rules
**The Atmosphere-Not-Fill Rule.** Oxblood never owns a flat full-bleed background. It appears as radial-gradient glow (fixed behind the scroll, or local to a card/banner), as a gradient button fill, or as an elevated-surface tint — always graduated, never flat.

**The Signal-Is-An-Edge Rule.** Signal red draws rims, dots and hairlines — never areas. If a block of `#ef233c` fills more than a few square pixels, the rule has been broken and the brand red has a rival.

**The One Accent Rule (carried over).** Gold marks exactly one thing per view: the primary action or the price. Section labels/eyebrows use the dedicated `.eyebrow` pill treatment, not bare gold text — that's what keeps the accent legible as "the important thing" rather than decoration.

## Typography

**Display/Body Font:** Vazirmatn (Tahoma, sans-serif fallback) — unchanged from the previous world.
**Label/Mono Font:** DM Mono — unchanged, still reserved for small uppercase labels and prices' unit suffix.

**Character:** The pairing didn't change; what changed is how headings resolve — one word per heading may now carry the gold gradient-shimmer (`.grad`) treatment instead of a flat accent color, for a more "premium SaaS" feel matching this world's glow-and-glass material language.

### Hierarchy
- **Display** (font-black / 900, `text-4xl` → `text-6xl` clamp): Hero H1 only.
- **Headline** (font-black / 900, `text-3xl` → `text-4xl`): Section H2s, now preceded by an `.eyebrow` pill (reintroduced — see Do's/Don'ts).
- **Body** (regular / 400, `text-sm`, leading 1.8): Paragraph copy, unchanged.
- **Label** (font-medium / 500, DM Mono): the real micro-scale, four steps in active use — `9px`/`10px`/`11px`/`13px`. Captions, form field hints, badges, ticker items, and status text all draw from this scale; none of these steps is a mistake or an isolated exception.

## Layout

Centered container, `1.5rem` padding, `1280px` max at the `2xl` breakpoint — unchanged. Section rhythm stays `py-20` as the default beat. RTL throughout.

**The two-chapters rhythm system is fully retired.** There is no light/paper surface anywhere in this world, and no scroll-based header recoloring — `HeaderChapterWatcher` and its `data-chapter` attributes were deleted. The header is a static frosted-glass bar (`rgba(13,4,6,0.72)` + blur) regardless of scroll position. Visual variety within a uniformly dark world now comes from the glass-surface/glow material itself, not from alternating light and dark chapters.

## Elevation & Depth

Glass-first: `backdrop-filter: blur(18px)` plus a gradient-masked 1px hairline border (oxblood-lit on one corner, gold-lit on the other) is the default elevated-content material, replacing the previous world's flat `bg-card` + solid border.

### Shadow Vocabulary
- **`card`** (`0 8px 30px rgba(0,0,0,0.45)`): Default ambient ground shadow for glass surfaces on the near-black canvas.
- **`deep`** (`0 40px 90px rgba(0,0,0,0.6)`): Larger objects (the hero phone silhouette).
- **`glow-oxblood`** (`0 10px 30px rgba(100,2,17,0.5)`) / **`glow-gold`** (`0 10px 30px rgba(201,162,39,0.32)`): Button-specific glow shadows, brightening on hover — replaces the previous world's flat hover-color-shift with a literal light-source feel.

### Motion Tiers
One curve (`cubic-bezier(0.2, 0.7, 0.3, 1)` — a livelier fast-out than the previous world's pure ease-out-expo), three named durations:

| Tier | Duration | Use for |
|---|---|---|
| `duration-fast` | 150ms | Small contained state changes. |
| `duration` (default) | 220ms | General default — color/background, card hover-lift. |
| `duration-slow` | 300ms | Larger movement — drawer slide-in, backdrop fade, scroll-reveal entrances. |

### Named Rules
**The One Motion Signature Rule (carried over, curve updated).** Every CSS transition uses the one curve above at one of the three named tiers — never a hardcoded per-component `duration-*`/`ease-*` pair. This was violated once already in this project's history (`Button.tsx` hardcoded `duration-200 ease-out`); check for the same class of drift after any future motion-adjacent edit.

**The PillNav exception (documented, bounded).** `components/layout/PillNav.tsx` drives its hover and entrance with GSAP on `power3.out`, `back.out(1.7)` and `elastic.out(1, 0.5)` — none of which are the site curve. This is a real exception, granted because those easings *are* the component's character: the rising circle and the settling logo read as mechanical on a plain fast-out curve.

The exception is bounded to that one file. It does not license GSAP or off-scale easing anywhere else, and any new component reaching for a custom curve needs its own decision, not this precedent.

### The red-noir depth stack

Four fixed, inert layers sit beneath every `.wrap` section, painted back-to-front:

| Layer | What it is | Where |
|---|---|---|
| Atmosphere | Four radial gradients — oxblood top-right (the brand light source, held at 0.42 so the cool canvas still reads), oxblood-lite upper-left, an aqua counter-light low-left, aqua floor glow | `body::before` |
| Technical grid | 44px hairline grid, radially masked so it dissolves before the edges | `body::after` |
| Starfield | Two `box-shadow` point layers drifting at 90s and 140s | `.noir-stars` |
| Top scrim | Gradient + blur so the page dissolves into the header instead of sliding under a hard edge | `.gradient-blur` |

None of them is a surface: they are all `pointer-events: none` and none introduces a flat fill, so the Atmosphere-Not-Fill rule still holds.

Under `prefers-reduced-motion: reduce` the drift and the conic rim stop while the grid, the stars and the glow stay painted — the depth is the design, the movement is not. Note that the star animations are declared on `:nth-child` selectors, so the reduced-motion override must match that specificity or it silently loses.

## Shapes

**Panels, not lozenges.** The radius scale was cut from 12/16/22/28/34 to
6/8/12/14/18. Cards read as panels with defined edges; `rounded-full` still owns
buttons, chips and the nav pills, so the interactive language stays soft while
the content language turns architectural.

**Full-bleed grids.** The trust bento, the hero credential row and the campaign
banner span the viewport rather than sitting inside the 1280px container, and
they are separated by hairlines instead of gaps. Previously: Radius scale: `12px` (sm — chips, small icon tiles) → `16px` (md) → `22px` (lg, `--radius` root value — default cards) → `28px` (xl) → `34px` (2xl — large panels, CTA blocks) → `9999px` (full — every button, badge, and pill chip). Nothing in this world uses a 0-4px radius; that was the previous world's signature, not this one's.

## Components

### Buttons
- **Shape:** Full pill (`rounded-full`) — always, no exceptions.
- **Default (gold):** Gradient fill (`gold-lite` → `gold`), dark text, `shadow-glow-gold`, lifts + brightens on hover. The "money" CTA — signup, submit, place order.
- **Oxblood:** Gradient fill (`oxblood-lite` → `oxblood`), white text, `shadow-glow-oxblood`. The general primary action — used more often than gold (e.g. the hero's main CTA).
- **Outline/Ghost:** Transparent or `foreground/5` fill, hairline border, no shadow.
- **States:** default, hover (lift + shadow brighten, per variant), focus-visible (gold outline ring), active (`translate-y-px`), disabled (`opacity-50`), loading (spinner + `aria-busy`, added this session).

### Cards / Glass Surfaces
- **Shape:** `22px`-`34px` radius depending on size.
- **Material:** `.glass` — `backdrop-filter: blur(18px)`, translucent gradient fill, gradient-masked hairline border. Replaces flat `bg-card` + solid border as the default.
- **Hover:** Lift (`-translate-y-1` to `-translate-y-1.5`), no color shift.

### Inputs / Fields
- **Style:** `rounded-xl` (16px), `bg-ink/60`, hairline border.
- **Focus:** Gold ring + border-color shift.
- **Error:** `aria-invalid:border-destructive` — present on the shared `Input` component; **not yet wired into every field of `PartnerForm.tsx`** (a pre-existing gap, unchanged by this pass).

### Badges
- **Shape:** Full pill.
- **Variants:** `default` (gold fill), `oxblood` (oxblood fill, gold-lite text), `gold` (gold-tinted outline), `outline`, `destructive`.

### Navigation
- **Header:** Static frosted-glass bar, always — no scroll-based recoloring (the previous chapter-matching header is retired along with the chapters it matched). Marquee ticker (real, confirmed facts only — brand tagline, B2C+B2B note, Redmi/TCH partnerships) scrolls above it, pauses on hover.
- **Mobile nav:** Floating glass panel (not edge-to-edge), slides in from the logical end edge.
- **Mobile dock:** Fixed bottom bar, `ink-2` background — the one place that stays flat/edge-to-edge, a legitimate exception for fixed edge-anchored chrome.

## Do's and Don'ts

### Do:
- **Do** treat oxblood as atmosphere (gradient glow, gradient button fill) — never as a flat full-bleed background fill.
- **Do** use `.glass` for elevated content surfaces by default — flat `bg-card` + solid border is the previous world's device, not this one's.
- **Do** round everything — `rounded-full` for interactive pills, `22px`+ for cards. A 0-4px radius appearing anywhere is a regression to the retired world.
- **Do** use the `.eyebrow` pill above Persuade-mode section headings (home page) — but skip it on Operate-mode surfaces (shop, partners) per the mode-appropriateness principle; those need token consistency, not the full marketing device set.
- **Do** reserve the gold gradient-shimmer (`.grad`) for exactly one word per heading — it's a signature move, not a default text-color replacement.
- **Do** keep signal red on rims, dots and hairlines — `.shiny-edge` is the pattern; a filled `#ef233c` block is not.
- **Do** tag any new full-bleed dark section consistently with the rest — there is no chapter system anymore, so no `data-chapter` attribute is needed on new sections.

### Don't:
- **Don't** reintroduce the previous world's `.light`/paper chapter, the `HeaderChapterWatcher` scroll-recoloring header, or `data-chapter` attributes — all three were deliberately deleted, not just unused.
- **Don't** hardcode a per-component `duration-*`/`ease-*` pair — same rule as before, now pointing at the new curve. PillNav's GSAP easings are a documented, file-scoped exception (see Motion Tiers), not an opening.
- **Don't** let signal red grow into a surface colour, a text colour for body copy, or a second button fill. It has one job: marking the live edge.
- **Don't** use `champagne`/`wine`/`paper`/`ink-dark` class names anywhere — they no longer exist as Tailwind tokens (renamed to `gold`/`oxblood`/`ink`/`foreground`). A build error on one of these names means a stale reference was missed.
- **Don't** apply the full Persuade-mode device set (eyebrow, gradient text, floating glass stat cards) to Operate-mode utility surfaces (filters, forms, admin) — carry the palette and material, not every marketing flourish.
- **Don't** state unconfirmed facts from the reference sample as real (e.g. its specific mall/address, its "12 years" claim, its fabricated partner-count stats) — the sample is a style reference, not a source of business facts. `PRODUCT.md` is the only source of truth for those.

## Token naming

The accent token is `aqua` everywhere — CSS variable `--aqua`, Tailwind
`text-aqua` / `bg-aqua` / `border-aqua` / `shadow-glow-aqua`, plus `aqua-lite`
and `aqua-deep`. It was renamed from `gold` across 62 files when the palette
changed; a token named `gold` that renders cyan is worse than no token at all.

**A trap this project has already fallen into twice:** changing the tokens is
not enough. `globals.css` and `home.css` carried the original antique gold as
hardcoded literals (`rgba(201, 162, 39, …)`, `#C9A227`, `#F0DCA0`) inside the
eyebrow pill, the `.grad` shimmer sweep, the hairlines and the glass borders.
Those are the most visible surfaces on the page, so two palette changes in a row
looked far weaker than they should have until the literals were swept too. After
any future palette change, grep the CSS for the old hex values before believing
the result.

## Card and page lightness must be paired

Any surface whose background is `--card` must take its text from
`--card-foreground`, never `--foreground`. While every palette kept both dark
this never mattered; the moment a light-page/dark-chrome variant was tried, the
nav label and both hero CTAs rendered invisible. `.shiny-edge` and the header
now read `--card-foreground` for that reason. Check this pairing before shipping
any palette where the card and the page differ in lightness.

## The `duration-*` trap on animated components

Tailwind's `duration-*` utilities set **`animation-duration` as well as
`transition-duration`**, and the utilities layer outranks the components layer.
Putting `duration-fast` on a `.shiny-edge` button — added there to time its
hover lift — silently replaced the rim's `9s` sweep with `150ms`, spinning it
about sixty times too fast. The CSS said one thing and the page did another, and
no tooling flags it.

Rule: never combine a `duration-*` utility with a component class that declares
its own `animation`. Let the element inherit the default transition tier, or
move the transition onto a wrapper.

The rim itself follows the reference: a 2px border, one solid signal colour
across a ~40% arc (not two alternating hues, which read as a flicker), a 9s
linear sweep, and a soft outer glow so the colour bleeds past the edge instead
of being trapped inside the line.
