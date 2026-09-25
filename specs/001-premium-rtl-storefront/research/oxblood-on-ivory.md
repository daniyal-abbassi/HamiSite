# Q4 — Saturated dark red as text on warm ivory, beyond the 11.94:1 ratio

**Question (driver, board 02:48; `research/README.md` Q4):** `#640211` on `#f4f1ea` measures 11.94:1 and
passes everything WCAG asks. What does readability guidance say beyond the ratio — halation on warm
grounds, chromatic aberration at small sizes, long-form versus display use? If the evidence is "fine for
headings, wrong for body", that changes T116's type scale. (Partner's measured inventory, board 03:52: the
oxblood usages are a 14px/700 kicker, a 28px/800 heading phrase, a 14px/700 link, a 12px/400 «۰۱» ordinal
on white, a 12px/400 «SHORT FAQ» label — **no long-form paragraph on the page is oxblood today**; body
copy is ink `#110408` 17.82:1 and `#4a3e3c` 9.10:1.)

---

## Verdict up front (inference built on the findings below)

**Finding:** The evidence does **not** say oxblood-on-ivory is wrong for body copy on luminance grounds —
at 11.94:1 the pair sits far inside every ratio-based band, and the classic reading psychophysics says
luminance contrast dominates legibility with chromaticity secondary. What it *does* say: **red-hued ink
carries two costs a ratio cannot see — a small focusing error (longitudinal chromatic aberration) and
measured visual fatigue — and both scale with text size and duration.** So the practical answer is the
one the partner hypothesised: **fine for headings, display phrases, links and short bold labels; the two
12px/400 oxblood items (the «SHORT FAQ» mono kicker and the «۰۱» ordinals) are the boundary case** —
safe by contrast, mildly softened by aberration for some eyes, and the cheapest place to spend ink
instead if T116 wants headroom. **No type-scale change is forced by the evidence; a one-variable
change would buy margin.**

---

## Finding 1 — The physics: red is the wavelength the eye cannot focus on the retina

**Finding:** Longitudinal chromatic aberration (LCA) in the human eye focuses long-wavelength (red) light
**behind** the retina; the eye accommodates at a compromise around yellow-green. Text whose ink is
red-dominant is therefore slightly defocused for every viewer, worst at small sizes, and worse again for
astigmatic or uncorrected eyes. This is optics, not taste.

**Evidence:**
- Magruder Laser Vision, "What Is Chromatic Aberration": "The red light will get focused (refracted)
  less to end up focusing just behind the retina. This is chromatic aberration inside the eye."
  (magruderlaservision.com, read 2026-09-24.)
- StatPearls/NCBI "Chromatic Aberration" (Manion et al. 2023): the eye's lens "inability to focus all
  colors on the same axis" — the standard clinical description (read 2026-09-24).
- Meng et al. 2026, *TVST* (Effect of Chromatic Aberration on White-Light Contrast): "LCA imposes a
  posterior focal shift for long-wavelength red light" (abstract snippet, read 2026-09-24).
- **Inference (labeled):** `#640211` is red-dominant ink (its sRGB emission is overwhelmingly the R
  channel), so the LCA cost applies to it in full. The cost is *small* — dark ink at 11.94:1 still
  resolves edges far better than the bright-red-on-white case where most "red is unreadable" complaints
  come from — but it is nonzero, and it is largest exactly at the 12px/400 end of the inventory.

## Finding 2 — Measured fatigue: red text is the worst of the tested hues (with a stated confound)

**Finding:** Fan et al. 2024 (*Sensors* 24(11):3516, PMC11175232 — eye-tracking study, 50 participants,
3 days): "text color significantly affects visual fatigue, with **red text causing the highest level of
visual fatigue**"; cognitive performance "worse when using red text".

**The confound you must know before citing this:** their condition was **negative polarity (bright text
on black)** — the opposite polarity of oxblood-on-ivory — and their red was set at the same HSB
brightness/saturation as the other hues, which left it among the **lowest-luminance** inks on their
black ground (luminance contrast 3.00 vs yellow's 6.13 and white's 19.60). So the result may partly be
the WCAG-floor contrast they accepted for red/blue, not hue alone. Hami's pair is dark-ink-on-light at
11.94:1 — the polarity and the contrast cushion are both better than the study's red condition.

**Evidence:** full abstract + method read from PMC 2026-09-24 (contrast table quoted from Table 1).
**Confidence: high** that the study says red fatigues most *under its conditions*; **medium** on
transferring that to oxblood-on-ivory — direction consistent, magnitude unknown.

## Finding 3 — The classic psychophysics: once luminance contrast is high, chromaticity is secondary

**Finding:** The reading-legibility literature (Legge et al.'s psychophysics-of-reading series; Knoblauch,
Arditi & Szlyk 1991 on chromatic vs luminance contrast) establishes that **reading rate is driven
primarily by luminance contrast; chromatic contrast contributes little once luminance contrast is
equated**. A pair at 11.94:1 is deep in the region where those experiments found chromaticity effects
negligible for normal reading.

**Evidence:** cited from the literature from memory of the standard results — **I did not fetch these
papers** (the searches surfaced secondary sources, and fetches of two primary-candidate pages failed
from this machine). Treat this finding as **medium confidence, verify-the-citation-if-it-becomes
load-bearing**. It is the strongest argument that "11.94:1 mostly settles it" is *not* naive.

## Finding 4 — Halation: the wrong worry for this polarity

**Finding:** Halation (the astigmatism halo that fuzzes text) is a **light-ink-on-dark-ground** effect —
the documented accessibility complaint is "white text on black backgrounds creates a visual fuzzing
effect for people with astigmatism called halation" (Level Access, "Astigmatism and Web Accessibility",
read 2026-09-24). Dark ink on a warm light ground is the safe polarity; the ivory `#f4f1ea` is bright
but it is the *background*, and dark-on-light is the configuration astigmatic readers tolerate best.
If anyone on the pair is worried about "halation on warm grounds" for oxblood text — I found no source
supporting that concern at this polarity. The warm-vs-cool ground question does not appear in the
legibility literature I could reach.

**Evidence:** as cited. **Confidence: high** on the polarity asymmetry; the specific warm-ivory angle is
**absence of evidence** (nothing found either way).

## Finding 5 — Colour-vision deficiency: luminance survives, hue does not

**Finding:** Red-green deficiency (protan/deutan, the most common CVDs, ~8% of men) attacks **hue
discrimination, not luminance**. Oxblood at 11.94:1 keeps its full contrast for a colour-blind reader —
they may read it as very dark warm grey, but they read it. The WCAG dimension where CVD actually bites,
1.4.1 Use of Colour ("colour is not used as the only visual means of conveying information",
webaim.org/articles/contrast, read 2026-09-24), is already satisfied by the partner's inventory: oxblood
items are kickers/ordinals/links that carry their meaning in words, not in colour.

**Evidence:** WebAIM contrast article + standard CVD descriptions (read 2026-09-24). **Confidence: high.**

## Finding 6 — Market/practice corroboration

**Finding:** The nearest commercial practice I found in Q1: Technolife (a top-3 Iranian electronics
retailer) ships a campaign band `--section-bg-color:#520408` with `--title-color:#ffffff` — a saturated
dark near-oxblood used **in this exact market, in production** (as a fill with white display text, not
small body text). Print/publishing tradition likewise treats oxblood/burgundy as a display-and-accent
colour, with body copy in ink — which is precisely the division Hami's inventory already implements.

**Evidence:** `competitor-grounds.md` Finding (Technolife), fetched 2026-09-24. **Confidence: high** for
the existence of the practice; the "print tradition" half is general knowledge, labeled **low-medium**.

## What this changes for T116 (recommendation-shaped; inference)

1. **Headings, display phrases, bold kickers, links, CTA fill: oxblood is right and evidence-backed.**
   Nothing found contradicts the partner's committed usage at ≥14px/700.
2. **The two 12px/400 items are the only real boundary.** They are short labels (not long-form), so the
   fatigue/duration concern barely applies; but they sit at the size where LCA softening is most
   visible, in the lightest weight. Two cheap outs, neither a redesign: (a) weight them up one step
   (12px/500–600 reads crisper in red), or (b) move them to ink and keep the accent for display. Either
   is a one-variable change inside `.band-paper`'s `--catalogue-*` scope, exactly the blast radius the
   partner predicted.
3. **Do not adopt oxblood for long-form body copy.** Not because the ratio fails — it doesn't — but
   because long-form is where LCA softening and reading duration compound, every authority reserves the
   darkest, most neutral ink for paragraphs, and the page already has ink at 17.82:1 doing that job.
   The current architecture (oxblood = display, ink = body) is the evidence-aligned one.
4. **If a number is ever needed beyond 11.94:1:** I did not run APCA, so treat as inference: a pair this
   dark clears every ratio-based band with margin; the residual concerns above are exactly the ones a
   ratio cannot express, which is why they are decided by size/weight/duration policy, not by another
   metric.

## What I could not determine

- Primary-source confirmation of the Legge/Knoblauch results (fetch failures; cited from literature
  memory, medium confidence — flagged above).
- Any study of dark red specifically on warm (yellow-tinted) grounds — searches surfaced nothing on
  ground temperature interacting with text hue; the warm-ivory element of this question has no evidence
  base I could find, in either direction.
- Persian-script-specific legibility work on hue (all sources are Latin-script or script-agnostic;
  the cursive joining of Persian would interact with edge softening *worse* than Latin if anything, but
  I found no measurement — **labeled inference, offered as a hypothesis to test, not a finding**).
