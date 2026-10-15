# Implementation Evidence: Persian Typography Refresh

**Feature**: [spec.md](spec.md) | **Started**: 2026-10-15 | **State**: In progress

## Baseline and font provenance (T001–T003)

The rendered `body` family at `/` is `Estedad Variable` followed by Vazirmatn and Tahoma. The hero heading computes to 32px at 390px and 43.52px at 1280px. `app/globals.css` currently defines four variable Arabic/Latin subsets, plus two DM Mono files; total font-file size in `public/fonts/` before this work was about 193 KiB. `tailwind.config.ts` points `font-sans` at `--font-vazirmatn`, whose value currently starts with Estedad. The body uses 1.8 line height and zero letter spacing. `app/(main)/home.css` and `components/shop/shop-luxury.css` add many smaller local sizes, including 9–11px shop labels. A global mobile rule intentionally hides decorative 8–9px microcopy and raises 10px content to 12px.

The following captures use actual local database content. Browser width was 390px for phone and 1280px for desktop; saved images include the browser's scrollbar width. Cart and checkout were observed as guest states, so address/payment form states remain unverified at baseline. The product sample is a current TCH One Pro listing. The homepage is very long, so its desktop baseline is an above-the-fold capture; the other saved captures are full page.

| Screen | Phone baseline | Desktop baseline |
| --- | --- | --- |
| Home | [home-mobile-full.jpg](baseline/home-mobile-full.jpg) | [home-desktop-viewport.jpg](baseline/home-desktop-viewport.jpg) |
| Shop | [shop-mobile-full.jpg](baseline/shop-mobile-full.jpg) | [shop-desktop-full.jpg](baseline/shop-desktop-full.jpg) |
| Current product | [product-mobile-full.jpg](baseline/product-mobile-full.jpg) | [product-desktop-full.jpg](baseline/product-desktop-full.jpg) |
| Guest cart | [cart-mobile-full.jpg](baseline/cart-mobile-full.jpg) | [cart-desktop-full.jpg](baseline/cart-desktop-full.jpg) |
| Guest checkout | [checkout-mobile-full.jpg](baseline/checkout-mobile-full.jpg) | [checkout-desktop-full.jpg](baseline/checkout-desktop-full.jpg) |

Font metadata (`fc-scan`) identifies the shipped Arabic variable files as Estedad and Vazirmatn. Their named upstream families publish SIL Open Font License 1.1 notices: [Estedad](https://github.com/google/fonts/blob/main/ofl/estedad/OFL.txt) and [Vazirmatn](https://github.com/google/fonts/blob/main/ofl/vazirmatn/OFL.txt). The existing Latin DM Mono family has the same [license](https://github.com/google/fonts/blob/main/ofl/dmmono/OFL.txt). Copies are included alongside the shipped files as `public/fonts/OFL-Estedad.txt`, `public/fonts/OFL-Vazirmatn.txt`, and `public/fonts/OFL-DM-Mono.txt`. This checkout did not retain the exact download/build revision for its original WOFF2 subsets, so byte-for-byte upstream provenance cannot be independently reconstructed; no commercial family is introduced.

## Treatment comparison (T004–T006)

Both treatments used the same 390px phone and 1280px desktop routes, product, content, size roles, and weights. Only the first family in `--font-ui` changed. [Revised Estedad captures](comparison/estedad-home-phone.jpg) and [Vazirmatn captures](comparison/vazirmatn-home-phone.jpg) are saved for all five screens:

| Screen | Revised Estedad | Vazirmatn |
| --- | --- | --- |
| Home | [phone](comparison/estedad-home-phone.jpg) · [desktop](comparison/estedad-home-desktop.jpg) | [phone](comparison/vazirmatn-home-phone.jpg) · [desktop](comparison/vazirmatn-home-desktop.jpg) |
| Shop | [phone](comparison/estedad-shop-phone.jpg) · [desktop](comparison/estedad-shop-desktop.jpg) | [phone](comparison/vazirmatn-shop-phone.jpg) · [desktop](comparison/vazirmatn-shop-desktop.jpg) |
| Product | [phone](comparison/estedad-product-phone.jpg) · [desktop](comparison/estedad-product-desktop.jpg) | [phone](comparison/vazirmatn-product-phone.jpg) · [desktop](comparison/vazirmatn-product-desktop.jpg) |
| Guest cart | [phone](comparison/estedad-cart-phone.jpg) · [desktop](comparison/estedad-cart-desktop.jpg) | [phone](comparison/vazirmatn-cart-phone.jpg) · [desktop](comparison/vazirmatn-cart-desktop.jpg) |
| Guest checkout | [phone](comparison/estedad-checkout-phone.jpg) · [desktop](comparison/estedad-checkout-desktop.jpg) | [phone](comparison/vazirmatn-checkout-phone.jpg) · [desktop](comparison/vazirmatn-checkout-desktop.jpg) |

Estedad's heavier Persian shapes retain the brand's editorial character at the revised 700 heading weight. Vazirmatn is clear and neutral, especially for controls, but weakens the shop and hero's premium emphasis on the same hierarchy. Both handle the current One Pro Latin run and Persian digits; neither solves cramped card labels without changing local sizes. **Selected: revised Estedad**, with Vazirmatn as the Persian fallback. This also respects the owner's earlier choice to move away from Vazirmatn as the primary family. The first home Estedad captures caught an unloaded background image, so they were replaced after the image completed; the final files above show the loaded page.

The owner reviewed the five-screen comparison and said the Persian text is acceptable, but the numbers and prices do not fit the premium direction. This rejects the original price treatment for SC-005. The follow-up uses proportional Persian figures at a lighter weight and gives «تومان» a smaller secondary role, while retaining the established Persian formatting and amount values. T028 stays open for the revised five-screen comparison and owner reassessment.

## Owner price-direction follow-up (T030)

The price treatment now separates the canonical amount from its currency unit with a smaller, lower-emphasis «تومان» label. Displayed figures remain Persian and proportional; comparable table values retain tabular alignment. All rendered amounts still come from `formatToman`, and no calculation, amount, or checkout behavior changed. The shared `TomanPrice` presentation is used across storefront cards/details, cart and checkout, home deals, order screens, Telegram mini-app, and partner bundles.

| Same review routes | Revised desktop capture | Notes |
| --- | --- | --- |
| Home | [home](final/home-price-review-desktop.png) | Hero at the same desktop browser viewport; this view has no visible price. |
| Shop | [shop](final/shop-price-revised-desktop.png) | Product cards show proportional Persian figures and a secondary unit. |
| Product | [product](final/product-price-revised-desktop.png) | Product price block shows the revised amount/unit hierarchy. |
| Guest cart | [cart](final/cart-price-review-desktop.png) | Guest cart route captured; no authenticated cart contents were available. |
| Guest checkout | [checkout](final/checkout-price-review-desktop.png) | Checkout redirects to login for this guest session; no checkout totals were available. |

These captures use the same five route set as the earlier comparison, at the available desktop viewport. The browser capture interface did not provide a verified phone or 200% zoom override in this run. T030 is complete for implementation and capture; T028 remains open until the owner reassesses the revised price direction. No claim is made that the owner has accepted the new treatment.

The font files expose variable weights through their `@font-face` declarations. Shared roles use 700 for headings, 400 body, and 500–650 for support/labels. Persian letter spacing remains zero. `tailwind.config.ts` points to one full fallback stack, avoiding duplicate fallback names in computed style; `app/layout.tsx` keeps `lang="fa" dir="rtl"`.

`lib/persian-typography.ts` belongs to the in-progress RTL work. It provides input digit normalization and an alternative price formatter, but that formatter does not share the missing-price guard in `lib/utils.ts`. Shopper-visible card, detail, cart, and checkout prices already use **`formatToman` from `lib/utils.ts`**; this feature keeps that path authoritative and does not alter the RTL helper or canonical numeric input values.

## Implementation and validation

The shared `type-display`, `type-page`, `type-section`, `type-body`, `type-support`, `type-label`, `type-caption`, `type-control`, and `type-price` roles are in `app/globals.css`. The storefront, forms, partner screens, admin inventory, and Telegram cards now use these roles where the old local sizes were cramped. No price calculation, stock state, product name, checkout total, validation message, or payment action was rewritten.

The [20 real product examples](comparison/mixed-script-samples.json) were recorded from `/shop` pages 1 and 2 at 390px. They include `One Pro`, `Poco X7 Pro`, `Bond II 5G … DM-B70104`, `USB-C / لایتنینگ`, `Compact 2045`, percentages, Persian half-spaces, and nine-digit prices. The product-card model label was allowed to wrap instead of truncating its Latin identifier. The heading allows three lines for longer mixed-script names; the full official name also remains on the product link and detail page. A browser recheck of 24 rendered cards found zero missing `تومان` units, zero Latin digits in displayed prices, and zero model-label width overflow. The source name for one Redmi A5 entry ends in a hyphen; this feature preserves that catalog fact rather than inventing a corrected name.

At 320px, a measured 14px nine-digit price needed up to 154px inside a 125px card body. The shop grid now becomes one column below 360px. Re-measurement of eight page-two cards found no price overflow and no document horizontal overflow. At 390px, the two-column grid remains and the sampled price labels fit.

The browser observed four font assets on `/shop`: Estedad Arabic and Latin variable files, plus DM Mono regular and medium Latin files. `document.fonts.status` reported `loaded`; the computed body stack resolves to Estedad, Vazirmatn, Tahoma, sans-serif. No remote font dependency was added. The original font file declarations use `font-display: swap`.

A local reverse proxy blocked all `/fonts/` requests with 404 while forwarding the same production build. The browser reported `document.fonts.check('16px "Estedad Variable"') === false` on [home](final/fallback-home-phone.jpg), [product](final/fallback-product-phone.jpg), [guest checkout/login](final/fallback-checkout-guest-phone.jpg), and [partner](final/fallback-partner-phone.jpg). All four retained visible headings and actions without document overflow at 390px. The authenticated checkout form remains unavailable. A second proxy delayed font responses by 30 seconds; [the home first render](final/delayed-home-fallback.jpg) had `document.fonts.status === 'loading'` and Estedad unavailable while the hero title and primary product link remained laid out. [After load](final/delayed-home-loaded.jpg), Estedad was available and the title rectangle remained 327 × 86.375px at (24, 336.375), the CTA remained 158.297 × 52px at (192.703, 514.344), and document overflow stayed absent. This measured no movement for those essential elements on the sampled home viewport.

For route coverage, an 8-second local font-response delay was applied on separate browser origins so each page made fresh font requests. The [shop](final/delayed-shop-first-render.png), [product](final/delayed-product-first-render.png), and [partner](final/delayed-partner-first-render.png) captures show the visible page content and primary controls during the delayed response. Opening [guest checkout](final/delayed-checkout-first-render.png) redirects to login; its username and password fields remain visible, so this verifies the reachable guest state rather than authenticated checkout. No font failure or layout overflow was visible in these first-render captures. Only home has a saved after-load geometry comparison; the three additional routes were checked for first-render legibility/action presence, not numeric layout-shift deltas.

## Final production review set

These captures came from a fresh `next build` served by `next start`, after the development server's stale chunk was stopped. The root JavaScript chunk returned HTTP 200 and a shop category filter responded to a real browser click with the expected query parameter and `aria-pressed="true"`.

| Route / state | Phone | Desktop |
| --- | --- | --- |
| Home | [phone](final/home-phone.jpg) | [desktop](final/home-desktop.jpg) |
| Shop | [phone](final/shop-phone.jpg) | [desktop](final/shop-desktop.jpg) |
| One Pro product | [phone viewport](final/product-phone-viewport.jpg) · [full page](final/product-phone.jpg) | [desktop](final/product-desktop.jpg) |
| Guest cart | [phone](final/cart-phone.jpg) | [desktop](final/cart-desktop.jpg) |
| Guest checkout, redirected to login | [phone](final/checkout-phone.jpg) | [desktop](final/checkout-desktop.jpg) |

The phone and desktop samples showed no document horizontal overflow. The guest cart and checkout paths cannot demonstrate cart totals, address controls, or payment fields without an authenticated account and cart. The [login error state](final/login-error-phone.jpg) was exercised with an empty form: labels rendered at 14px, the visible fields at 16px, and the error stayed below its field without horizontal overflow at 390px and [desktop](final/login-error-desktop.jpg). The current validation library also emitted the English string `String must contain at least 3 character(s)`; that untranslated copy predated this typography change. The public [partner form phone](final/partner-form-phone.jpg) and [desktop](final/partner-form-desktop.jpg) render 14px labels and 16px inputs without horizontal overflow. A 640px CSS viewport [reflow check](final/partner-form-narrow-reflow.jpg) passed; the in-app browser did not apply its keyboard zoom shortcut, so this is **not** an actual 200% browser zoom result.

The authenticated admin route `/admin/products` redirected this browser session to login. `/tma/products` rendered at desktop width without a Telegram launch context but showed an empty catalog, so it does not verify the real product/order rows. Their shared roles were updated in source and compile, but rendered authenticated admin/TMA data states remain unverified. Actual 200% browser zoom was not attained: keyboard zoom shortcuts did not yield a verifiable zoom level, so the 640px CSS viewport reflow result must not be treated as equivalent.

The consistency pass also changed the login identifier and registration username to `dir="auto"`; these are usernames (their schemas allow arbitrary strings), so their entered script now determines reading order. Phone and password inputs retain their intentional LTR direction. Partner application explanatory text, file guidance, section legends, and submit guidance now use shared label/caption tokens at phone widths instead of 9–12px overrides. The partner bundle card's item list, price units, quota, variant, quantity selector, and action use the same shared type roles as the storefront controls.

## Requirement reconciliation

| Requirement | Result |
| --- | --- |
| FR-001–FR-004, FR-006 | Shared roles, Estedad rights, Persian joining/zero tracking, and core hierarchy implemented; production samples reviewed. Operational content still needs authenticated visual review for FR-003. |
| FR-005, SC-002 | Phone and desktop widths checked; actual 200% browser zoom remains unverified. |
| FR-007–FR-009, FR-011, SC-004 | 20 real mixed-script examples inventoried; 24 rendered cards rechecked with no missing price units, Latin price digits, or model-label width overflow. The existing catalog's trailing hyphen is preserved. |
| FR-010 | Phone/password LTR direction and canonical form values are preserved; username fields use `dir="auto"` because they accept arbitrary scripts. Guest login and public partner fields inspected; authenticated forms remain unverified. |
| FR-012, SC-006 | Blocked font requests passed on four representative guest/public states. Delayed first renders were checked on home, shop, product, partner, and guest checkout/login. Home has an after-load geometry comparison; other route movement is not numerically measured. |
| FR-013, SC-001, SC-005 | Before/after captures are ready. Owner clarity and premium-fit assessment remains pending; SC-001 is limited by unavailable authenticated cart/checkout states. |
| SC-003 | Sampled storefront prices and quantities follow Persian conventions; account/admin/TMA data states remain unverified. |

## Quality gates and handoff

Typography changes are limited to shared roles and font declarations (`app/globals.css`, `tailwind.config.ts`), storefront and purchase UI (`app/(main)/home.css`, `components/home/SectionHead.tsx`, `components/home/DiscountedProducts.tsx`, `components/shop/{shop-luxury.css,CatalogListing.tsx,FilterSidebar.tsx,ProductCard.tsx,ProductDetail.tsx,ProductListRow.tsx}`, `components/cart/{CartLine.tsx,CartPageClient.tsx,CartDrawer.tsx}`, `components/checkout/CheckoutClient.tsx`), shared price presentation (`components/ui/TomanPrice.tsx`), shared controls and auth (`components/ui/{button,input,textarea}.tsx`, `components/auth/{LoginForm,RegisterForm}.tsx`), partner styling (`components/partners/partners.css`, `components/partners/bundles/PartnerBundleCard.tsx`), admin samples (`components/admin/dashboard/sections/CatalogInventorySection.tsx`, `components/admin/ui/Pagination.tsx`, `components/admin/products/ProductForm.tsx`), order and Telegram samples (`components/order/{OrdersListClient,OrderDetailClient}.tsx`, `components/tma/{ProductCard,OrderCard,DashboardMetrics,VariantEditorSheet}.tsx`, `app/(tma)/tma/orders/[id]/page.tsx`, `app/(tma)/tma/products/page.tsx`). This feature also adds three `public/fonts/OFL-*.txt` notices, `.cursor/rules/persian-typography.mdc`, and `specs/038-persian-typography/` evidence. Other modified and untracked paths shown by `git status --short` belong to existing RTL or owner work and were left in place.

- `npm run typecheck`: passed after the consistency fixes.
- `npm run test:unit`: 63 files, 608 tests passed after the consistency fixes; the frontend-only config did not reset the database.
- `npm run build`: passed after the final price implementation. The production server was stopped first, and its `.next` output was moved to `/tmp/hami-typography-price-final-next-20261015` before rebuilding. `next start` was restarted on port 3000; home and shop returned HTTP 200.
- `npm run test:unit`: 63 files, 608 tests passed after the final price implementation.
- `npm run typecheck`: passed after the main typography consistency fixes; the production build also completed its lint/type checks after the final price implementation.
- `git diff --check`: passed after the price follow-up and evidence edits.
- `graphify update .`: completed after the price follow-up (6622 nodes, 10330 edges); reported existing zero-node source-file and missing SQL parser warnings, then regenerated `graphify-out`.

No schema, seed, or API contract changed. The existing in-progress RTL edits and untracked helper were preserved. No files were staged, committed, or pushed. Remaining follow-up: owner acceptance of revised price direction, actual 200% browser zoom, and authenticated cart/checkout/admin/TMA visual review.
