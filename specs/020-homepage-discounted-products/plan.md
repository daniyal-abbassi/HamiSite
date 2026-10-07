# Plan: Homepage Discounted Products

1. [x] Add a server-side homepage rail filtered to real, currently purchasable discounted products/variants and sort by discount percentage.
2. [x] Rebuild the DOM to mirror the reference's actual hierarchy: feature product card and horizontal compact cards; replace the shared newest-product card's appearance with deal-specific components that preserve variant, image, price, stock and cart behavior.
3. [x] Match the inset panel, gold frame/glows/sparkles, split header, 12-column grid, image ratios, discount chips/meters, prices, and CTA proportions from the supplied `DealsSection.tsx`/`index.css`.
4. [x] Substitute factual section summary and discount meter for the reference's fabricated deadline and sold-stock meter; do not add fake perks or campaign timing.
5. [x] Review mobile render, update graphify, and run typecheck/diff hygiene.

## Data finding

The current database contains five available product rows with a positive product-level reduction. Three have real variants; only variants with both a positive reduction and purchasable stock qualify. The rail therefore filters per purchasable variant for variant products and per product row for products without variants. The Vite sample's countdown, sold totals, remaining quantities, and perks have no supporting live data and are excluded.
