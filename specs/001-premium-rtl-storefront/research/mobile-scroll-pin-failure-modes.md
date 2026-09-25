# 007 mobile — Documented failure modes of scroll-pinned sequences on the engines our customers use, and which mitigations hold

**Question (driver, board 15:02 +0330, reshaping FR-017):** The owner answered "phone first", so the
question is no longer *whether* phones get the pin. It is *what breaks* — documented failure modes of
scroll-pinned sequences on **Android Chrome, Samsung Internet, iOS Safari, and Android builds without
Google services** — and which mitigations hold on those engines. Load-bearing for spec 007's plan phase.
Scope note: `specs/007-motion-assembly-band/spec.md:332-336` also assigns me FR-011 (pinned-narrative
accessibility) and FR-002 (Persian shaping) — FR-011 evidence that landed while researching this file is
folded in at the end; FR-002 is a separate pass I have not started.

---

## Contradictions and cautions first (most valuable, per the contract)

**1. The failure mode everyone will blame (100vh) is not the one that bites.** In the GSAP forum
thread read today, the working diagnosis is *not* the pinned element's CSS unit: "VH on its own will
not affect or shift the height of the page as you scroll… DVH on its own will affect and shift the
height of the page at the exact moment the toolbar and address bar dis/and re-appear" — and the GSAP
maintainer's root-cause statement: **"`window.innerHeight` does change"** when mobile toolbars
show/hide, so every px-based start/end calculation ScrollTrigger made at refresh time goes stale. The
pin jumps because the *measurement substrate* moved, not (only) because the element resized.
**Evidence:** gsap.com community thread 40393 "ScrollTrigger pin position is jumping on iOS due to its
address bar" (2024-04-07, with reproduction video) and the adjacent kubik101 thread (2023) where Jack
identified `window.innerHeight` as fundamental and shipped a beta converting `100vh` to px on
`refresh()`. **Confidence:** high for iOS Safari (first-party reports with reproductions); medium-high
that Android Chrome shares the mechanism (same `innerHeight` behaviour; no separate Android report found
this pass). **Affects:** spec 007 US2, driver's assembly sequence.

**2. Two mitigations exist and *the community disagrees about one of them*.** GSAP's official answers
in that thread: `ScrollTrigger.config({ ignoreMobileResize: true })` and `normalizeScroll()`. One
reporter: *"Tried ignoreMobileResize: true, but it does nothing!"* while others confirm it fixes the
jump ("Solution applied… no jump now, yay!"). `normalizeScroll()` was reported to work but "hacks the
default scrolling" and was disliked. So `ignoreMobileResize` is the right first mitigation **but not
observed to hold for everyone** — treat it as must-test-on-device, not as solved. **Confidence: medium**
(forum evidence, mixed outcomes, not reproduced here).

**3. Lenis is already in this checkout's motion stack, and its iOS failure history is documented.**
Read today: Lenis issue #288 "Scroll top problem only on IOS" — page loads, user scrolls a little, page
*scrolls itself to top* (Safari and Chrome iOS); the thread's eventual workaround was
`ScrollTrigger.config({ ignoreMobileResize: true })`, and blame ping-ponged between Lenis and
ScrollTrigger ("Your issue might be caused by ScrollTrigger itself"). Lenis issue #454: horizontal loop
on mobile "scroll starts shaking back and forth really fast, or shoots either way with a very high
velocity" when the loop wrap happens mid-touch — **fixed in Lenis v1.3.4** per the thread. Since
feature 002 owns Lenis here and 007's pin sits on top of it: pin + smooth-scroll + toolbar-resize is a
three-body intersection where each component's docs assume it owns the scroll. **Confidence:** high that
the issues are documented; medium that 007 hits them (depends on how the pin is wired). **Affects:**
spec 007, interplay with `lib/atmosphere/**`.

---

## Per-engine failure modes and mitigations (what is *read* vs *inferred*)

### iOS Safari

**Failure modes (read):**
- Toolbar/address-bar show-hide changes `window.innerHeight` mid-scroll → px-based pin start/end go
  stale → **pin jumps** (GSAP thread 40393, recorded video, 2024).
- `100dvh` sizing on the pinned element resizes *at the moment* the toolbar collapses/expands → content
  shift coordinated with the jump (kubik101's measurements: dvh shifts when the toolbar dis/re-appears,
  vh does not — but vh then over-covers on tall screens, since vh = largest viewport).
- Scroll-snap + RTL + programmatic scroll has documented engine bugs (Mozilla 1552089 — relevant only if
  the assembly includes a horizontal strip; see `scroll-snap-vs-embla.md`).

**Mitigations and whether they hold:**
- `ScrollTrigger.config({ ignoreMobileResize: true })` — documented GSAP answer; mixed field reports
  (contradiction 2). **Holds for the resize-jump specifically; does nothing for other failure classes.**
- Size pin geometry in vh/px with refresh-time conversion; avoid `dvh` on the pinned element itself
  (kubik101/GSAP-beta direction). **Holds for element-size shifts; vendor-thread evidence, not spec.**
- `position: sticky`-based pinning instead of a JS-fixed pin: the pure-CSS staged pattern read today
  (Vanilla Breeze `data-stage`) pins with `position: sticky` and *releases the pin under
  `prefers-reduced-motion` and below 60rem to static flow* — no refresh, no px math, nothing to go
  stale on toolbar resize. **Sticky sidesteps the whole innerHeight class of failure because there is no
  measurement to invalidate. Confidence: high as a mechanism; medium that it composes with 007's
  "assembly" needs — a sticky pin cannot re-layout three sections as freely as a scrubbed JS timeline.
  That trade-off is driver's plan-phase call, not mine.**

### Android Chrome

**Failure modes:**
- Same toolbar-resize `innerHeight` refresh mechanism — **inference** (same platform behaviour; GSAP's
  `ignoreMobileResize` is documented for "mobile" generally, not iOS specifically). Confidence: medium-
  high.
- Main-thread cost of JS scroll handlers vs compositor-driven animation: the *widely repeated* claim is
  "CSS scroll-driven animations run off the main thread; scroll listeners do not" — **I did not obtain a
  web.dev/Chromium primary source for it** (that search failed on a connection error and was not
  successfully re-run). Flagged as **unsourced; do not quote me** until someone re-checks it.
- Lenis on Android: issue #288's jump-to-top is iOS-specific in its reports; no Android equivalent
  found. **Absence noted, not asserted safe.**

**Mitigations:**
- CSS **scroll-driven animations** (`animation-timeline: scroll()/view()`) — no JS in the loop, no
  refresh, no innerHeight math; the animation is defined against the scrollport and follows it. This is
  the mitigation that structurally *cannot* hit the resize-jump failure. Support (below) determines where
  it may be the primary path vs the fallback.
- `prefers-reduced-motion`: consistent guidance read today — under `reduce`, release pins / disable
  scroll-coupled motion, keep content in document order, and treat `scroll-behavior: smooth` itself as
  motion to disable. The Vanilla Breeze pattern hard-releases its sticky pin under `reduce`. **Holds on
  every engine** (user-agent media query, not an engine quirk). Maps onto 007's FR-005.

### Samsung Internet

**Failure modes:** no Samsung-*specific* pinned-sequence failure was found in this pass — **absence is a
result**. Samsung is Chromium-based, so the Android Chrome failure classes plausibly inherit —
**inference**, not read.

**Evidence read:** caniuse tables (fetched today) — scroll-driven animations
(`wf-scroll-driven-animations`, `mdn-css_properties_animation-timeline_scroll`): **Samsung Internet 4–22
not supported, 23+ supported; Safari 3.1–18.7 not supported, 26+ supported**; the tables also showed
Chrome and Firefox gaining support in recent majors (exact version numbers on caniuse are moving —
re-check before quoting them into the plan).

**Consequences (inference):** a CSS-scroll-driven primary path silently does nothing on Samsung ≤22 and
Safari ≤18.x — motion that never runs. Per `listing-entrance-lcp.md` Finding 1 (my earlier file), shape
the fallback so failure is **visible-as-finished**, not visible-as-hidden: base = final state, hidden
state only inside the keyframe/`@starting-style` with `animation-fill-mode: backwards`. Same discipline,
new at-rule. **Confidence:** high on the support tables (fetched); medium on "Samsung inherits Chrome
bugs".

### Android builds without Google services (Huawei &c.)

**Finding: I could not find reliable, current engine-version data for these browsers in this pass.**
Targeted searches returned a PWA-compatibility article for Android skins, generic WebView-version
repositories (`frelixir/WebViewUpgrade`, `JonaNorman/WebViewPackage`), and Samsung-focused pages —
nothing stating, for 2026, what Chromium base Huawei Browser and common no-GMS browsers ship. This is
the honest gap: **the engine this population runs is the one we know least about, and it is exactly the
"phone first" audience.**

**What is safe to say (inference, low-medium confidence):** no-GMS Android ships a mix of vendor browsers
and WebViews updated on vendor schedules, historically lagging current Chromium; pin code must be
**feature-detected, never UA-sniffed** — `@supports (animation-timeline: scroll())` for the CSS path,
capability check for any JS pin — and the fallback must be the path that *looks finished* (same rule as
above).

**What would close the gap:** Huawei Browser release notes, a DeviceAtlas/StatCounter-style engine source,
or a real-device check the pair can run. I did not find one today; posting the gap rather than inventing
a number.

---

## Synthesis: which mitigations hold where

| Mitigation | iOS Safari | Android Chrome | Samsung Internet | No-GMS Android | Evidence strength |
|---|---|---|---|---|---|
| `ignoreMobileResize: true` (GSAP) | holds for resize-jump (mixed reports) | holds (same mechanism) | inherits (Chromium) | unknown | medium (vendor forum) |
| `normalizeScroll()` (GSAP) | works but "hacks default scrolling" | works, same caveat | inherits | unknown | medium (forum; one dissatisfied user) |
| Avoid `dvh` on pinned element; vh→px refresh conversion | holds | holds | inherits | unknown | medium (measured in-thread) |
| `position: sticky` pin (no JS measurement) | **holds structurally** — nothing to invalidate | holds | holds | holds | high (mechanism), medium (fits 007's needs) |
| CSS scroll-driven animations as primary motion | Safari 26+ only | recent engines per caniuse (verify version) | 23+ | feature-detect | high (caniuse fetch); gap on older Safari |
| Base = final state + `@starting-style`/fill backwards | fails open everywhere | same | same | same | high (my `listing-entrance-lcp.md`; w3c/largest-contentful-paint#148 context) |
| Release pin under `prefers-reduced-motion` | holds | holds | holds | holds | high (two sources read + reference implementation) |
| Feature-detect, never UA-sniff | — | — | — | **required** | high (driven by the data absence above) |

---

## FR-011 addendum — accessibility of pinned scroll narratives (evidence that landed in this pass)

Read from css-scroll-driven.com's keyboard-access guide and the Vanilla Breeze staged-layout docs:
- **Pinned/stacked content must stay in document order** — sticky/transforms don't reorder DOM;
  implementations that reorder with `order`/absolute positioning break Tab order (2.4.3). "The visual
  stacking must not imply that covered content is unreachable, because it is not."
- **Each animated section must make sense on its own** — "if the next step depends on a state set by
  motion, the design is over-reaching what the pattern supports."
- **Reduced motion = pin released, content flat and complete** — the reference pattern collapses to
  figure-then-narrative in reading order, which is also the mobile reading order (pin element first in
  DOM).
- Keyboard users scroll the document natively; **nested** scroll containers need explicit
  `tabindex="0"` to be keyboard-scrollable — automatic UA focusability "is not universal across engines
  and versions."

**Confidence:** high (two independent sources, consistent). **Affects:** spec 007 FR-011 — this is the
substance the requirement can be written against. FR-002 (Persian shaping) remains untouched by this
file.

---

**Method note:** all sources public fetches on 2026-09-24 (GSAP forums, Lenis GitHub issues, caniuse,
MDN, css-scroll-driven.com, Vanilla Breeze docs, WPT/Mozilla bugs cross-referenced from the snap
research). No build, no dependency install, no :3000 server contact, no locks, no source edits. One
planned search (web.dev scroll-driven performance primary source) failed on a connection error and is
flagged above as unsourced rather than filled in.
