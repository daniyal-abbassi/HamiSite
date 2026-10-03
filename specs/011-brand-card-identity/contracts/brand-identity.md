# Contract: Brand Card Identity

**Surface**: `lib/brand-identity.ts` + the `.brand-deck` block in `app/(main)/home.css` + `components/home/BrandRows.tsx`
**Spec**: [../spec.md](../spec.md) · **Decisions**: [../research.md](../research.md) · **Model**: [../data-model.md](../data-model.md)
**Inherits**: [008's contract](../../008-brands-stacking-cards/contracts/brand-deck-behaviour.md), which this one must not break

Eight clauses. **"Provable"** means an assertion in `tests/unit/brand-identity.test.ts` running in the node
harness — no DOM, no browser. This feature is unusually testable for a visual change, because the palette is
arithmetic and the claims are sourced data: **garishness, contrast and falsehood are all checkable without looking
at anything.** What cannot be checked without a person is recognition, and that is R1.

---

### R1 — The colour carries the brand, and the count decides

A person shown the six card grounds with names and wordmarks hidden identifies at least **four of six** makers,
and does not confuse the two blue makers or the two hueless ones.

**Evidence**: `verification/recognition-test.mjs` renders the six grounds alone into one image; a person who has not
seen the site names them. Recorded as a count and a per-brand hit list, not a vibe.

**If it misses four**: the treatment gets bolder in **one** step — raise the chroma ceiling by a stated amount,
re-screenshot, re-run — and the step is recorded with its cost visible. Do not tune several things at once, and do
not decide by looking. This clause exists because the owner's ask and Jev's judgement conflict (research D5) and
neither should win by argument.

*Fails as*: five of six correct but only because the names were visible; a reviewer reading their own brand list.

---

### R2 — Six cards, one family

The six grounds share lightness and stay under one chroma ceiling; the differences between them are hue and
placement only. A cold viewer says the six belong to one page.

**Evidence**: *provable* — every record's `L` within 0.17–0.26 and `C` ≤ 0.055, asserted from the module, not from
the rendered page. Plus the human half: show the six to someone who has not seen the site and ask whose page this
is; the answer must be Hami Hamrah (SC-004).

---

### R3 — No invented brand colour, and no borrowed one either

Every hue family traces to a recorded source with a check date; every specific value is Hami's and is never
labelled as the maker's.

**Evidence**: *provable* — each record's `hueSource.kind` is one of `primary | observed | aggregator | none`, and
no rendered string, `title`, `aria-label` or comment on the page asserts an official colour. **Specifically
forbidden**: `#1428A0` presented as Samsung's, `#005AFF` as Nokia's, any hex as realme's or TCL's.

*Why this is a clause and not a comment*: the researcher found the aggregator values "the most repeated unsourced
claim" for Samsung, and refused to quote a plausible yellow for realme from memory. That refusal is the thing
being preserved.

---

### R4 — The hueless are distinguished by their reason

Apple is neutral because monochrome is its documented identity. TCH carries the house ground because nothing was
sourced for it. The two are measurably different, and neither is a guess.

**Evidence**: *provable* — Apple's `hueFamily` is `monochrome` with `C = 0`; TCH's is `none` with
`placement: "house"`; and the two computed grounds differ by more than a stated ΔE-equivalent threshold. The
validation rule "`hueFamily: none` ⇒ `placement: house`" is asserted, so a blank row cannot silently become a hue.

---

### R5 — Every card says one true thing, with a source

Six of six cards carry a line; six of six lines have a recorded URL and date; **zero** lines assert a blocked
framing.

**Evidence**: *provable* — presence, source and date on all six; the blocklist checked case- and
script-insensitively against every rendered field. The four entries that must never appear are Apple's "Think
different", Nokia's "Connecting People", Nokia-as-handset-manufacturer, and realme-as-independent. TCL's
phone-heritage implication and Samsung's "world's biggest phone company" sharpening are also blocked.

**Also required**: a human reads all six lines against their sources and confirms each says what the source says.
A test can prove a phrase is absent; only reading proves a phrase is not *overstated*.

---

### R6 — Text stays legible on all six grounds

Cream and champagne clear 4.5 : 1 against every card ground.

**Evidence**: *provable* — OKLCH→sRGB→relative-luminance→ratio computed in the test for all six grounds, which is
one arithmetic fact because lightness is pinned (D1). Then **browser-confirmed** at 360 px on all six, because the
computation assumes no overlay the stylesheet might add.

---

### R7 — The deck still works, unchanged

008's mechanism, geometry and acceptance measurement survive this feature with no clause newly failing.

**Evidence**: `node specs/008-brands-stacking-cards/verification/measure-deck.mjs` re-run after the treatment
lands, and its output compared clause-by-clause against the recorded pass (C1, C2, FR-008 3.06 screens, D2, C8,
C9). **The instrument is not edited to accommodate this feature** — if a clause fails, the treatment changes.
*Provable* too: the deck's sticky rules (`position: sticky`, `inset-block-start: calc(var(--stack-i) * 16px)`, no
absolute on items) are still present in the stylesheet.

---

### R8 — The system takes a seventh maker without a redesign

Adding a brand is one row: a hue family, its source, a line, its source, and a placement.

**Evidence**: *provable* — the envelope is a constant in the module, not six values; the CSS reads custom
properties rather than per-maker classes; and a test asserts no rule in the stylesheet names a specific maker.
A grep for the six display names inside `app/(main)/home.css` must return nothing.

---

## Non-negotiables inherited, not re-decided

- **No maker logo, product photograph, or generated maker imagery.** The wordmarks already on disk stay the only
  maker artwork. Generated imagery either reproduces a protected look or depicts merchandise the shop claims to
  sell — Principle I, no exception path.
- **Apple's logo usage terms were never read** (the page 404'd). Nothing here may assert what they allow.
- **The research gaps are a tooling limit, not a finding.** The researcher was bot-blocked on every search engine
  and had direct fetches plus an encyclopaedia only. A later pass with working search could upgrade evidence; it
  would not change the rule that the value stays ours.
- **The deck stays mobile-first.** 008's budget is defined at 360 × 640 and every check here runs there first.
- **The owner decides R1's aesthetics on their own phone**, as they did with the categories chapter and with the
  undecorated deck.
