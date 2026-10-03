# Contract: Product Presentation Behaviour

**Feature**: [spec.md](./spec.md) | **Model**: [data-model.md](./data-model.md) | **Research**: [research.md](./research.md)

What a browser — or a shopper — can check. Nothing here is satisfied by a unit test, and `H1` outranks every
other clause in this file.

---

## H. Honesty — this outranks the effect

- **H1** A product's image is a photograph of that product, or the shared brand placeholder. Never a
  keyword-guessed stand-in, never a template stock photograph of another company's device, never a generated
  object, never a confident remote hotlink. **(Principle I, FR-028, FR-022.)** 188 of 189 records satisfy the
  first branch through the mirror; the one with no photograph (`347 اپل آیدی`) renders
  `/brand/placeholder-product.webp`, and `tests/unit/product-images.test.ts` pins both halves. The
  keyword/brand/category guessing that used to fill that gap is deleted, not merely bypassed.
- **H2** An asset whose `reviewStatus` is not `approved` is presented in the framed form or not at all.
  Silence is not approval, and the default state must be the honest one (FR-030).
- **H3** No treatment may crop, obscure or de-emphasise price, availability, brand or name. An unknown stock
  state still reads «تماس بگیرید» at the same contrast it has today (FR-021, SC-006).
- **H4** Nothing in the presentation implies a finish, accessory, scale reference, quantity or viewpoint the
  record does not support (FR-022, FR-023).
- **H5** The imageless record is presented with the brand placeholder, which asserts something about the shop
  and nothing about the product. No *object* is invented for it — the placeholder carries the merchant's own
  monogram, not a device (FR-019, US4/2).

## P. Product as protagonist

- **P1** On a surface presenting one product, a viewer naming "what the page is about" names the product,
  unprompted, within three seconds (FR-001, SC-001).
- **P2** No decorative element on that surface is neither the product, nor its information, nor its action.
  Removal is the standard; "styled more quietly" is not removal (FR-002).
- **P3** Hierarchy is carried by whitespace, proportion and scale. A border, panel fill or card shadow used to
  create emphasis fails this clause even when it looks good (FR-003).
- **P4** Display-scale type supports the product rather than framing it; order of attention is product,
  statement, price, action (FR-004, US1/3).
- **P5** Exactly one primary action on a decision surface, and nothing else on it looks like a button
  (FR-005, US1/5).

## D. Dimensional presence

- **D1** No accidental seam anywhere: a product never appears as an opaque rectangle resting in a frame
  unless that framing is the deliberate `form: framed` treatment (FR-007, SC-003, US2/3).
- **D2** Isolated and framed presentations MUST NOT share a row with different baselines. When both occur,
  the row uses the framed form throughout (FR-009's checkerboard guard, US2/5, US4/4).
- **D3** Separation from the page ground holds across feature 002's full tonal range, sampled at
  intermediate scroll points and not only at its settled stages (FR-008).
- **D4** One grounding cue, derived from the object's own alpha bounds, with one light direction and one blur
  scale site-wide. It is absent on the framed form (D6).
- **D5** A square source and a portrait source under the same rule look like siblings, and neither reads as
  degraded (FR-017, US2/4).

## M. Motion

- **M1** Every animation on a product surface has an identifiable purpose a reviewer can state; motion that
  repeats without carrying information fails (FR-010, SC-007).
- **M2** Nothing loops. Each reveal comes to rest and stays at rest; no reveal replays when a shopper scrolls
  back (FR-011, US3/1).
- **M3** A pointer- or scroll-driven response settles immediately when the shopper stops. No drift afterwards
  (US3/2).
- **M4** All content reachable through motion is reachable without triggering it, on any input method
  (FR-012, US3/3).
- **M5** With `prefers-reduced-motion`, the product, information set and action are identical and nothing is
  missing (FR-013, SC-008). The behaviour matches `004`'s rows and `005`'s carousel exactly — one rule across
  three surfaces (FR-038/005-X5).
- **M6** Motion and the scroll-driven ground coexist as one choreography; neither destabilises the other
  (FR-014). Two motion libraries each driving scroll-linked movement on one page fails this clause no matter
  how each performs alone (D6). 002's Question 1 is reopened, so this is verified against what the ground
  actually does and re-run after 002 settles.
- **M7** One motion system serves 002, 003, 004 and 005, chosen on quality rather than on what is already
  installed (owner ruling, 2026-09-22). Until it is chosen, this surface inherits 004's shipped vocabulary —
  `220ms cubic-bezier(0.2, 0.7, 0.3, 1)`, one duration scale — and does not invent its own
  (X1 of 005's contract, reciprocal with `004/FR-032`).
- **M8** Nothing animates while off-screen (matching `002/FR-019` and `005/FR-019`).

## S. Systematic across 188

- **S1** The rule is one function over the manifest. Adding a product requires no exception work
  (FR-016, SC-004).
- **S2** Display size is capped by the product's own measured pixels, never by the layout. No product is
  shown visibly soft or upscaled at the largest size any surface uses (FR-018, D8, SC-005, US4/5).
- **S3** A product that cannot be isolated keeps its complete listing presence through the framed form:
  findable, browsable, countable, and reported in the D4 measurement (FR-033, FR-034, SC-014).
- **S4** Derivatives do not make a listing meaningfully slower to become usable than it is today, measured on
  the same route (FR-032, SC-010).

## R. Right-to-left

- **R1** Compositions are designed for RTL reading, not mirrored: asymmetry, product-against-headline
  placement, light direction and reveal direction all derive from the inline axis (FR-024, FR-026, SC-011).
- **R2** Any left-to-right assumption carried over from the reference is either adapted with the adaptation
  documented here, or dropped (FR-025).

---

## Explicitly not covered by this contract

- **Whether D3's measurement comes back good.** The sources exist and are honest; whether 188 of them can be
  cleanly matted is unknown until the 24-file trial runs, and a failure rate above ~35% means this feature is
  re-scoped rather than that D1–D5 are met by smaller shadows.
- **The specific colours, radii, curve values and stage counts** the reference is silent on and Constitution
  IV assigns to the implementer (FR-026, FR-027).
- **Any judgement gate** — SC-001, SC-002, SC-005, SC-007, SC-009, SC-011, SC-012, SC-013, SC-015 need
  people. Several are the same kind of panel feature 004 could not assemble; where they go unmeasured they
  stay visibly unmeasured.
