# Feature Specification: Motion Assembly Band — the homepage's back half as one movement

**Feature Branch**: `007-motion-assembly-band`

**Created**: 2026-09-24

**Status**: Draft — three open decisions marked below; the rest is ready for planning.

**Input**: User description: "labor agents: one to use this style: https://superdesign.dev/library/text-blur-animation — one to use this for squeezing below sections into one animation style UI: https://superdesign.dev/library/exploded-view-assembly — تجربه حضوری خرید را لمس کنید / چرا حامی همراه، اعتماد با واقعیت ساخته میشود / همراه شما از انتخاب تا تجربه. agents we have are: yourself - qoder CLI - freebuff (3)"

## Why this feature exists

The homepage's back half is long and thin. Measured at 360px on 2026-09-24, after the day's removals:

| Section (heading as a shopper reads it) | Height | Words | What it can point at |
|---|---|---|---|
| «تجربه حضوری خرید را لمس کنید» — store-experience | 1,685px | 141 | one `tel:` link |
| «چرا حامی همراه · اعتماد، با واقعیت ساخته می‌شود» — trust | 824px | 60 | one link into the shop |
| «همراه شما، از انتخاب تا تجربه» — final-conversion | 452px | 29 | three links |
| **together** | **2,961px** | **230** | — |

That is **3.7 viewports carrying 230 words** at the end of the page — the part a shopper reaches only if the
page has earned it, and the part that currently reads as three unrelated blocks that simply run out.

Band 3 solved the front half by removing decoration and rebuilding composition. This feature is the owner's
answer for the back half: **make those three sections move like one thing.** Two treatments are named, both
from the owner's own reference library, and one of them — the assembly — is the mechanism that genuinely
shortens the stretch, because three stacked blocks becoming one pinned movement is a reduction in length,
not an addition of effects.

### What the two references actually are (read from the source, not assumed)

- **Text blur animation** (`superdesign.dev/library/text-blur-animation`). The page's own words: *"Create a
  complex animation that fades in, slides up, and reduces blur for each letter"*, applied to a heading
  component with *"responsive font sizing, tight letter tracking, and smooth color transitions — ideal for
  hero banners, section headers."* Three simultaneous properties per unit of text: opacity 0→1, an upward
  translation, and a blur that resolves to zero.
- **"Exploded View" Assembly** (`superdesign.dev/library/exploded-view-assembly`). Its words: *"Pin a central
  product mockup. As the user scrolls, have the internal components (UI elements, icons, layers) 'explode'
  outwards in different directions. As they continue to scroll, have the components fly back together and
  'lock' into a final, different layout."* Described as *"perfect for 'how it works' or feature breakdown
  sections."*

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The three closing headings arrive as statements, not as blocks of text (Priority: P1)

A shopper who has scrolled past the products reaches the part of the page that has to make them feel
confident about a 20-year shop. The three headings there — "touch the in-person buying experience", "trust is
built with reality", "with you, from choice to experience" — currently appear as ordinary type in an ordinary
box, like everything above them. With this story, each one arrives: it lifts into place and resolves from
soft to sharp, and the moment reads as deliberate. Nothing moves on its own; the heading arrives once, as the
shopper reaches it.

**Why this priority**: It is the smallest of the two treatments, it is reversible on its own, and it changes
the three sections the owner named without touching what they say. If only this ships, the back half already
reads as composed rather than as leftover.

**Independent Test**: Load the homepage at 360px, scroll to each of the three headings, and observe that it
settles from a soft, lower state into a sharp, final one, once, and that after settling it is pixel-identical
to the same heading today. Then reload with reduced motion requested and confirm it is sharp at first paint
with no travel at all.

**Acceptance Scenarios**:

1. **Given** a shopper at 360px scrolled to just above «تجربه حضوری خرید را لمس کنید», **When** they scroll
   until it is in view, **Then** the heading rises into place and resolves from soft to sharp, and no word of
   it changes shape, position or joining as it settles.
2. **Given** the same shopper continues scrolling past it, **When** they return to the heading, **Then** it
   is already settled and does not replay.
3. **Given** a shopper whose system asks for reduced motion, **When** they reach any of the band's headings,
   **Then** it is present in its final state immediately, with no travel and no blur at any point.
4. **Given** a shopper on a slow connection where the page's text arrives before anything can move, **When**
   they reach a heading, **Then** the heading was never absent — it is in the served document and readable
   whether or not anything animates.
5. **Given** a screen-reader user reaching the section, **When** they navigate to the heading, **Then** they
   hear the same heading text they would see, with no announcement of motion and no fragmenting of words.

---

### User Story 2 - The back half reads as one movement instead of three unrelated blocks (Priority: P2)

A shopper scrolling past the store-experience section into the trust section and on to the closing note
experiences one continuous choreography rather than three stacked boxes with three separate headers. Parts
of what the sections already contain — the phone number, the four capabilities, the warranty line, the way
into the shop — separate and re-gather as the shopper scrolls, and the arrangement they land in is different
from the one they started in: the three sections resolve into a single closing composition. The shopper ends
at the call to action having passed through one movement, not three.

**Why this priority**: This is the part that answers "squeeze the sections below into one animation style
UI", and the part that actually shortens the back half. It is P2 rather than P1 because it is the riskier
mechanism, depends on the outcome of an open decision below (does it replace the three sections or layer
over them), and is worth less if the page's content is still thin — it arranges what exists; it cannot
manufacture what was removed for being untrue.

**Independent Test**: Scroll the back half at 360px and at 1280px and record the sequence. Confirm that
(a) every element that flies is something the three sections already contained — no element appears that is
not also present in the served document, (b) the final arrangement holds all the same content, (c) the
distance scrolled to pass through the band is no greater than the three sections' current combined height,
(d) the shopper's position and the browser's back gesture survive mid-sequence reload, and (e) with reduced
motion the same content is present in its final arrangement with nothing moving.

**Acceptance Scenarios**:

1. **Given** a shopper reaching the band, **When** they scroll through it, **Then** the parts separate and
   re-lock into one final composition, and at every point in that sequence all of the band's text is present
   and legible.
2. **Given** a shopper who stops scrolling in the middle of the sequence, **When** they leave it and return,
   **Then** the band is wherever their scroll says it should be — it never plays independently of the scroll
   and never has to "catch up".
3. **Given** a shopper who reloads the page in the middle of the band, **When** the page returns, **Then**
   they land at the same place in the sequence, not at the top of it.
4. **Given** a shopper on a phone using a thumb flick, **When** they fling past the band, **Then** nothing is
   skipped that they needed — the phone number and the closing action are reachable in the settled state
   without scrolling back.
5. **Given** a reduced-motion shopper, **When** they scroll the band, **Then** they see the final composition
   statically, with the same content and the same links, and no part of it is missing.
6. **Given** a keyboard user tabbing through the band, **When** focus reaches an element that is mid-flight
   off-screen, **Then** the page brings it into view and the control works — motion never hides a control from
   the person who is on it.

---

### User Story 3 - A shopper who arrives by phone number is not made to wait for an animation (Priority: P3)

Most purchases at this shop happen by phone. The store-experience section carries that number, and the
closing composition carries it again. For this band, the number and the primary way into the shop behave as
if nothing is animating: they are present, legible, tappable and stable at every point of the sequence, in
both directions, on a phone.

**Why this priority**: It is a constraint on the other two stories stated as a story of its own because it is
the one that can cost real money, and because "make the important thing move" is the natural failure mode of
an assembly animation. It is P3 in build order and first in veto power.

**Independent Test**: During the band's full sequence at 360px, attempt to reach and activate the phone link
at ten different scroll positions, including mid-flight, and confirm it is visible, correctly labelled, and
activates every time. Confirm its rendered digits are Persian-formatted and its text never changes.

**Acceptance Scenarios**:

1. **Given** a shopper mid-sequence on a phone, **When** they tap the phone number, **Then** the dialer opens
   — the tap is never captured by the animation.
2. **Given** any point of the sequence, **When** the number is on screen, **Then** it is legible at the same
   contrast as the settled page, and it has not moved position between frames in a way that defeats a thumb.

---

### Edge Cases

- **A heading that is already in view on load** (a short viewport, or a reload at the band): the reveal must
  not fire on content the shopper is already looking at, and must not hide it first.
- **Very long Persian headings** wrapping to three or four lines: the unit of motion has to survive a line
  break without orphaning a word or splitting one.
- **A shopper scrolling backwards through the band**: the sequence must run in reverse cleanly and must not
  leave an element stranded mid-flight.
- **Fast flings** where the band is crossed in a few frames: the shopper must land in the settled
  composition, not in a frozen middle state.
- **Very tall viewports** (a desktop window showing the whole band at once): the sequence must not require
  more scroll distance than exists, and must not shrink the band to nothing.
- **Print, and forced-colours mode**: the band renders as its final composition with no motion and no lost
  content, matching what feature 002 already promises for the ground.
- **A shopper who returns to the page after minutes away** (tab restored): the band is in the state their
  scroll position says, not replaying from the top.
- **The scroll ground underneath**: the page's travelling ground (feature 002) is anchored to section
  positions. A band that pins or re-arranges sections must not make the ground jump, stall, or move while
  the content is stationary.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The three named sections MUST present their headings with the arrival treatment — a lift into
  place while resolving from soft to sharp — as a single, once-per-visit event tied to the heading entering
  the viewport.
- **FR-002**: The unit of the arrival treatment MUST be the **word or the line, never the letter**. Persian
  letters change shape according to which neighbours they join; separating them for animation is not a style
  choice but a rendering defect. *(Verified in this checkout on 2026-09-24: the same heading set to one
  element per letter renders in disconnected letterforms and the glyph shapes change; one element per word is
  indistinguishable from the original. The reference's own wording — "for each letter" — and its "tight
  letter tracking" both fail on Persian script, and the site spent this week driving rendered Persian
  letter-spacing from 91 elements to zero.)*
- **FR-003**: Every element in the band MUST exist in the served document before any motion can occur, and
  MUST be present and legible in the band's final composition. Motion may change where something is and how
  sharp it looks; it may not decide whether it exists.
- **FR-004**: The assembly MUST use only parts the three sections already contain. It MUST NOT introduce
  placeholder, decorative or invented components to have more pieces to move — the reason two of these three
  sections are short is that their filler was removed today, and re-adding it as an animation prop would
  undo that.
- **FR-005**: The band MUST honour a reduced-motion preference by presenting its final composition with no
  travel, no blur, and no hidden-then-revealed content.
- **FR-006**: The band MUST remain correct under reload, back/forward, tab restore, and mid-sequence
  navigation: the shopper's position determines the band's state, and nothing replays from the beginning.
- **FR-007**: The phone number and the primary way into the shop MUST be visible, legible, tappable and
  positionally stable at every point of the sequence, on a phone first.
- **FR-008**: All directional behaviour MUST be defined in reading-direction terms (start/end), not screen
  left/right, so the band reads the same way in RTL as the rest of the site.
- **FR-009**: The band MUST NOT delay or degrade the page's first meaningful text paint. Because FR-016
  replaces three blocks with one movement, the band MUST come in **at or under 2,400px at 360px** against
  the 2,961px it replaces — the shortening is the point of the chosen reading, so a replacement that does not
  shorten has failed the decision rather than the measurement.
- **FR-010**: The band MUST coexist with the travelling page ground (feature 002). This is not a courtesy
  clause — it is a direct collision the owner should see before planning: **three of the ground's six stages
  are anchored to the sections this band replaces** (`store-experience` carries the ember stage,
  `final-conversion` carries the closing dark, and `trust` sits between them). Replacing them removes the
  elements those anchors resolve against, and the ground would silently fall back to even spacing across a
  page whose shape changed. So: the ground's stage list, its anchors and the rendered-section drift guard
  MUST be re-declared together with the band, in the same change, and the guard MUST be control-run — shown
  to fail when a section is removed without updating the list — rather than trusted because it is green.
- **FR-011**: Keyboard and assistive-technology users MUST be able to reach and operate every control in the
  band regardless of its animated state; focus into an off-screen element must bring it into view.
- **FR-012**: The band's text MUST keep meeting the site's contrast floor at every sampled point of the
  animation, including during the soft phase — a blurred heading is not exempt from legibility.
- **FR-013**: The band MUST render correctly in print and in forced-colours mode as its final composition,
  with motion and decorative layering removed.
- **FR-014**: Every claim in the three sections MUST remain within the verified list (the shop's warranty,
  its twenty years, its in-person and wholesale capability). The band is presentation; it does not license a
  new assertion, and a composition that would need one is out of scope.
- **FR-015**: The band MUST be verifiable without a human panel: each behaviour above is checked by a
  measurement or a screenshot in a browser, and any criterion that genuinely needs people is recorded as
  closed-unmeasured rather than asserted.

### Key Entities

- **Band** — the three named sections taken as one unit of experience: store-experience, trust,
  final-conversion. Has a start, a settled composition, and a length a shopper must travel.
- **Arrival treatment** — the per-heading soft-to-sharp lift. Has a unit (word or line), a trigger, a once
  flag, and a settled state that must equal today's rendering.
- **Assembly sequence** — the scroll-driven separation and re-locking of the band's parts. Has parts (each an
  existing element), a spread phase, a gather phase, and a final arrangement that carries the same content
  as the three sections it replaces or overlays.
- **Part** — one element the assembly moves. Must exist in the served document, must be identifiable in the
  final composition, must never be a prop invented for motion.
- **Immovable layer** — the phone number and primary shop action, exempt from positional change (FR-007).
- **Ground coupling** — the relationship between the band's scroll behaviour and feature 002's travelling
  ground (FR-010).

## Decisions *(resolved by the owner, 2026-09-24)*

- **FR-016 — the assembly REPLACES the three sections.** Resolved **A**. The back half becomes one pinned
  closing movement rather than three stacked blocks with motion applied to each. Consequences the owner
  accepted with the answer, and which are now requirements rather than risks: **SC-001's ≤ 2,400px is
  binding, not aspirational**; the three section headings stop being separate landmarks, so the navigation,
  the ground's stage anchors and the drift guard all have to be re-declared rather than left to drift (FR-010);
  and there is no per-section rollback — the band ships as one unit or not at all.
- **FR-017 — phone first.** Resolved as **"phone first"**, which is stronger than either option offered: the
  phone is the reference implementation and the desktop is the enhancement of it, not a variant that survives
  a port. The sequence must be designed at 360px and proven there before any desktop behaviour is defined;
  where the two disagree, the desktop yields. Pinning's known rough edges on mobile browsers are therefore a
  problem to solve inside the feature, not a reason to move it to desktop only.
- **FR-018 — the phone number never moves.** Resolved **A**. FR-007 stands exactly as written: positional
  fixity, not merely reachability. It is the shop's most valuable action and it is exempt from the
  choreography.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A shopper reaches the closing call to action by travelling **at least 19% less** distance than
  today — the band's total length at 360px is ≤ 2,400px against the 2,961px it replaces. This is binding
  under FR-016's replacing reading: a band that lands at 2,900px has met the letter of "no worse" and failed
  the decision.
- **SC-002**: **Zero** Persian words in the band render in disconnected letterforms at any frame. Checked by
  screenshotting each animated heading in its settled state and comparing against the same heading rendered
  without the feature; any glyph-shape difference is a failure.
- **SC-003**: With reduced motion requested, the count of band elements that are hidden, blurred, or displaced
  at first paint is **0**, and the settled composition is what the shopper sees.
- **SC-004**: With scripting unavailable, the served document still contains **100%** of the band's words and
  links, and the count matches the settled page exactly.
- **SC-005**: Sampled at 20 points across the band's sequence, no visible text falls below the site's
  contrast floor — the soft phase included, not excused by being transient.
- **SC-006**: The phone number activates successfully in **10 of 10** attempts from scroll positions spread
  across the whole sequence at 360px.
- **SC-007**: Reloading at five different positions inside the band returns the shopper to the matching
  state in **5 of 5** cases, with no replay from the beginning.
- **SC-008**: The band introduces **no** new claim: every string in the settled composition appears in the
  verified content list, checked as a set difference against today's three sections.
- **SC-009**: The page's travelling ground still matches the sections that render — the existing drift guard
  passes, and the ground's tone at ten sampled positions inside the band is the tone the authored sequence
  specifies for that position.
- **SC-010**: **Closed unmeasured by design, not passed.** Whether the band reads as premium rather than as
  decoration is a human judgement, and this project has no human panel (owner decision, 2026-09-23). The
  box stays visibly open with the missing instrument named, on the precedent the earlier bands set. An agent
  scoring this is fabricating.

## Assumptions

- The three sections named by the owner are the ones identified in the table above by their rendered
  headings; the owner named headings, not files, and those headings map one-to-one onto `store-experience`,
  `trust` and `final-conversion` as they render today.
- Scope is the homepage's back half only. No other section adopts either treatment until this one has been
  looked at, which keeps the site's "one accent treatment applied uniformly" rule intact rather than
  negotiating with three new ones.
- The arrival treatment applies to the three section headings, not to body copy — the reference describes it
  on headings, and blur on running text is a legibility problem, not a style.
- The band sits on top of the travelling ground feature 002 shipped, and inherits its reduced-motion,
  print, and forced-colours behaviour rather than inventing new ones.
- "Phone first" (FR-017) means every acceptance scenario above is executed at 360px **first** and the
  desktop result is derived from it. A behaviour that only holds at 1280px is a defect, not a platform
  difference.
- Under FR-016's replacing reading there is no rollback to "the three sections as they were" once the band
  ships; the previous composition exists only in git history. That is accepted deliberately, not discovered
  later.
- Content is what exists after today's removals. This feature does not wait on new photography, new customer
  proof, or a refreshed catalogue export; if it needs any of those to have enough parts to move, that is a
  signal the band is smaller than assumed (FR-004).
- Verification is by browser measurement and screenshot comparison in this checkout, on the standing rule
  that this machine is not a performance instrument and no frame-rate claim will be made from it.
- Three agents build this (driver, qoder, freebuff) in one shared checkout, so file ownership and the
  coordination protocol in `notes/parallel-agent-plan.md` §4 and `.agent-pair/README.md` are part of the
  feature's dependencies, not administrative overhead.

## Work Split *(the owner's explicit ask — three agents)*

**driver** — the Qoder CLI session that owns the atmosphere, the hero and the page composition today.
- Owns the **assembly sequence** (US2) and the ground coupling, because pinning and re-arranging sections
  touches the travelling ground, the section-order drift guard and the page composition — all files already
  claimed by this agent, and none of which a second agent should be editing underneath it.
- Owns the resolution of FR-016/017/018 with the owner, and the spec-to-plan translation.
- Hands over, rather than holds: the arrival treatment (US1), so the split is real.

**qoder** — the fourth agent, currently on standby with no locks held.
- Owns the **arrival treatment** (US1) on the band's headings — which under FR-016 means the headings of
  the new composition, so this work starts only once the driver's replacement structure exists. FR-002 (the word/line unit), FR-005
  (reduced motion), FR-008 (RTL direction terms) and FR-012 (contrast during the soft phase).
- Sequenced **after** the replacement structure lands, and that dependency is stated rather than assumed:
  the arrival treatment is applied to headings that will exist only inside the new composition. It does not
  touch the ground or the section order.
- Deliverable includes the SC-002 proof — the settled-versus-today screenshot comparison — because FR-002 is
  the requirement most likely to be satisfied in code and broken on screen.

**freebuff** — research only, no source edits, per its contract.
- Owns the evidence the build depends on. FR-017 is now settled as phone-first, so the mobile question is
  no longer *whether* — it is *what breaks*: documented failure modes of scroll-pinned sequences on Android
  Chrome, Samsung Internet, iOS Safari and Android builds without Google services, and the mitigations that
  hold on those engines. Plus the accessibility behaviour of pinned scroll narratives
  for keyboard and screen-reader users (FR-011), and the Persian-shaping constraint in FR-002 checked against
  the fonts this site actually self-hosts rather than the generic test above.
- Also owns the one thing the pair cannot see from inside the repo: whether either reference's mechanism is
  known to degrade on the devices this market actually ships.
- Deliverable is one file per question in `research/`, findings separated from inferences, "not found"
  stated as such.

**Not involved**: the IDE session holds the categories lane and `#categories`, which is in the front half and
out of scope here; the partner agent's brief is complete and its paper chapters are in the front half too.
Both are named so nobody drifts in.

**Coordination**: every file touched is claimed in `.agent-pair/locks/` before editing, board messages carry
a generated timestamp with its offset, and nothing is pushed without the owner.
