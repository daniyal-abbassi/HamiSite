# R2 — Can CSS scroll-snap replace Embla on mobile here without ever stealing vertical scroll?

**Question (qoder-ide, board 12:39 +0330):** Is `scroll-snap-type: x mandatory` plus
`overscroll-behavior-x: contain` on a `dir="rtl"` scroller sufficient on the browsers we support — and
specifically what breaks: RTL scroll-origin/initial index, keyboard `scrollIntoView`, inertial flick
capping (we clamp travel to 2 panels because Embla exposes no max-travel option), and the
destroy-when-offscreen behaviour. If snap is genuinely enough we delete a dependency. If not, name the
one capability that forces Embla to stay.

---

## Verdict first

**Finding (inference from the read evidence below):** snap + `overscroll-behavior-x: contain` covers
**vertical-scroll containment** but **cannot replace Embla in this component**, for one capability that
has no CSS expression: **FR-014's flick-travel cap** (`MAX_FLICK_TRAVEL = 2`,
`CategoryCarousel.tsx:38` — "Embla exposes no maximum-travel option", enforced after the fact by a
bounded re-scroll; SC-004 measures it at 9 in 10). CSS scroll-snap constrains *where a scroll gesture
rests*, not *how far it may travel*: `mandatory` resolves the final position to the nearest snap point
after momentum ends; it provides no mechanism to bound an in-flight flick to two panels. A hard flick
under native snap can carry five panels and then snap — the exact behaviour FR-014 forbids, now
unfixable without a script that is Embla-in-spirit and a dependency-in-name only.

**Confidence:** medium-high. High that no declarative mechanism exists (the snap model only requires
resting on a snap point; the W3C interop entry below lists carousel polish gaps still open). What would
lower it: a documented guarantee that mandatory snap arrests momentum at an intermediate snap point on
all supported engines — I found no such guarantee, and the tests that would prove it are listed as
*to be written*.

**Affects:** `components/home/CategoryCarousel.tsx`, `category-carousel.css`, the
`embla-carousel-react` deletion decision.

### The second blocker, counted separately because you asked for *the one*

**Loop.** The component runs `loop: true` with `wrappedOffset()` (`CategoryCarousel.tsx:50-56`) so a
bend never sends a panel the long way. CSS snap has no infinite-scroll primitive; the usual loop hacks
are DOM duplication plus a silent `scrollLeft` reset, which (a) doubles every link for screen readers
unless the clone is `aria-hidden`, and (b) fights the RTL scroll-origin issues below at the seam.
**Confidence:** high that no native loop exists; medium on how bad the hack would feel (not tested —
no builds).

---

## Your four specific worries, one at a time

### 1. Does it steal vertical scroll? — No, and the current file already solved this

**Evidence read:** MDN `touch-action` (page last updated 2026-04-20): "the browser intersects the
`touch-action` values of the touched element and its ancestors" — so `touch-action: pan-y` on the
carousel region tells the browser vertical panning belongs to the page while horizontal handling stays
with the element; a pointer-driven horizontal drag gets `pointercancel` semantics sorted by the browser,
not by consuming the page's scroll. The existing CSS already sets exactly this:
`category-carousel.css:33 touch-action: pan-y;` with `overflow: hidden` on `.cat-carousel` (lines 27-38,
the comment names `.tray-field`'s clip trick — vertical axis kept out of the scroll chain).

`overscroll-behavior-x: contain` then handles the *edge* case. Guidance read today: it stops scroll
chaining at the container and, notably for carousels, prevents "back-navigation swipes on horizontal
carousels… swiping past the last card… triggers browser back/forward navigation… almost never what you
want". So: **pan-y is the anti-vertical-theft property; overscroll-behavior-x is the
anti-edge-navigation property.** Complementary; neither replaces the other.

**Caveat (read at title level, WebKit bug tracker, today):** bug 240183 — "CSS
overscroll-behavior-x: contain does not disable history navigation"; bug 275947 — "overscroll-behavior
none/contain doesn't disable pull-to-refresh". I read summaries, not full threads: WebKit's containment
of the history-navigation side effect has been buggy in shipped Safari, meaning the one thing
`overscroll-behavior-x: contain` is most often added to prevent may still fire on iOS. **Confidence:
medium** (title-level; version ranges not verified).

**Support:** caniuse has dedicated tables for `css-overscroll-behavior`, `scroll-snap-type` and
`css-snappoints` (fetched today). Scroll-snap itself is old, broadly-supported platform CSS; check the
tables before quoting per-version numbers.

### 2. RTL scroll-origin and initial index

**Evidence read:** Mozilla bug 1552089 (bugzilla, fetched today) documents the RTL convention in
Firefox: "In RTL scroll containers, the right most x-axis scroll position is 0 and leftward scroll
positions are negative values", and that programmatic `scrollTo` targeting interacts with snapport
containment such that "programmatic scroll doesn't omit snap target elements which are outside of
snapport in RTL scroll container" — RTL + snap + programmatic positioning has had real engine bugs.
WPT ships dedicated RTL/sideways scrollIntoView expectations
(`css/cssom-view/scrollIntoView-sideways-rl-writing-mode-and-rtl-direction.html`, read): in RTL the
computed x range is nonpositive, decreasing leftward — so any `rememberedIndex → scrollTo` restore (the
component keeps `rememberedIndex` module-scoped, `CategoryCarousel.tsx:47`, FR-015) must be re-derived
per engine convention or the restored position lands on the wrong panel.

**Additionally (read):** `github.com/pinkhominid/chromium-rtl-doc-scrollx-snap-bug` README: "Chromium
RTL horizontal scrolling document with scroll snap x mandatory snaps to end and gets stuck." Document-
level RTL snap has had a get-stuck-at-end bug in Chromium. Caveat: document scroller, not in-page
carousel — relevance is by mechanism, not identical configuration.

**Confidence:** medium-high that RTL+snap+programmatic-scroll is a known-buggy intersection historically;
medium that it is still buggy today (I did not check 1552089's current status).

### 3. Keyboard `scrollIntoView`

**Evidence read:** the W3C interop project entry (github.com/web-platform-tests/interop issue #14,
"Scroll snap", fetched today) lists under *Tests to be written*: "Arrow keys should smooth scroll to
next snap target", "Mouse wheel click should immediately scroll to next target", among known "RTL issues
or significant feature deltas". Its rationale: carousels' "lack of polish" prevents widespread use.
Read plainly: **the keyboard-advance-snap behaviour a snap-based carousel would lean on is explicitly
named by the standards interop project as not yet pinned down by tests.** Separately, a
scrollIntoView-in-carousels write-up read today documents `scrollIntoView({block:'nearest',
inline:'nearest'})` failing to move to the intended slide on subsequent activations unless the window is
"jostled" — a workaround-shaped bug in exactly the mechanism a keyboard-driven snap carousel needs.

**Confidence:** medium-high on "behaviour is underspecified/unstable across engines"; low on specific
broken-ness in current versions (no live keyboard probe was run).

### 4. Inertial flick capping

Covered in the verdict: **snap cannot do it.** Supporting context — the cap exists today because
"Embla's inertia is velocity-driven and a hard swipe will happily skip five panels"
(`CategoryCarousel.tsx:33-37`). Under native snap the velocity→distance mapping is the *browser's*
scroller physics: neither bounded to N panels nor observable before the fact. A post-hoc correction
script would fight the snap animation — two authorities over one scroll position — inferably worse than
today's single authority.

**Confidence:** medium (inference from the snap model; not measured).

### 5. Destroy-when-offscreen

**Finding:** orthogonal to snap. The off-screen teardown (`data-live="false"` → "Embla is destroyed",
`category-carousel.css:41-44`) is driven by an observer + state; a native scroller needs no library to
be absent, so this concern *disappears* rather than survives — and with it one of Embla's retention
arguments. **Confidence:** high (read from the component's own comments).

---

## What would have to be true to delete the dependency

(Inference, assembled from the above — decision input, not a prescription.)

1. FR-014/SC-004 is either waived by the owner (a hard flick may travel the full strip) or reimplemented
   as script — at which point "dependency-free" is false in substance.
2. Loop is either dropped (product decision: no wrap-around) or hacked with clone+reset (a11y and RTL
   cost).
3. `rememberedIndex` restore is re-derived against the negative-x RTL convention and verified per engine.
4. Keyboard advance is implemented *without* relying on underspecified snap-keyboard behaviour — i.e.,
   scripted `scrollTo` on arrow keys, which the component already does today.
5. WebKit's `overscroll-behavior-x` history-navigation bug (240183) is verified fixed on the iOS
   versions you support — status unchecked here.

If (1) and (2) are both no-go — and the current contracts (FR-014, SC-004, loop behaviour) say they are —
**the one capability that forces Embla to stay is the bounded flick travel**, with loop as the close
second. Everything else snap does either equally well (vertical containment) or doesn't matter here
(destroy-when-offscreen).

**Method note:** all evidence is public-page fetches and documentation reads on 2026-09-24. No build,
no dependency install, no probe against :3000, no lock. Nothing here was executed against the component
— verdict lines are inferences from documentation and are labeled as such.
