# T023 — Contrast sweep result

**Run**: 2026-09-28 ~04:30 +0330 · **Harness**: `tools/contrast-sweep.mjs` (T022) · **Raw data**: `notes/contrast-sweep.json`
**Contract line under test**: **L1** — *"Meaningful text holds its contrast against the ground at **every**
point of every transition, not only at each stage's settled endpoints. Zero failing measurements, not an
average."* · **SC-004** · **FR-015**

**Verdict: PASS.** 0 failing measurements out of 496 node-samples at 360×640 and 558 at 1280×800.

---

## What this is, and what it is not

`notes/ground-sweep.json` already existed in this folder. **It is a different measurement** — it tracks the
ground layer's own luminance as the page scrolls, which answers "does the progression move smoothly". It
says nothing about whether text stays readable over that progression, which is what L1 actually asks. T022
is the second measurement, and it is the one the contract names.

This harness steps the scroll position across the whole document and, at every step, for every probe node:

1. reads the ground layer's rendered `background-color` at that scroll position,
2. walks from the text node up through every ancestor that paints, compositing each translucent
   background over the one beneath it — so a `bg-ink/80` card wash over the moving ground is measured as
   the colour it actually produces, not as either ingredient,
3. stops at the first fully opaque ancestor, because below that the ground cannot matter,
4. computes the WCAG relative-luminance ratio against the text's own colour.

**The ground really does move**, which was the first thing to check — a sweep where the backdrop is static
passes for the wrong reason. 23 distinct rendered tones at 360 px and 31 at 1280 px, from `rgb(58,12,18)`
at the top of the page down to `rgb(22,4,6)`.

## Correction: the first run of this file overstated what was tested

The first version claimed *"no probe had an opaque ancestor, so every sample sits directly on the
progression."* **That was wrong, and the bug was in the harness, not in the page.** The flag that was
supposed to record whether an opaque ancestor stopped the composite was computed with broken logic and
came back false for all 496 samples. The claim was read off that flag instead of off the DOM.

Measured properly, and confirmed by walking the ancestor chain of a real product card:

- `.product-card` paints `rgb(18, 7, 10)` at **alpha 1** — fully opaque.
- So **product name, price, availability label, section heading and the header label are all shielded**.
  The moving atmosphere cannot reach them. Their contrast is a property of their own card, not of L1.
- The first run therefore tested **one** category against the progression and reported it as six.

That is the exact failure mode this whole feature is about: a check that quietly measures nothing and
returns a clean sheet. The harness now records `reachedGround` per sample and the sweep was re-run.

## Results — corrected, and now split by whether the atmosphere can actually reach the text

Only the ground-exposed rows are evidence about L1. The shielded rows are listed because they are
measurements, but they would not move if the ground changed.

| category | worst @360 | worst @1280 | needed | reaches the ground? |
|---|---|---|---|---|
| body copy | **6.49:1** | **6.49:1** | 4.5 | **yes** |
| footer text | 7.23:1 | 7.23:1 | 4.5 | **yes** |
| eyebrow label | 10.26:1 | 10.26:1 | 4.5 | **yes** |
| bare heading | 14.40:1 | 14.40:1 | 3 | **yes** |
| product name | 17.50:1 | 17.50:1 | 4.5 | no — opaque card |
| price | 13.48:1 | 13.48:1 | 3 | no — opaque card |
| availability label | 17.50:1 | 17.50:1 | 4.5 | no — opaque card |
| header label | 16.86:1 | 7.60:1 | 4.5 | no — opaque bar / island |

**12 ground-exposed node-samples per width, 0 failing.** Tightest is body copy at 6.49 against a 4.5 floor.

**Every minimum lands at step 0**, the top of the page, and that is physically correct rather than a bug:
the arc runs from wine toward near-black and the page's text is light, so a light foreground over a
darkening ground gains contrast as you scroll. The weakest moment is necessarily the lightest ground, and
the intermediate tones L1 worries about are strictly better than the endpoint it is measured against.

## What this says about the atmosphere itself

Worth stating plainly, because it was not the question I set out to answer: **most of the page's text is
sealed off from the progression by opaque cards.** The atmosphere is doing its work in the gaps, the
margins, the eyebrows and the footer — not under the product grid. That is a legitimate design, and it
means L1's risk surface is far smaller than the contract's wording implies. But it also means the sweep
should not be cited as proof that the product grid is safe against the ground, because the ground never
touches it.

## Still not resolved

- **`bare paragraph` never resolved** at either width. The selectors tried match nothing visible on `/`, so
  one intended probe category is empty and the sweep is 12 ground-exposed nodes where it was meant to be 15.
  Reported rather than hidden.
- Gradients in a backdrop chain are flagged, not resolved. No sample set the flag in this run.

---

## The threshold is a decision, and here it is recorded

Nowhere in 002's spec, plan, research or contracts is "its legibility threshold" given as a number. Rather
than invent a private figure, this harness applies **WCAG 2.2 AA**: **4.5:1** for normal text, **3.0:1** for
large text (≥ 24 px, or ≥ 18.66 px at weight ≥ 700). That is the standard the rest of the project's
accessibility work already assumes.

It matters because a threshold chosen silently can be loosened silently. If a different bar is intended,
change one constant in the harness and re-run; the raw per-step data is in `contrast-sweep.json` either way.

---

## Against the three reference numbers the task names as protected

| reference | value | this sweep |
|---|---|---|
| cream-on-wine | 10.08:1 | section heading 14.40:1, body copy 6.49:1 |
| brand-ticker band | 12.19:1 | price 13.48:1 |
| 004's smallest emphasised row | 5.66:1 | worst overall 6.49:1 |

Stated carefully: **these are not the same nodes**, so this is a comparison of magnitude, not a re-measurement
of those three. What can honestly be said is that the tightest point this sweep can find (6.49:1) sits above
the tightest reference the project has previously accepted (5.66:1), and that no category falls below any of
the three. It does not reproduce them and does not claim to.

---

## What this does not prove

- **It is one page.** `/` is the only route with a scroll-driven ground; interior pages hold a constant tone
  and `PageGround.tsx` does not even mount the hook for them, by design. Interior pages need their own pass
  before L1 can be called satisfied site-wide.
- **Gradients in a backdrop chain are flagged, not resolved.** A node whose ancestors paint a
  `background-image` gradient gets `gradientUnder: true` in the JSON. No probe in this run set the flag, so
  nothing was skipped — but the limitation is real and would need pixel sampling to close.
- **The probe set is 15–18 nodes, not every text node on the page.** It is a representative set chosen to
  cover the six categories L1 names. A category with no visible instance at a given width is reported as
  missing rather than silently passed — which is what caught the header gap below.
- **Contrast is not the same as legibility.** Persian glyph rendering, line length and the 10 px floor are
  measured elsewhere.

---

## One real gap this found on the way

At 360 px the header probe initially resolved to **nothing**. The desktop nav is `hidden md:block`, so the
only text-bearing header controls on a phone are the search field and two icon buttons — and the first
version of this harness filtered candidates on `textContent.length > 1`, which rejects an `<input>` and an
icon-only `<button>` by construction.

That is the failure mode worth remembering: a probe set that quietly finds nothing at the primary viewport
reports a clean pass. Mobile is the primary experience here, so the filter now admits form controls on
their own terms and measures them against their placeholder/foreground colour, and unresolved categories are
printed as `!! NOT FOUND` instead of passing silently.
