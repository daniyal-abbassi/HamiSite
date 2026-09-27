# Q6 + Q7 — the arrival, measured

**Contract**: [../contracts/category-masonry.md](../contracts/category-masonry.md) Q6, Q7 · **Tasks**: T021, T022
**Run**: 2026-09-26 18:05 · `node specs/010-categories-masonry-gallery/verification/arrival-probe.mjs` → **9/9 PASS**

The probe is re-runnable and exits non-zero on any failure, so this table is not a snapshot of a moment someone
felt good about.

| Check | Result | Detail |
|---|---|---|
| Q6a arrival plays on first view | PASS | min opacity 0.00 during the wave, all 1 after |
| Q6a no replay on scroll away and back | PASS | returned with all nine at opacity 1 |
| Q6a tiles visible *before* the trigger | PASS | `1,1,1,1,1,1,1,1,1` — the hidden state never exists ahead of its moment |
| Q6b reduced motion | PASS | all 1 immediately, **0** tiles carrying inline styles |
| Q6c1 chunk blocked | PASS | 9 tiles, 9 labels, all visible, distinct heights 288/400/512, `hydrated: false` |
| Q6c2 arrival cleared after itself | PASS | 0 tiles left with inline styles (`clearProps`) |
| Q6d / SC-007 zero layout shift | PASS | `#brands` document top 5565 / 5565 / 5565 before, during, after |
| Q7 blur concurrency | PASS | peak **3** tiles carrying a filter; bound `ceil(0.32/0.12) = 3` |
| Q7 label never blurred | PASS | 0 samples with a filter on any `.cat-card__label` |

## Two errors this probe caught, both mine, both now fixed

**1. The block matched nothing, and the check would have passed on a broken page.**
The first draft aborted any request whose URL contains `CategoryArrival`. In dev Next bundles that component into
the route's own chunk, so no URL matched, nothing was blocked, and the "blocked script" check was measuring a
fully-working page. Retargeted at `**/_next/static/chunks/app/**`, which is what a CDN failure actually looks
like — and it then reported `hydrated: false` alongside nine visible tiles, which is the proof Q6c was supposed to
be in the first place.

**2. Research D4's bound was false as written, and only measurement said so.**
D4 claims "blur capped at 3 tiles at a time", derived as `ceil(RESOLVE_DURATION / STAGGER)`. The arithmetic
described how many tweens *overlap*; it said nothing about how many elements *carry a filter*, because
`gsap.from()` writes its start value to every target the instant the tween is created. Measured: **9 layers
holding `blur(6px)` simultaneously** from the first frame — the exact property the refusal in
`spec.md` FR-011's neighbourhood exists to prevent, and the thing a staggered `from()` looks like it avoids while
not avoiding it.

The fix is `immediateRender: false` on the blur tween, so a tile gets its filter when its own turn arrives.
Re-measured: **3**. There is no visible snap from sharp to soft, because the rise tween holds that tile at
opacity 0 at the moment the blur lands — the two tweens share a stagger, so a tile is never *seen* unblurred and
then blurred.

The probe now asserts `carrying ≤ 3` rather than the looser `animating` count. Sampling at 50 ms makes 4–5
elements appear to change between two samples even when only 3 are ever active, because a tween can finish and
another begin inside one window; `carrying` is the quantity the compositor actually pays for, and it is the one
now bounded.

## What is still not claimed

**No frame rate appears anywhere in this file, and none may be added.** The owner's hardware cannot measure
smoothness honestly in either direction, so the guarantee here is structural: at most three layers blurred at
once, one-time, skippable, and provably absent under reduced motion. If someone later reports "it feels choppy",
the answer is to shorten `RESOLVE_DURATION` or drop the blur, not to argue about fps.
