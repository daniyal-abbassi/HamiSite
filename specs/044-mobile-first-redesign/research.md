# Phase 0 Research: Mobile-First First-Screen Redesign

**Feature**: 044-mobile-first-redesign · **Date**: 2026-10-25
All NEEDS CLARIFICATION items from the plan are resolved here.

## R1 — Background artwork application

**Decision**: The tall silk artwork (`mockups/background-mobile-silk.png`, ~9:16, cream field with oxblood silk waves at the top corners and a large bottom wave) becomes the mobile first-screen surface: it is copied to `public/images/hero/home-silk-mobile.png` and applied as the hero band's background on viewports <768px, replacing the generated `home-mobile-*.webp` artwork in that range. The wide banner (`mockups/banner-silk-wide.png`) is copied to `public/images/hero/home-silk-wide.png` and applied as the background of the homepage's closing CTA band at desktop widths, where the existing flat treatment is the weakest surface.

**Rationale**: The mockup defines exactly one screen — the first — and the tall artwork is composed for it (silk dips at the header corners, big wave under the trust facts). The closing CTA band is the desktop surface whose current look (plain band + halo) benefits most from the wide silk without touching the approved hero artwork.

**Alternatives considered**: (a) full-page fixed background — rejected: the homepage's catalog rails are data-dense and legibility over the silk's dark waves would fight the honest-presentation rule; (b) replacing the desktop hero artwork with the wide silk — rejected: the desktop hero was owner-approved yesterday and spec story 4 forbids regression; (c) CSS-recreated waves — rejected: owner supplied the artwork, and CSS gradients would not match the approved texture.

## R2 — Header logo lockup on the oxblood bar

**Decision**: Compose the mockup's white lockup from the official alpha files `public/brand/hami-mark-alpha.png` (H mark, oxblood on transparent) and `public/brand/hami-wordmark-fa.png` (wordmark, oxblood on transparent), placed mark-first (inline-end of the wordmark, i.e. visually right in RTL) on the solid oxblood bar, turned white with a CSS `filter: brightness(0) invert(1)`.

**Rationale**: The mockup shows the white mark + wordmark directly on oxblood. No supplied asset ships as white-on-transparent; the two alpha files are the official artwork in the right shape, and the inversion is presentation, not a redraw — consistent with the T082 assumption that supplied brand files are used as-is.

**Alternatives considered**: «قسمت-فارسی-لوگو.png» (white wordmark baked on an oxblood plate) — rejected: its baked plate color will not exactly match the header surface token at the edges, producing a visible rectangle seam. «HamiHamrah(حامی همراه)-Logo.png» (stacked lockup, baked background) — rejected for the same reason and wrong orientation for a 64px bar.

## R3 — Mobile header surface

**Decision**: On <768px the header becomes a solid oxblood (`--oxblood`) bar with softly rounded bottom corners, white actions, and the white lockup — replacing the glass pill on phones only. The existing scrolled/docking behavior is retained but restyled (the scrolled state stays oxblood, slightly compressed). Desktop (≥768px) keeps yesterday's approved glass-pill presentation untouched.

**Rationale**: The mockup defines a solid brand bar; glass over an already-solid brand surface reads as noise at 64px height. Keeping the desktop untouched honors spec story 4 and FR-012.

**Alternatives considered**: oxblood glass (semi-transparent) — rejected: the mockup bar is uniform and solid; translucency over the cream page would muddy the wave dips behind the corners.

## R4 — Trust facts content and icons

**Decision**: Extend `lib/content/verified-facts.ts` with the two owner-confirmed facts (2026-10-25, recorded in spec FR-007): `priceMatch` — «قیمت برد به برد» and `officialDealership` — «نمایندگی رسمی». The hero's short labels become the mockup's four: «۲۰ سال سابقه» (Clock), «فروشگاه حضوری در مشهد» (MapPin), «قیمت برد به برد» (Medal), «نمایندگی رسمی» (ShieldCheck). Existing `redmi`/`tch` facts remain in the source (no other consumers today — verified by grep — but they stay available and honest). Icons are lucide, stroke-matched to nearby typography, wrapped in outlined circular rings per the mockup.

**Rationale**: Owner confirmation satisfies Principle I; the label keys stay semantic (`priceMatch`, `officialDealership` — no brand-named keys like the retired `redmi` naming debt).

**Alternatives considered**: renaming/removing `redmi`/`tch` — rejected: out of scope; the source may hold more facts than one surface renders.

## R5 — Hero photograph composition

**Decision**: The hero keeps its two-column grid on mobile but the visual order inverts: the text column stays in the inline-start (right) column; the photograph `public/store/shop-ai-relight.png` (1126×1407) becomes the second column's content — a rounded block bleeding to the page's left edge, per the mockup — with explicit dimensions/`fill` + reserved frame so nothing shifts while it loads. On ≥768px the existing artwork picture and scene stay exactly as approved; the photo block renders mobile-only.

**Rationale**: The mockup places the photo left with the headline overlapping its edge slightly; the current grid already reserves a two-column split, so the photo slots into the empty left half that yesterday's analysis called "the artwork's empty wall".

**Alternatives considered**: replacing the desktop artwork with the photo — rejected (story 4, R1b); photo as a full-width banner above text — rejected: contradicts the approved composition and pushes CTAs below the fold.

## R6 — Category trigger on the oxblood bar

**Decision**: The category `GlassMenu` trigger stays the interactive element (with its repaired tap behavior from 2026-10-25), but on the oxblood bar its closed-pill glass surface is rendered transparent (surface hidden via the header scope styles) so it reads as a bare white hamburger icon per the mockup; its open panel keeps the existing glass presentation.

**Rationale**: The mockup shows four plain white icons; a glass pill inside a solid bar duplicates surfaces. The trigger's 44×44 touch behavior (pillHeight + extension) is untouched.

**Alternatives considered**: swapping to a plain button and losing GlassMenu — rejected: reuse-before-create; the open menu's glass panel is already owner-seen behavior.

## R7 — Below-the-first-screen continuity

**Decision**: Homepage sections below the hero keep their current content, behavior, and paper styling; they inherit the page's existing background. Only the closing CTA band gains the wide silk background (R1). No section is restyled in this feature beyond that band.

**Rationale**: Spec assumption (documented) and scope boundary; the silk-first-screen + paper-continuity matches the mockup's own cream field.

## R8 — Verification approach

**Decision**: Definition-of-Done verification = `npm run typecheck` + `npm run build` clean; live-browser confirmation on the dev server: first screen at 390×844 compared against `mockups/mobile-home-design.png`, 360/430 spot checks, desktop 1280×800 regression pass, touch + keyboard operability of the header actions and CTAs. The dev server is restarted after the build per the CLAUDE.md stale-build trap.

**Rationale**: Constitution DoD requires real-browser proof (hydration) and both widths; the project has no visual-regression harness wired, so the browser walkthrough with saved screenshots is the evidence.

## Resolved unknowns

None remained open: the single spec clarification (trust-facts content) was answered by the owner on 2026-10-25 ("Adopt mockup labels") and is encoded in R4.
