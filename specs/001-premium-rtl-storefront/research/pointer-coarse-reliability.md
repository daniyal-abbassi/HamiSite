# Q2 — Does `@media (pointer: coarse)` actually fire on the devices this shop's customers use?

**Question (driver, board 02:48; `research/README.md` Q2):** Android Chrome, Samsung Internet, iOS Safari,
Android builds without Google services. Any documented case of a phone reporting `fine`, or a touchscreen
laptop reporting `coarse` and getting 44px controls it does not want? T093 moved the whole touch-target
policy onto that query (`app/globals.css:1146`); the question is what it misses.

**What T093 shipped, read off the file (context for the cost analysis):** the `@media (pointer: coarse)`
block at `app/globals.css:1146–1209` does three things: (1) invisible centred `::after` hit-area
expansion to 44×44 on `size-8/9/10` icon controls — explicitly non-painting, no reflow; (2) `min-width`
44 on the two text-only brand wordmark links; (3) `min-height: 44px` on text controls (`button:not(...)`,
`[role="tab"]`, `a[class*="flex"]`, `a[class*="rounded-full"]`) — **the only rule that can change visible
layout**. It is pure CSS, evaluated by the engine before first paint; no JS, no hydration dependency.

---

## Finding 1 — On the mainstream devices Hami's customers actually carry, the query fires correctly

**Finding:** Every mainstream browser on every mainstream phone reports `pointer: coarse` on a
touch-primary device. Android Chrome, Samsung Internet, Firefox for Android, iOS Safari, and de-Googled
Android builds all report `coarse` because the engines read the platform's input-device enumeration —
the value does not depend on Google services in any way I could find.

**Evidence:**
- Patrick H. Lauke's **measured device matrix** (manually verified results per browser/device,
  patrickhlauke.github.io/touch/pointer-hover-any-pointer-any-hover/results/, read 2026-09-24):
  "iOS 13.4 / touch / Safari → pointer:coarse **true**"; "Android 10 / touch / Chrome 81 →
  pointer:coarse **true**"; "Android 10 / touch / Firefox 68 → pointer:coarse **true**".
- caniuse ("Media Queries: interaction media features"): Chrome 41+, Safari 9+, Firefox 64+, Samsung
  Internet 5+, Chrome for Android, Firefox for Android all **supported**; global support 96.97% — the
  unsupported tail is IE and pre-2015 browsers (caniuse.com/css-media-interaction, read 2026-09-24).
- MDN: the feature is "Baseline · Widely available … across browsers since December 2018"
  (developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer, read 2026-09-24).

**Inference (labeled):** the no-GMS case (Huawei/Honor on HarmonyOS/EMUI without GMS, common in the
Iranian market) ships the same engine family — Huawei Browser and Chrome forks are Chromium; Firefox for
Android is Gecko. No source I could find reports any divergence of the interaction media features from
the OS input enumeration on these builds, and I found no bug report of a GMS-less build misreporting.
**Confidence: high** for mainstream Chrome/Samsung/Safari; **medium** for the no-GMS inference (absence
of evidence — I could not test such a device from here).

## Finding 2 — "A phone reports `fine`": essentially documented only for one broken proxy browser

**Finding:** I could not find a mainstream phone or browser where a touch-primary device reports
`pointer: fine`. In Lauke's entire matrix the only coarse-primary device reporting `fine` is **Android +
Puffin Browser (2019)** — labeled "utterly broken" by Lauke himself (it reports `fine`+`hover` even
without a mouse). Puffin is a cloud-proxy browser with negligible share, and in a proxy browser the
engine has no real view of the device's inputs, so no CSS signal could help.

**Evidence:** Lauke matrix row "Android 10 / touch / Puffin → pointer:fine true" with note "Utterly
broken" (read 2026-09-24). Confidence: **high** that mainstream devices are unaffected; **medium** that
no obscure Iranian-market browser misbehaves (I cannot enumerate them all).

## Finding 3 — "A touchscreen laptop reports `coarse`": yes, documented, and currently unfixed in one family

**Finding:** Hybrid misclassification goes the *other* way, and it has a real, partially-live history:

- **Firefox on Windows touch/trackpad laptops reported `coarse` for years** (bug 1638556, opened 2020):
  with no external mouse, `(pointer: fine).matches` returned **false** on ordinary Windows 10 laptops
  with trackpads — caused by a 2018 tablet heuristic (`WinUtils.cpp` counting mouse devices against
  digitizer presence). **Fixed in Firefox 82 (2020)**; RESOLVED FIXED (bugzilla.mozilla.org/1638556,
  read 2026-09-24).
- **Chromium/Edge in Windows tablet mode with a mouse connected still misreports**: Lauke's matrix rows
  "Windows 10 / Surface (tablet mode) + mouse / Chrome 81, Edge 81" show `pointer:coarse true` with
  `any-pointer:fine` **false** — "does not consider stylus nor mouse at all" (tracked as Chromium bug
  1088262 / issue 40277167). The Windows-10-desktop Edge report (techcommunity.microsoft.com, Nov 2022)
  is the same family.
- iPad with attached mouse/trackpad: iPadOS deliberately keeps the touch picture primary
  (`pointer:coarse` even with a pointer attached — bug 209292 for `any-pointer` not updating). Apple's
  own HIG treats touch as not replaced by a pointing device on iPad, so calling an iPad `coarse` is the
  intended outcome, not a defect.

**Evidence:** as cited, all read 2026-09-24. Confidence: **high**.

## Finding 4 — What this means for T093 specifically (inference, with the cost made explicit)

**Inference:** The misclassification that exists today lands on **hybrid desktop-ish devices that get
44px targets they didn't need** — and against T093's implementation, that misfire is nearly free:

1. The main mechanism is an **invisible hit-area expansion** (`::after`, `background: none`,
   `globals.css:1177–1187` "Hit area only — must never paint"): a touch-laptop user gets a bigger
   forgiveness margin; nothing reflows; hover styling is untouched.
2. The only visible change a misclassified desktop gets is `min-height: 44px` on text controls — a
   modestly taller pill/tab. Mild, not broken.
3. The dangerous direction — **a real phone silently keeping 32px controls because it reported `fine`**
   — has no mainstream instance documented anywhere I could find. The only case is a proxy browser where
   no CSS signal exists to be read.

**Confidence: high** on the asymmetry; the residual unknowns are obscure browsers (unknowable from here).

## Recommendation-shaped notes for the pair (inferences)

1. **Keep `pointer: coarse` as the axis.** It is the correct semantic axis (the previous
   `max-width: 767px` was the wrong one — a landscape phone at 844px is still a thumb), support is
   Baseline-wide, and both failure directions cost less than the defect T093 fixed.
2. **Do not add an `any-pointer` OR-branch to catch hybrids.** `(any-pointer: coarse)` is true on every
   touchscreen laptop too — it widens, not narrows, the same misfire, and `any-*` cannot distinguish
   "touch primary" from "touch present". The current query is the tightest correct signal.
3. **The one gap no media query can close:** devices whose browsers lie about inputs entirely (proxy
   browsers). If that class ever matters, the answer is outside CSS (e.g. sizing controls above minimums
   unconditionally). I do not recommend it for this shop: desktop luxury layout would pay for a class of
   device that is close to nonexistent.
4. **Testable claim for the verification scripts, if wanted:** `matchMedia('(pointer: coarse)').matches`
   should be **true** in the existing 360×800 browser probes and **false** at 1280×900 desktop probes —
   that pins which branches of T093 each verification surface is actually exercising.

## What I could not determine

- Live behaviour of current HarmonyOS browser builds (no test device; no bug reports found either way).
- Whether Samsung Internet's current versions changed anything since Lauke's 2020 measurements — his
  matrix predates Samsung Internet 12+; caniuse says "supported" without a correctness caveat, and I
  found no misreport reports since. **Confidence: medium** on the pre-2020→now continuity.
