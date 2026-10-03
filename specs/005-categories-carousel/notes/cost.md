# T025 — Frame cost, production build, CPU-throttled

**Run**: 2026-09-22. `npm run build` → `next start -p 3001`, 360×740,
`Emulation.setCPUThrottlingRate: 4`, 70 wheel steps over a region far from the section.
**Measured on a production build, not dev** — feature 004 recorded a 50ms-vs-33ms dev-mode gap that
vanished entirely in production, and dev numbers are not comparable.

| | median frame | p95 | worst frame | frames over 50ms |
|---|---|---|---|---|
| Section **present** | 44.7ms | 388.3ms | 1219.1ms | 70 of 187 |
| Section **removed** | 49.7ms | 487.0ms | 604.3ms | 88 of 178 |
| Δ | **−5.0ms** | **−98.7ms** | +614.8ms | −18 |

**FR-020 / SC-009: the section does not degrade the page.** With the carousel present the page is
slightly *faster* on both the median and the 95th percentile, and produces fewer long frames. The
differences are small enough to be run-to-run variation, which is the honest reading: the correct
conclusion is "no measurable cost", not "the carousel speeds up the homepage".

**One number that is not explained.** The worst single frame is 1219ms with the section present against
604ms without. A plausible cause is the nine badge SVGs decoding together when the section first enters
the viewport, or the `IntersectionObserver` constructing and destroying Embla at that boundary. It is a
single frame during a scroll that contained 70 frames over 50ms either way, so it does not change the
verdict — but it is recorded as unexplained rather than dismissed, and it is the first thing to look at
if a real phone reports jank at this section.

**What this does not cover**: P4's claim that the only per-frame writes are custom properties. That was
verified by reading the code path — `paintArc` writes `--o`, `--d` and `--zi` on nine existing nodes
inside one `requestAnimationFrame`, with no `setState` and no layout read — and not by a trace.
