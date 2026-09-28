# Feature 002 — legibility and harm (Phase 5 and Phase 6 evidence)

Run 2026-09-28 against the dev server at `http://localhost:3000`, 360×640 and 1280×800.
Two new instruments:

- `specs/002-scroll-atmosphere/tools/surface-separation.mjs` — contract **L2** (fixed header, each of
  its own appearance states, over every ground tone) and **L3** (product imagery keeps clear
  separation from the ground throughout).
- `specs/002-scroll-atmosphere/tools/content-identity.mjs` — contracts **A2** (reduced motion is
  content-identical), **A3** (silent to assistive technology), **L4** (forced colours) and **G1**
  (the ground is never load-bearing).
- `specs/002-scroll-atmosphere/tools/hidden-document.mjs` — contract **A5** (a hidden document runs
  nothing and is already correct on return).

The reason these are separate from `contrast-sweep.mjs` (T022/T023, which covers L1 text): a sweep
that composites CSS colours cannot measure a photograph. `frame-bleed` puts the photo's own white at
the card's top corners (`app/globals.css:726-732`), so the pixel that meets the ground is a pixel of
the image, and the only honest instrument is one that looks at rendered pixels.

## Verdicts

| Clause | Result | Number |
|---|---|---|
| L2 — header legible in each appearance state | **PASS** | 360: 8 state/probe pairs, worst 7.86:1 against a 4.5:1 floor. 1280: 16 pairs, worst 7.86:1. Measured with the eased scroller confirmed loaded. |
| L3 — product imagery keeps separation | **PASS, thin at 360** | 360: only **2** stage reads, worst **8.57:1**. 1280: 25 reads, worst 16.83:1. Floor 3.0:1 (WCAG 2.2 SC 1.4.11, the bar for an edge a shopper must see). Two reads is a spot check, not a sweep — see the coverage limit at the bottom. |
| A2 — reduced motion content-identical | **PASS** | content hash `bf7368911d7294d2` for baseline, reduced, forced colours *and* ground deleted. |
| A3 — silent to assistive technology | **PASS** | accessibility tree 1700 nodes / 1078 named, **identical** with the layer hidden; no tree node for the ground; `aria-hidden="true"`, no text, not focusable, no role. |
| L4 — forced colours | **PASS** | computed `display: none` on the layer under `forced-colors: active`, content hash unchanged, document height +4px. |
| G1 — ground never load-bearing | **PASS** | deleting the layer changes nothing in the content hash. |
| A5 — hidden document | **mechanism PASS, platform half unobserved** | 0 colour writes in 6s of idle; after a forced stale value, `visibilitychange` restores the colour for the real position (`rgb(18,15,30)`), transition `all 0s`. |

## What the header's two states actually are

`Header.tsx` is not "transparent island, then solid bar" in the way T024 assumed. The bar carries an
opaque `bg-[#0B0204]` when scrolled; the *island* carries an opaque `bg-[#14060A]` on its inner `nav`
when not. In both states every header probe is **shielded by an opaque layer** — the moving ground
never reaches header text at all. That is why the L2 numbers are flat across 17 steps: the clause is
satisfied by construction, and the instrument proves the construction rather than assuming it.

Two facts about that construction are worth keeping, because they bound what L2 can ever mean:

- The island state exists only while `scrollY <= 20` (line 68), so it is reachable over exactly
  **one** ground tone — the top of the arc.
- The header hides itself on downward motion (line 52). A monotonic walk therefore sees "hidden"
  almost everywhere and never tests the bar. The harness arrives, then nudges up 14px — what a
  shopper does — to make the bar appear at each tone. Without that nudge the first version of this
  file reported "solid bar" once at 360 and **never** at 1280, which was an instrument artefact.

## Corrections, kept in

Four false alarms were chased down before believing any of this, and each one is the interesting part:

1. **`scroller: native`, not Lenis.** The assumption that `ScrollSmooth.tsx` eases programmatic
   scrolls is wrong in headless Chromium — it gates on `(pointer: fine)` and `(any-pointer: coarse)`,
   and this browser matches neither. The harness now *detects and prints* which scroller is in play
   instead of assuming, and settles by polling `scrollY` because `html { scroll-behavior: smooth }`
   (`globals.css:127-129`) is enough on its own to make a fixed wait measure a tween.
2. **A 1.01:1 "card dissolving into the ground" was a lie about a clipped rail.** The featured
   products rail scrolls horizontally with `overflow: hidden`; cards scrolled sideways out of it
   still report a rect inside the viewport, sitting on top of whatever *is* painted there. Fixed by
   asking `document.elementFromPoint` who is actually on top before trusting a box. The real worst
   edge at 360 is 8.55:1.
3. **`page.screenshot({ encoding: "base64" })` returns a Buffer in this Playwright build.**
   `String(buffer)` utf8-rendered the PNG into garbage, the browser reported it undecodable, and
   when a `.toString()` was patched away the samples all came back `rgb(0,0,0)` because `deviceScaleFactor`
   is ignored for screenshots — sampling at ×2 on a ×1 image reads outside the canvas, where
   `getImageData` returns transparent black and every edge looks like a perfect tie. The harness now
   derives the scale from the bitmap and treats a transparent read as "could not see", never as black.
4. **"Reduced motion changed the H1" was the instrument reading a motion artefact.** `FlipWords`
   (`components/ui/flip-words.tsx`) stacks every candidate word in one `aria-hidden` sizer and paints
   the current word on top; under reduced motion it "settles on the first word and stops cycling" —
   its own documented behaviour. Comparing raw textContent made A2 fail for the rotator's phase. The
   animated word is now normalised to a token and the *candidate set* is compared instead, so a word
   genuinely disappearing still fails.

## The 240px that is not ours

Document height by condition: baseline 12148px, reduced motion **11908px**, forced colours 12152px,
ground deleted 12148px.

The reduced-motion shortfall belongs to feature 008. Its brand deck gives up its pin travel when
motion is reduced, and its own C8 gate records the same numbers from the other side: 1511px animated
(2.36 screens) versus 1270px static (1.98 screens) — 241px, matching to within a pixel. A2 promises
"same sections, products, prices, links, reading order", none of which changed; document length is
contract **A1**'s subject, and the honest reading is that the homepage is 240px *shorter* to reach
under reduced motion because a different feature stops stacking cards. That is not a 002 defect and
it is not hidden by folding geometry into the content hash — the two are hashed and reported apart,
and this paragraph is the reason.

The +4px under forced colours is unexplained and immaterial to content identity; recorded rather than
rationalised.

## What remains open in these two phases

- **A5's platform half.** Headless Chromium here has no tab occlusion: `bringToFront()` on a second
  tab leaves the first at `visibilityState: "visible"`, `Emulation.setVisibilityStateOverride` does
  not exist, and `Page.setWebLifecycleState: frozen` is accepted and then ignored. The mechanism is
  proven (event-driven, not timer-driven; correct on the return event; no transition to catch up to)
  and the browser's own rAF suspension is not observed. Close it by switching tabs by hand, or
  `--headed` on a machine with a display. **T031 stays unchecked for that reason.**
- **T027** — a section shorter than the viewport resolving to a coherent tone. Not measured.
- **T032** — the low-capability fallback and the `FallbackGround` choice, under CPU throttling.
- **T034** — the fifteen-minute soak.
- **More product edges sampled at phone width.** At 360 the homepage's cards live in a horizontal rail where
  only ~two are painted at once, so raising the step count cannot raise the read count — 31 steps still
  produced 2. The fix is a surface that stacks imagery vertically, not a denser walk of this one.
- `page.accessibility.snapshot()` is gone from this Playwright build; A3 is read off
  `Accessibility.getFullAXTree` over CDP instead, which is the stronger instrument, not a downgrade.

---

## 2026-09-29 — re-run after the background redesign: the ground no longer travels

Everything above this line was measured on the **continuous scroll-driven ground**. That mechanism is gone:
`codex-live-review` moved the colour from one fixed layer onto each section's own background, on the owner's
request for "more visible luxury scroll background transitions" and "separate section backgrounds instead of
continuous scroll tint". The change is committed (`e1dc0fe`'s successor work, tree clean).

Measured twice, because the first instrument disagreed with itself:

- `tools/ground-sweep.mjs` — **declared direction: 0 of 20 steps rise; max seam 0.00000**. The layer's own
  colour was sampled at 13 scroll positions and returned **one value**: `rgb(48, 8, 15)`. It is a static
  rectangle now.
- A direct probe of what is actually painted behind the content at 13 positions — **9 distinct section/colour
  pairs**: `top` 48,8,15 · `featured` 9,9,11 · `categories` 244,241,234 · `brands` 20,22,28 · `new-arrivals`
  244,241,234 · `b2b` 48,8,15 · `online-services` 244,241,234 · `store-experience` 17,17,20.

So the page is **not** monotone — the colour changes more sharply than the old progression ever did. What it
changed from is *continuous* to *discontinuous*: a hard boundary at every section edge, which is precisely what
FR-004 of this feature was written to forbid ("no visible seam, band or step").

**What this does to the evidence above:**

1. **FR-001 and FR-003 are no longer implemented.** There is no scroll-driven progression to measure. This is
   the same category of gap feature 007 just recorded for its pin: a decision made in the tree that the spec
   never caught up with.
2. **Every contrast number above is void.** L1, L2 and L3 were measured against a dark ground. Three sections
   are now near-white paper (`244,241,234`), so text colours chosen for cream-on-wine are sitting on the
   opposite end of the range. The instruments still run — they just no longer measure the promise.
3. **G1 and A3 survived**, and that is not luck: content identity and the accessibility tree do not care where
   the colour comes from. Re-run 2026-09-29: content hash `bf7368911d7294d2` unchanged across baseline, reduced
   motion, forced colours and a deleted layer; accessibility tree 1700 nodes / 1078 named either way.

**Not judged here:** whether hard section boundaries look better than a travelling tint. That is the owner's
call and they made it. What is recorded is that the feature's first four requirements describe a mechanism the
code no longer contains, and that its legibility evidence needs re-deriving against light bands.

**Owner ruling, 2026-09-29, on the question above:** the sectioned colours are kept — "the scroll colours are
fine, there is no problem." The code stands and the requirements are amended (T044). The travelling layer is not
being restored, so the contrast re-derivation in T045 must be run against light paper bands, not against the
dark ground the old numbers assumed.
