# Implementation Plan: Homepage Lower Section Backgrounds

## Sequence

1. **Prepare the artwork** — use the user's ChatGPT-generated image for `obtainable-now`, create a compressed WebP derivative, and retain the original PNG in `public/images/shapes/`.
2. **Generate the remaining art** — use AI Bridge to create separate backgrounds for `categories`, `brands`, `new-arrivals`, `b2b`, `online-services`, and `store-experience`; capture the images from the signed-in Chrome profile when the bridge times out after ChatGPT has already rendered an image.
3. **Integrate the section canvases** — optimize the unique per-section images to WebP, use full-bleed layers with mobile-specific focal positions, preserve CSS fallback colors, and tune text/card contrast where the dark/paper token system requires it.
4. **Verify the page** — check image paths, typecheck, diff formatting, and review the full section sequence at desktop and mobile widths.

## Design Direction

- Dark canvases: layered oxblood silk, restrained champagne edge light, subtle abstract motion, no focal object.
- Light canvases: warm ivory/champagne material with burgundy wave accents and open space for content.
- Keep the visual system coherent while giving each section its own composition: rich oxblood silk for dark chapters and warm ivory/champagne with burgundy waves for light chapters. Product cards need clear separation; category and brand artwork must stay distinct from their surroundings.
- Use section-specific crops, with mobile focal points as the base CSS and desktop positioning as a min-width override. Keep details low contrast so the background does not compete with headings or product imagery.

## Dependency

The user supplied the ChatGPT artwork for `obtainable-now`. AI Bridge generated the six remaining section images using the new signed-in Chrome profile. Three recent requests returned a bridge timeout after the corresponding image had appeared in ChatGPT, so those images were captured through CDP. The user source and four recent AI sources are preserved as PNG; all sections use optimized WebP derivatives.
