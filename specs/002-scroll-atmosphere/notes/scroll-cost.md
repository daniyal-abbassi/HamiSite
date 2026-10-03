# T047 — Production cost of the scroll easing: **UNMEASURED** (the first verdict was invalid)

> **Second status change, same day: the thing this page was measuring no longer exists.** ScrollSmoother
> was replaced by Lenis before this task was re-attempted (`research.md` D10), so every number here
> describes a build that has shipped to nobody. T047 stays open and now has to be run against Lenis, on
> hardware that means something. Note that the cost model changed shape, not just size: the concern named
> in the last section — a fresh transform on a container holding the whole document — is structurally gone,
> because Lenis animates the document's own scroll position instead.

> **The verdict on this page was withdrawn on 2026-09-22.** It read "FAILS FR-009 / FR-015" and it was
> wrong to draw that conclusion, for a reason the owner supplied: **the machine it was measured on is too
> weak to be a benchmark.** Every frame-time number below is a property of that hardware, not of the
> feature. The 5× ratio is not salvageable either — a CPU-bound machine can amplify a compositor cost
> nonlinearly, so a machine with real graphics headroom might show a much smaller multiple, or almost
> none. Whether ScrollSmoother is affordable here is **currently unknown**, not answered.
>
> What survives is the mechanism finding in the last section, which does not depend on the machine.

**Run**: 2026-09-22, production build, headed Chrome on the local X display. 1280×900, 35 wheel steps.

## Three reasons this measurement should not have been trusted

1. **Headless Chrome software-rasterises.** Measured there, the page ran at 75ms median with *no smoother
   at all* — an impossible number, and one that also invalidated the first `will-change` test, because
   what was being measured was CPU rasterisation rather than compositing.
2. **The machine is the bottleneck, not the feature.** Re-run headed with the GPU compositor, the
   smoother-off baseline was 19.9ms. That is a floor set by this hardware, and a lerp layered on top of a
   machine already near it will look catastrophic in proportion in a way it would not on one with
   headroom.
3. **The mitigation table is therefore measuring noise on a saturated system.** Run-to-run the baseline
   moved 109ms → 136ms with no code change between the two runs.

## The measurement

| | median frame | p95 |
|---|---|---|
| Smoother **off** (reduced-motion path, same page) | **19.9ms** | 82ms |
| Smoother **on** | **109.3ms** | 297ms |
| Smoother on, 4× CPU throttle | 212.3ms | 315ms |

**These numbers describe this PC.** They do not describe the shoppers, and FR-009 and FR-015 are about
the shoppers — "a mid-range phone or laptop" is a claim about typical hardware, which this is not. The
easing is neither cleared nor failed by anything on this page.

## Mitigations tried, under real GPU

| Change | median | Verdict |
|---|---|---|
| baseline | 136.5ms | (run-to-run variance vs the 109ms above) |
| `will-change: transform` on `#smooth-content` | 122.0ms | marginal |
| `will-change` + `translateZ(0)` | **97.6ms** | best attempt, still ~5× baseline |
| hide `.gradient-blur` + `.noir-stars` | 123.7ms | not the cause |
| hide the categories carousel | 169.5ms | not the cause (and noise-dominated) |

No mitigation helped meaningfully, but on a saturated machine that result proves very little — you
cannot tell a compositor win from measurement noise when the baseline is already moving 25% run to run.
**The one structural observation that does not need a benchmark:** ScrollSmoother writes a fresh
transform to a container holding the entire 12,554px document every frame, and lowering `smooth` shortens
how *long* the loop runs without reducing what each frame costs. Whether that is affordable is an
empirical question about real hardware, and it has not been answered.

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

## What a real answer requires

The easing stays in the build, **unjudged**, until it is measured somewhere that represents a shopper.
Any of these would settle it and none of them is this machine:

- **The owner scrolls it on the hardware they actually care about** — a normal work laptop, and a real
  Android phone to confirm touch was never touched. This is a feel question as much as a number, and
  "does it feel expensive or does it feel broken" is answered by a hand on the trackpad.
- **A remote/CI browser on a known-spec runner**, so the figure is reproducible and attributable to the
  code rather than to whatever else this PC was doing.
- **Chrome's own frame timings via a trace**, reading compositor and main-thread breakdown rather than
  inferring fps from a `requestAnimationFrame` sampler, which is the crudest instrument available and is
  sensitive to everything else running.

Until then the honest status of FR-009 and FR-015 against the easing is **not yet measured**. The earlier
"do not ship it" recommendation is withdrawn along with the numbers it rested on.
