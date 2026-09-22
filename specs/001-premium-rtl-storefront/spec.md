# Feature Specification: Premium Persian RTL Storefront

**Feature Branch**: `001-premium-rtl-storefront` (no dedicated branch created — no `before_specify` hook is configured; work continues on `Hami-v3`)

**Created**: 2026-09-20

**Status**: Draft — amended 2026-09-20

## Amendment Record

| Date | Change | Reason | Classification |
| --- | --- | --- | --- |
| 2026-09-20 | **FR-057 … FR-064 added** — Persian language and typography correctness | The installed Persian language references were audited against this repository and found three real defects it did not previously forbid: letter-spacing applied to Persian headings site-wide, a missing zero-width non-joiner in search copy, and a mobile-number rule that rejects the international form shoppers paste. Dates and identity-code handling were already correct and are now pinned so they cannot regress. Evidence counts are in the feature checklist | **MINOR** — new requirements, nothing removed |
| 2026-09-20 | **FR-031** narrowed; Resolved Q2 superseded in part; the "No new visual assets" assumption qualified | Feature `003-floating-product-presentation` asked the same question about presenting products as floating objects, and the owner answered **B — isolate the product by removing the photograph's background**. The original wording forbade all new asset production, which blocked that decision outright | **MINOR** — guidance materially expanded; no principle removed, and the underlying honesty requirement that a product be shown as it truly is remains binding and is now stated explicitly inside FR-031 |

Nothing else in this specification was altered by the amendment. The full change record, including what is
still forbidden, is inside **FR-031** and the **Resolved Q2** entry.

**Input**: User description: "Redesign and complete the Hami Hamrah Shop frontend as a premium Persian RTL e-commerce experience for a real mobile-phone and electronics distributor in Iran. The goal is not to create a conventional online store. The storefront should communicate exceptional trust, premium craftsmanship, technological sophistication, and a luxury brand presence from the first viewport... The experience must remain practical and usable as an e-commerce storefront... Do not interpret 'luxury' as excessive decoration, gradients, glowing effects, visual noise, or stereotypical luxury aesthetics. Luxury should come from composition, typography, proportion, whitespace, imagery, hierarchy, interaction quality, restraint, and precision... Unknown or unavailable information must never be fabricated."

## Related Initiative

This specification is the first feature under the frontend-only initiative begun 2026-09-20 and governed
by `.specify/memory/constitution.md` v1.0.0. Four of its principles are load-bearing here and are referenced
by number below: **I** Honest Interface, **II** Persian RTL by Default, **III** Static Data Seam,
**IV** Design Is Open.

## Terminology

Terms used consistently throughout this specification:

- **Catalog record** — one of the 189 product entries available to the storefront.
- **Purchasable** — the catalog states whether the merchant can sell the item right now. In the current
  snapshot only **5 of 189** records carry that state, and the owner has confirmed this is staleness in the
  export rather than the real trading position (Resolved Q1). Availability is therefore expected to change
  substantially, and the storefront must present it correctly both before and after a refresh.
- **Refresh tolerance** — the requirement that a large change in availability data must not force a
  redesign, break a layout, or invalidate a merchandising rule. See FR-053 … FR-056.
- **Call-for-price** — a record with no listed price, meaning "ask us" rather than "free". 5 records.
- **Availability label** — the truthful status shown to a shopper: in stock, limited, contact us,
  or out of stock.
- **Surface** — any distinct screen the shopper can reach (home, listing, product page, and so on).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Premium first impression and brand trust (Priority: P1)

A Persian-speaking shopper arrives at Hami Hamrah for the first time, from a shared link or a search
result, on a phone. Within one screen they must understand three things without scrolling: this is the
established Mashhad merchant with twenty years of trading history, this is an authorized seller of real
branded goods with valid warranties, and this is a serious, carefully-made place to buy from — not a
dropshipper or a grey-market listing page. They then choose their own next step confidently.

**Why this priority**: The brief's stated goal is that positioning lands "from the first viewport." Every
other story depends on it — a shopper who does not trust the first screen will not browse deeply, will not
read a price as honest, and will not call the shop. It is also the only story that carries claims the
merchant cannot compete on with price alone.

**Independent Test**: Fully testable by loading the first screen as a new visitor with no products opened,
then asking a shopper unfamiliar with the business what they now believe about it. Delivers value on its
own: an improved first impression is useful even if nothing else changes.

**Acceptance Scenarios**:

1. **Given** a first-time visitor on a mobile connection, **When** the first screen finishes presenting,
   **Then** they can state that Hami Hamrah is a long-established Mashhad retailer, and can name at least
   one specific reason to trust it, without having scrolled.
2. **Given** the same visitor, **When** they look at the first screen for five seconds, **Then** they can
   name at least one obvious next action available to them.
3. **Given** any trust claim shown (authorization, warranty, history), **When** it is checked against the
   merchant's verified facts, **Then** it is one the business can substantiate, and no supporting
   certificate, award, or review is implied that the merchant does not hold.
4. **Given** the visitor continues past the first screen, **When** they scroll through the homepage,
   **Then** the presentation stays at the same level of care from first section to last, with no section
   that is visibly filler.

---

### User Story 2 — Find the product they came for (Priority: P2)

A shopper knows roughly what they want — a Samsung phone, a power bank under a budget, whatever is on
offer — and needs to reach it through browsing, category and brand entry points, filtering, and search.
Categories and brands should feel like a curated shop floor with intent behind the arrangement, not an
exported database listing. They must be able to narrow to a short list and read a truthful price on it.

**Why this priority**: This is the core utility that makes the site a storefront rather than a brochure.
It is second only to first impression because a beautiful site that hides its catalog fails at the job it
exists to do.

**Independent Test**: Give a participant a concrete goal ("find a Xiaomi phone", "find the cheapest power
bank that is actually available") with no help, and count the interactions and time to reach a matching
result. Works even if the homepage is unchanged.

**Acceptance Scenarios**:

1. **Given** a shopper on the product listing, **When** they filter by brand and category together,
   **Then** they see only matching items and the result count reflects exactly what is shown.
2. **Given** a shopper searching a Persian product name, **When** results appear, **Then** matches include
   the intended product and are ordered by relevance rather than arbitrarily.
3. **Given** a category with many products, **When** the shopper reaches the end of the loaded results,
   **Then** more arrive without losing their place or their applied filters.
4. **Given** filters that match nothing, **When** the shopper looks at the result area, **Then** they are
   told plainly that nothing matched, are offered a way to widen the search, and are not shown an empty
   frame that reads as a loading failure.
5. **Given** a shopper who wants to return to a narrowed view later or send it to someone, **When** they
   copy the address of their filtered results, **Then** reopening it reproduces the same filter state.
6. **Given** 162 of 189 catalog records are not currently purchasable, **When** a shopper browses any
   listing, **Then** they can tell within one glance which items are actually obtainable, and unobtainable
   items are neither hidden nor presented as equivalent to available ones.

---

### User Story 3 — Inspect a product and trust what is shown (Priority: P3)

A shopper opens a specific product and needs to decide. They want to see it properly, read what it is,
check the specification details that matter to them, understand the price and any discount, see which
colour or storage options exist, and know whether they can have it. Nothing on this screen may be
invented to fill space.

**Why this priority**: This is where purchase intent resolves or dies. It ranks after discovery because a
shopper must arrive here to benefit, and it is the surface with the highest risk of dishonesty — an empty
spec table, a gallery of pictures that are not that product, or a struck-through price that was never
higher all mislead at the exact moment of decision.

**Independent Test**: Open products across the full range of data completeness — the richest, one with no
specifications, one with a single image, one with no price — and confirm each renders as a complete,
honest screen. Testable independently of the listing and the homepage.

**Acceptance Scenarios**:

1. **Given** a product with a listed price, **When** the shopper views it, **Then** they see the price
   with its currency unit and, only where a genuinely higher previous price exists, the discount and its
   percentage.
2. **Given** a product where the comparison price is equal to or lower than the current price, **When**
   the shopper views it, **Then** no discount or struck-through price is displayed.
3. **Given** a product with no listed price, **When** the shopper views it, **Then** the price area reads
   as "ask us" with a way to do so, and never as zero or free.
4. **Given** a product with colour and storage options, **When** the shopper selects among them, **Then**
   what changes is visible and the option they have chosen is unambiguous.
5. **Given** a product with no recorded specifications, **When** the shopper views it, **Then** the
   specification area is simply absent rather than present-but-empty, and the page still reads as finished.
6. **Given** a product whose gallery holds more than one picture, **When** the shopper moves through it,
   **Then** they can tell how many views exist and which one is showing.
7. **Given** a product with exactly one picture, **When** the shopper views it, **Then** no gallery
   affordance, thumbnail row, or dots imply that more views exist.
8. **Given** any product, **When** its images fail to arrive, **Then** the layout holds its shape and the
   absence is graceful, never a broken icon or a collapsed frame.
9. **Given** a shopper who arrives at a product link that does not exist, **When** the page loads, **Then**
   they are told the item is unavailable and returned somewhere useful.

---

### User Story 4 — Act on availability honestly (Priority: P4)

The shopper has found what they want and wants it. Almost nothing in the catalog is marked purchasable, so
the honest path for most items is a phone call or a visit to the physical store. That path must feel like
a considered, premium service — a merchant who answers and knows their stock — and must never feel like a
broken buy button or a dead end. The shopper should be able to reach a human being in one obvious action
and know what to expect when they do.

**Why this priority**: Today this is the primary conversion action for roughly ninety-seven percent of the
catalog as snapshotted, and it is the only conversion action this feature can promise truthfully. The owner
has confirmed that availability figure is stale and will be refreshed (Resolved Q1), which raises rather
than lowers this story's priority: the moment a shopper can genuinely buy, the honesty of the step between
"interested" and "orders it" becomes the whole brand promise. A storefront that presents a purchase flow it
cannot honour damages the exact trust Story 1 exists to build.

**Independent Test**: Choose a product in each availability state, take the action offered, and confirm
the outcome is truthful and the shopper is left with a usable next step. Requires no account, no cart, and
no payment capability.

**Acceptance Scenarios**:

1. **Given** a product that is not purchasable, **When** the shopper looks for the way to obtain it,
   **Then** a single clear action is present, and its wording matches the real outcome rather than
   imitating an order confirmation.
2. **Given** a product that is not purchasable, **When** the shopper takes the action, **Then** the
   contact details offered are the verified ones and nothing is invented on the shopper's behalf.
3. **Given** a shopper on a phone where a call cannot be placed, **When** they use the contact action,
   **Then** they can still read the number and copy it.
4. **Given** a product that is genuinely available, **When** the shopper expresses intent, **Then** the
   response distinguishes it from the unavailable case instead of using identical wording.
5. **Given** a returning or existing customer, **When** they seek their own past purchases, **Then** the
   route they are sent is the one that exists, and no link leads to a page that was never built.

---

### User Story 5 — One coherent brand across every surface and screen size (Priority: P5)

The shopper moves between home, listing, product, and the partnership and information pages, opening the
site on a phone and later on a laptop. It should read as one art-directed brand throughout: the same
identity, the same standard of spacing and hierarchy, the same quality of interaction, the same reliable
navigation. Direction and numerals must behave correctly for Persian at every width.

**Why this priority**: The brief requires the whole site to feel like one premium brand rather than a set
of unrelated pages. It comes after the individual stories because it is what makes them feel intentional
together, and because a shopper will hit it on their second or third page rather than their first.

**Independent Test**: Walk the full site on a narrow phone and on a wide desktop display in sequence,
in Persian, using only the keyboard as well as touch and mouse, and note every place the quality or the
direction breaks. Testable without changing any single page's content.

**Acceptance Scenarios**:

1. **Given** a shopper navigating every available page, **When** they move between them, **Then** the
   navigation, page identity, and standard of presentation remain recognisably the same throughout.
2. **Given** the site at the narrowest common phone width, **When** the shopper scrolls any page,
   **Then** nothing extends past the screen edge and nothing overlaps.
3. **Given** a right-to-left page, **When** the shopper uses it, **Then** direction, alignment, spacing,
   icon orientation, and numeric formatting all read correctly, and switching to a left-to-right locale
   would not be needed to make sense of any screen.
4. **Given** a keyboard-only shopper, **When** they tab through a page, **Then** every interactive element
   is reachable, its focus is always visible, and the order matches what they see.
5. **Given** a shopper who has reduced motion enabled on their device, **When** they browse, **Then**
   movement is calmed rather than removed of meaning, and no information is available only through
   animation.
6. **Given** any page at any width, **When** text grows to fit a longer Persian phrase, **Then** the
   layout adapts instead of clipping or overlapping.

---

### Edge Cases

- **Product with no image at all** (1 record): what shows in its place, and does the listing remain
  attractive without inventing a photograph?
- **Gallery images beyond the first** (133 records have more than one): only the primary picture is held
  locally; secondary views depend on a remote host that was measured at six to seven and a half seconds
  per image and failed often. What does the gallery do when those views are slow or never arrive?
- **Out-of-stock item reached directly** by shared link or bookmark: shown, marked truthfully, with the
  availability action still meaningful — or redirected?
- **Prices and quantities appearing in Latin digits** anywhere, mixed with Persian digits on the same
  screen.
- **Toman amounts with no fractional unit** — extremely large integers: readable at a glance at every
  width without truncation.
- **A product name long enough** to wrap across several lines in a card, a listing row, a browser tab, and
  a page heading without breaking any of them.
- **Products that appear in more than one category**, and a category with zero products in it.
- **The one record typed as a service** rather than a physical good, and the three sim-card records: does
  the availability treatment fit them?
- **A Persian product address shared in a messaging app** with different character encoding, reopened
  later: does the shopper reach the same product?
- **Catalog data that has aged** — the export is dated 2026-09-09. What does the storefront communicate
  about how current a displayed price or stock state is?
- **A filter set narrowed to one result**, and to zero.
- **Missing verified contact facts**: there is a confirmed phone number but no confirmed street address or
  email. What may an information page legitimately say?
- **Interaction while images are still arriving** on a slow mobile connection.
- **Browser back and forward** through a filtered listing: does the shopper land back where they were?

## Requirements *(mandatory)*

### Principles and Truthfulness

- **FR-001**: Every price, availability status, discount, specification, image, and product claim shown to
  a shopper MUST come from an existing catalog record or a merchant-verified fact. Nothing in these
  categories may be invented, estimated, or filled in to complete a layout. (Constitution I)
- **FR-002**: Products whose availability is unknown or unreadable MUST be presented as "contact us" and
  MUST NOT be presented as in stock. (Constitution I)
- **FR-003**: Products without a listed price MUST NOT display zero, a dash that reads as free, or an
  assumed amount. They MUST present asking for the price as the intended behaviour.
- **FR-004**: A discount MUST be displayed only where the previous price is strictly higher than the
  current price.
- **FR-005**: Where the record has no value for a section, that section MUST be absent rather than shown
  empty. This covers specifications (23 records have none), description text (35), and gallery views beyond
  the first (56).
- **FR-006**: Trust claims MUST be limited to merchant-verified facts: the twenty-year trading history,
  the Mashhad physical store, certified Redmi dealership granted via Radman Paj, and official TCH regional
  representation. No other authorization, award, review, testimonial, or certification may be implied. The
  brand authorizations MUST be presented as stated facts and MUST NOT be accompanied by certificate
  imagery, document scans, or store photography, because the owner has confirmed only a street address and
  an email address will be supplied — not supporting documents (Resolved Q3). (Constitution I)
- **FR-007**: Contact details MUST be drawn from the single verified contact record. The owner has committed
  to supplying a verified street address and email address, which will then be admissible content for an
  information surface (Resolved Q3). Until each is actually supplied and confirmed it MUST NOT appear
  anywhere in the interface, including as an obviously placeholder value, so the phone number stands alone
  in the interim. (Constitution I)
- **FR-008**: A section that exists only to fill space MUST NOT be created. Where the storefront has
  nothing true and useful to say in a place, that place MUST remain empty.

### Language, Direction, and Numerals

- **FR-009**: Persian with right-to-left reading order is the primary and required presentation of every
  surface. (Constitution II)
- **FR-010**: Layout MUST use direction-relative spacing and alignment so that content reads correctly
  right-to-left without compensating overrides on a per-screen basis.
- **FR-011**: Prices, quantities, dates, and result counts MUST render with Persian numerals consistently,
  and MUST NOT mix numeral systems within a screen.
- **FR-012**: Interface copy MUST use descriptive actions in Persian rather than generic prompt words.
- **FR-013**: Iconographic and directional cues (back, forward, chevrons, carousels, progress) MUST orient
  correctly for a right-to-left reader on every surface.

### Home and Brand Impression

- **FR-014**: The first screen MUST establish the brand's positioning and at least one trust signal
  without requiring the shopper to scroll.
- **FR-015**: The first screen MUST present the real logo identity in a legible form on the chosen
  background, using the supplied official logo files.
- **FR-016**: The homepage MUST give a shopper three or more genuinely different ways to enter the catalog
  (for example a featured product, a category, and a brand or an offer), each leading somewhere real.
- **FR-017**: The homepage MUST communicate the price-leadership position truthfully — that retail prices
  sit close to wholesale — without stating a specific comparative claim about any competitor that cannot be
  substantiated.
- **FR-018**: Every homepage section MUST be populated from real catalog or merchant data. A section that
  would render with no real content MUST be omitted entirely.
- **FR-019**: Promotional framing MUST NOT be used where there is no actual promotion attached to it.

### Catalog Discovery

- **FR-020**: Shoppers MUST be able to browse the full catalog of 189 products in paged or incrementally
  loaded form, with the total number of matching products visible.
- **FR-021**: Shoppers MUST be able to narrow products by category and by brand, singly and combined.
- **FR-022**: Shoppers MUST be able to narrow by availability, by price range, and by whether an item is
  on offer.
- **FR-023**: Shoppers MUST be able to search products by name, including Persian names.
- **FR-024**: Shoppers MUST be able to order results by newest, price ascending, price descending, and
  featured. Products with no listed price MUST sort to the end of the price ordering in both directions,
  so that asking-for-a-price never reads as the cheapest item in the shop.
- **FR-025**: The default product ordering MUST place genuinely obtainable items ahead of unavailable ones
  without hiding the unavailable ones.
- **FR-026**: Applied filters MUST be visible as removable controls, with a single action that clears all
  filters.
- **FR-027**: The complete filter and search state MUST survive reload, sharing, and browser back/forward.
- **FR-028**: Category and brand entry points MUST be presented as a curated selection with meaningful
  grouping and counts, not as an undifferentiated list. Only 19 of the 32 categories and 15 of the
  39 brands actually contain products, so listing all of them would present 28 empty doors.
- **FR-029**: Shoppers MUST be able to reach the products of a given brand and of a given category from a
  dedicated place, not only through a filter.

### Product Presentation

- **FR-030**: Product listings and cards MUST show, where the record has it: an image, the name, the
  brand, the price, and the availability state.
- **FR-031**: Premium visual impact MUST be built from the photography that already exists for each product,
  carried by composition, cropping, scale, whitespace, and typographic hierarchy — not by video, by
  three-dimensional modeling of a product that was never photographed, or by generated imagery (Resolved Q2,
  as amended 2026-09-20). A product's dependable image is its single locally-held photograph, and every
  treatment MUST be able to stand on it alone. Additional views held on the remote host are genuine
  photographs of the same product but were measured as slow and failure-prone, so a composition MUST NOT
  depend on them: they may be offered, and MUST degrade to the single local view without emptying a frame or
  breaking a layout. The 56 records with no additional view MUST be indistinguishable in polish from the 133
  that have one, and the count and current position MUST be evident whenever more than one view is actually
  shown.

  **Permitted by amendment (2026-09-20)**: deriving an isolated version of an existing photograph by
  removing its background, so a product can be presented as an object rather than as a picture in a
  rectangle. This is the one form of new asset production allowed here, and it is bounded: the derived asset
  MUST depict the same product with its true shape, finish, colour, and proportions; the unchanged source
  MUST be retained alongside it; every derived asset MUST be reviewed against its source individually; and
  where a clean result is not achievable the product MUST fall back to a deliberately framed presentation
  rather than ship with a defective edge. Full requirements live in `003/FR-028 … 003/FR-034`. **The
  principle that motivated the original wording is unchanged and still binds**: nothing a shopper sees may
  represent the product as something it is not.
- **FR-032**: The product page MUST present recorded specifications in a scannable form and description
  text in a readable form.
- **FR-033**: Where a product has options, the shopper MUST be able to see the available colours and
  storage capacities and which combination is selected.
- **FR-034**: The price MUST be the most prominent information on the product page after the product's
  identity, and the discount treatment MUST be legible as a comparison rather than decoration.
- **FR-035**: Related products MUST be selected on a real relationship — same brand, same category, or a
  genuine pairing — and MUST NOT be an arbitrary sample of the catalog presented as a recommendation.
- **FR-036**: Every product surface MUST render acceptably for the sparsest record in the catalog as well
  as the richest.

### Availability and Contact Action

- **FR-037**: Every product MUST offer one unambiguous primary action appropriate to its real
  availability.
- **FR-038**: The action for a non-purchasable item MUST describe what will actually happen and MUST NOT
  imitate the wording or confirmation of a completed order.
- **FR-039**: The contact action MUST be reachable in at most one interaction from any product and MUST
  function on devices where placing a call is unavailable.
- **FR-040**: Where the shopper expects a purchase capability that this feature cannot honour today, the
  interface MUST say plainly that the capability is not available here and MUST NOT leave a control that
  appears to work. The owner has confirmed the current availability figures are stale and will be refreshed
  (Resolved Q1), so obtainability-oriented presentation is a genuine design target rather than a workaround.
  This resolves the *data* question only: the frozen purchase backend is a separate boundary set by
  Constitution III and Resolved Q1 does not reopen it, so cart, checkout, and payment remain outside this
  feature regardless of how the availability numbers move. (Constitution I and III)

### Responsiveness, Coherence, and Interaction Quality

- **FR-041**: Every surface MUST be usable and composed with intent at both the narrowest common phone
  width and a wide desktop display, with no horizontally scrolling page. (Constitution II)
- **FR-042**: Navigation MUST be present and equivalent on phone and desktop, reaching the same
  destinations from both.
- **FR-043**: Every interactive element MUST have visibly distinct resting, hovered, focused, pressed, and
  disabled treatment, and MUST NOT be operable in a state where it cannot respond.
- **FR-044**: Focus MUST be visible on every interactive element at all times, and keyboard order MUST
  follow visual order in right-to-left layout.
- **FR-045**: Interactive targets MUST be comfortably usable by touch.
- **FR-046**: Any area that updates asynchronously MUST communicate its loading, empty, error, and success
  states distinctly, and MUST reserve space so content does not jump.
- **FR-047**: Movement MUST support a reduced-motion preference without removing access to any content or
  state.
- **FR-048**: Images MUST reserve their space so a page holds its layout while pictures arrive, and a
  failed image MUST degrade without layout damage.
- **FR-049**: The storefront MUST present a single consistent identity across surfaces — the same
  vocabulary of spacing, hierarchy, and detail — so no page appears to belong to a different project.
- **FR-050**: The presentation of the store on screen MUST remain consistent with the physical-store
  reputation it represents: it MUST NOT look cheaper than the business it stands for. (Constitution I)

### Design Freedom

- **FR-051**: This specification MUST NOT fix colors, typefaces, sizes, spacing values, corner radii,
  shadows, or motion curves. Those are decisions to be made during design development. (Constitution IV)
- **FR-052**: Where a premium effect is desired, it MUST be achieved through composition, hierarchy,
  proportion, restraint, and precision, and MUST NOT depend on decorative excess, glow, or visual noise.

### Catalog Currency and Refresh Tolerance

Added because Resolved Q1 established that availability data will change substantially.

- **FR-053**: Presentation and merchandising rules MUST be expressed against each record's own state and
  MUST NOT embed the current counts, ratios, or thresholds of this snapshot, so that a large availability
  refresh changes what is shown without requiring a redesign.
- **FR-054**: Every surface MUST remain composed across the whole plausible range of availability — from
  today's 5 obtainable items to a catalog that is mostly obtainable — with no layout, section, or empty
  state that only works at one end of that range.
- **FR-055**: Wherever a price or an availability state is decisive to a shopper's decision, the storefront
  MUST make the currency of that information discoverable, so a shopper is not left to assume a figure from
  a snapshot of unstated age is current. The form is a design decision; the obligation is not.
- **FR-056**: After a data refresh, any state the storefront cannot interpret MUST fall back to
  "contact us" rather than to a positive claim, exactly as an unreadable state does today. Refreshed data
  MUST NOT be able to introduce a false availability claim by omission. (Constitution I)

### Persian Language and Typography Correctness

Added 2026-09-20 from the installed Persian language references, each rule below verified against this
repository rather than assumed.

- **FR-057**: Persian text MUST NOT be letter-spaced. Tracking breaks letter joining in Persian script, so
  every heading, label, and body string set in Persian MUST render with zero letter-spacing. Latin-only
  decorative labelling is exempt, because spacing there is a typographic device rather than a defect.
- **FR-058**: Persian words MUST use the correct zero-width non-joiner where the standard form requires one
  («ثبت‌نام», «جست‌وجو», «می‌شود»), and MUST NOT be rendered with a visible space or with the joiner omitted.
- **FR-059**: Interface copy MUST use the formal-but-human register consistently: direct address («شما
  می‌توانید»), short sentences, concrete claims. Bureaucratic and machine-generated phrasing is prohibited —
  including the padding constructions that substitute for stating a fact, and superlatives with no
  measurement behind them. (Constitution I)
- **FR-060**: Standard interface actions MUST use the established Persian terms rather than transliterated
  English, and the term for saving, sending, and cancelling an order MUST each be distinct and correct.
- **FR-061**: Dates and times shown to a shopper MUST be rendered in the Persian calendar through the
  platform's own locale formatting, which already reports the correct week start and month names. Hand-rolled
  calendar conversion is prohibited: leap-year rules in the Persian calendar do not follow a simple
  arithmetic cycle.
- **FR-062**: Mobile-number acceptance MUST include the international dialling forms a shopper actually
  pastes, not only the locally written form, and MUST normalise Persian and Arabic digits before checking.
- **FR-063**: Where a form collects a fixed-line number, it MUST be validated by the fixed-line rule and
  MUST NOT be tested against the mobile rule, since the two have different shapes.
- **FR-064**: Numeric fields that a shopper reads or that are checked for validity — national identity,
  postal, legal-entity and economic codes — MUST preserve leading zeros by being handled as text, MUST state
  their expected length in the label or hint, and MUST set their input direction to left-to-right so a mixed
  identifier is not reordered on screen.

## Key Entities

- **Product**: a purchasable thing the merchant sells. Carries a name in Persian and sometimes English, a
  brand, one main category plus possible secondary categories, a price, an availability state, images,
  specification details, description text, and a set of options.
- **Product Option (Variant)**: a specific sellable configuration of a product, distinguished mainly by
  colour and storage capacity, which may carry its own price and stock count. 311 exist across the
  catalog.
- **Brand**: a manufacturer or line the merchant carries. 39 are listed; only about 15 are attached to
  products in the current data, which is why a brand entry point cannot simply list all 39.
- **Category**: a grouping used to browse. 32 exist in a parent-and-child arrangement, but only 19
  contain products in the current data.
- **Price**: an amount in Toman with no fractional unit. May be absent, which means "ask us" and never
  "free".
- **Comparison Price**: a previous price a discount is measured against. Meaningful only when strictly
  above the current price.
- **Availability State**: the merchant's real selling status for an item — in stock, limited, contact us,
  or out of stock. Only 5 records currently support an unqualified "in stock".
- **Product Image**: a photograph of that specific product. The first view is held locally for 188 of 189
  records; further views are held remotely.
- **Specification**: a named attribute and value pair, such as battery capacity or screen size. Present
  for 166 records.
- **Trust Credential**: a verified fact about the merchant's standing — the trading history, the physical
  store, and the two brand authorizations. Distinct from marketing copy because it is substantiable.
- **Contact Channel**: a verified way to reach the merchant. Today only the phone number qualifies.
- **Curated Collection**: a merchant-chosen grouping presented with intent, such as a home feature or a
  brand grouping, which must correspond to real products rather than an arbitrary sample.
- **Storefront Surface**: any screen a shopper can reach, each of which must hold the same standard of
  presentation as the homepage.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a test with 10 shoppers new to the business, at least 8 state unprompted after five
  seconds on the first screen that Hami Hamrah is an established, trustworthy retailer, and at least 6 can
  name a specific reason.
- **SC-002**: At least 9 of 10 shoppers complete a concrete finding task — reaching a product that matches
  a stated requirement — in three interactions or fewer and under forty seconds.
- **SC-003**: A shopper can determine whether a given product is obtainable within five seconds of it
  appearing on screen, measured across products in each availability state.
- **SC-004**: Zero fabricated values. Auditing all 189 products, every displayed price, availability
  state, discount, specification, and image traces to a catalog record or a merchant-verified fact.
- **SC-005**: Zero false availability. Every record whose current state is not obtainable displays as not
  obtainable, and every record without a price displays no numeric price — verified by auditing the whole
  catalog, and re-verifiable after an availability refresh without restating the totals.
- **SC-006**: All 189 products and all 32 categories render without layout breakage, clipped text, or an
  empty section presented as though populated.
- **SC-007**: Numeral consistency is complete: a scan of every surface finds no screen mixing Persian and
  Latin digits.
- **SC-008**: No page scrolls sideways at the narrowest common phone width, at a common tablet width, or on
  a wide desktop display.
- **SC-009**: A keyboard-only shopper can reach and operate every interactive element on every surface with
  a visible focus indicator, verified by walking each page.
- **SC-010**: The first product image on a listing is visible to the shopper within two seconds on a
  typical mobile connection, and the page remains usable while later images arrive.
- **SC-011**: A shopper who reaches out by phone after browsing reports that what they were told matched
  what the site showed, for price and availability, in at least 9 of 10 such contacts.
- **SC-012**: In a side-by-side comparison with a well-regarded global technology brand's site, at least
  7 of 10 participants rate Hami Hamrah as equally polished or more polished, and the panel's mean rating
  on "does this feel like a premium, intentional brand" is at least 4 of 5.
- **SC-013**: Perceived-shopping-abandonment drops: fewer than 10% of tested shoppers reach a product they
  wanted and then leave because they cannot tell how to proceed.
- **SC-014**: Every link and navigation target in the storefront resolves to a page that exists, verified
  by walking the full navigation of the site.
- **SC-015**: Refresh tolerance holds: replaying the storefront against a predominantly obtainable version
  of the same catalog changes what shoppers see without changing any layout, wording rule, or merchandising
  threshold, and with no section left empty or overfull.

## Out of Scope

Deliberately excluded, primarily to respect the frozen backend boundary in Constitution III and the
frontend-only initiative:

- Account sign-in, registration, and session handling.
- Cart contents, cart persistence, and any checkout or order placement.
- Payment taking or payment gateway integration of any kind. No payment capability is confirmed for this
  business, so nothing in this specification may promise one.
- The administrative back office and any merchant-facing tooling.
- Bulk and tiered reseller pricing. The catalog data carries no pricing tiers, so no truthful reseller
  price can be displayed; the partnership route itself remains in scope as an information surface.
- Any change to how product data is stored or served, and any change to the services that sit behind the storefront.
- Languages other than Persian.
- Publishing or advertising integrations, reviews and ratings, wishlist and favourites, compare features,
  and any shopper account history — each requires capabilities this feature may not assume.

## Assumptions

Reasonable defaults chosen where the brief did not specify, each overridable without reworking the
specification:

- **Browsing is the promise; buying is designed for but not delivered.** The brief lists understanding,
  browsing, discovering, inspecting, and navigating; it does not list buying. Resolved Q1 confirms the
  availability data is stale, so obtainability is treated as real and forthcoming — but the purchase backend
  remains frozen under Constitution III, so this feature presents the catalog and connects the shopper to
  the merchant without completing an online transaction.
- **The catalog export is a stale snapshot, used deliberately.** It is dated 2026-09-09. It is sufficient to
  design and build against and insufficient to quote as current, which is why FR-053 … FR-056 exist. A
  refreshed availability export is an explicit dependency of the availability story, not an assumption.
- **Availability is communicated, not hidden.** Out-of-stock items remain browsable and clearly marked,
  matching how the physical shop presents itself, rather than being suppressed.
- **Phone-first, desktop-first-class.** Most visitors are assumed to arrive on a phone, but no surface may
  be a reduced version on desktop or the reverse.
- **The physical store is the fulfilment story.** Collection in Mashhad and contact by phone are assumed
  to be honest expectations for the near term.
- **Existing official logo files are the identity source** and are used as supplied, not redrawn.
- **No certificate or store photography exists on hand, and none is coming.** The owner will supply a
  verified street address and email; brand authorizations will be asserted in words rather than shown as
  documents (Resolved Q3). The design must therefore carry trust through specificity and restraint rather
  than through evidence it does not have.
- **No new visual assets are being produced** (Resolved Q2), **with one amendment**: isolating a product from
  its own existing photograph by removing that background is now permitted, and is the only new-asset route
  allowed. The existing product photographs, the official logo files, and typographic, compositional, and
  motion craft remain the entire raw material — a concept that depends on a photograph, render, film, or
  generated image which does not already exist is out of scope by constraint, not by taste.
- **Reduced-motion and keyboard access are requirements, not enhancements.**
- **Prices are shown in Toman**, matching how the business quotes.
- **Data staleness is disclosed** rather than silently trusted, in a form decided during design.
- **Existing frontend context is a draft to improve on**, not a compatibility target — Constitution IV
  permits discarding any current visual treatment outright.

## Resolved Clarifications

The three items below could not be defaulted responsibly: each significantly changed scope or the
shoppable experience, and no reasonable assumption covered it. All three were answered by the owner on
2026-09-20 and are now binding. The option tables are retained as the decision record.

**Open questions remaining: none.**

### Question 1: What is the shopper's purchasing relationship with this catalog?  —  **RESOLVED: B**

**Context**: User Story 4 and FR-037 through FR-040. The catalog marks only **5 of 189** products as
purchasable, while 162 are out of stock and 6 are explicitly "call".

**What we need to know**: Should the storefront be designed as a price-and-showroom experience that
routes nearly all interest to a phone call, or is the availability data stale and scheduled to be
refreshed before design locks?

| Option | Answer                                     | Implications                                                            |
| ------ | ------------------------------------------ | ----------------------------------------------------------------------- |
| A      | Showroom frame is correct and permanent    | Contact action becomes the core interaction; buy-oriented patterns retire |
| B      | Data is stale and will be refreshed        | Purchase-ready patterns stay in scope as design targets, built against honest fallbacks |
| C      | Mixed: phones are call-first, accessories are stock-first | Two presentation treatments and a more complex listing model |
| Custom | Provide your own answer                    | Re-frames User Story 4 and the availability requirements                |

**Answer recorded (owner, 2026-09-20)**: **B** — the availability data is stale and will be refreshed.
Obtainability-oriented merchandising is therefore a genuine design target, not a workaround, and the
storefront must survive a wholesale change in availability without being rebuilt.

**Boundary note**: this resolves the *data* question only. It does not reopen the frozen purchase backend
set by Constitution III, so cart, checkout, and payment remain outside this feature regardless of how the
figures move. Anyone reading option B as licence to touch checkout has misread it.

**Propagated to**: Terminology (Purchasable, Refresh tolerance), User Story 4, FR-040, the new
FR-053 … FR-056, SC-005, SC-015, Assumptions.

---
### Question 2: Where does the imagery for a "million-dollar" presentation come from?  —  **RESOLVED: A**

**Context**: User Story 1, FR-031, and the brief's invitation to use cinematic imagery, video, layered
composition, or 3D product visualization. The repository holds **one** real local photograph per product
(188 records), no video, and no 3D material — and the remote gallery images are slow enough to fail
often. Constitution I forbids substituting imagery that is not the actual product.

**What we need to know**: Whether premium impact must be built from the existing photographs and
typographic composition, or whether real assets will be supplied.

| Option | Answer                                        | Implications                                                        |
| ------ | --------------------------------------------- | ------------------------------------------------------------------- |
| A      | Art-direct with existing photography only     | Composition, typography, restraint, and motion carry the premium    |
| B      | Merchant supplies real photography or video   | Highest ceiling; the schedule depends on asset delivery             |
| C      | Abstract, non-representational visuals permitted | Rich atmosphere allowed, provided nothing implies a product truth |
| Custom | Provide your own answer                       | Determines what the hero concept may promise                        |

**Answer recorded (owner, 2026-09-20)**: **A** — art-direction works strictly with the photography that
already exists. Premium impact must be carried by composition, cropping, scale, whitespace, typographic
hierarchy, and interaction quality.

**Consequence the brief should face plainly**: this declines the original invitation to use cinematic
imagery, video, layered composition, and 3D product visualization as a group, because none of that raw
material exists and Q2 chose not to acquire it. The "million-dollar" goal now rests entirely on craft
applied to 188 still photographs. That is achievable and it is a harder constraint than the brief
anticipated, so it should be treated as the defining constraint of the design phase rather than as a
limitation to work around later.

**SUPERSEDED IN PART (2026-09-20)**: feature 003 asked the same floating-product question and the owner
answered **B — remove backgrounds to isolate the product** (`003` Resolved Q2). That is new asset production
and was forbidden by this answer's wording. **On the single point of background removal, option A no longer
stands**; the remainder of this answer holds — no video, no modeling of products that were never
photographed, and no generated imagery. See the Amendment Record and the amended `FR-031`. The two recorded
answers are now reconciled here rather than contradicting across files.

**Propagated to**: FR-031, Key Entities (Product Image), Assumptions.

---
### Question 3: Which trust proofs will the merchant supply?  —  **RESOLVED: C**

**Context**: FR-006, FR-007, and User Story 1. The strongest claims — certified Redmi dealership, TCH
regional representation, twenty years of history, the Mashhad store — currently have no document,
address, or photograph attached, and inventing any of them is prohibited.

**What we need to know**: Whether real certificate documents, store photography, a street address, or an
email address will be provided, so the trust story can be shown rather than only asserted.

| Option | Answer                                   | Implications                                                    |
| ------ | ---------------------------------------- | --------------------------------------------------------------- |
| A      | Owner will supply documents and photos   | Verifiable proof becomes a centerpiece of the experience        |
| B      | Claims stay as text, no documents       | Trust must be carried by presentation quality and specificity   |
| C      | Partial: address and email only          | A real contact surface, while authorizations remain text-only   |
| Custom | Provide your own answer                  | Sets what an information page may legitimately contain          |

**Answer recorded (owner, 2026-09-20)**: **C** — a verified street address and an email address will be
supplied. No certificate documents and no store photography are coming, so the brand authorizations stay
asserted in words rather than shown as evidence.

**Consequence**: an information page gains a real contact surface and a location, which is the single
strongest trust upgrade available here, but the two authorization claims remain unsubstantiated on screen.
Design must carry them through specificity and restraint. Neither address nor email may appear before it is
actually delivered and confirmed.

**Propagated to**: FR-006, FR-007, Assumptions, Edge Cases.
