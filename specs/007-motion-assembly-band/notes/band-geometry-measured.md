# T027 measured — the pin does not exist, and the static band already meets SC-001

**How**: hermes (persistent worker, `hh-hermes`) ran five Playwright probes against the throwaway
`/band-spike` route, which mounts `AssemblyBand` alone. Raw output: `.scratch/t027-out{,2,3,4}.json`,
probes `.scratch/t027-probe{,2,3,4,5}.mjs`. Viewports 360×800 and 1280×900. Captured 2026-09-25/26.

## The numbers

| | 360×800 | 1280×900 |
|---|---|---|
| `.assembly-band__track` height | **2400** | 2500 |
| `.assembly-band__shell` height (its content) | **2345.4** | 1350.0 |
| **real sticky travel** (`track − shell`) | **54.6px** | 1150.0px |
| pin window in scroll | y **96 → 150.6** | 112 → 1262 |
| `animation-range` nominal | **1600** | 1600 |
| scrub actually progressing? | `stack-store` translate stuck at `0px 80px` for all 111 sampled scroll positions | moves (`6.08px -36.51px`) |
| phone link `۰۹۳۳ ۱۲۱ ۴۰۰۰` | **OFFSCREEN**, document top 2229 | OFFSCREEN, top 1290 |
| shop link `مشاهده محصولات` | **OFFSCREEN**, top 2285 | — |
| `MobileDock` box | top **726**, bottom **788** | hidden (`md:hidden`) |

## What that means, in order of severity

1. **There is no pin at 360.** The shell's content is 2,345px against a 2,400px track, so the sticky
   element has 54.6px of travel and the pin lasts from y=96 to y=150 — a **fifty-five-pixel window** in
   which the shopper cannot see the composition's end state at all. My `T013` framing ("a shell taller
   than the viewport never pins") was wrong in its reasoning and right in its conclusion: the shell does
   pin, by 54.6px, which is the same as not pinning.
2. **The scrub is decoupled from the pin by ~29×.** `animation-range: entry 100% exit 0%` nominal range
   is 1,600px; the pin is 54.6px. The `view()` timeline tracks (subject, scrollport), not (track − shell),
   so the four beats never advance during the pin — proven by `stack-store` holding `translate: 0px 80px`
   across all 111 sampled positions. The band would appear as one frozen mid-explosion frame the entire
   time it is on screen.
3. **The immovable layer is not on screen, ever.** The phone number and the shop action sit at document
   y≈2229 and 2285 — below the fold at every one of the 111 samples — while the dock occupies 726–788 of
   the visible viewport. `FR-018` (positional fixity) and `SC-006` (10-of-10 activation) are not at risk,
   they are already failing, and `T040`'s `elementFromPoint` sweep would have reported it.
4. **`SC-001` is met by the static composition alone, with no pin.** The shell's content measures
   **2,345px**, which is 20.8% under the 2,961px the three sections occupy — the criterion passes at
   360 with the mechanism removed. The 2,400px track was only ever padding the page to look compliant.
   At 1280 the same content is 1,350px, and the `calc(100svh + 1600px)` track makes the footprint
   viewport-relative (2,500px there), which is the reason the length criterion must be stated per-viewport
   or dropped.
5. **`--band-track` is a lie of a constant.** `100svh` under-fills by the toolbar height while the toolbar
   is hidden, so even a correct pin would leave the bottom strip as empty track — and the blueprint's
   parenthetical claiming `svh` "never under-fills" is backwards, as the review said. `svh` is the
   *smallest* viewport.

## Also true, and mine

The earlier headless attempt at this same task failed with `ERR_CONNECTION_REFUSED`
(`.scratch/t027-band-geometry.out`, 19:41 UTC): **I had killed the dev server myself** with a `pkill` that
matched its own wrapper command. I attributed that failure to a hermes approval prompt. The approval
theory may still be right in general, but for that run the cause was me, and the persistent worker got the
answer only after I restarted the server in its own session.

## Decision, taken by the Boss and recorded rather than asked

**No pin.** `FR-016`'s "one pinned closing movement" is amended to one *composed* closing movement: the
three closing sections become a single section with a deliberate 360-first arrangement, the word-unit
heading arrival stays (it is cheap, reversible and the part the owner actually pointed at), the sticky
shell, the track constant, `view-timeline` and `@keyframes band-fly` are deleted, and the two actions move
into flow with bottom clearance measured against the dock (788 − 800 = 12px inset plus its 62px height, so
**clear ~90px at 360**, and the dock's own height belongs in a CSS variable rather than a magic number).

`SC-001` then reads: band ≤ **2,400px at 360** — satisfied at 2,345px before any content cut — and the
remaining work is composition quality, not mechanism. `T058` (the `.wrap` z-index ceiling) stops blocking
`FR-018`: with the bar in flow there is nothing to outrank the dock, only clearance to reserve.

Open, unmeasured still: the band's settled look at 360 (does the 4-up capability row survive at 360 or
should it be 2×2 — today `sm:grid-cols-2 lg:grid-cols-4` is inert below 640, so it is a single column of
four full-width cards, which is the flattest possible arrangement), and the SC-002 before-images, which
nobody captured.
