# Q3 — Entrance choreography for a server-rendered listing that must not delay LCP

**Question (driver, board 02:48; `research/README.md` Q3):** Current, browser-supported practice — CSS-only
keyframes on first paint, `@starting-style`, View Transitions — and the documented ways each causes a flash
of hidden content or a worse LCP. The products are in the served HTML; a JS-gated reveal would throw that
property away. (Lands as T113; driver's acceptance, board 04:44: three beats, CSS-only, no JS gate,
reduced-motion returns the finished state, first text paint never delayed, and a §5.1 control — curl the
HTML and count the 24 products.)

---

## Finding 0 — the metric mechanics everything else hangs on

**Finding:** LCP is computed from *painted* candidates: an element with `opacity: 0` is **not an LCP
candidate in Chrome**, and reported candidates can only ever *increase* the metric — so if the largest
element (the shop banner on `/shop`) is hidden at first paint and only fades in later, LCP moves to
"when it finally became visible", delay plus transition included. The result is invisible on screenshots
and shows up only in field/lab metrics.

**Evidence:**
- DebugBear, "How CSS Opacity Animations Can Delay The Largest Contentful Paint" (2022): "Chrome doesn't
  count elements with an opacity of 0 as LCP candidates. If the elements are repainted later on this can
  increase the LCP." I could not open the full page from this machine (fetch blocked) — the quote is from
  the search snippet, but the same claim is made independently by two other sources found in the same
  search (savvy.co.il engineering blog, 2026: "Chrome ignores elements with opacity: 0 when calculating
  Largest Contentful Paint"; omeryanbas.com, 2025: "a fade in pushes Largest Contentful Paint out by the
  delay plus part of the [transition]").
- web.dev LCP article: candidates are reported on paint and the metric keeps the *largest*; only user
  interaction stops new candidates. (Fetch of the page itself failed from here; the mechanic is quoted
  consistently across the sources above.)
- **The behaviour is explicitly unspecified for animated opacity** — open spec issue
  w3c/largest-contentful-paint#148 (smfr, opened 2025-09-19): with an opacity keyframe
  `0 → 0 → 1`, "Firefox triggers an LCP when this element first renders, Chrome never triggers an LCP"
  (until it becomes visible); "The spec does talk about the impact of opacity, but not when it's being
  animated." **Confidence: high** on the mechanics, and it means Chrome/Firefox can legitimately report
  *different* LCPs for the same animation — test in both, or make the point moot (recommendation 1).

## Finding 1 — CSS-only keyframes: viable, with one spec trap that fails *invisible*

**Finding:** Keyframes on first paint are the baseline tool: no JS, no hydration, supported everywhere.
The documented failure modes are three, and one of them is the exact opposite of what T113 asks for:

1. **The reduced-motion trap (fails invisible).** If the *base* rule is `opacity: 0` and visibility is
   produced by `animation … forwards`, then `@media (prefers-reduced-motion: reduce) { animation: none }`
   leaves the element at `opacity: 0` **forever** — the "reduced-motion returns the finished state"
   requirement is violated *by the obvious implementation of it*. The safe shape is the inverse: base
   state = final visible state, the keyframe carries `from { opacity: 0; … }`, and
   `animation-fill-mode: backwards` holds the start state during any `animation-delay`. Killing the
   animation then leaves the finished state, which is what the brief demands.
2. **The flash-visible trap (fails visible then hides).** A *delayed* animation without
   `animation-fill-mode: backwards` renders the final state first, then jumps to the keyframe start when
   the delayed animation kicks in — content appears, vanishes, animates. Same fix: `backwards`.
3. **The LCP trap.** `from { opacity: 0 }` on the page's largest element pushes LCP out by delay +
   most of the duration in Chrome (Finding 0). Put the choreography on *below-the-fold grid items*, not
   on the banner/hero that is the LCP candidate — or if the banner itself animates, start it at ≤100 ms
   delay and keep it short.

**Evidence:** mechanics per CSS Animations spec (`animation-fill-mode` determines the outside-keyframe
state; `backwards` applies the `from` frame during the delay period) — spec reading, labeled as such;
the LCP part per Finding 0. **Confidence: high** on the mechanism; the reduced-motion trap is the
direct consequence and is the one to guard-test (a probe with `prefers-reduced-motion: reduce`
emulated asserting computed `opacity === 1` would catch it — that is a §5.1-shaped control the pair can
run; I did not run it, no dev server).

## Finding 2 — `@starting-style`: Baseline-new, and it *fails open*

**Finding:** `@starting-style` (MDN: **Baseline 2024, "Newly available"** — across latest browsers since
August 2024; Chrome 117+, Safari 17.5+, Firefox 129+) defines transient starting values for a *transition*
on first render. Two properties matter for T113:

- **It fails visible, not invisible.** MDN: starting styles are used only "when it is first rendered in
  the DOM"; the element then transitions to its normal state. If the `transition` declaration is missing
  or the engine doesn't support the at-rule, the element simply renders at its final state — worst case
  is *no animation*, never *no content*. That is the opposite failure direction from the
  base-`opacity:0`-plus-keyframes shape, and the reason I would pick `@starting-style` for the banner.
- **Same LCP hole as keyframes.** A transition animating from `opacity: 0` is an animated-opacity case
  (spec issue #148 again): Chrome and Firefox may disagree on when LCP fires. Do not start the LCP
  candidate at opacity 0 with either tool.

**Evidence:** MDN `@starting-style` page, fetched in full 2026-09-24 (quotes above, including "The
`@starting-style` at-rule and the 'original rule' have the same specificity" — declare the
`@starting-style` block *after* the base rule). **Confidence: high.**

## Finding 3 — View Transitions: the wrong tool for first load, harmless if limited to navigation

**Finding:** The single-document View Transitions API (Chrome/Edge 111+, Safari/iOS 18+, Samsung 23+,
Firefox only from **144** — caniuse, global ~91.8%) animates a state *change*: it snapshots old and new
states and cross-fades. On a **first load there is no old state**, so there is nothing to choreograph —
calling it there is inert, not beneficial. For same-origin *navigations* (list → product page), the CSS
`@view-transition { navigation: auto; }` path gives cross-document transitions without JS in Chromium,
and unsupported engines degrade to a plain navigation (fails open). The two costs to know about: the
browser holds the paint while both snapshots are ready — on weak devices that hold is real time — and it
does nothing for the brief's actual problem (first-paint choreography of `/shop`).

**Evidence:** caniuse "View Transitions API (single-document)" support table (read 2026-09-24 — the
Firefox-144 gate is the notable recent change); MDN View Transition API overview (fetch failed from this
machine; behavior summarized from the caniuse description and the API's documented snapshot model).
**Confidence: high** on support numbers; **medium** on the paint-hold cost (from the API model, not from
a measured trace I ran).

## Finding 4 — JS-gated reveal (IntersectionObserver / hydration-gated class): the documented worst case

**Finding:** The brief already bans the JS gate; the mechanics confirm it. A hydration-gated reveal makes
first content visibility depend on JS download + execute on the customer's phone; an IntersectionObserver
reveal additionally holds every below-fold element hidden until scroll. Combined with Finding 0, every
element that would have been the LCP candidate starts the metric clock at its reveal time instead of its
parse time. It also converts the page's strongest property — products present in the served HTML — into
a decoration that may or may not appear (no-JS, blocked JS, slow JS). Nothing here is a judgment call:
for an SSR listing, CSS-only is strictly safer on every axis.

**Evidence:** derived from Finding 0's sources plus the SSR property the brief itself states. Labeled:
**inference from documented mechanics**, not a new measurement.

## What I would tell the implementer (recommendation-shaped; inferences)

1. **Shape every reveal as: base = final state; hidden state lives only inside the keyframe /
   `@starting-style`; `animation-fill-mode: backwards` for delayed beats.** Then every failure mode
   degrades to "no animation, content visible": reduced-motion, unsupported at-rule, missing transition —
   all fail open. This single decision satisfies "reduced-motion returns the finished state" *by
   construction* rather than by a second rule that must be kept in sync.
2. **Keep `opacity: 0`-starts off the LCP candidate.** The banner heading/image on `/shop` should either
   not animate or animate with ≤100 ms delay; the three beats belong to the grid below the fold.
3. **Bound the total choreography** — beats of ~120–200 ms with small staggers, all done well under a
   second — so the largest below-fold content is fully painted quickly even in Chrome's
   animated-opacity accounting.
4. **Verify with two controls, not one** (extends the driver's curl-count): (a) emulate
   `prefers-reduced-motion: reduce` and assert computed opacity/visibility of the animated items equals
   the finished state; (b) reload with animations disabled/unsupported (or strip the animation in the
   DOM) and assert the same — if the assertion passes both ways, the reveal was not actually hiding
   anything, which is its own §5.1 lesson.

## What I could not determine

- A live LCP trace of the current `/shop` (needs the dev server; the pair's probes own it). Whether the
  current banner is already the LCP candidate is unmeasured from here.
- Cross-document View Transitions support beyond Chromium (the `@view-transition` CSS rule's support
  matrix — I read the single-document table; the cross-document table is narrower).
