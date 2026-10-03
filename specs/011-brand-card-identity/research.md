# Research: Brand Card Identity

**Feature**: 011 | **Date**: 2026-09-26 | **Plan**: [plan.md](./plan.md)

Seven decisions. The evidence base is `research/brand-identity-sources.md`; where a decision contradicts the
spec as first written, that is said rather than smoothed over.

---

## D1 — One envelope, six hues

**Decision**: every card keeps the deck's existing lightness range and a fixed low chroma ceiling. Only the OKLCH
hue varies, and it is taken from the maker's documented hue family. Values: `L` within 0.17–0.26, `C` ≤ 0.055 for
a card ground; hue per maker from the table in `data-model.md`.

**Rationale**: the owner wants recognition by colour and no garishness at the same time, and those pull against
each other only if brightness and saturation are free. Fix them and hue becomes the only variable — six cards at
one intensity read as one family wearing six faces, which is also exactly what the shop's own burgundy already
looks like: a dark, low-chroma field. The envelope is a number, so FR-011 stops being an argument about taste and
becomes an assertion a test can fail.

It buys a second thing for free. Because lightness never moves, the text contrast is the same on all six cards
(see D6 in the plan), which turns FR-013's six checks into one computed check.

**Alternatives considered**

- **Six hand-picked brand colours** — the reflex, and the failure mode. Six independently chosen colours at
  whatever intensity each looks best in isolation is a logo wall; nothing forces them into one family, and the
  owner's "با استایل کلی سایت هم هارمونی داشته باشه" is lost one card at a time.
- **Print each maker's documented hex** — impossible on the evidence. No maker published a citable value; every
  Samsung/realme/Nokia/TCL hex found came from an aggregator. Also the most garish option available, because
  corporate colours are tuned for white backgrounds and signage, not for a dark luxury ground.
- **Accent only, house ground unchanged** — Jev's answer at 0.83, and the weakest response to the owner's literal
  sentence. Kept as the fallback direction if SC-001 shows the tinted version is too loud, not as the opening move.
- **Per-maker *material* instead of hue** (brushed metal, glass, matte) — Jev scored it 0.00 and it is wrong for a
  different reason: material is not nameable from a screenshot the way a hue is, so it fails the owner's test even
  when it looks expensive. Retained for exactly one card, Apple, where the achromatic register *is* the documented
  identity (D4).

---

## D2 — Hue family from the brand, exact value ours

**Decision**: the hue family must be a documented association for that maker, with its source recorded. The
specific OKLCH values are Hami's, and are labelled as ours in the data and in the notes.

**Rationale**: this is forced, not chosen. The research pass looked for each maker's published visual-identity
guidelines, then its live site, then aggregators, and found **no primary-source colour value for any of the six**.
The only value observed on a maker's own markup was Xiaomi's orange in `mi.com/global`. Printing `#1428A0` as
"Samsung Blue" would repeat what the researcher called "the most repeated unsourced claim" they found.

The split also happens to solve the harmony problem: a hue we tune can be brought next to burgundy and champagne,
while a corporate colour cannot be tuned at all without ceasing to be it.

**Alternatives considered**

- **Use aggregator values and cite the aggregator** — honest about provenance, but it puts a third party's guess on
  a commercial page and calls it the maker's colour. Rejected on Principle I.
- **Use no colour at all until primary sources exist** — the safest possible reading, and it fails the feature
  outright. It also treats a tooling limit as a finding: the researcher was bot-blocked on every search engine and
  had direct fetches plus an encyclopaedia only.
- **Requiring a primary source per hue before shipping** — would block on documents that may be unreachable from
  this machine, and the distinction it protects (family vs value) is already carried by the rule that the value is
  ours.

---

## D3 — The two blues differ by *placement*, not by value

**Decision**: Samsung and Nokia are both documented blue and their hues are left essentially the same. They are
separated by **where** the hue sits on the card: Nokia carries blue as the card ground, Samsung carries it as an
accent over a near-neutral ground.

**Rationale**: the research already documents the difference. Samsung's colour is recorded as **contested between
its corporate blue and its retail identity**, which is monochrome with blue detail; Nokia's association is
blue-dominant. So there is a *sourced* second property for exactly the pair that needs one, and it is used instead
of an invented one. Shifting Samsung's hue toward teal to make it differ would break D2 — the shifted value would
belong to nobody.

**Alternatives considered**

- **Shift one hue until they differ** — the easy visual fix, and a fabricated association. Rejected.
- **Accept identical cards** — the recognition test would then be measuring a real confusion, and the deck would
  have two interchangeable cards in a sequence whose whole point is one-at-a-time distinction.
- **Let the owner's wordmark do the work** — true, and already true today; the point of the feature is that the
  card should be recognisable before the name is read.

---

## D4 — The two no-hue makers are distinguished by *why* they have none

**Decision**: Apple gets an achromatic aluminium-grey register (chroma at the neutral limit). TCH gets the **house**
treatment — the existing wine-and-champagne ground, no maker claim at all.

**Rationale**: both are "no hue", but for opposite reasons, and the reasons are visible if you use them. Apple's
identity is documented as monochrome black/white/grey — that *is* the brand, so a neutral card is the most
faithful thing available. TCH produced no association at all, so the honest card is the one that says nothing about
TCH's colour. The two therefore look different from each other — cool neutral against warm house burgundy — which
solves the "two neutrals are indistinguishable" edge case without inventing anything.

**Alternatives considered**

- **Give Apple a hue from its product marketing** — Apple's product shots run every colour; picking one and calling
  it Apple's identity would be exactly the invented association FR-003 forbids.
- **Give TCH a colour from its logo** — the researcher found no saturated value in TCL's own served markup and
  explicitly declined to quote a commonly-cited blue. Deriving a colour from a logo we are not permitted to
  reproduce is doubly wrong.
- **Drop TCH from the deck** — Jev scored this 0.00 and it is also false to the catalogue, which holds TCH
  products. A quiet card is the honest outcome; an absent brand is a different kind of statement.

---

## D5 — The owner's ask and Jev's objection are settled by a count, not by argument

**Decision**: build the strongest treatment the envelope allows, then run SC-001 — show a person the six grounds
with names and wordmarks hidden and count correct identifications, target four of six.

**Rationale**: these two are genuinely in conflict and no amount of reasoning resolves them. The owner wrote
*"با دیدن رنگ هر کارت بدونه اون چه برندیه"* — recognisable by the card's colour. Jev scored a full brand tint at
**0.01** and accent-only at **0.83**. Jev was optimising the pair it could weigh (harmony and luxury) and had no
evidence at all about how strong a colour signal people need in order to name a brand from a swatch — that is a
fact about people, and the only way to get it is to ask people.

So the decision is procedural: the envelope is the opening position, SC-001 is the referee, and if four of six is
missed the treatment gets bolder in one visible step at a time — with a screenshot at each step, so the luxury cost
is seen rather than debated. If it passes, the accent-only fallback is never needed.

**Alternatives considered**

- **Follow Jev and ship accent-only** — a defensible design and a direct answer to the wrong question.
- **Follow the literal ask and ship full brand colour** — Jev's 0.01, and the owner's own rejection history
  (two category layouts rejected on sight, an equal-tile grid rejected twice) says this owner punishes saturation
  more than they reward cleverness.
- **Ask the owner to pick now** — they already answered this once, in the message that commissioned the feature:
  recognisable by colour, but not garish, and harmonious. That is a request for a measurement, not a coin flip.

---

## D6 — Lines are ours, sourced; slogans appear only as the makers' own words, and the famous unverified ones are blocked by test

**Decision**: six one-line characterisations, written by us from researched attributes, each carrying its source URL
and check date. Two documented slogans may appear, attributed and visually marked as the maker's. A test-enforced
blocklist keeps "Think different" and "Connecting People" off the page.

**Rationale**: research found exactly two citable maker lines — realme's "Make it real", seen in the brand's own
live page title on its UK site, and TCL's "The Creative Life", adopted by the company in 2014. It found **nothing**
verifiable for Apple's and Nokia's famous lines, which are the two most likely to be written from memory. A slogan
on a card reads as the maker speaking, and implies a relationship nobody established; our description of a maker is
a different object and must not be dressed as theirs.

The blocklist is a test rather than a comment because the failure is so easy to reintroduce: those two phrases are
what anyone reaches for, and a comment does not stop a well-meaning edit at 2am.

**Alternatives considered**

- **Use the well-known slogans because shoppers expect them** — puts unverified words in makers' mouths on a
  commercial page. Rejected on Principle I.
- **Use Nokia's published positioning sentence** — research explicitly warns it is a corporate positioning
  statement, not a registered slogan, and setting it as a tagline would present it as one.
- **Keep the three existing invented lines and write three more** — that is the status quo, and the status quo is
  invented copy presented as brand truth. Replacing it is most of this feature.
- **Quote the encyclopaedia's employee and revenue figures** — research flagged the Nokia ones as 2020 figures.
  Numbers age on a commercial page; the characterisations that survive are qualitative.

---

## D7 — The palette lives in a pure module and reaches CSS as custom properties

**Decision**: `lib/brand-identity.ts` holds the six records and the envelope; it derives the OKLCH strings the
card consumes, and `BrandRows.tsx` emits them as per-card custom properties. No six-way CSS class list, no inline
colour literals in the stylesheet.

**Rationale**: two reasons, both about what can be checked. First, the claims worth defending here — every line
has a source, no blocked phrase appears, every chroma is under the ceiling, every text/background pair clears the
contrast floor — are all assertions about *data*, and the node-only harness can test data but not a rendered
component. Second, FR-017's seventh maker must be one row in a table plus a hue number; if the palette were six
CSS classes, adding a maker would mean editing the stylesheet and re-deriving the envelope by eye.

Emitting custom properties rather than classes also keeps 008's geometry untouched: the deck's sticky rules read
`.brand-deck__item`, and nothing about the mechanism changes when a card's ground changes.

**Alternatives considered**

- **Six modifier classes in `home.css`** — readable in the stylesheet, invisible to the test suite, and it puts the
  envelope in six places where it can drift.
- **Inline styles computed in the component** — moves the data into a client render path and out of reach of the
  server HTML that 008's contract depends on.
- **CSS-only with `color-mix()` from the house burgundy** — elegant, but then the maker hue is expressed as a mix
  ratio rather than as a documented family, which is the thing FR-002 requires be traceable.
