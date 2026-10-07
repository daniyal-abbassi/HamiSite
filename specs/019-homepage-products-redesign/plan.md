# Plan: Homepage Products Section Redesign

## Decisions

1. Treat the supplied implementation as the source for products-section composition and card styling; use the generated `SHOP SECTION/ChatGPT Image Oct 6, 2026, 11_57_03 PM.png` as the burgundy-dominant background.
2. Keep burgundy as the main canvas and retain ivory showroom curves as small perimeter highlights; keep product-card artwork separate.
3. Adapt `FeaturedProducts`, `ProductRail`, and `ProductCard` to the source's blush card, favorite state, carousel affordances, and responsive sizing while retaining actual product/action contracts; remove homepage breadcrumb, filters, and catalog status copy per owner feedback.
4. Scope layout and art direction to `#featured`; leave unrelated product rails and the global header untouched.
5. Place the `/shop` CTA after the carousel and pagination; use the existing Nastaliq accent at a smaller scale.
6. Verify types, diff hygiene, and local desktop/mobile rendering, paying particular attention to the Hero-to-products transition.

## Owner feedback implementation sequence (2026-10-07)

1. Replace the Samsung-only homepage source with a server query of the globally newest 12 real catalog products, including variant and image data. Rename the heading and accessible section labels to “جدیدترین محصولات”.
2. Extend the featured card contract with real serialized variants. Keep selection state in the featured shelf and pass the selected variant into the card, price display, and cart action. The card chooses the same-storage variant where possible when color changes.
3. Use the selected variant's own price, compare-at price, availability, and optional image. Keep product-level fields as fallback only when no variants exist.
4. Contain/inset all product photos and show a small discount pill only when the actual price pair yields a positive discount.
5. Verify on the running local site that newest items are from multiple brands, color controls change the selected price, discounted products get a badge, and images are not cropped. Run `npm run typecheck`, `git diff --check`, and `graphify update .`.

### Risks and decisions

- “Newest” follows the catalog's `updatedAt` comparator, which is its existing recency contract; do not fabricate timestamps or use the reference project's fixture products.
- Multiple storage variants may share a color. Preserve the current storage where possible; otherwise select the first real variant of that color.
- A variant may not have its own image or sale price. Fall back to the product image; show no discount unless the selected variant's own comparison price is valid.
- A product-level cart action remains available only for products without variants. When a variant exists, add the selected variant ID so the server resolves that exact price.

## Image-stage refinement (2026-10-07)

- Set the featured card image stage to pure white to continue the backgrounds in the catalog photography.
- Keep `object-fit: contain` and remove the added inset padding so the complete photo fills the available stage naturally; preserve the unavailable label with a light scrim.
- Verify the updated image/photo balance in the local browser before closing Beads task `HamiSite-basic-structure-bv0`.

## Variant-photo follow-up (2026-10-07)

- The live DB has no `ProductVariant.imageId` associations for the 19 variants in the current 12-item homepage shelf. The catalog snapshot does retain explicit `image_url` values for some variants, matched by product slug and color/storage; some colors have no URL and some colors share one. Use those URLs only when explicitly present, and keep the database as the source of prices, stock, and sort order.
- Permit the configured catalog host as a variant photo source, and keep the white `contain` stage. Improve the swatch hit area and ensure it paints above the stretched product-title link hit area.
- In browser review, selecting Titanium on Redmi Note 15 Pro switched to its catalog photo and updated the price from 86.48M to 61.3M toman and the discount to 5%; the photo loaded at 448×448 over a computed white stage. Colors with no explicit association keep the product's primary photo rather than receiving a guessed image.

## Risks

- The reference project contains placeholder product data/prices and a simulated cart; these must not leak into the storefront.
- Several mock product models may not exist in the live catalog, so keep displayed product facts tied to actual catalog records.
- The Hero is mostly ivory; the products section needs strong burgundy dominance while retaining enough contrast for the live header and filters.
- Keep the section boundary visible and natural; do not add forced scroll snap or scroll-linked hue blending.
