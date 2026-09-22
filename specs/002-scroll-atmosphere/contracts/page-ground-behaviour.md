# Contract: Page Ground Behaviour

The observable promise this feature makes to a shopper. Implementation is free; this is not. It is the
artifact the quickstart verifies and `/speckit-tasks` decomposes against.

## The progression

| # | Clause |
|---|---|
| P1 | Scrolling the homepage top to bottom passes the ground through more than one tonal state, and the sequence has one discernible direction. A shopper who cannot answer "did the environment change?" has been shown a page that failed. |
| P2 | The change belongs to the page's structure. Stage boundaries are the section boundaries, not arbitrary fractions of document height. |
| P3 | No frame anywhere in the document shows a seam, a band, a visible step, or an instantaneous change. This includes the midpoint of a fast flick that traverses several stages at once. |
| P4 | Pausing at any position leaves the ground looking settled rather than caught mid-fade. |
| P5 | Returning to the top restores the exact initial state. Entering the page at an arbitrary position — reload, back/forward, an anchor jump, an end-key press — shows the correct tone on the first frame, with no catch-up animation. |
| P6 | The page reads as one continuous environment at every position, never as a stack of separately decorated pages. |
| P7 | The boundary between the last homepage section and the footer resolves without an abrupt tone change. |
| P8 | **The page is calmer than it was.** Measured against the existing five-glow field, the result MUST NOT increase perceived busyness. This is the clause most likely to fail the feature, and it is the correct thing to fail on. |

## Scroll feel

| # | Clause |
|---|---|
| S1 | The shopper's own scrolling is native. Nothing intercepts, eases, delays, substitutes for, or re-implements it. What is smooth is the visual response, not the physics. |
| S2 | A key press produces immediate movement at every point of the page, with no perceptible lag. |
| S3 | Touch behaves natively: flick deceleration, stopping mid-gesture, and settling where the gesture intends. Correct under a right-to-left document. |
| S4 | The ground never lags behind the content, overshoots it, or snaps into place after movement stops. |
| S5 | Existing in-page anchor animation still works and lands at the correct ground tone; the two mechanisms do not fight. |
| S6 | The page is no slower to reach, and no slower to become interactive, than it is today. |

## Legibility

| # | Clause |
|---|---|
| L1 | Meaningful text holds its contrast against the ground at **every** point of every transition, not only at each stage's settled endpoints. Zero failing measurements, not an average. |
| L2 | The fixed header stays legible and visually distinct over every ground tone, in each of its own appearance states. |
| L3 | Product imagery keeps clear separation from the ground throughout. Edges do not bleed into the background at any intermediate tone. |
| L4 | Under an operating-system high-contrast or forced-colors preference, legibility is preserved or improved, never compromised. |
| L5 | Where the ground and an existing decorative layer are both visible, they reconcile rather than compete. The existing glow field is left unaltered (Resolved Q2 = C), so the new layer earns its place by what it does to the whole, not by how much it adds. |

## Accessibility and resilience

| # | Clause |
|---|---|
| A1 | A shopper with reduced motion gets distinct settled tones per region with no animated travel, and a page that is not faster or slower to reach. |
| A2 | The reduced-motion page is content-identical: same sections, products, prices, links, reading order. Nobody can tell they received a lesser page. |
| A3 | The effect is silent to assistive technology: no announcements, no focus movement, no change to reading order or document structure. The layer is presentational and marked as such. |
| A4 | A device that cannot sustain the effect sheds it rather than losing responsiveness, and falls back to a deliberately chosen tone, never an unstyled default. |
| A5 | A hidden or backgrounded document runs nothing, and is already correct on return. |
| A6 | Fifteen minutes of continuous up-and-down scrolling leaves the tone-to-position correspondence exactly as it was in the first minute. There is no accumulated state for it to drift in. |

## The clause that outranks the others

| # | Clause |
|---|---|
| **G1** | **The ground is never load-bearing.** No information, state, price, availability, or navigation exists only in the ground. If the effect were removed entirely, the page would remain complete and honest. Every other clause in this document is subordinate to this one, and it is the reason Constitution I is not at risk from a feature whose whole subject is colour. |

## Explicitly not contracted

The number of stages, their colours, their positions, the transition duration and curve, the section
groupings, whether the mechanism is a custom property or a scroll-driven animation, and every other
visual parameter. FR-027 and Constitution IV reserve all of these to design. Two constraints do carry
across from feature 004 and are not free here: the easing family recorded in
`specs/004-mobile-brands-rows/notes/coherence.md`, and the page's standing rule of one travelling element
per region.
