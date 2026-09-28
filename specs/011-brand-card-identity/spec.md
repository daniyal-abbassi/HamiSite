# Feature Specification: Brand Card Identity

**Feature Branch**: `011-brand-card-identity`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "perfect! such a clean design… but it needs a little touch and it would be just perfect: هر کارت برند باید وایب همون برند + وایب حامی همراه رو بده ولی به صورتی که تو ذوق نزنه و با استایل کلی سایت هم هارمونی داشته باشه + وایب لاکچری باید حفظ بشه. و اینکه هر برند باید همون یک خط توصیف رو داشته باشند (در اینترنت جستجو کن برای هر برند). مشتری باید با دیدن رنگ هر کارت بدونه اون چه برندیه. اگه لازمه من با جی پی تی چیزی/کارتی تولید کنم بهم بگو. اگر مهارت یا ام‌سی‌پی سروری لازم داری توی گیت‌هاب بگرد و بهم بگو."

## Builds on

Feature 008's stacking-card deck, which the owner accepted on their own phone on 2026-09-26. **This feature does
not change the deck's mechanism** — sticky cards in normal flow, no pin, no scroll-linked script. It changes what
each card *says* and *looks like*, and the deck's acceptance measurement must still pass afterwards, unchanged.

## Why this feature exists

The deck works and looks clean. Six cards, one at a time, sliding over each other. But right now all six cards are
the same dark burgundy ground carrying a Latin wordmark, and three of them carry a description while three carry
nothing. A shopper who reaches the end of the deck has learned six names and seen one colour.

The owner's ask is that each brand should feel like *itself* while still feeling like *Hami Hamrah* — recognisable
without being loud, and without the page turning into a logo wall.

**The honest difficulty, stated up front.** Five of these six brands have a colour the public associates with them:
Samsung blue, Xiaomi orange, realme yellow, Nokia blue, TCL red. A page that paints each card in its brand's full
hue turns a burgundy-and-champagne storefront into a rainbow, which is precisely the "تو ذوق زدن" the owner ruled
out. And **Apple has no hue** — its identity is aluminium, glass, black and white. So the requirement "a shopper
knows the brand from the card's colour" cannot be met the same way twice, and cannot be met by hue at all for one
of the six. A feature that forced a colour onto Apple to complete the pattern would be inventing a brand
association, which is a false statement on a commercial page, not a design choice.

## The three-way tension this feature has to hold

| Force | What it demands | What breaks if it wins alone |
|---|---|---|
| Brand recognisability | Each card should feel like that maker | Six competing saturated hues on one dark ground |
| Shop identity | The page should read as Hami Hamrah | The deck becomes six unconnected brand landing pages |
| Luxury register | Restraint, proportion, quiet materials | Bright flat fills read as a marketplace banner |

The feature is only successful if all three hold at once. Two out of three is the failure state, and each pair
fails in a different obvious way.

## Clarifications

### Session 2026-09-29

- Q: When the artwork carries no writing and the description line is withdrawn, what tells a shopper which maker
  a card is? → A: **The artwork alone.** The owner's ruling, in their words: "the brand's card is self
  explanatory and does not need a text." Amended FR-006, FR-004, FR-013, FR-015, FR-019, SC-002, SC-003 and
  User Story 2; FR-007 and FR-008 kept as conditional clauses so a line that ever returns is still disciplined.
- Consequence the owner did not ask for and which is therefore recorded rather than assumed away: a picture with
  no name on it announces nothing to a screen reader and identifies nothing in print. FR-004 now requires the
  maker's name as an **accessible name that is never rendered as visible text**, which keeps the ruling exactly —
  no text on the card — without making the deck unreadable to someone who cannot see it. Withdraw this only on an
  explicit instruction.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Telling the brand from the card alone (Priority: P1)

A shopper watching the deck arrive, one card at a time, can tell which maker each card belongs to largely from how
the card looks — its colour and material character — before or alongside reading its name.

**Why this priority**: This is the owner's stated test: *"مشتری باید با دیدن رنگ هر کارت بدونه اون چه برندیه."* If
the cards stay interchangeable, nothing else in the feature matters.

**Independent Test**: Show a person the six cards' colour and material treatment with the brand names and wordmarks
hidden, and ask them to name the brand. Count correct answers out of six.

**Acceptance Scenarios**:

1. **Given** a shopper who has never seen this page, **When** they are shown the six card treatments without names,
   **Then** they correctly identify at least five of the six brands.
2. **Given** the same shopper, **When** they see the card whose maker has no signature hue, **Then** they can still
   tell it apart from the other five — and the page has not given that maker a colour it does not use.
3. **Given** the six cards in sequence, **When** a shopper is asked who the page belongs to, **Then** they answer
   Hami Hamrah, not "a brand comparison page".

---

### User Story 2 — Each card is understood without a word (Priority: P2)

*(Rewritten 2026-09-29. This story used to be "Every brand says something" — that a shopper could read one
researched line about each maker. The owner withdrew the line: the six cards are art-led, and the ruling is that
each card is self-explanatory. What remains of the story is the claim that survives the withdrawal, which is the
harder one — that a picture can be trusted to identify its maker on its own.)*

A shopper scrolling the deck knows which maker each card belongs to from the card itself, with no caption, no
tagline and no product count. The three-way tension this feature was built to hold is unchanged; only one of its
two tools has been removed, so the recognition burden now sits entirely on the artwork and on the hue and
material treatment the earlier requirements govern.

**Why this priority**: It is still second, not first, because recognisability from the treatment alone is what
the feature is judged on — and with the line gone, it is the only thing it is judged on.

**Independent Test**: Show the six cards, with no text anywhere on them, to someone who has not seen the site.
Count how many makers they name correctly. Then ask the same of a shopper who cannot rely on colour: the answer
must come from the depicted device or wordmark, not from the hue.

**Acceptance Scenarios**:

1. **Given** the deck, **When** any card is the topmost one, **Then** it shows the maker's artwork and no text.
2. **Given** a card, **When** its hue is ignored or unavailable, **Then** the shopper can still tell which maker
   it is from what the artwork depicts.
3. **Given** a screen-reader user reaching the deck, **When** any card is focused, **Then** they hear that
   maker's name, though nothing on screen shows it.
4. **Given** the page printed, **When** a reader looks at the six cards, **Then** each is still attributable.

---

### User Story 3 — Still one shop, still expensive (Priority: P3)

After the treatment is added, a person arriving cold still reads the page as one brand's storefront with a
premium feel — not as a set of manufacturer ads assembled into a carousel.

**Why this priority**: This is the constraint that decides *how* stories 1 and 2 get implemented, and it is the one
the owner named twice ("تو ذوق نزنه", "وایب لاکچری باید حفظ بشه"). It is third in priority only because it is a
limit on the other two, not a separate deliverable.

**Independent Test**: Show the finished deck to someone who has not seen the site. Ask (a) whose page is this, and
(b) does it feel like one page or several. Both answers are the measurement.

**Acceptance Scenarios**:

1. **Given** the finished deck, **When** a cold viewer is asked who the page belongs to, **Then** they say Hami
   Hamrah.
2. **Given** the six cards, **When** a cold viewer is asked whether they belong together, **Then** they say yes.
3. **Given** any card, **When** a shopper looks at it, **Then** nothing on it is illegible against the card's
   own background — which since 2026-09-29 means the artwork's subject and any focus or hover treatment, because
   the card renders no text.

---

### Edge Cases

- **A maker whose identity has no hue.** The page must not invent one. Its character has to be carried by something
  else the maker actually uses, and the shopper must still be able to tell it apart.
- **Two makers whose signature colour is nearly the same** (Samsung blue and Nokia blue). Distinguishability cannot
  rest on hue alone for these two; something else must separate them, and it must be documented, not decorative.
- **A shopper who cannot distinguish the hues** (colour vision deficiency, or a phone screen at an angle). Colour
  may help recognition; it must never be the only thing carrying it. The name and mark stay.
- **A brand whose documented colours changed over time or differ by region.** Use the current, documented one and
  record which source was used and when it was checked.
- **A description that is true but reads as a claim about the shop** — stock, pricing, authorisation, service
  quality. Those are the shop's to claim, not the maker's, and not ours to claim on the maker's behalf.
- **A seventh brand is added.** The treatment must be a system that extends, not six hand-tuned one-offs that break
  when the set changes.
- **A brand line that is too long for the card** at 360 px. It must not push the maker's name out of view — the name
  and mark are protected.
- **A card shown in reduced-motion or print.** The identity treatment must survive without the deck motion.
- **The research finds nothing solid for a maker** (TCL/TCH is the likeliest). The honest outcome is a restrained or
  neutral card with no invented association, and a note saying why.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each of the six brand cards MUST carry a visual identity treatment that a shopper can associate with
  that maker independently of the others.
- **FR-002**: Every colour used to identify a maker MUST be a **hue family the maker is publicly associated with**,
  with the source of that association recorded. The **exact value is Hami's**, chosen to sit with the shop's own
  palette, and MUST be recorded as ours rather than as the maker's official colour. This split exists because the
  research found **no citable brand-guideline colour value for any of the six makers** — every specific value
  circulating for Samsung, realme, Nokia and TCL comes from third-party aggregators, never from the maker. Printing
  an aggregator's hex as though it were a company's official colour would be a false statement on a commercial
  page; choosing our own value inside a documented hue is not.
- **FR-002a**: A card MUST NOT be labelled, titled or described in a way that presents its colour as the maker's
  official or registered colour.

- **FR-003**: Where a maker has no publicly documented hue — **Apple**, whose identity is monochrome, and **TCH**,
  for which the research found no association at all — the treatment MUST NOT assign one. Its distinctiveness MUST
  come from a property that maker actually uses, and the two MUST still be distinguishable from each other, since
  both are the absence of a hue.
- **FR-004** *(amended 2026-09-29 with FR-006; original below)*: Distinguishability MUST NOT depend on colour
  alone. With no name printed on the card, the non-colour cue is the **artwork itself** — the depicted device and
  the maker's own wordmark inside it — so two cards whose hues are close must still be told apart by what is
  drawn on them. Because a picture cannot do this for a shopper who cannot see it, each card MUST also carry the
  maker's name as an **accessible name that is not rendered as visible text** (image alternative plus link name).
  That label is the card's identity for screen-reader, print and colour-blind paths, and it is not a caption: the
  owner's ruling that the card carries no text stands.
  > Original: "Each card keeps its maker name and mark visible, and a shopper with normal colour vision
  > deficiency, and a shopper reading the page in print, get the same identification." The visible half is
  > withdrawn by FR-006; the equal-identification half is not, and is now carried by the accessible name.
- **FR-005**: Where two makers' documented hues are close enough to be confused, the treatment MUST separate them
  by a documented property of each, not by an arbitrary adjustment.
- **FR-006** *(amended 2026-09-29 on the owner's ruling; original below)*: A brand card carries **no description
  line**. The artwork is the whole of the card's visible content, and the owner's ruling is that it is
  self-explanatory. No card shows a caption, a tagline, a sentence or a product count.
  > Original: "All six cards MUST carry one description line each. A card with no line is a defect, not a
  > variant." That was written when the cards were typographic. The owner supplied art-led cards, confirmed all
  > six, and removed the line deliberately — so a card **with** a line is now the defect.
- **FR-007** *(conditional since 2026-09-29)*: **Where a card carries any description line at all** — including a
  line added later, or one reintroduced by a future change — that line MUST state something about the maker that
  is supportable from public sources, and the source MUST be recorded with it. An unsourced line does not ship.
  This clause is dormant while FR-006 holds, and it is kept rather than deleted so that removing the line does
  not also remove the rule that disciplines any line that returns.
- **FR-008** *(conditional since 2026-09-29)*: **Where a description line exists**, it MUST NOT be phrased or
  positioned so that it reads as the maker speaking about itself, unless it is that maker's actual published
  line and is presented as theirs. Our description of a brand and a brand's own slogan are different objects and
  must not be confused on the page. Research established exactly two citable lines — realme's "Make it real",
  seen in the maker's own live page markup, and TCL's "The Creative Life", adopted by the company in 2014 — and
  **failed** to establish the two most commonly assumed ones: Apple's "Think different" and Nokia's "Connecting
  People" are **not** to be printed, in artwork or in text.
- **FR-009**: No line or treatment may assert partnership, official representation, endorsement, certification,
  pricing, availability, or stock that the shop cannot back. This is Principle I and has no exception path.
- **FR-020**: No card may state or imply a fact about a maker that the research has shown to be false. Two are
  live risks here and both read like safe common sense: **Nokia does not manufacture phones** — a licensed partner
  is the exclusive maker of Nokia-branded phones and tablets, so presenting Nokia beside Apple and Samsung as a
  phone factory is untrue; and **realme is not an independent company** — it is an Oppo sub-brand again as of
  January 2026. A third, softer: **TCH's parent is a television manufacturer first**, with own-brand phones only
  from 2019, so a card that implies a phone heritage for it is misleading.
- **FR-021**: Where the honest characterisation of a maker is not about phones, the card MUST say the true thing
  rather than stretch to fit the deck's theme.
- **FR-010**: The shop's own identity MUST remain dominant: a cold viewer must read the page as one Hami Hamrah
  surface containing six makers, not as six manufacturer pages assembled together.
- **FR-011**: The premium register MUST be preserved. The treatment must read as restrained and deliberate; a
  saturated flat fill that makes the deck look like a promotional banner fails this requirement even if it maximises
  recognisability.
- **FR-012**: The six treatments MUST form one family — the same card shape, the same composition, the same
  typographic voice — so that difference between cards is identity, not inconsistency.
- **FR-013** *(conditional since 2026-09-29)*: **Any text a card renders** — a name reintroduced, a focus ring
  label, a caption added by a later change — MUST remain comfortably legible against whatever the treatment does
  to that card's background, at every width. Six backgrounds means six checks, not one. While FR-006 holds, no
  card renders text and this clause has nothing to bind; it is kept live because the six-check discipline is the
  point, not the text.
- **FR-014**: The deck's existing behaviour MUST be unchanged: sticky cards in normal flow, no pin, no
  scroll-linked script, and its acceptance measurement must pass afterwards exactly as it passed before.
- **FR-015**: The right-to-left and Persian typographic rules already in force continue on every surface of the
  deck: no letter-spacing, no uppercase transform, Persian numerals wherever a number appears to a shopper. The
  clause that once required the description to be live text rather than artwork is **dormant while FR-006 holds**
  — there is no description — but it is the rule again for any text a later change puts on a card, and it binds
  the accessible names required by FR-004, which are Persian strings and must be written as such.
- **FR-016** *(amended 2026-09-27 on the owner's order; original text below)*: Each card carries exactly one
  approved brand artwork from `public/images/brands/`, and those six artworks are the whole of the maker imagery
  on the page. The artwork may reproduce a product and a wordmark — the original clause forbade both — and the
  live wordmark is therefore removed from the card so the maker's name is drawn once, not twice. Nothing else may
  be added: no stock photo, no second render, no generated logo outside the approved six, no artwork on any
  surface but the deck card. FR-015 is not amended and still binds: the description, the name and the count are
  live text, never part of the image.
  > Original: "No new imagery of the makers may be generated or sourced. The wordmarks already on disk remain the
  > only maker artwork on the page, and no treatment may reproduce a logo or a product."
  > The owner supplied six generated card artworks, confirmed all six approved, and answered the objection in
  > these words: "overwrite the rules". The bar was raised down by the person who owns the brand and the legal
  > exposure, not by the agent implementing it. See `notes/artwork-amendment.md`.
- **FR-017**: The identity system MUST extend to a seventh maker without redesigning the existing six.
- **FR-018**: Where research cannot establish something honestly for a maker, the page MUST show less rather than
  guess, and the gap MUST be recorded rather than papered over.
- **FR-019** *(amended 2026-09-29)*: Nothing on a card may be clipped by the card's own geometry at any width.
  With no name and no line left to protect, the element under protection is now the **artwork's own subject** —
  the depicted device and wordmark must not be cropped, squashed or scrolled off at 360px, in the stacked
  position, or in print. The deck's fit gate keeps its job; what it guards has changed.
  *(Earlier readings protected the live name, then the mark; both were withdrawn by FR-006 and FR-016.)*

### Key Entities

- **Brand identity treatment** — per maker: the documented colour or material association, its source and check
  date, the property that makes the card distinguishable without colour, and how the treatment stays inside the
  shop's own register.
- **Brand line** — per maker: one short description in Persian, what it asserts, the public source for it, and
  whether it is our description or the maker's own published wording.
- **Recognition evidence** — the count of brands a cold viewer identifies from the treatment alone, with names
  hidden. This is the number the feature is judged on.
- **Harmony evidence** — whether a cold viewer reads the finished deck as one shop's page.
- **Deck contract (inherited)** — 008's sticky mechanism, fit budget and protected mark-and-name rule, all of which
  must survive untouched.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** *(test condition amended 2026-09-29)*: A person shown the six cards **with the maker's name hidden**
  correctly identifies at least **four of six** makers, and does not confuse the two makers that share a hue
  family (Samsung and Nokia) or the two that have no hue (Apple and TCH). Four, not five: the research
  established a documented hue for exactly four makers, and a fifth would require inventing an association for
  TCH.
  > The original condition hid "names **and wordmarks**". That test can no longer be run as written: since
  > FR-016 the wordmark lives inside the approved artwork, so hiding it means hiding the card. The condition is
  > narrowed to the name alone, which is the thing the page can still hide. This is a real narrowing of the
  > measurement — a shopper recognising Apple from the drawn iPhone is weaker evidence than recognising Apple
  > from a logo alone — and it is recorded rather than smoothed over.
- **SC-002** *(inverted 2026-09-29 with FR-006; wording tightened the same day, because as first written it
  failed the owner's own approved artwork)*: **Zero of six** cards render a text string **that the page itself
  puts there** — no caption, no name element, no product count — and **six of six** are still attributable to the
  right maker by a shopper who is not using colour. A wordmark **inside** the artwork is not a violation and never
  was: FR-016 permits the artwork to reproduce a product and the maker's wordmark, and five of the six approved
  cards do exactly that. The check is therefore made against the card's rendered markup, not against the pixels of
  the image.
  > Original: "Six of six cards carry a description line; zero cards are blank."
- **SC-003** *(conditional 2026-09-29)*: **Zero** unsourced lines ship. While FR-006 holds this is satisfied by
  there being no lines at all, and the criterion is kept live so that any line reintroduced later is measured
  against a recorded public source rather than written fresh.
  > Original: "Six of six lines have a recorded public source." 
- **SC-004**: A cold viewer asked "whose page is this" answers **Hami Hamrah**, and asked "do these six belong
  together" answers **yes** — both, on the finished deck.
- **SC-005**: The deck's existing acceptance measurement passes after the change with **no clause newly failing**.
- **SC-006**: **Zero** claims of partnership, endorsement, official status, price or stock appear on any card.
- **SC-007**: Every card's text clears the legibility floor against its own background — **six of six** checked, not
  one assumed.
- **SC-008**: The owner accepts the treated deck on their own phone, as they did the undecorated one.
- **SC-009**: **Zero** cards repeat the three known-false framings — Nokia as a phone manufacturer, realme as an
  independent company, TCH as a phone maker by heritage — and **zero** print an unverified slogan.

## Assumptions

- **The six makers are fixed** by what the catalogue actually holds: APPLE, SAMSUNG, XIAOMI, NOKIA, REALME, TCH.
  This feature does not add brands.
- **Generated imagery is now the identity's leading layer.** *(Amended 2026-09-27; this bullet previously read
  "No generated imagery is needed, and none is wanted", and recorded the owner's ChatGPT offer as declined.)* The
  owner produced six card artworks, approved all six, and ordered the rule overwritten. What the amendment does
  **not** change: colour, material, type and a sourced line still carry the identity, because the artwork is one
  band of a card and the text beside it is still the part that is true, selectable and screen-readable. The
  artwork's hues are Hami's art direction, not evidence — the sourced-hue table in `lib/brand-identity.ts` still
  answers for every colour claim the page makes in words, and no card may say a maker's colour is its own because
  a picture happens to be green.
- **`TCH` is not TCL Technology.** *(Recorded 2026-09-27, after the records were written.)* The catalogue's brand
  «تی سی اچ» carries 23 SKUs — smartwatches, bluetooth headphones, powerbanks and feature phones. The research
  file read the three letters as the TV manufacturer and the TCH record inherited that: a line asserting Chinese
  1981 origins and a "second-largest TV maker" claim, the slogan "The Creative Life", and a blocklist forbidding
  the brand be called a phone maker — a brand that sells phones. FR-018 governs: the page shows less rather than
  guesses, so the unsupportable claims are removed rather than replaced with a new story about a company this
  project has not actually researched. `research/brand-identity-sources.md` is left as written, because it is a
  record of what was read on 2026-09-26, not of what is true.
- **No new tooling is needed.** The research is reading public sources and recording what they say; the existing web
  search and browser cover it.
- **No card carries a description line as of 2026-09-29** (FR-006). The assumption that governed them — that any
  line is Hami's own wording from researched attributes, never a maker's slogan, because a real slogan on the
  shop's page implies a relationship nobody established — is **kept, not deleted**. It is the rule the moment a
  line returns, and it is why FR-007 and FR-008 were made conditional rather than removed. Where a slogan is
  genuinely the best wording, FR-008 still decides how it may appear.
- **Apple and TCH are the no-hue cases.** Apple's identity is documented as monochrome; TCH produced no association
  at all. Both are carried by other means, and must remain distinguishable from each other.
- **The colour values on this page are Hami's, inside the makers' documented hue families.** That is a deliberate
  choice forced by the evidence — no maker published a citable value — and it happens to solve the luxury problem
  too, because a hue we tune can sit with burgundy and champagne in a way a corporate colour cannot.
- **The research was done without working web search.** The researcher was bot-blocked on every search engine and
  had direct page fetches and an encyclopaedia only. The gaps are a tooling limit, not proof that brand guideline
  documents do not exist; a later pass with real search could upgrade a hue family's evidence, and would not change
  the rule that the value stays ours.
- **Samsung and Nokia are the near-hue case** (both blue) and are expected to need a second distinguishing property.
- **Recognition is tested on people, not asserted by the designer**, exactly as the categories chapter was.
- **Verification happens on a real phone or an exact 360 px viewport**, as with every recent frontend feature here.

## Out of Scope

- Changing the deck's mechanism, geometry, order, or fit budget (all 008's, and FR-014 protects them).
- The brand listing pages a card links to.
- The moving brand ticker elsewhere on the homepage.
- Per-product or per-category imagery, and any maker logo artwork.
- Adding brands beyond the six.
- Anything asserting a commercial relationship between the shop and a maker.
