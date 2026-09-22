# T047 — Production cost of the scroll easing: **FAILS FR-009 / FR-015**

**Run**: 2026-09-22, production build, **headed Chrome on the real X display** so the GPU compositor is
in play. 1280×900, 35 wheel steps of 90px.

## Why the first measurements were wrong, twice

Headless Chrome software-rasterises. Measured there, the page ran at **75ms median with no smoother at
all** — an impossible number for an unthrottled desktop, and one that made every comparison suspect. It
also invalidated the first mitigation test: `will-change: transform` appeared not to help, because the
thing being measured was CPU rasterisation, not compositing.

Re-run headed on `DISPLAY=:0`, the baseline is **19.9ms median (~50fps)**. That is the number to compare
against.

## The measurement

| | median frame | p95 |
|---|---|---|
| Smoother **off** (reduced-motion path, same page) | **19.9ms** | 82ms |
| Smoother **on** | **109.3ms** | 297ms |
| Smoother on, 4× CPU throttle | 212.3ms | 315ms |

**Roughly 5× the frame cost.** At 109ms the page renders about 9 times a second while scrolling, on an
unthrottled desktop, with the GPU attached. FR-009 requires "no visible stutter, jitter, or dropped
frames on a mid-range phone or laptop" and FR-015 requires motion to stay smooth on a mid-range device.
This fails both, and it fails them on the *desktop*, where the easing is the only thing that runs.

## Mitigations tried, under real GPU

| Change | median | Verdict |
|---|---|---|
| baseline | 136.5ms | (run-to-run variance vs the 109ms above) |
| `will-change: transform` on `#smooth-content` | 122.0ms | marginal |
| `will-change` + `translateZ(0)` | **97.6ms** | best attempt, still ~5× baseline |
| hide `.gradient-blur` + `.noir-stars` | 123.7ms | not the cause |
| hide the categories carousel | 169.5ms | not the cause (and noise-dominated) |

Nothing closes the gap. The cost is inherent to what ScrollSmoother does: it writes a fresh transform to a
container holding the entire 12,554px document every frame, so the subtree cannot be treated as one
statically-composited layer. Lowering `smooth` would shorten how *long* the loop runs, not what each
frame costs.

## One real win found on the way

The smoother made an existing inefficiency dominant rather than creating it. `useAtmosphereGround` wrote
`--hami-ground` on **`documentElement`** every frame. A root custom property is inherited by every
element, so each write invalidated style for the whole document. Measured via CDP `Performance` metrics
during a scroll:

| | before | after moving the write to `.hami-page-ground` |
|---|---|---|
| style recalculation | **+3,350ms** | **+288ms** |
| total CPU task time | +7,731ms | +1,476ms |
| script | +215ms | +111ms |
| layout | +29ms | +16ms |

An 11× cut in style recalc, and it stands on its own merits with or without the smoother — the ground
hook was paying that tax on every homepage scroll since it was built. The hook's own header comment
claimed a root write "triggers a style recalculation on one element", which is exactly backwards; that
claim is corrected in the file, and it is the reason the cost went unnoticed.

## Recommendation

**Do not ship the easing as the default.** The options, in the order I'd take them:

1. **Revert to native scroll** and keep the ground progression. The page stays at ~50fps. The owner's
   "smooth and heavy" ask goes unmet, which is a real loss and should be decided by them, not buried.
2. **Ship it behind an explicit opt-in** — a setting the shopper chooses, defaulting off. Honest, and it
   means the premium-feel scroll is available to anyone on hardware that can carry it.
3. **Ship it and accept ~9fps.** Not recommended: a stuttering "luxury" scroll contradicts the brief more
   than a fast native one.

This is a decision about a trade-off the spec did not anticipate, so it is recorded as an open question
rather than resolved by picking one silently.
