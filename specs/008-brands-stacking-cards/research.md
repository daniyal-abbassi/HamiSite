# Phase 0 Research: Brands Stacking-Card Deck

Nine decisions. Each states what was chosen, why, and what was rejected with the reason — the rejected options
are the point, because this section has already been rebuilt twice and each rebuild re-decided something
without recording it.

Numbers below are arithmetic against the shipped stylesheet, not measurements of an effect that exists yet.
Anything still unproven at the end of this file is flagged as a **gate** in D2 and is the first thing tasks.md
must do.

---

## D1 — Mechanism: CSS `position: sticky` in normal flow, not a pinned scrub

**Decision.** Each card is a normal-flow block with `position: sticky` and an `inset-block-start` offset. The
deck is what the browser produces on its own when six sticky blocks of finite height follow each other: the
first stops, the second climbs over it, and so on. No scroll listener, no animation library, no JavaScript at
all in the stacking path.

**Rationale.**

- It is literally what the owner described. "Each card stay sticky at the top, so the next card appears to
  slide over the previous one" names sticky positioning. The reference is a deck, and a deck is stacking — not
  scrubbing a timeline.
- The four hardest requirements in the spec come free with it. Reload mid-chapter, back/forward restoration,
  an End-key jump past the section, and scrolling backwards all resolve to the correct state because the
  browser owns the position — there is no animation to be in the wrong frame. Feature 007 had to hand-build
  those cases and got two of them wrong.
- **`position: sticky` is currently used nowhere in this codebase** (verified by grep across `app/` and
  `components/`), so it introduces no conflict with an existing sticky layer — and equally, nothing here has
  prior experience with its gotchas, which is why the fit gate in D2 exists.
- It creates no containing block, so it does not disturb `position: fixed` descendants. That is the exact
  failure mode that forced `gsap/ScrollSmoother` out of this project on 2026-09-22: the smoother's transform
  made the ground layer, star field, header and mobile dock have to escape the wrapped subtree
  (`components/atmosphere/ScrollSmooth.tsx:12-31`). Lenis was chosen over it for that reason. Re-introducing a
  transform-based scroll mechanism would undo a decision that already cost a rewrite.
- Lenis is desktop-only and coarse-pointer-gated, and it drives the **real document scroll**. Sticky behaves
  identically with and without it, so the deck does not need to know the easing layer exists.

**Alternatives considered.**

- *GSAP ScrollTrigger with `pin`.* Rejected. `gsap@3.15` is installed, but `ScrollTrigger` is imported nowhere
  in this app, so this would be a new mechanism, not a reuse. Pinning works by taking the element out of flow
  and holding it with a spacer plus transforms — reintroducing the class of containing-block problem above, and
  putting the burden of reload/restore/end-key correctness back on hand-written code. It also buys nothing: the
  visual result is the same stack.
- *CSS scroll-driven animation (`view-timeline` / `animation-timeline: scroll()`).* Rejected. It is the right
  tool for scrubbing a property against progress, which is not this effect, and feature 007 already learned how
  subtle `animation-range` geometry is (`entry 100% exit 0%` being containment-bounded and unreachable for an
  oversized subject). Browser support is a second-order reason, not the first.
- *A JS scroll handler computing offsets per frame.* Rejected outright: it is the only option that can drop
  frames on the shop's actual hardware, and it is the one thing the Constitution's restraint clause argues
  against.

---

## D2 — The fit budget is arithmetic, settled before styling — **this is the gate**

**Decision.** The deck is sized from a budget computed at the smallest case the spec names — **360 × 640** —
and the numbers are fixed in one place so a later change to any of them is visible as a change to the budget.

```
viewport height at the fit case                     640 px
mobile dock clearance (<768px, from feature 007)    − 88 px   (5.5rem)
deepest sticky offset (5 edges × 16 px, see D3)     − 80 px
                                                   ────────
available height for the last card                  472 px
chosen card height                                  460 px   (12 px slack)
```

Chapter length then follows: six cards in flow ≈ 2,760 px, plus the section heading and its vertical padding
≈ 290 px → **≈ 3,050 px ≈ 4.8 screen-heights at 640 px**, inside FR-008's ceiling of 6.5.

**Rationale.** Feature 007 planned a pinned stage at `100svh` and discovered at implementation time that the
usable stage is not `100svh` once browser chrome and the mobile dock are accounted for — its own post-mortem
says the design "fails by geometry, not by coding"
(`specs/007-motion-assembly-band/notes/pin-geometry-review.md:13,51`). Writing the subtraction down first is
the whole lesson.

**The gate.** Before any styling is finalised, one task measures the real card height at 360 × 640 in a browser
and compares it to 460 px. Two outcomes are allowed: the deck fits, or the deck is not shipped and the static
stack is (FR-014). "Close enough" is not an outcome, and neither is "we will tune it later" — that is how the
last attempt reached a 54.6 px travel it had budgeted as 1,600 px.

**Alternatives considered.** *Size cards by content and let the chapter be as long as it needs* — rejected,
because FR-008 exists to stop the deck eating the page. *Use `100svh` as the card height* — rejected: it is
exactly the assumption that failed, and `svh` is the *smallest* viewport, so under a browser toolbar it
under-fills rather than overflows, silently cropping the card's bottom.

---

## D3 — Stack edge: 16 px per card, five edges maximum

**Decision.** Card *i* sticks at `inset-block-start: calc(i * 16px)`. The card behind the active one therefore
shows a 16 px strip, the one behind that another 16 px, and so on — a visible deck edge, five strips deep.

**Rationale.** "Like a deck of cards" means the previous cards remain partly visible; a card that fully hides
its predecessors is a slideshow, and the spec records that reading as an explicit assumption. 16 px is enough
to carry the brand's Latin name at the smallest type size on the page, which is what makes the stack legible as
a stack rather than as a smear. The total cost (80 px) is already inside the D2 budget.

**Alternatives considered.** *A large edge (40–60 px)* — reads as a list of headers, and eats the card height.
*No edge at all (every card at `inset-block-start: 0`)* — the previous card is fully covered, which is the
slideshow reading rejected above.

---

## D4 — Card composition, and why the label goes at the top

**Decision.** Each card carries, in this order: the brand's **mark** (the existing authentic SVG), its
**Persian name**, an optional **one-line story**, and an optional **count**. The mark and name sit in the card's
upper region; the optional content sits below them; nothing reserves space for what is absent.

**Rationale.** FR-007 requires the mark and name to be entirely in view at every sampled point. With sticky
offsets growing downward (D3), the *top* of a card is the one region guaranteed to be visible for the whole
time that card is on top — so the label belongs there, and the optional content belongs at the bottom where it
can be partially covered by the next arriving card without harming anything. This is the reference's own
behaviour: what stays readable in a deck is the header of each card.

It also disarms the defect that triggered this rebuild. Feature 004's rows reserved a fixed 44 px band under
the name that three of the six brands could never fill — an empty frame on half the list, forbidden verbatim by
that feature's C5 and shipped anyway. Content-driven height with the label on top makes that shape
unrepresentable: there is no band to be empty.

**Alternatives considered.** *Label at the card's bottom* — the natural editorial choice, and the one that
would fail FR-007 the moment a card is deep in the stack. *Fixed-height cards with the story vertically
centred* — reintroduces the reserved-space defect in a taller form.

---

## D5 — Counts: shown only when the destination will honour them

**Decision.** A card shows a product count only when the brand's listing actually holds purchasable products;
otherwise no number appears at all. The number comes from `lib/brand-counts.ts`, computed at request time, and
is never authored in a component.

**Rationale.** Measured against the export, only 5 of 189 products are purchasable and two of these six brands
have none. A card reading "۴۹ محصول" over an empty shelf is a false statement to a customer under Constitution
I — and it is precisely the kind of claim a deck of confident-looking cards encourages. Feature 005's category
panels already solved the same problem with a `showsCount` discipline (a panel must neither promise breadth it
lacks nor understate it with a confident small number), so the rule is inherited rather than invented.

Absence must not read as a defect: the card simply composes tighter (D4), which is why height is content-driven.

**Alternatives considered.** *Show zero explicitly* — a number that discourages, and still a claim. *Show the
total catalogue count* — that is the overstatement the rule exists to prevent.

---

## D6 — Paint order and the page's existing z-index ceiling

**Decision.** Cards are ordered by `z-index: calc(var(--stack-i) + 1)` **inside the section's own stacking
context**, created once on the section element. The section itself stays under the ceiling the homepage already
enforces.

**Rationale.** An arriving card must paint over the one it is covering; document order alone does not guarantee
that for sticky elements. But this page already has a hard ceiling: `.wrap` caps its descendants below the
mobile dock (`z-40`) and the header (`z-50`), and feature 007's geometry review found that the ceiling is
load-bearing — a card that escaped it would slide over the header. Creating the stacking context on the section
means the six cards order themselves among themselves and cannot reach above the dock.

**Alternatives considered.** *Rely on DOM order* — works in most browsers today and is not guaranteed; a deck
that mispaints one card looks broken. *Give cards high explicit z-indexes* — that is how the header gets
covered.

---

## D7 — Reduced motion, print, and the fallback switch

**Decision.** Under `prefers-reduced-motion: reduce` and in print, the deck becomes a **static stack**: same
six cards, same order, same composition, `position: static`, separated by a normal gap. One CSS block, no
JavaScript branch, no second component.

**Rationale.** The static stack is not a degraded mode here — it is the same DOM with the mechanism switched
off, which is what makes FR-013 and FR-014 cheap to satisfy and honest to verify. It is also the escape hatch
the fit gate (D2) needs: if measurement says the deck does not fit at 360, shipping the static stack is a CSS
change, not a redesign, and the section still reads as a deck because the cards were composed to look like
cards from the start.

**Alternatives considered.** *A JS media-query branch that rebuilds the list* — two code paths to keep in sync
for a difference that is one property. *Hiding the section under reduced motion* — the brands are a
destination, not a decoration.

---

## D8 — RTL: the deck is vertical, so the risk is elsewhere

**Decision.** All offsets use logical properties (`inset-block-start`, `padding-inline-*`, `margin-inline-*`).
The stack direction is block-axis (downward), which RTL does not invert. Latin brand names inside a Persian
card are wrapped with an explicit `dir="ltr"` run.

**Rationale.** A stacking deck moves along the block axis, so the right-to-left flip that bites most layouts
here does not bite this one — but two adjacent things do. First, any use of physical `top`/`left` in the sticky
offset or the mark's placement will survive LTR testing and misalign in the shipped RTL page. Second, the
brand marks carry Latin wordmarks ("APPLE", "SAMSUNG"); inside a right-to-left line those need an explicit
direction or they reorder. The homepage has been burned by both categories before, which is why this is a
decision and not an assumption.

**Alternatives considered.** *Write physical properties and fix in review* — the defect class is invisible on
an LTR screenshot, so review does not catch it.

---

## D9 — How this is verified, given there is no DOM harness

**Decision.** Split by what can be proven cheaply. **Unit (node, Vitest):** the six brands and their order,
that every card's content is derivable from the data seam, the count rule (D5), and the fit budget as a pure
function of viewport height so the arithmetic in D2 cannot silently rot. **Browser:** geometry — sampled at an
exact 360 × 640 viewport, walking the sequence and recording each card's label rect against the viewport, plus
the reduced-motion and reload-mid-chapter cases.

**Rationale.** The project has no DOM harness and research from feature 002 explicitly refused adding one, so
anything requiring layout must be measured in a browser. The label-clipping requirement (FR-007) is a
measurement, not an assertion, and the project's own trap list says a scroll probe must use
`behavior: "instant"` — `app/globals.css:128` sets `scroll-behavior: smooth`, so a naive `scrollTo()` samples a
page that is still gliding and returns zero useful frames. That is a known false-negative in this repo and the
verification script must defeat it deliberately.

**No frame-rate or smoothness claim is part of acceptance.** The development machine is the one that lost three
agent processes to load average 33 in a single night; a number taken there is a false number whichever way it
lands. The structural choices in D1 (no scroll listener, no per-frame JS, only `transform`-free properties) are
how the plan addresses performance without pretending to measure it.

**Alternatives considered.** *Add Playwright/jsdom for the geometry tests* — out of scope and contrary to the
existing harness decision. *Judge it by eye on the desktop* — the requirement is at 360 px, and the desktop is
where this effect will look fine while failing.
