# Contract: Performance and Behavior Preservation

## Route and interaction coverage

| Route key | Selection | Required interactions |
| --- | --- | --- |
| home | `/` | Navigate to shop; visible primary content; scroll to real product sections |
| shop | `/shop` | Search, change filter, sort, switch page, open product |
| category | One existing category URL frozen in manifest | Navigate to a listed product; empty/filtered state where supported |
| product | One existing purchasable product, with variants if available | Gallery, variant, quantity, add to cart |
| cart | `/cart` with approved account and actual test contents | Open drawer, adjust quantity, remove/re-add designated test item, navigate to checkout |
| checkout | `/checkout` with approved account | Review totals, existing shipping selection, validation feedback; stop before payment initiation |
| partner | Actual existing partner bundle route with approved account | Select bundle quantity, inspect correct partner price; use designated test cart if adding |

Planning does not invent slugs or account data. Freeze representative IDs and exact routes during baseline setup. Out-of-stock and unavailable-price examples supplement the primary product sample. Do not substitute guest redirects for authenticated rows.

## Timing protocol

Use the profile in spec.md: 390px viewport, 4x CPU slowdown, 1.6 Mbps download, 750 Kbps upload, 150ms latency; desktop visual comparison at 1280px. Record viewport height and device scale too. Verify settings applied in the recording tool. Capture five fresh visits with browser HTTP cache cleared, preserving the intended authentication session, and five returning visits with normal browser cache and the same session. Keep server warm state consistent. Record cold server behavior separately.

Measure principal content explicitly, with a route-specific visible selector and usable-state condition. Record LCP and CLS separately, ending initial-load observation after visible content has settled; do not use a missing image or placeholder as a success. Capture interactions separately, with at least 20 repetitions per action and reset to the same starting state. p95 feedback and completion timing follow data-model.md. Preserve every failed attempt and retry reason.

Apply SC-001/003 to public entry pages. Apply SC-002 to all defined interactions. Record authenticated page timings even though no absolute content-load threshold is imposed on them; compare regressions and behavior. Laboratory results must never be labeled field p75 INP or real-user Core Web Vitals. Unsupported measurement controls make the affected result unverified.

## Existing interface guarantees

- Preserve shop query parameter keys, filter intersection, unknown-slug refusal, pagination, sort semantics, returned DTO fields, and canonical metadata.
- Product visibility, missing-product 404 behavior, primary images, structured data and nonce handling remain correct.
- `formatToman` remains authoritative for visible currency values; `TomanPrice` presentation, Persian digits, RTL order, and variant selection retain their current meaning.
- No private cross-request cache or change to auth/session/CSP/CSRF behavior. A response belonging to a previous account or obsolete selection must not replace current state.
- Server-side price, availability, authorization, and mutation validation remain authoritative. Preserve existing public freshness and invalidation behavior.
- Drawer splitting must preserve immediate opening feedback, keyboard focus, Escape/close, restored focus, repeated opening, and the successful-add drawer flow.
- Motion reduction, touch-native scrolling, supported themes, and useful visible content must remain available. Do not hide content or remove primary imagery to improve a measurement.

## Acceptance evidence

Store sanitized manifests, all raw samples, trace references, screenshot pairs, SC results, and a measured finding/change matrix under this feature's `evidence/`. Report source observations separately from runtime findings. Credentials and full sensitive request payloads are excluded. Every route has a pass/fail/unverified result; any missing required coverage prevents full-feature completion. Owner visual review is a distinct gate from numerical performance.
