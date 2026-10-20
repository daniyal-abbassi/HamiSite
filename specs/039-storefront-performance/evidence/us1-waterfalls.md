# T009 — Reader sequencing decision

The frozen product route already meets the 2.5-second fresh principal-content target (baseline median 2115 ms). Its product lookup is needed for the 404 branch; `catalogGeneratedAt()` currently follows that branch so an unknown slug stays a 404 without a second database read. Starting both promises together would spend work on missing products and could change which error wins if metadata fails. No measured product-route waterfall justifies that semantic change, so this candidate is rejected for this pass.

The shop page already runs `buildShopView`, category tiles, and provenance in `Promise.all`. Inside `buildShopView`, counts, category tree, brands and departments run together; the product query intentionally follows slug resolution because an unknown brand/category returns an explicit empty state without a broad unfiltered query. This dependency is preserved. The search/filter interaction baseline is slow (p95 completion 1472/3587 ms), but it does not isolate this server dependency as the cause; US2 traces are the next test.

Source: `baseline-public.json` product samples and `baseline-interactions.json` search/filter samples, build `SI5JalMD_PFquWP7kYRcV`. No application change is attributed to T009. Unknown-slug, sorting and pagination guards remain for T012.
