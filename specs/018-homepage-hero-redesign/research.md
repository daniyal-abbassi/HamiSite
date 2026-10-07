# Research: Homepage Hero Redesign

## Current Implementation

- `Hero` is defined inside `app/(main)/page.tsx`. It currently uses a two-column grid, a rotating `FlipWords` headline, `<ShopWindow />`, a CTA pair, three trust labels, and a full-width `BrandTicker`.
- `ShopWindow` already renders a second, AI-rendered showroom image and the approved merchant facts. It would conflict visually with the requested RAW full-canvas art if retained in the redesigned hero.
- The brand presentation exists later in `BrandShowcase`; the moving/duplicate-style brand strip is not needed to make the redesigned intro useful.
- The main layout's header is fixed. `<main>` contributes `pt-24 md:pt-28` to clear it, so a reference-like hero that begins behind the transparent top header must account for that offset without editing the header.
- `PageGround` remains behind page sections. The RAW hero art has its own light canvas, so this feature can contain the light visual chapter in the hero and leave the progression code and the following chapters alone.

## Asset Findings

| Asset | Dimensions | Intended use |
|---|---:|---|
| `RAW-DESKTOP-BG.png` | 1779×884 | Wide art: showroom to the left, open copy field to the right |
| `RAW-MOBILE-DISPLAY-BG.png` | 941×1672 | Tall art: showroom above/left, open light field for mobile copy |
| `DESKTOP-REFERENCE-STYLE.png` | 1780×884 | Desktop composition reference only |
| `MOBILE-DISPLAY-REFERENCE-STYLE.png` | 940×1672 | Mobile composition reference only |

The RAW images already have the target aspect ratios. Use the two RAW files with CSS responsive background-image rules, keeping the source files untouched. CSS media queries allow the browser to request the matching image rather than downloading both backgrounds in a pair of hidden `<Image>` elements. The references show a single composition, so pagination would imply unavailable slides and is excluded.

## Content and Trust

- Keep the headline and calls to action as live Persian content. The existing destinations `/shop` and `/partners` are already used by the hero.
- The existing hero's paragraph safely explains that a person quotes the current price. Keep that truth condition; do not turn the background or copy into a claim that live inventory/prices are displayed on the site.
- The approved facts live in `lib/content/verified-facts.ts`: the 18-month company warranty, twenty years in Mashhad's mobile market, physical shop in Mashhad, official Redmi representation with Radman Pj warranty, and TCH representation in the region.
- The reference's labels about fast shipping, guaranteed authenticity, support, and competitive prices are not all supported by that source. Use verified wording in the four compact trust positions rather than adding new business claims.

## Decisions

1. Keep the `Hero` in its current file and replace only its composition; do not create another hero abstraction or add a dependency.
2. Use the existing site's `md`/`lg` conventions to switch from the mobile art/stacked composition to the desktop art/two-column composition. The mobile layout may extend through tablet widths if that is what keeps the content readable; the 1024px and 1440px desktop targets retain the desktop composition.
3. Make the hero its own full-bleed paper surface and leave the global header, `PageGround`, the homepage section anchors, and all sections below the hero in their current order.
4. Use the reference as an art-direction target, while preserving the project's truthful copy, live controls, keyboard operation, and reduced-motion behavior.
