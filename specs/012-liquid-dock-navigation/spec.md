# Feature Specification: Liquid Dock Navigation

**Feature Branch**: `Hami-v3`

**Created**: 2026-09-27

**Status**: Draft

**Input**: User description: "الان برو سراغ نوار منوی پایین در موبایل. اول اینکه آیتم سبد رو پاک کن. و دوم اینکه میخوام ازین استایل برای جا به جایی بین آیتم هاش استفاده کنی و هرجا که بنظر مناسب میاد — https://github.com/arknow91/liquid-taffy" (Go to the mobile bottom nav bar. First, delete the cart item. Second, use this style for moving between its items, and wherever else you think it fits.)

## What the reference actually is, and what is being adopted

`liquid-taffy` is described by its own author as a **"reference implementation, not a package"** — it cannot be
installed, and nothing about it is being vendored. What it demonstrates is three interactions sharing **"one
trigger, one visual language, and — literally — one gesture engine"**:

| Reference interaction | Its behaviour | Adopted here? |
|---|---|---|
| Anchored dropdown | a menu that "hangs above itself" | **No** — nothing on this storefront is a hover menu that could hang |
| Morphing dropdown | the trigger "becomes the dropdown, stretching upward" | **No** — the account control is a set of links, not a morphing surface |
| Speed dial | "droplets launching past full size" | **No** — the bar's dial entry is one `tel:` request; a speed dial needs ≥2 actions behind it |
| **The travelling body** | one shape that leaves its slot, thins into a neck across the gap, and snaps into the next | **Yes — this is the request** |

So the adoption is narrow and specific: **the selection marker becomes one body of material that travels**,
instead of what exists now, which is a background colour fading onto whichever tab is current. The reference's
**procedurally synthesised click sounds are explicitly not adopted** — an audible storefront is not a premium
signal in this market, it is a surprise, and there is no precedent for it anywhere in the app.

Two ideas from the reference are carried across as *principles* rather than as effects, and they are the ones
that make this safe to build:

1. **"One thing kept in two halves that cannot disagree."** The reference refuses to let a surface's colour be
   stated twice. Applied here: the travelling body and the label it sits under draw from the *same* token, so
   they are physically incapable of disagreeing about which tab is current.
2. **`prefers-reduced-motion` adapts the effect** rather than cancelling the information. Applied here: the
   marker must still be in the right place.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The cart leaves the bar, and stays reachable (Priority: P1)

A shopper on a phone opens the site. The bottom bar has five destinations, not six: خانه, فروشگاه, همکاری,
تماس, حساب. «سبد» is gone. Nothing else about the bar changes yet.

They can still get to what they were buying. The header carries a cart control on every page at every width,
and it opens a drawer that already offers both «مشاهده سبد» and «تسویه حساب». The count that used to ride on
the bar's tab now rides on that control instead.

**Why this priority**: it is the part the owner asked for in one imperative sentence, it is worth shipping on
its own, and it is the only part of this feature that changes what destinations exist. Everything else in this
spec is presentation.

**Independent Test**: on a 360 px viewport, walk all five bar destinations plus a product page, and from each
one reach the cart contents in two taps or fewer. Then confirm the bar itself contains no cart entry at all —
not a hidden one, not an icon with an empty label.

**Acceptance Scenarios**:

1. **Given** a phone at 360 px on the home page, **When** the bar renders, **Then** it offers exactly five
   destinations and none of them is the cart.
2. **Given** the shopper has two items in their cart, **When** they look at any page, **Then** the number two
   is visible on the cart control in the header.
3. **Given** the shopper taps the header cart control, **When** the drawer opens, **Then** both «مشاهده سبد»
   and «تسویه حساب» are present and go where they say.
4. **Given** a shopper who had been using the bar's cart tab, **When** they look for it, **Then** nothing in
   the bar points at a stale or half-removed cart entry — no leftover badge slot, no reserved gap.
5. **Given** a desktop viewport, **When** any page renders, **Then** nothing has changed at all: the bar is
   mobile-only and desktop never had the cart tab in it.

---

### User Story 2 - The selection travels as one body (Priority: P2)

The shopper moves from «خانه» to «فروشگاه». Instead of one pill fading out and another fading in, a single
shape leaves its slot, thins as it crosses the gap, and settles into the new one — the way something with a
body and a little viscosity would. Pressing a tab stretches the shape under the finger; releasing lets it
snap.

**Why this priority**: this is the second half of the request and the whole visual reason for the feature, but
it is worth nothing on its own if the bar still holds six items — the owner asked for both together, and the
removal is the simpler, safer slice to land first.

**Independent Test**: with the cart still present, film the transition between two non-adjacent tabs at 360 px
and confirm one shape is observed crossing the gap rather than two shapes swapping. Then confirm the shape
never leaves the bar's own bounds.

**Acceptance Scenarios**:

1. **Given** the shopper is on «خانه», **When** they tap «حساب» four slots away, **Then** one continuous shape
   is visible travelling across the four slots, and it never splits into two independent markers.
2. **Given** the shopper presses and holds a tab, **When** the press is held, **Then** the shape deforms under
   the finger and returns to its resting form when released, without navigating early.
3. **Given** the bar reads right-to-left, **When** the shape travels from the rightmost tab to the leftmost,
   **Then** it takes the shorter visible path across the slots between them and never mirrors to the wrong
   side at any point in the travel.
4. **Given** the shopper returns to a page a moment later, **When** the bar renders, **Then** the shape is
   already resting under the current tab — the travel is a response to an interaction, not an entrance
   animation replayed on every page view.
5. **Given** the destination is a `tel:` request rather than a page, **When** the shopper taps «تماس», **Then**
   the shape does not travel to it and does not stay stranded there, because no page became current.

---

### User Story 3 - One language across the whole storefront (Priority: P2)

The owner's answer to "wherever you think it fits" was **everywhere you can**. So the travelling body is not a
bottom-bar decoration; it becomes the site's one way of answering *"which of these is the current one"*,
wherever that question is asked.

Seven surfaces ask it, and they were found by looking for the state rather than for anything that looks like a
tab bar — every control that already publishes a current-or-pressed answer:

| # | Surface | The question it answers | Today |
|---|---|---|---|
| 1 | Mobile bottom bar | which page am I on | background colour fades onto the current tab |
| 2 | Desktop header pills | which page am I on | a circle rises under the pointer — already travels, differently |
| 3 | Home page featured tabs | which product set am I looking at | selected tab gets a filled pill |
| 4 | Shop category tiles | which department is filtered to | border colour changes |
| 5 | Shop pagination | which page of results | current number gets a filled circle |
| 6 | Product image views | which view of this product am I seeing | thumbnail border changes |
| 7 | Product variant options | which capacity / colour / model is chosen | chosen chip gets a filled background |

**Why this priority**: it is now an instruction, not a judgment call — but it is still second to the bar
itself, because the bar is where the language has to earn its keep before it is allowed to spread, and
because every surface below the first two inherits the problems the first two reveal.

**Independent Test**: visit all seven on one phone and one laptop, change the selection on each, and confirm
the same object is travelling with the same weight and the same colour source every time — then confirm the
code behind them is one implementation configured seven ways, not seven that were written to look alike.

**Acceptance Scenarios**:

1. **Given** any of the seven surfaces, **When** its current selection changes, **Then** the marker travels to
   the new one with the same deformation and the same timing it has on the bar.
2. **Given** all seven, **When** any one shows a current selection, **Then** the marker's colour and that
   selection's own label colour come from one source and cannot be configured to disagree.
3. **Given** a surface whose items wrap onto more than one line — the variant options and the image views
   both do — **When** the selection moves between lines, **Then** the marker reaches its destination without
   stretching across the full width of the group to get there.
4. **Given** pagination where the new page is far from the old one, **When** the shopper jumps from page 1 to
   page 20, **Then** the marker does not crawl through nineteen slots; it takes a bounded path or arrives
   without travel, and which of those is stated rather than left to whatever the geometry does.
5. **Given** a surface the shopper cannot see because it is a back-office control, **When** the feature ships,
   **Then** it is untouched.
6. **Given** two surfaces on screen at once — the header pills and the featured tabs, on a laptop's home page
   — **When** the shopper interacts with one, **Then** the other's resting marker is unaffected and neither is
   animating.

---

### User Story 4 - It fails honestly (Priority: P3)

Everything that makes the shape travel happens in the browser. A phone with a blocked script bundle, a reader
that asks for less motion, or a machine that cannot afford a per-frame filter must still be able to see where
it is. The bar is the primary navigation on mobile; a decoration that eats the information it decorates is a
defect, not a trade-off.

**Why this priority**: it ranks last in build order and first in consequence. Spreading an effect that cannot
degrade honestly across seven surfaces multiplies the defect sevenfold, so this story is a **gate on User
Story 3**, not a follow-up to it — nothing beyond the bottom bar adopts the marker until the bar passes these
four scenarios. It changes nothing the shopper sees when everything works, which is why it is easy to skip and
why it is written as requirements.

**Independent Test**: load the bar three ways — scripting blocked, reduced motion requested, and normal — and
confirm the current destination is identifiable in all three, by the same means.

**Acceptance Scenarios**:

1. **Given** scripting never runs at all, **When** the bar is served, **Then** the current destination is
   already visibly marked in what arrived from the server, and no slot sits empty waiting for a shape to
   appear.
2. **Given** the shopper has asked for reduced motion, **When** they change tab, **Then** the marker is in the
   new place immediately, with no travel and no stretch.
3. **Given** the marker's filter cannot be afforded, **When** the bar renders, **Then** the shopper sees a
   plain solid marker in the right place rather than a smeared or transparent blob.
4. **Given** the shopper uses a keyboard, **When** they Tab through the bar, **Then** focus is visible on its
   own and is never carried only by the travelling shape, which shows where the *current page* is, not where
   the *cursor* is.

### Edge Cases

- **Five items where six were**: the slots share the bar's width evenly, so every tab gains width at 360 px. The longest label
  in the bar is «فروشگاه»; it must be measured after the change, not assumed, because this same arithmetic has
  silently clipped a control before (the header search field, and the desktop call button at 768 px).
- **The count goes from zero to one to many**: the relocated badge must vanish at zero and must not clip at
  four Persian digits.
- **A route the bar cannot match**: `/cart` and `/checkout` remain reachable pages that no tab is active for.
  The bar must show no marker at all rather than park one under «خانه» by default — which is the exact bug the
  bar's own documentation says it was moved to fix.
- **The account tab's destination changes with auth state** (`/login` for a guest, `/orders` when signed in),
  and auth is "loading" on first paint. The marker must not travel twice because the target resolved late.
- **A tap that navigates and a tap that dials live in the same bar.** Only the first changes the current
  destination.
- **The bar floats over content with a bottom inset** that other surfaces already reserve space against — the
  stacking-card deck's height budget subtracts it. Changing the bar's height by even a few pixels invalidates
  a measurement that another feature depends on.

## Requirements *(mandatory)*

### Functional Requirements

**Removing the cart entry**

- **FR-001**: The mobile bottom bar MUST present exactly five destinations: home, shop, partners, call, and
  account. It MUST NOT present a cart entry.
- **FR-002**: A shopper on a phone MUST be able to reach their cart contents from every page the bar appears on
  in no more than two interactions.
- **FR-003**: The live count of items in the cart MUST remain visible to a phone shopper wherever the bar
  appears, on the control that remains after FR-001, and MUST be hidden when the count is zero.
- **FR-004**: The cart's own page and the checkout MUST remain reachable and MUST keep working unchanged; this
  feature removes a shortcut to them, not the destinations.
- **FR-005**: Removing the entry MUST leave no orphaned state behind: no live cart count still being read for
  the bar, no reserved slot, no dead badge styling.
- **FR-006**: Desktop navigation MUST be unaffected.

**The travelling marker**

- **FR-010**: Exactly one marker MUST represent the current destination in the bar at any time. It MUST be a
  single travelling body, not a per-tab background that fades.
- **FR-011**: When the current destination changes by shopper action, the marker MUST travel from its previous
  slot to the new one, deforming as it goes, and MUST come to rest within the bar's own bounds at both ends of
  the travel.
- **FR-012**: Pressing a destination MUST deform the marker for the duration of the press, and releasing MUST
  return it to its resting form. The navigation MUST occur on release, at the same moment it occurs today.
- **FR-012a**: Moving a held press across neighbouring destinations MUST NOT change which one the release
  commits to. The reference lets you grab its shape and pull it between slots; that gesture is **declined here
  deliberately**. The reason is not the risk of a misfire — it is that the marker's whole meaning on this site
  is *"this is where you are"*, and a drag-to-select gesture makes it briefly mean *"this is where you might
  go"* on the one control where the two must never be confused. FR-016 requires the marker and the current
  label to be unable to disagree; a previewing marker disagrees by design. Settled by the owner's instruction
  of 2026-09-27 ("your call"); the advisory model preferred the drag at 0.65 and is recorded in
  `notes/jev-advisory.md`.
- **FR-013**: The marker MUST render correctly in a right-to-left bar: the travel path, the deformation, and
  the resting position MUST all follow the visual order the shopper sees, not the order the destinations are
  listed in source.
- **FR-014**: The marker MUST NOT animate its travel on first render or on page load. It MUST appear already
  at rest under the current destination.
- **FR-015**: A destination that does not change the current page — the dial request — MUST NOT receive the
  marker, and MUST NOT interrupt a travel in progress.
- **FR-016**: The marker's colour and the current destination's label colour MUST derive from one source such
  that they cannot be configured to disagree.
- **FR-017**: When no destination in the bar matches the current route, the marker MUST be absent entirely. It
  MUST NOT default to the first entry.
- **FR-018**: The bar's outer height and its bottom inset MUST be unchanged from their current measured values,
  so that surfaces which reserve space against them need no re-measurement.

**Degrading honestly**

- **FR-020**: The current destination MUST be identifiable from the markup the server sends, before any script
  runs. The travel MUST be an enhancement over that, never the only thing carrying it.
- **FR-021**: When the shopper has requested reduced motion, the marker MUST be placed at the current
  destination with no travel, no press deformation, and no transition.
- **FR-022**: If the effect cannot run — script blocked, error thrown, capability unsupported — the bar MUST
  present a plain resting marker and MUST remain fully navigable.
- **FR-023**: Keyboard focus MUST remain visible independently of the marker at all times.
- **FR-024**: The marker MUST NOT announce or imply anything a screen reader does not already receive from the
  current-page semantics the bar exposes today.

**Cost discipline**

- **FR-030**: The effect MUST stay confined to the group it belongs to. The adopted component draws no filter,
  and none MAY be added to it: introducing the reference's blur-and-threshold filter onto these seven
  surfaces is out of scope and would reintroduce the cost this design happens not to have.
- **FR-031**: The marker tweens its width, which is layout rather than composition. Any implementation MUST
  therefore kill an in-flight trip before starting another, and MUST state how many layout-writing elements
  can be mid-travel at one instant.
- **FR-032**: No smoothness or frame-rate claim MAY be made from the development machine. The acceptance gate
  is the owner's own handset.
- **FR-033**: At most **one** marker MAY be travelling at any instant, across all surfaces. Two surfaces are
  on the home page at once on a laptop, and a shop page can show filters, pagination and a category row
  together; seven resting markers are fine, seven simultaneous animations are not.
- **FR-034**: A resting marker MUST NOT hold a compositor hint. The adopted component sets a permanent
  will-change on its marker element; that is one layer on a demo stage and seven-plus on a shop page, so the
  hint MUST be present only while a trip is in progress.
- **FR-035**: Widening the language from one surface to seven MUST NOT add a dependency. The motion library
  already in the project covers what is needed.

**Scope of the language**

- **FR-040**: The marker MUST be one implementation, configured per surface. A second travelling-marker
  implementation fails this feature, and a per-surface variant that "looks the same but is written separately"
  is that failure in the form most likely to be argued past review.
- **FR-041**: The seven surfaces enumerated in User Story 3 are the in-scope set: the mobile bottom bar, the
  desktop header pills, the home featured tabs, the shop category tiles, the shop pagination, the product
  image views, and the product variant options.
- **FR-042**: The reference's synthesised sound MUST NOT be ported to any surface, on any interaction.
- **FR-043**: The back office MUST be left alone entirely, including its sidebar, which asks the same
  "which page am I on" question and would otherwise be the easiest surface to change.
- **FR-044**: Surfaces that do not ask a one-of-N question MUST NOT receive a marker. Named explicitly because
  they are the plausible over-reach: the stacking-card deck, the categories arrival, the cart drawer, dialogs,
  and any body text.
- **FR-045**: Where a group's items wrap onto more than one line, the marker MUST reach its destination without
  traversing the width of the whole group.
- **FR-046**: Where a change of selection can cross an arbitrarily large distance — pagination is the only such
  surface — the behaviour at long distances MUST be stated and tested, not left to the geometry. Either the
  travel is bounded to a maximum visible distance, or it is suppressed beyond one, and which is chosen MUST be
  recorded with the measurement that justified it.
- **FR-047**: Adopting the marker on a surface MUST NOT change what that surface announces to assistive
  technology. Six of the seven already publish a current-or-selected state and the seventh is a pressed state;
  the marker is decoration over an existing truth, never the only carrier of it.

**The port itself**

The adopted component was written for a demo stage in a left-to-right, English, button-only, CSS-module,
light-and-dark world. This is a right-to-left, Persian, link-based storefront with one palette. Every place
those differ is a requirement below rather than something to discover mid-build.

- **FR-060**: The source MUST arrive with its licence and copyright notice retained and attributable, naming
  the upstream project and the files taken.
- **FR-061**: The marker MUST be correct in a right-to-left row, and correctness MUST be demonstrated by
  measurement on a rendered right-to-left page rather than argued from the arithmetic. The adopted component
  positions its marker from a physical left offset and moves it with a physical horizontal transform; that
  combination happens to be internally consistent, and MUST NOT be silently mixed with logical positioning in
  the same row.
- **FR-062**: Five of the seven surfaces are navigation, not in-page tab switching, and MUST keep their link
  semantics and their current-page announcement. The adopted component hardcodes a tablist with tab roles and
  a selected state; applying that to a set of page links MUST NOT be shipped, because it tells a screen reader
  that panels will swap in place when the truth is that the page changes.
- **FR-063**: The marker's colours MUST come from this storefront's own palette. The adopted component reads
  eight custom properties that do not exist here, and the two that carry its surface and its rim are the whole
  difference between the marker looking made-for-this-site and looking pasted-in.
- **FR-064**: The marker MUST adapt to a group whose slots are equal width rather than content width — the
  bottom bar's destinations are evenly divided, which the adopted component has never been asked to do.
- **FR-065**: The marker MUST adapt to a group whose items are taller than the marker's own fixed height, and
  to a group where the item is an icon stacked above a label rather than a line of text.
- **FR-066**: The port MUST NOT take the reference's switch, menu, morph, burst, icon-morph, hover-row or
  sound modules. Only the travelling marker and the motion helper it asks about.
- **FR-067**: The marker MUST be parked at the current selection in the very first painted frame on a server
  render, with no trip and no zero-width flash, on all seven surfaces.
- **FR-068**: Where the reference's own comments record a defect it worked around, the port MUST keep the
  workaround and its explanation. Three are load-bearing: killing the previous trip, refusing to re-fire the
  travel when a re-render lands on the same slot, and reading "is this the first paint" off the element rather
  than from a ref because of the double-mount.

### Key Entities

- **Destination** — one entry in the bar: its target, its Persian label, its icon, whether it is a route or a
  dial request, and how its route is matched (exact, prefix, or never).
- **Marker** — the single travelling body. Its state is *which destination it rests under*, plus a transient
  deformation while a travel or a press is in progress. It has no colour of its own.
- **Surface** — one of the seven places the marker is used, listed in User Story 3. Each supplies its own
  geometry, item count, wrap behaviour and distance range; none supplies its own implementation, its own
  timing, or its own colour.
- **Group** — the set of sibling controls a single marker moves between: the five bar destinations, the three
  header pills, the featured tabs, the category tiles, the page numbers, the image views, one option label's
  values. A variant picker with three option labels is three groups, each with its own marker.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A phone shopper reaches their cart from any page in **≤ 2 taps**, and the bottom bar contains
  **0** cart entries.
- **SC-002**: The bar shows **exactly 5** destinations, and every one of their labels renders in full at
  360 px with no clipping — measured on the rendered page, not estimated from the source.
- **SC-003**: With scripting blocked, the current destination is still visibly marked **100%** of the time.
- **SC-004**: With reduced motion requested, the marker is correct on the **first** frame after a change — zero
  travel frames.
- **SC-005**: **1** travelling-marker implementation exists across the whole storefront, in use on all **7**
  surfaces named in User Story 3, and on **0** surfaces outside that list.
- **SC-006**: The bar's measured outer height and bottom inset are **unchanged** from the values recorded
  before this feature.
- **SC-007**: The owner, on their own handset, accepts the movement as looking and feeling intentional rather
  than gimmicky — the same gate that settled the categories and brands chapters.
- **SC-008**: No shopper-facing text, route, or destination other than the cart entry is removed or reworded.
- **SC-009**: On a laptop home page, where two of the seven surfaces are visible at once, **≤ 1** marker is
  observed animating at any instant, and **0** while nothing is being interacted with.
- **SC-010**: All **7** surfaces still publish the current, selected or pressed state they publish today,
  unchanged — the count of shopper-facing controls that gained an accessible name or lost one is **0**.
- **SC-011**: The back office ships with **0** changes.

## Assumptions

- **The cart is not being removed from the product.** Only its shortcut in the bar goes. Its header control,
  its drawer, its page, and its checkout all stay — verified before writing this: the header control carries
  no width restriction, so it is already visible on a phone, and the drawer it opens already links to both
  the cart page and checkout.
- **Five entries, and no replacement.** The freed slot is not filled with a new destination. Five is a normal
  count for a bottom bar and the widest label gains room.
- **Press-and-release navigation, not drag-to-select — settled by the owner, on my judgment.** Asked directly,
  the owner answered "your call" on 2026-09-27, so this is mine to decide and it is decided as FR-012a. The
  reference lets you grab its shape and pull it between slots; the deformation on press is kept and the
  pull-to-reselect is not. The reason recorded in FR-012a is semantic rather than cautionary: on this site the
  marker means *"where you are"*, and a previewing marker would mean *"where you might go"* on the one control
  where those must not be confused. The advisory model preferred the drag at 0.65 — below its own decisiveness
  bar — and that dissent is recorded rather than dropped.
- **"Everywhere you can" was read as every surface that asks the same question, not every surface I can put an
  effect on.** The seven were found by searching for controls that already publish a current-or-pressed state,
  which is a reproducible criterion, rather than by deciding which ones would look good. FR-043 and FR-044
  then bound the result: the back office is excluded outright, and the surfaces most likely to be reached for
  next — the deck, the arrival, the drawer, dialogs — are named and refused.
- **The reference's source is taken into the project; its package is not.** The owner instructed this twice,
  so it was verified rather than argued with. The repository's `package.json` declares **`"private": true`**,
  has no `main`/`exports`/build step, and its only scripts are `dev`/`build`/`preview` for a Vite app — so it
  cannot be installed as a dependency, and `npm install github:arknow91/liquid-taffy` would produce nothing
  usable. It **is** MIT-licensed with the source present, so the files themselves come in. That is the
  strongest available reading of "install it from GitHub", and it delivers what the owner actually wants:
  their exact code and its real motion, not a paraphrase of it.
- **The vendored surface is `PillTabs`, and it is a closer match than the README suggests.** It is a row of
  switches where *"one shared pill floats UNDER the labels and GSAP carries it from tab to tab, going a little
  gelatinous on the way — it stretches long and low as it takes off, leaning into the direction of travel,
  then rings back to shape on an elastic once it lands."* That is the feature. It already handles first paint
  without animating, kills its own previous trip, honours the motion preference, and re-parks itself when the
  row is re-laid out.
- **The adopted surface carries no SVG filter.** Verified by reading it: the goo/metaball filter lives in
  `goo.ts` and is used by the switch, the menu, the morph and the burst — none of which this feature takes.
  The pill's liquidity is entirely motion (scale, skew, elastic) on a solid element. This makes FR-030 and
  FR-031 far easier to satisfy than the reference's own description implies, and it retires the assumption
  that a bounded blur region was part of the deal.
- **No new dependency.** The reference needs `gsap`, `react`, `react-dom` — all three are already in this
  project.
- **The sound is one import and one call site**, so FR-042 is satisfiable without touching the motion.
- **Dark ground stays.** The reference's "two frames" are light and dark; this storefront is dark with light
  editorial bands, so the principle is taken as *one colour source that cannot disagree*, not as a theme
  switch.
- **The bar remains phone-only.** It is hidden at wider-than-phone sizes today and that does not change.
- **`/cart` and `/checkout` will still have no active tab.** That is already true today and FR-017 makes it
  explicit rather than accidental.
- **Feature 011 (brand card identity) is parked**, at the owner's instruction, until they regenerate the brand
  imagery. Nothing in this feature touches the deck or the brand cards, so the two do not collide.
