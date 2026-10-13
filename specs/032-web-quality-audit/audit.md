# Web quality audit — 2026-10-13

## Scope and method

FarsiUI's [Web Quality Audit](https://farsiui.ir/skills/web-quality-audit) links to `addyosmani/web-quality-skills`, revision `afa8da942115f2961fdbfa80807ea0b232ff6c00`. Its two files were installed unchanged under `.agents/skills/web-quality-audit/`; their source hashes match the installed copies. The bundled `scripts/analyze.sh app` returned zero issues and warnings because the app directory contains no standalone HTML files. That result is only a source smoke test.

The live target was the local development server. Browser checks covered the homepage, `/shop`, and one available product detail page at a 1280px desktop width and a 390px mobile viewport. The homepage also received one Lighthouse 13.5 lab audit of accessibility, SEO, and best practices. Development compilation and database logging make this environment unsuitable for speed conclusions. Authenticated checkout, partner, and admin paths were outside this public audit.

### Run conditions and limits

| Run | Reviewer/date | Build, browser, and tools | Targets and access | Viewport, throttling, cache |
| --- | --- | --- | --- | --- |
| Initial browser review | Codex / 2026-10-13 | Local development build; Chromium version was not recorded; Lighthouse 13.5 | Public `/`, `/shop`, and one product detail page; the product slug was not preserved in the first notes | 390px mobile and 1280px desktop; exact device emulation, network throttling, and cache state were not recorded |
| Initial production lab | Codex / 2026-10-13 | Local production build; Lighthouse 13.5 on Node 22.17.0 (below its requested Node version); Chromium version was not recorded | Public `/` only | Lighthouse mobile defaults; exact profile, host CPU load, and cache state were not preserved; Lighthouse reported a slow host CPU |
| Repeat public browser review | Codex / 2026-10-13 | Local production build from `npm run build`; Playwright with headless Chromium 154.0.8037.57 | Public `/`, `/shop`, and `/shop/گوشی-موبایل-تی-سی-اچ-مدل-one-pro-دو-سیم-کارت-ظرفیت-128-گیگابایت-و-رم-6-گیگابایت` | 390×820 and 1280×820 CSS pixels, device scale factor 1; normal local network, new browser contexts; no network or CPU emulation |

The subsequent repeat run below records its own exact slug and conditions. The first run's missing conditions cannot be reconstructed reliably and are not silently treated as equivalent. No authenticated test account, production real-user monitoring, or Search Console access was available in this review.

## Evidence

| Signal | Scope and conditions | Result | Evidence type |
| --- | --- | --- | --- |
| Accessibility | Homepage, Lighthouse mobile default | 100/100; four visible label/accessibility name mismatches in discounted product media links | Lab audit |
| SEO | Homepage, Lighthouse mobile default, development | 92/100; `robots.txt` fetch timed out in this run | Lab audit |
| Best practices | Homepage, Lighthouse mobile default, development | 96/100; guest `/api/auth/me` returned the expected 401 and development bundles had no source maps | Lab audit |
| Performance | Homepage, Lighthouse 13.5 mobile default, local production build, one run | 43/100; FCP 2.98s, LCP 4.33s, TBT 4.52s, CLS 0.001; Lighthouse warned that the host CPU was slower than expected | Lab audit, diagnostic only |
| Accessibility | Homepage, Lighthouse mobile default, local production build | 100/100; discounted-link label mismatch passed with zero affected elements | Repeat lab audit |
| SEO | Homepage, Lighthouse mobile default, local production build | 92/100; `robots.txt` passed, but Lighthouse did not recognize a streamed body description | Repeat lab audit |
| Rendered structure | Home, shop, product detail | Persian RTL, one descriptive H1, page description and canonical URL present; no broken images observed | Browser observation |
| Mobile layout | Home, shop, product detail at 390px | No document-level horizontal overflow observed | Browser observation |
| Crawl access | `/robots.txt` | HTTP 200 with allow/disallow rules and sitemap URL; Lighthouse timeout was not reproduced by a direct request | Direct request |
| Core Web Vitals | Public storefront | No production or field measurements available in this run | Unverified |

### Repeat public journey, 2026-10-13

The repeat production browser check received HTTP 200 for all three routes at both widths. Each rendered a route-specific title, description, canonical URL, one descriptive H1, `lang="fa"`, and `dir="rtl"`. The document scroll width equaled the viewport width (390 or 1280 CSS pixels) in all six visits. The first keyboard Tab reached the visible Persian skip link. A same-page browser flow clicked the shop navigation link and then a product card, reaching the specific product detail route above at both widths; its gallery buttons had Persian accessible names such as `نمای ۱ از ۷`. No uncaught page error or smooth-scroll warning appeared in that flow. The guest session request still logged an expected HTTP 401.

The initial image probe sampled lazy images below the viewport before they were requested. Their incomplete state is not evidence of broken images. The desktop shop checkbox that a simple name heuristic flagged sits inside the visible `فقط پیشنهادهای ویژه` label. A focused accessible-name check remains part of the accessibility repeat check.

### Repeated homepage mobile performance lab, 2026-10-13

Three separate Lighthouse 13.5 navigations used the same local production build at `http://localhost:3000/`. The CLI ran under Node 22.23.2 with Chromium 154.0.8037.57 in headless mode. Its recorded mobile emulation was 412×823 CSS pixels at device scale factor 1.75; simulated network settings were 150 ms RTT and 1638.4 Kbps throughput, with 4× CPU slowdown. Each CLI invocation used a fresh browser process and Lighthouse navigation, so previous page storage was not intentionally reused. The host has four logical CPUs on an Intel Core i5-3380M at 2.90 GHz. These are **lab** results for this host, not field Core Web Vitals or an INP measurement.

| Run | Performance score | FCP | LCP | Total blocking time | CLS | Run warning |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 46/100 | 2.930 s | 4.580 s | 2.482 s | 0.0011 | None reported |
| 2 | 48/100 | 2.593 s | 4.543 s | 2.551 s | 0.0073 | None reported |
| 3 | 48/100 | 2.604 s | 4.479 s | 2.436 s | 0.0082 | None reported |
| **Median (range)** | **48 (46–48)** | **2.604 s (2.593–2.930)** | **4.543 s (4.479–4.580)** | **2.482 s (2.436–2.551)** | **0.0073 (0.0011–0.0082)** | The earlier one-off run warned of a slow host CPU; these three did not |

The repeated LCP and blocking-time concern is tracked in Beads `HamiSite-basic-structure-abi`. Trace inspection and field-data availability determine whether a safe bounded correction is justified.

**Focused trace and decision:** A fourth production Lighthouse run saved its DevTools trace for inspection. Across the three comparable runs, Lighthouse reported initial document response of 380–460 ms, main-thread work of 12.5–13.7 s, JavaScript bootup of 3.3–3.4 s, and estimated render-blocking CSS savings of 1.30–1.66 s under its mobile simulation. The raw trace's longest renderer tasks included a 421 ms `RunTask` and 255 ms `Layout`; its event stack did not identify a specific app component. Lighthouse identified the small header logo as the LCP element in all three runs, so a blanket change to the already eager, high-priority hero image would be poorly supported. Source review found `app/(main)/page.tsx` already prioritizes that hero image, while `components/home/DiscountedProducts.tsx` is a below-fold client rail. These observations point toward browser layout/JavaScript and render-blocking CSS as areas to investigate, but they do not isolate a safe file-level correction. Keep F3 at medium diagnostic severity and the Beads follow-up open; do not assert a field Core Web Vitals failure or alter the performance architecture from this host-only trace.

**Correction decision:** The audited public journeys have no newly confirmed critical or high finding. F1 and F2 received bounded corrections before this repeat audit and now have comparable after-checks. F3 remains unverified for visitor impact, with the evidence gap and follow-up recorded above. No additional application change is justified by this audit round.

### Field-data availability

| Source | Access check | Consequence and verification path |
| --- | --- | --- |
| CrUX / PageSpeed field data | The configured `APP_BASE_URL` for this checkout is localhost; no production origin was identified in the audit context. No origin- or URL-level CrUX population and period can be selected responsibly. | Unverified. With the deployed public origin, query its URL and origin field data and record the 28-day period and p75 LCP, INP, and CLS separately from these lab runs. |
| First-party real-user monitoring | No web-vitals or analytics reporting integration was found in the scoped `app/`, `components/`, `lib/`, and root `package.json` search; no RUM dashboard or credentials were supplied. | Unverified. A project owner can supply a dashboard or export with route population and reporting period. |
| Search Console | No verified property or read access was available to this local audit. | Unverified. Check indexing and Core Web Vitals reports for the actual property when access is supplied; do not infer those states from Lighthouse. |

No row above is a field performance pass or failure. Authenticated checkout, partner, and admin journeys also remain unverified without suitable test credentials.

### Category review and evidence interpretation

| Category | Verified signal | Open limit or next action |
| --- | --- | --- |
| Performance | Three comparable local production mobile labs show 4.479–4.580 s LCP and 2.436–2.551 s total blocking time; CLS stayed below 0.009. | Browser trace and field population are needed before calling this a real-user Core Web Vitals failure; see F3 and `HamiSite-basic-structure-abi`. No INP was measured by the navigation-only lab. |
| Accessibility | The initial discounted-link mismatch was corrected and one production Lighthouse repeat passed; the repeat route flow exposed a keyboard skip link and named product gallery controls. | T008 repeats the affected link-tree and Lighthouse checks. A screen-reader session and broader human keyboard review remain unavailable. |
| SEO | Route-specific titles, descriptions, canonicals, Persian language, and descriptive H1s rendered on the three public targets. A new direct request returned 200 for `/robots.txt` and `/sitemap.xml`; a Googlebot user-agent response contained description and canonical in its `<head>`. | Search Console indexing is unavailable. The browser-mode Lighthouse meta-description diagnostic reflects streaming behavior and does not prove a crawler omission. |
| Best practices | Public navigation returned no uncaught page errors. The guest `/api/auth/me` request returned the expected 401; the earlier development audit's missing source-map diagnostic was development-only. | No production HTTPS, headers, or dependency security review was in this localhost scope. A lab score or console line alone cannot establish a visitor-facing failure. |
| Agentic browsing | The browser exposed named links, a labeled shop checkbox, a skip link, and named product gallery controls; these are direct rendered-semantic observations. | A dedicated Lighthouse Agentic Browsing result and human assistant task trial were unavailable. No claim is made about AI discovery, citation, or search ranking. |

The `robots.txt` timeout in the first development Lighthouse run was not reproduced by direct requests or the earlier production Lighthouse rerun. Source-only concerns remain hypotheses until observed in the browser or an equivalent direct response.

## Findings and changes

| ID | Target and category | Severity / confidence | Evidence type and reference | Visitor impact and next action | Status |
| --- | --- | --- | --- | --- | --- |
| F1 | `/` discounted product links; accessibility | Medium / high | Initial Lighthouse lab mismatch and browser inspection; repeat Lighthouse row above | Spoken or announced link names could omit visible offer text; remove overriding labels and repeat the affected check | Corrected; repeat lab passed, with further tree check in T008 |
| F2 | `/` and route transitions; best practices | Low / medium | Development browser console warning and source inspection; repeat production browser flow | Future smooth-scroll handling could differ on navigation; declare root behavior and repeat a route transition | Corrected; comparable mobile and desktop navigation passed |
| F3 | `/` mobile performance | Medium / medium confidence in lab concern; field impact unknown | Initial and three repeat production Lighthouse labs plus focused trace | Potential delay for visitors; obtain field population and attribute dominant browser work before a bounded correction under Beads `HamiSite-basic-structure-abi` | Unverified for real-user impact; follow-up open |

Severity follows [the report contract](contracts/audit-report.md). F3 is a diagnostic concern, not a confirmed high issue. The crawler metadata and `robots.txt` lab signals are interpreted below rather than asserted as visitor-facing defects because direct-request evidence did not reproduce them.

### Medium — discounted product link names differed from visible labels

- **Impact:** Voice control and screen reader users could hear or speak a link name that omitted the visible offer or discount text.
- **Evidence:** Lighthouse `label-content-name-mismatch` identified the featured media link and three supporting media links on the mobile homepage. All four had an explicit `aria-label` overriding visible content.
- **Change:** Removed the overriding labels. The featured link now gets its name from the visible offer and product caption; its decorative image has empty alternative text. Supporting links use the product image alternative text plus the visible discount.
- **Verification:** Browser inspection after the change confirmed those links have no overriding label and retain their visible product and discount content. Repeat Lighthouse result is recorded below.

**Additional comparable repeat check (2026-10-13):** On the production homepage at 390px, the accessibility tree named the featured media link from visible `پیشنهاد شگفت‌انگیز` plus the product caption, and supporting media links from the product image alt text plus visible discount percentages. For example, one supporting link included its Nokia product name and `٪۱۱`; none of these links had an overriding `aria-label`. A Lighthouse 13.5 mobile accessibility navigation on the same production build scored 100/100; `label-content-name-mismatch` scored 1 with zero affected elements and no run warning. This verifies F1's corrected state for the audited homepage.

### Low — smooth-scroll development warning

- **Impact:** Next.js warned that future route transitions may handle site-wide smooth scrolling differently.
- **Evidence:** The browser console emitted the warning and the root stylesheet sets smooth scrolling on `html`.
- **Change:** Declared the existing smooth-scroll behavior on the root document so the framework can handle transitions consistently.
- **Verification:** The rendered root element has `data-scroll-behavior="smooth"` and the mobile homepage still has no horizontal overflow.

**Additional comparable repeat check (2026-10-13):** In the production build, a browser clicked homepage → shop → the selected product card at both 390px and 1280px. The root retained `data-scroll-behavior="smooth"`, `lang="fa"`, and `dir="rtl"`; document scroll width equaled viewport width on the final route. No smooth-scroll warning or uncaught page error appeared. This closes F2 for the audited flow.

## Interpreting the remaining lab signals

- The development Lighthouse `robots.txt` failure was a local fetch timeout; a direct request returned 200 and the production Lighthouse run passed this check.
- Next.js streams metadata into the body for ordinary browser requests. This explains Lighthouse's production `meta-description` failure. A Googlebot user-agent request received the same description in the initial document `<head>`, as configured by `htmlLimitedBots`; the browser DOM also contained it. The Lighthouse result does not establish that search crawlers miss the description.
- The `/api/auth/me` 401 is the guest session check. Changing that response for a score would alter the authentication contract; its impact needs a separate assessment.
- Missing source maps were reported for development bundles. They are not evidence of a production defect.
- The single production Lighthouse run reported slow LCP and high main-thread blocking time, but also warned about the audit host CPU. This is a lab concern, not proof of field Core Web Vitals failure. Repeat runs, field evidence, and a focused trace are tracked in Beads issue `HamiSite-basic-structure-abi` before changing the performance architecture.
- Search Console status, real-user Core Web Vitals, a screen-reader session, and authenticated journeys were unavailable in this local review. Dedicated Lighthouse Agentic Browsing results were not available; the browser accessibility tree exposed named product links and controls.

## Verification

- Final 2026-10-13 gates after the repeat audit: `npm run typecheck` passed; `npm run test:unit` passed 54 files and 532 tests; `npm run build` passed after the server serving `.next` was stopped. No application source changed between the earlier browser checks and this final build.
- The final built app served `/` with HTTP 200 and a referenced `/_next/static/chunks/webpack-af710f0f473ddfb2.js` with HTTP 200 and JavaScript content (3,532 bytes). This checks that the production HTML points to a loadable client chunk.
- Lighthouse 13.5 mobile production rerun: discounted-link name mismatch passed with zero affected elements; `robots.txt` passed.
- `npm run typecheck`: passed.
- `npm run test:unit`: 54 files and 532 tests passed.
- `npm run build`: passed; the homepage reports 213 kB first-load JavaScript, shop 202 kB, product 205 kB.
- Production browser reload: corrected links rendered, no broken images observed, and a referenced client JavaScript chunk returned HTTP 200.
- `git diff --check`: passed.

## Specification handoff check

| Criterion | Result and boundary |
| --- | --- |
| SC-001: three public journeys, mobile and desktop | Met locally: `/`, `/shop`, and the named One Pro product detail route were visited at 390px and 1280px, including homepage → shop → product navigation. |
| SC-002: every finding has target, evidence, severity, impact, next action | Met for F1–F3 in the findings table. F3's medium severity describes a repeatable lab concern; real-user impact remains unverified. |
| SC-003: repeat checks for fixes | Met for the discounted link names and root smooth-scroll declaration, with comparable production browser checks and a new Lighthouse accessibility result. |
| SC-004: critical/high disposition | No confirmed critical or high issue was found on the audited public journeys. F3 remains a medium lab concern with Beads `HamiSite-basic-structure-abi` open for field data and attribution. |
| SC-005: repeat audit entry | The installed two-file skill, quickstart, report contract, and [shop repeat example](repeat-audit.md) are locatable in this checkout. A local smoke start took well under five minutes. A later HTTP/1.1 retry downloaded both files from the pinned revision into scratch space; their hashes and bytes matched the installed copies. |

This report and [repeat-audit.md](repeat-audit.md) contain the contract's scope, evidence, findings or explicit zero-finding state, correction verification, and uncertainty sections. Authenticated routes, real-user Core Web Vitals, Search Console, and a screen-reader session remain outside the verified scope. At handoff, the two pre-existing application edits remain uncommitted, the feature documents remain untracked, and the six pre-existing screenshot files were preserved. No commit, push, database reset, or reseed was performed.
