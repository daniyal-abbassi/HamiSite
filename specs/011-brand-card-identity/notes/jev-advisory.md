# Jev advisory — brand card identity

**Feature**: 011 | **Run**: 2026-09-26 19:58 | **Model**: `jev` via `/v1/systemone`
**Status**: advisory. Jev authorises nothing; the decisions below are the owner's and the plan's.

Four closed questions about the core tension — recognisability vs harmony vs luxury vs shop dominance.

## Decisive

| Question | Answer | Margin |
|---|---|---|
| How should brand colour enter a dark card? | **accent only** — the house ground stays; the hue lives in an edge, rule, ordinal or mark plate | 0.83 vs 0.16 gradient-wash, **0.01 full tint** |
| The maker with no documented hue? | **give it no hue** — carry it by material/achromatic register and accept it is distinguished differently | 0.80; *invent a subtle hue* scored **0.00** |
| The maker research cannot source? | **keep the house treatment and record the gap** | 0.97; *drop it from the deck* scored **0.00** |

## Not decisive — goes to the owner, not to the leader

**Two makers are both documented blue. How should they be kept apart?**
`second_property 0.53 · hue_shift 0.24 · accept 0.23` — margin 0.30 on the top pair but the confidence split is wide
enough that Jev is not claiming an answer. Treated as an open design question for planning, with the honest note
that all three options have a cost: shifting a hue breaks FR-002 (documented association only), a second property
must itself be documented, and accepting the similarity concedes SC-001 for two of six brands.

## Where Jev contradicts the owner's literal ask, and why that matters

The owner's sentence is *"مشتری باید با دیدن رنگ هر کارت بدونه اون چه برندیه"* — **by the card's colour**. Jev scored
`full_tint` at **0.01** and `accent_only` at **0.83**. Those are not compatible with the literal requirement: an
accent-only treatment leaves the card looking like the house card with a coloured edge, which is a much weaker
colour signal than "the card is that brand's colour".

Two readings:

1. **Jev is right about the failure mode.** A full brand tint on six cards is exactly the "تو ذوق زدن" the owner
   ruled out in the same message, and the owner has consistently rejected saturation in favour of restraint.
2. **Jev optimised the pair it could weigh and under-weighted the one it could not.** It had no evidence in its state
   about how strong a colour signal is needed for a shopper to name a brand from a swatch — that is a fact about
   people, and the only way to get it is SC-001's test.

**Resolution this note recommends, for the owner to accept or overrule:** do not decide it from preference. Build the
strongest treatment that keeps the house ground dominant, run SC-001 (name five of six from colour alone), and let
the number say whether the accent is enough. If it isn't, the treatment gets bolder in a measured way — with the
luxury cost of each step visible in a screenshot rather than argued about. That keeps all four owner requirements in
play instead of trading two against the other two at design time.

## Also worth recording

Jev scored `per_brand_material` — a distinct material/light treatment per card instead of hues at all — at **0.00**,
while simultaneously recommending a material treatment for the achromatic maker. Those are inconsistent, and it is a
useful signal: the model is confident about the specific case and unhelpful about the general one. Planning should
not treat this table as a design direction, only as a check that the obvious loud option is widely judged wrong.
