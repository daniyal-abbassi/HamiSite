# T003 — Measurement Procedure and Verified Capabilities

**Captured** 2026-10-16 00:12–00:30 (+0330) · **Runner** `specs/039-storefront-performance/verification/probe-capabilities.mjs` · **Raw output** [probe-results.json](probe-results.json)

Purpose: prove, before any baseline capture, that the controls the performance contract
(`contracts/performance-validation.md` §Timing protocol) depends on are actually applied by this
harness — not merely requested — and state exactly what is unsupported. A capability that cannot be
verified makes its result *unverified*; it never becomes a pass.

## Reproduce

```bash
# production server must be serving this checkout's .next build on 127.0.0.1:3000
node specs/039-storefront-performance/verification/probe-capabilities.mjs
```

The runner launches system **Google Chrome 150.0.7871.181** via Playwright 1.61.1
(`/home/lain/tools/pixel-bridge-mcp/node_modules/playwright`), headless, with the machine's
`http_proxy`/`all_proxy` (→ `127.0.0.1:10808`) stripped from the browser env and `--no-proxy-server`.
Without that strip Chromium routes `127.0.0.1:3000` through the proxy and every timing is poisoned —
the first probe run failed with `ERR_PROXY_CONNECTION_FAILED`.

## Verified capabilities

| Control | Requested | Evidence that it is applied | Verdict |
| --- | --- | --- | --- |
| Viewport framing | 390×844, DSF 3 | `innerWidth/innerHeight/dpr` = 390/844/3, scrollbar gutter 0; exported PNG is 1170×2532 (=390×3) | ✅ verified |
| Desktop framing | 1280×800, DSF 1 | exported PNG is 1280×800 | ✅ verified |
| CPU slowdown | rate 4 | identical fixed workload: 36.7 ms free → 145.1 ms at 4x = **3.95×** slower, same result value | ✅ verified |
| Network download | 1.6 Mbps | same 103,322-byte (gzip) chunk: 201 ms free → **675 ms** throttled; measured wire rate 1.23 Mbps | ✅ applied |
| Network latency | 150 ms | 2,418-byte chunk: 69 ms free → 168 ms throttled (Δ ≈ 100 ms/request) | ✅ applied |
| Upload | 750 Kbps | set by the same `Network.emulateNetworkConditions` call that demonstrably throttled download | ⚠️ configured, not independently measured (see Limitations) |
| Screenshot export | 390 and 1280 | `probe-390x844.png` (1170×2532), `probe-1280x800.png` (1280×800) | ✅ verified |
| Trace export (DevTools format) | raw trace | `Tracing.start/end` in `ReportEvents` mode → 810 KB JSON, **2,992 events** | ✅ verified |
| Trace export (Playwright zip) | snapshots + screenshots + network | 741 KB zip written | ✅ verified |
| Reduced motion | `prefers-reduced-motion: reduce` | `matchMedia('(prefers-reduced-motion: reduce)').matches` = **true** in the emulated context and **false** in the primary context | ✅ verified |
| Touch emulation | mobile interaction | `navigator.maxTouchPoints` = 1, `'ontouchstart' in window` = true | ✅ verified |
| Interactivity after server start | hydration | clicking the header cart trigger opens `dialog[aria-label="سبد خرید"]` (client state → render); the drawer closes; a `window` marker survives an in-app link click, so navigation is handled by the client router rather than a full reload | ✅ verified |

Hydration is the check that matters most here, because `curl` 200 proves nothing in this repo
(CLAUDE.md §"Dev server — the stale-build trap"): a server holding a swapped `.next` returns HTML
whose chunk URLs 404, so the page renders and never hydrates. Both HTML and the referenced chunk
returned 200, **and** real controls work.

## Limitations and deviations (recorded, not waived)

1. **Upload throttle is not independently measured.** No benign same-origin POST endpoint exists in
   the app to time a body transfer against, and the defined interactions send small bodies
   (add-to-cart, quantity, partner selection). Expected cost of the largest defined mutation payload
   at 750 Kbps is single-digit milliseconds, so the limit is very unlikely to be binding — but this is
   an expectation, not a measurement, and is recorded as such. Revisit if a US2/US3 interaction shows
   an unexplained floor.
2. **Measured wire throughput is ~77% of the requested 1.6 Mbps** (1.23 Mbps including the 150 ms
   latency on a 103 KB asset). Chrome's throughput emulation is approximate at these durations. The
   useful guarantee is the *paired* one: baseline and final use the same call with the same numbers,
   so the profile is identical across phases even where the absolute cap is soft.
3. **Compression must be discounted.** These chunks are served `content-encoding: gzip`. Counting
   decoded bytes overstated throttled throughput 3.5× in my first attempt and briefly looked like
   "throttling not applied". Wire bytes come from CDP `Network.loadingFinished.encodedDataLength`;
   `performance.getEntriesByName` returned no entries for these fetches and is not relied on.
4. **The machine is not a quiet measurement environment.** 4 cores; during this probe the load average
   was **3.85–5.55** and the top CPU consumers were three `ChatGPT` desktop processes, `chrome`,
   `Xorg`, `gnome-shell` and this agent session itself — not the app under test. Repeat runs of the
   *unthrottled* chunk fetch varied 112 ms → 201 ms on identical input, which is that contention
   showing up. Baseline capture must be serialized (one stream at a time, already required by
   tasks.md) **and** the owner should close the desktop load before T004, or the baseline will not be
   reproducible enough to certify a 20% improvement.
5. Absolute laboratory numbers are laboratory-only; per contract they must never be reported as
   field/user Core Web Vitals.

## Environment drift since the T001 record

The T001 record (`environment.md`) described `next-server` pid 25813. That process no longer exists:
the machine rebooted (user session up 2026-10-15 20:37 +0330, i.e. after that capture). Port 3000 was
empty and `ss -ltn` showed nothing bound; a `curl` to it returned 503 from the local proxy, not from
Next.js — an easy false signal that the app was alive.

Restored per the T001 safe lifecycle, with **no rebuild**: the existing `.next` build was reused and
its identity is unchanged.

| Item | T001 record | Now |
| --- | --- | --- |
| `next-server` pid | 25813 | **12005** (started 2026-10-16 00:12 +0330, same checkout cwd) |
| `.next/BUILD_ID` | `SI5JalMD_PFquWP7kYRc` | **unchanged** — `SI5JalMD_PFquWP7kYRc` (built 2026-10-15 12:35:58) |
| Source commit | `b1fa09ba` | unchanged — `b1fa09ba` |
| Port | 127.0.0.1:3000 | 127.0.0.1:3000 |

Because the build identity is unchanged, the baseline profile in `manifest.json` remains valid and no
re-measurement is forced by the restart. The profile now also has its browser pinned: **Chrome
150.0.7871.181 headless, Playwright 1.61.1**, which replaces the manifest's placeholder
"exact version to be recorded at first capture".

## The tree was not frozen during this session

While T003 ran, another tool installed UI Verify into this checkout: `@playwright/test@^1.64.1` and
`@uiverify/playwright@^1.3.0` dev dependencies, `playwright.config.ts`, `e2e/uiverify-home.spec.ts`,
plus `.mcp.json`, `skills-lock.json`, `.gitignore` and new rules in `AGENTS.md`/`CLAUDE.md`. Nothing
under `app/`, `components/`, `lib/`, `prisma/`, `middleware.ts`, `next.config.mjs` or
`tailwind.config.ts` was touched, and the running production build is unaffected — so no baseline was
invalidated. It does mean the profile's `dirty_diff_identity` ("clean tree; untracked evidence only")
is now false, and it is restated against the real tree in `manifest.json`.

Consequence for T004: **the identity must be frozen at the first baseline sample.** Baseline and final
are only comparable if the tracked source is identical except for the build identity, so anything that
edits source mid-campaign invalidates the affected comparisons. Treat an unexpected `git status` change
during capture the way a cold server start is treated — re-record, do not silently compare.

## Instrument defect found and corrected after the first capture (2026-10-16)

The first T004 capture and the first T005 attempt reported **inflated CLS on every reused-page
(`returning`) sample**. The cause was in the runner, not the app: `capture()` called
`page.addInitScript(INIT)` once per repetition. Playwright accumulates init scripts, so repetition *n*
ran *n* copies of `INIT`; each copy registered its own `layout-shift` PerformanceObserver, and every
observer pushed into the same `window.__perf.shifts` array. The shift list was therefore duplicated
n times.

The signature was unmistakable once plotted: `home returning` read 0.0011, 0.0021, 0.0032, 0.0042,
0.0053 — exactly 1×,2×,3×,4×,5× of 0.0011. `fresh` samples were unaffected because each one gets a
new context and page.

What this did and did not change:

* **`fresh` numbers were never affected** (new page per sample), so the headline medians and every
  SC-001 verdict stand.
* **SC-003 verdicts were never at risk**: the inflated returning values (≤ 0.005) are an order of
  magnitude below the 0.1 limit either way. The one genuinely borderline value, `category fresh`
  CLS 0.098, was measured on a fresh page and is clean.
* **The returning CLS numbers themselves were wrong** and have been re-measured, not reinterpreted.

Both runners were fixed to register the init script and the CDP network listeners **once per page**
(`preparePage()`), with only the per-sample buffers cleared in `capture()`. Both baseline captures were
then re-run in full with the corrected instrument. The contaminated files are kept, not deleted, in
`evidence/archive/` as `*.CLS-CONTAMINATED-2026-10-16.json`, and the corrected runs are the files in
`evidence/`.

## Run-to-run variance across captures (recorded, not smoothed)

The first and second T004 captures disagree on `shop fresh`: **2996 ms → 3298 ms** (≈10%). Machine load
differed (1-minute load 0.59 at the first baseline, 1.7–2.3 at the re-capture). `home`, `category` and
`product` moved by less than 1%. This matters for the ≥20% relative-improvement requirement on routes
above target: a 10% swing is a real fraction of the margin being claimed, so the final comparison must
be taken at a comparable load level to its baseline, and the load is recorded per sample
(`machine_load`) for exactly that reason.

## Capabilities available but not required by T003

`page.screenshot`, CDP `Tracing`, and `context.tracing` all work; `Emulation.setCPUThrottlingRate` and
`Network.emulateNetworkConditions` can be re-set mid-session, so a single runner can capture paired
fresh/returning visits without relaunching. None of this is a claim about *results* — no baseline
sample has been taken yet.
