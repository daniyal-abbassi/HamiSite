# Jev advisory — feature 012 spec checkpoint

Asked 2026-09-27 ~01:00 +0330, after `spec.md` was written and before `/speckit-plan`. Runner:
`.scratch/jev-012-spec.mjs`. 822 input tokens, 103 output. State sent was six short strings — the ask, the
product, what the reference self-declares, where the dock sits on screen, and the risk if wrong. No repo
context.

`isDecisive()` needs top ≥ 0.80 **and** margin ≥ 0.25. **Neither choice question cleared it.** Both are
recorded, neither was acted on as a vote.

## Q1 — adopt the reference's drag-to-pull gesture? (choice, not decisive)

| option | p | |
|---|---|---|
| `full_drag` — press, pull across slots, commit on release | **0.65** | Jev's leader |
| `drag_preview` — drag previews only, commits where you pressed | 0.18 | |
| `decline_drag` — tap commits as today, press only deforms | 0.17 | **my decision** |

Margin 0.47 (passes) but top 0.65 (fails the 0.80 bar). **It argued against the decision I had already made
and written into the Assumptions.** 3.8× my choice is not a near-tie, but it is not decisive either, and the
standing rule is that a non-decisive answer is a prompt to ask, not a licence to take the leader. Went to the
owner as question 1 of two.

What Jev was not told and I weighed anyway: the dock floats over the device's own bottom gesture area, and
this bar is the primary mobile navigation for a shop whose reputation is twenty years of in-person trade in
Mashhad. A navigation control that can misfire is different in kind from a decoration that can misfire. That
argument is mine, it is not measured, and it is exactly the kind of thing the owner is better placed to judge
than either of us — they have a phone and I do not.

## Q2 — how far should the marker spread? (choice, not decisive)

| option | p | |
|---|---|---|
| `storefront_wide` — dock, header, filters, cards, drawers | **0.75** | Jev's leader |
| `dock_only` | 0.13 | |
| `dock_plus_header` — the bar, plus the desktop pills that already move a marker | 0.12 | **my decision** |

It ranked my choice **last**, 6× behind. Same caveat as Q1 and one more worth stating plainly: the owner's
words were "and wherever you think it fits", which is a delegation, not an invitation to redecorate. Jev
optimised for consistency of the visual language; FR-041 optimises for the sentence the owner actually wrote.
Constitution IV's binding requirement is that *a chosen treatment is applied uniformly across the surfaces it
covers* — which is satisfied by one implementation on two surfaces, and does not demand the whole storefront.
Still, this changes what gets built, so it went to the owner as question 2.

## Q3 — is the spec ready for planning? (score, 0–4)

**1.23 / 4**, confidence 0.4. Level 1: *"decisions are made but several are not written where an implementer
will find them."*

**This one was right, and it was the useful answer of the three.** Not the low score — the reason for it. I
had recorded the drag refusal only in the Assumptions prose, while FR-011 and FR-012 demanded travel and
press deformation. An implementer working from the requirements alone could have built full drag-to-select
and satisfied every numbered FR in the document. A decision that lives only in prose is not a decision the
build has to obey.

Fixed: **FR-012a** now states the refusal as a requirement, names it as the spec's one open question, and
spells out the exact edit to make if the owner overrules it.

## Net effect on the spec

- FR-012a added (the catch).
- Q1 and Q2 escalated to the owner as two plain-language questions rather than settled by the leader in
  either direction.
- No other change. 26 → 27 FRs.

## Resolution, same session — owner answered both

**Q1 → "your call."** Declined the drag, as originally decided, now as **FR-012a** with a better reason than
the one I first gave. My opening argument was that the bar sits over the phone's bottom gesture area and a
misfiring navigation control is worse than a misfiring decoration. That is the weaker case: the system gesture
is a vertical swipe from the screen edge, a horizontal drag inside the bar does not compete with it, and
slide-to-correct is a genuine affordance people already know from every other control on their phone. The
argument that survives is semantic. On this site the marker means *"where you are"* — that is the entire
content of FR-016, and it is why the reference's "two halves that cannot disagree" was carried across at all.
A drag-to-select marker spends most of a second meaning *"where you might go."* On the primary navigation
control, those two must not be the same object. Jev's 0.65 is a preference for the reference's gesture; it is
not an answer to that objection, and it was not asked to be.

**Q2 → "everywhere you can."** Jev's leader (`storefront_wide`, 0.75) is now what ships, and my narrow scoping
is gone. Two things about that are worth recording so nobody reads this as the model having been right.

First, it was not consulted on the thing that made its answer usable. It said "spread it" without any notion
of *where*, and a mandate to spread an effect across a storefront is only actionable once someone has decided
which surfaces qualify. The seven were found by a reproducible criterion — every shopper-facing control that
already publishes a current, selected or pressed state — which is why the list is seven and not "everything."
The back office's sidebar asks the same question and was excluded without argument.

Second, the answer was cheap to accept and expensive to satisfy. Widening from two surfaces to seven is what
forced FR-033 (at most one marker may be travelling at any instant — two are visible on a laptop home page
alone), FR-034 (a resting marker must cost nothing), FR-045 (variant options and image views wrap onto
multiple lines), FR-046 (pagination can jump from page 1 to page 20 and must not crawl through nineteen
slots), and FR-047 (six surfaces already publish an accessible current state and none may lose it). It also
turned User Story 4 from a follow-up into a gate on User Story 3: an effect that cannot degrade honestly is
worth one defect, not seven.

**The useful reading of this exchange:** the model's two answers were both directionally right and both
missing the constraint that decides it. Q1's preference ignored the meaning of the marker. Q2's preference
ignored that "everywhere" needs a definition of a surface before it means anything. Asked at a checkpoint
anyway — that is the policy — and both dissents are on the record rather than quietly dropped once the owner
overruled or agreed.

