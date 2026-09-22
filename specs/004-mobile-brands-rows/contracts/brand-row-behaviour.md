# Contract: Brand Row Behaviour

The observable promise this section makes to a shopper. Implementation is free; this is not. It is the
artifact the quickstart verifies and `/speckit-tasks` decomposes against.

## The section

| # | Contract |
|---|---|
| C1 | Six full-width rows, one per brand, stacked vertically, each visually distinct at rest without any band or colour change. |
| C2 | Each row shows the brand's Persian label and its authentic mark. A row with no mark is not permitted by the current data set; if one is ever added it renders without a visual rather than an invented one. |
| C3 | Each row carries an ordinal in Persian digits, ordered for right-to-left reading. |
| C4 | The set is exactly the six brands that have a real mark, a Persian label, and ≥1 product. It does not silently grow. |
| C5 | Three of the six carry a written story; the other three must not read as lesser — no dimming, no disabled styling, no "coming soon", no empty frame. |

## Press semantics

| # | Contract |
|---|---|
| C6 | Pressing a row navigates to that brand's products on the **first** press. No press is ever intercepted to reveal decoration. |
| C7 | Emphasis is triggered by a separate, separately-labelled control within the row, with its own focus stop. |
| C8 | At most one row is emphasised at a time. Selecting another releases the first in the same frame; there is no moment where both or neither hold emphasis. |
| C9 | Emphasis releases on: same-control press, press outside the section, the section scrolled from view, and navigation away and back. |
| C10 | Emphasis is identifiable within one glance by a shopper who looks away and back. |
| C11 | Expanding a row MUST NOT move the rows below it in a way that removes a target a shopper is aiming at. Resting geometry is stable. |

## Destination correctness — the blocking clause

| # | Contract |
|---|---|
| C12 | Every row destination resolves to a listing containing **at least one product of that brand**, verified against the catalog rather than assumed. |
| C13 | A brand or category parameter that matches nothing MUST produce an explicit unknown state naming what was requested. It MUST NOT render the unfiltered catalogue. |
| C14 | The `/shop?category=…` links on the homepage and in the shop chrome resolve correctly after this change, since they share the defective code path. Amended by T009: the eight latin-slug tiles became **six** tiles on real catalogue slugs, because two had no populated target at all, and the same stale slugs were additionally found in `Footer`, `ShopBanner`, `OnlineServices` and `accessoryCategories` — nine more links, all now drawn from one exported `categoryLinks` object. |

## Motion and accessibility

| # | Contract |
|---|---|
| C15 | Nothing animates while no row holds emphasis, and nothing animates while the section is off screen. |
| C16 | No perpetual loop. Motion comes to rest and settles immediately when interaction stops. |
| C17 | A reduced-motion shopper receives identical brands, labels, marks, stories and destinations, with emphasis expressed as a state change rather than travel. |
| C18 | Keyboard: every row reachable, focus always visible, activation navigates, arrow order matches visual RTL order. |
| C19 | Screen reader: a row announces as a destination; emphasis state is conveyed without borrowing a control role that means something else. |
| C20 | Touch targets are comfortable for a thumb and never sit beneath the fixed header. |
| C21 | Persian text renders with zero letter-spacing. |

## Shared with feature 005 (FR-032 ↔ 005/FR-038)

| # | Contract |
|---|---|
| C22 | One duration scale and one easing family across both surfaces, chosen once. |
| C23 | One emphasis rule: exactly one element holds emphasis, released the same way. |
| C24 | One interaction contract: a press on a selectable destination always navigates. **This is the clause feature 005 must honour in reverse** — its carousel's active panel must navigate on first press too. |
| C25 | One visibility rule: nothing animates off screen; at most one travelling element per page region. |
| C26 | One reduced-motion behaviour, identical in both. |

## Explicitly not contracted

Colour, typography, radii, spacing, row heights, duration values, easing curves, the position of the expand
control, and whether the story area sits above, below or behind the label. Principle IV reserves these to
design.
