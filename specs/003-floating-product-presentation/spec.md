# Feature Specification: Floating Product Presentation

**Feature Branch**: `003-floating-product-presentation` (no dedicated branch created — no `before_specify` hook is configured; work continues on `Hami-v3`)

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "Use the attached `DESIGN (1).md` reference and take inspiration from the way it shows luxury products — floating in the air, three-dimensional shape, and animation."

**Reference document**: `/home/lain/Downloads/DESIGN (1).md` — an Apple (España) product-page style reference. Read in full; summarized and corrected below.

## Related Initiative

Third feature of the frontend-only initiative governed by `.specify/memory/constitution.md` v1.0.0. It
relates to `specs/001-premium-rtl-storefront` (product presentation requirements) and
`specs/002-scroll-atmosphere` (the page environment products would float *inside*). Principles inherited:
**I** Honest Interface, **II** Persian RTL by Default, **IV** Design Is Open.

## What the Reference Actually Says — Read This First

The attached document is a strong source of transferable **principles**. It is not a source for the three
things the request names, and two of them it explicitly rules out.

| The request asks for | What the reference document says |
| --- | --- |
| Products floating in the air | Present — but by a specific mechanism: "the photographed product **floats without frame**", achieved because the product is photographed on **pure white** and placed on a **pure white** page. The seam is invisible because two colors match. It is not suspension, and the document's own Elevation section forbids the usual substitute: "Do not introduce box-shadows, glows, or drop-shadows." |
| Three-dimensional shape | **Contradicted.** The Imagery section states: "There is zero illustration, zero iconographic decoration, and **zero 3D rendering** — everything is optical product photography." |
| Animation | **Absent.** The document describes no animation at all beyond a static band layout and two button archetypes. |

The Apple experience being recalled — a product rotating on a scrolled turntable, the page building around
a physical object in motion — is a real thing Apple does, and it is a legitimate ambition. It is simply
**not documented in this file**, which captures the Apple Watch SE 3 page's static band language. Adopting
this reference verbatim would produce a page with no motion and no dimensionality, which is the opposite of
the request.

**Resolved Q3 = B overrides part of this document.** The owner chose the animated, dimensional product-page
experience over the reference as written, so the reference's prohibitions on depth cues and its silence on
motion are treated as Apple's system rather than as rules for Hami. Its product-as-protagonist and
chrome-stripping principles still apply in full, and its literal token values still do not transfer.

**What genuinely transfers, and is used in this specification**: the product as the sole protagonist;
chrome stripped until nothing competes with the object; whitespace and proportion carrying hierarchy
instead of decoration; type doing structural work at large sizes; a single chromatic action rather than a
field of buttons; photography dominating and UI receding; bands that breathe slowly.

**What must not transfer**: the literal token values. The reference's palette (a near-white canvas, a
graphite text tone, and one saturated blue action), its radii, and its type scale are Apple's system, and
Constitution IV puts them out of bounds for this document. Its typefaces are Apple's proprietary faces,
which cannot be licensed for this use — the reference itself concedes substitutes. Directional and alignment
rules in it assume left-to-right reading and must be re-derived for Persian.

## Amendment Applied to Feature 001 — Complete (2026-09-20)

Resolved Q2 selected the background-removal route, which is new asset production. Feature 001's
**`001/FR-031`**, as it then stood,
amended by its Resolved Q2, currently forbids exactly that:

> "Premium visual impact MUST be built from the photography that already exists for each product … **not by
> new asset production**, video, **three-dimensional visualization**, or generated imagery."

**That amendment has been applied (2026-09-20, classified MINOR).** `001/FR-031` now forbids video,
three-dimensional modeling of products that were never photographed, and generated imagery, while
explicitly permitting background removal under the fidelity conditions in FR-028 … FR-034 below. 001's
Resolved Q2 is marked superseded in part at the same place, so the two files no longer give opposite answers
to the same question. **This specification is no longer externally blocked.** The distinction that the
amendment preserves, and that still binds here:

| Route | Status under this feature |
| --- | --- |
| Transforming an existing photograph — scale, crop, perspective, tilt, motion | Always permitted; not asset production |
| **Removing a photograph's background to isolate the object** | **Chosen (Q2 = B).** Asset production on derived files; requires amending 001/FR-031 |
| Modeling or rendering a product that was never photographed | Still forbidden. Not chosen, and Q3 = B does not license it |

The amendment is a **MINOR** change under the constitution's versioning rule: it materially expands
guidance by permitting a derived-asset route, and it does not remove the underlying requirement that
premium impact be built from real photography of real products. Cut-outs are derived from the merchant's own
product photographs, not generated, and FR-022 and FR-023 below keep them bound to what the product actually
is.

The amendment also recorded the supersession inside 001's own Resolved Q2 entry, so a reader of either file
finds the reconciliation rather than a contradiction.

## The Hard Constraint: the Assets Cannot Float Today

Every figure below was measured, not assumed.

| Fact | Value | Why it matters here |
| --- | --- | --- |
| Locally-held product photographs | 188 of 189 products | The entire raw material for this feature |
| Image format | JPEG, all 188 | **JPEG has no transparency.** A JPEG cannot be an isolated floating object; it is always a full rectangle |
| Color components | 3 (RGB) on every file | Confirms no alpha channel in any file |
| Largest dimension | 900 pixels; most are 800×800 | Apple's product-as-hero scale needs more resolution than this on a large screen |
| Smallest files | 400×400 and 447×447 | A single presentation rule must survive a source this small |
| Aspect ratios present | 141 square, 45 portrait (675×900) | "Floating object" compositions are sensitive to shape; a square-tuned layout breaks on portrait, and vice versa |
| Median file weight | 58 KB | Modest web exports, not print-grade photography |
| Products with additional views | 133, held remotely and measured slow | The effect cannot depend on a second angle |

The consequence is unavoidable and was the core design problem of this feature: **the reference's floating
effect depends on the photograph's background matching the page's background, and these photographs have
their own opaque backgrounds that cannot be seen through.** Placed on the dark ground of feature 002, all
188 products arrive in a visible white or scene-colored rectangle — a framed picture, not a suspended object.

**Resolved Q2 = B settles this by removing the backgrounds**, converting the problem from "can the product
float at all" to "can 188 cut-outs be produced well enough to be trusted." That is a harder and more
expensive problem than it sounds, and it is now the central risk of the feature:

- An object with fine detail, translucent plastic, cables, straps, or a reflective finish is genuinely
  difficult to isolate cleanly, and this catalog contains chargers, cables, earbuds, straps, and SIM cards.
- A cut-out that clips part of a product, leaves a halo of the old background, or shifts its color
  misrepresents what is being sold. That is a **Constitution I** violation, not a cosmetic defect, and it is
  the specific way this route can go wrong at scale.
- The 900-pixel source ceiling still applies after removal, and in practice limits how large any single
  product may be shown.

A further systematic constraint remains: the reference describes **one or two large photographs per band**,
hand-composed. A storefront must present **188** of them in grids, rows, and cards. Whatever treatment is
chosen must be a rule that holds on the worst file as well as the best, and the cut-out process must be
reviewed against that same standard rather than spot-checked on hero products.

## Terminology

- **Isolated product** — a product image whose background has been removed so the object can sit on any
  surface. **Does not exist today for any of the 188 products; producing them is the work of this feature.**
- **Derived asset** — the isolated image produced from a source photograph. The source is kept unchanged so
  every derivation is auditable and reversible.
- **Seamless ground** — the reference's mechanism: photo background and page background are the same color,
  so the frame disappears. Superseded here by isolation, since it cannot work on a changing dark ground.
- **Dimensional presence** — the *sensation* of a physical object with weight, depth, and a relationship to
  the surface beneath it, whether produced by real geometry or by treatment of a flat photograph.
- **Object motion** — animation applied to a product presentation: entry, drift, response to pointer or
  scroll, or rotation.
- **Systematic treatment** — a presentation rule that holds across all 188 records, including the smallest,
  the portrait ones, and the one with no image.
- **Chrome** — interface decoration that is not the product, its information, or its action.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — The product owns the screen (Priority: P1)

A shopper meets a featured product and the screen is quiet: nothing frames it, nothing competes, no badge
or border or panel argues with it. The object is large, the surrounding space is deliberate, and the
headline and price sit near it as supporting information rather than rivals. This is the transferable core
of the reference, and it is achievable today without touching a single image file.

**Why this priority**: It is the idea in the reference that actually produces the premium feeling, it is the
one that transfers to a Persian dark-ground storefront without asset production, and it does not collide
with 001/FR-031 or with the transparency limitation. Nothing else in this feature works if the page is still
noisy.

**Independent Test**: Put one real product on a screen with the treatment on and once with the existing
presentation, and ask viewers what the page is about and what competed for their attention. Testable on a
single surface with no motion involved.

**Acceptance Scenarios**:

1. **Given** a featured product, **When** the shopper sees it, **Then** the product is the dominant element
   and can name it as such without prompting.
2. **Given** the same screen, **When** the shopper looks for anything decorative that is not the product,
   its information, or its action, **Then** they find none.
3. **Given** the product beside a large typographic statement, **When** the shopper reads the screen,
   **Then** the order of attention is product, then statement, then price, then action.
4. **Given** whitespace around the product, **When** the screen is judged, **Then** the emptiness reads as
   composed rather than as a layout that failed to fill.
5. **Given** one action available on that screen, **When** the shopper looks for it, **Then** it is
   unambiguous and nothing else on the screen looks like it.

---

### User Story 2 — A sense of object and depth (Priority: P2)

The shopper should feel that they are looking at a thing rather than a picture of a thing: the product has
dimensional presence, relates to the surface it sits on, and does not read as a flat rectangle pasted into
a box.

**Why this priority**: This is the specific quality the request names. It ranks second rather than first
because the route chosen to deliver it (Resolved Q2 = B, background removal across 188 files) is the largest
cost and the largest risk in the feature, and because it cannot even be attempted until feature 001 is
amended. Story 1 is the quieter idea that ships regardless; this is the one that has to be earned file by
file.

**Independent Test**: Present the same product on surfaces of different tones and ask whether it reads as an
object in a space or as a rectangular image. Repeat on the smallest and the portrait files, which is where
any rule will actually break.

**Acceptance Scenarios**:

1. **Given** a product presented in this way, **When** a shopper is asked whether it looks like a physical
   object or a picture in a frame, **Then** a clear majority say object.
2. **Given** no decorative layer behind the product, **When** the shopper views it, **Then** it still holds
   separation from the surface and does not visually merge into it.
3. **Given** a product whose photograph carries its own background, **When** it is presented, **Then** the
   boundary between photo and page is either invisible or clearly intentional — never an accidental seam.
4. **Given** the smallest file in the catalog and a portrait file, **When** both use the same treatment,
   **Then** neither looks like a degraded version of the other.
5. **Given** this treatment applied across a grid of many products, **When** the shopper scans the grid,
   **Then** the effect holds collectively and the grid does not become a checkerboard of visible photo
   rectangles.

---

### User Story 3 — Purposeful motion, not decoration (Priority: P3)

Products move with intent: an entry that reveals rather than announces itself, and a response to the
shopper that feels physical and continuous. Nothing loops at them, nothing spins for attention, and the
motion never makes it harder to read a price or judge a product.

**Why this priority**: Animation was explicitly requested, and it is also the element most likely to
degrade into the visual noise both the parent brief and feature 002 are rejecting. The constraint has to be
written down while there is still a decision to make.

**Independent Test**: Watch a product surface for thirty seconds doing nothing, then interact with it
normally. Count motion that carries no information. Verify the same products are legible with motion
prevented.

**Acceptance Scenarios**:

1. **Given** a product that animates, **When** the motion ends, **Then** it stays ended rather than
   repeating.
2. **Given** motion tied to the shopper's pointer or scroll, **When** they stop, **Then** the product
   settles immediately rather than continuing to drift.
3. **Given** the same motion, **When** the shopper instead reads by scrolling normally, **Then** nothing
   depends on hovering, and no content is unreachable without triggering it.
4. **Given** a shopper with reduced motion enabled, **When** they view the surface, **Then** they receive
   the identical product, information, and action with no motion, and cannot tell anything is missing.
5. **Given** motion on a mid-range phone, **When** the shopper scrolls past several animated products,
   **Then** the page remains responsive and no animation visibly stutters.
6. **Given** an animation and feature 002's scroll-driven ground on the same screen, **When** both are
   active, **Then** the two read as one choreography rather than competing movements.

---

### User Story 4 — It must hold across the whole catalog and on every device (Priority: P4)

The shopper encounters this presentation not once on a hero but throughout the storefront — in a grid of
many products, in a row, on a product page, on a small phone, and on a large screen. The quality must be a
property of the system rather than of one hand-composed screen.

**Why this priority**: The reference describes one or two photographs per band, chosen and composed by
hand. A storefront has 188 and must render them all. A treatment that only works on the hero is a mockup,
not a feature, and this is the story that determines whether the other three survive contact with real data.

**Independent Test**: Apply the finished treatment to the ten worst assets in the catalog — the smallest
files, the portrait ones, the busiest backgrounds, and the record with no image — and require the result to
look deliberate. Independent of the hero.

**Acceptance Scenarios**:

1. **Given** the full set of 188 photographs, **When** the treatment is applied, **Then** every one renders
   acceptably without per-product exception work.
2. **Given** the single record with no image at all, **When** it is presented, **Then** it looks intentional
   rather than broken, and no placeholder object is invented. (Constitution I)
3. **Given** a common phone and a large desktop display, **When** the same product is viewed, **Then** the
   presentation reads as designed for both, and the product is not blurred, soft, or visibly upsampled on
   the larger one.
4. **Given** many products presented together, **When** the shopper scans them, **Then** differences in the
   source photographs' backgrounds and framing do not turn into inconsistencies in the page.
5. **Given** a product shown at the largest size the design uses, **When** its quality is judged on a
   typical laptop display, **Then** it reads as sharp.

---

### Edge Cases

- **The 45 portrait photographs** presented in a system tuned for square, and the reverse.
- **The two smallest files** (400×400, 447×447) at the largest display size the design allows.
- **A product photographed on a busy or non-white background** — the reference assumes pure white; these
  files came from a shop's own product pages and do not always.
- **The one record with no image at all.**
- **A product whose photo includes accessories, hands, packaging, or text** — the subject is not cleanly a
  single object.
- **Products shown side by side where two photographs have visibly different background tones**, making one
  appear framed and the other not.
- **Motion triggered while a page transition or scroll-driven ground change is already running** —
  competing movement (feature 002).
- **A pointer device losing the product mid-animation** (scrolling away during a reveal).
- **Slow connections**, where a partially-loaded image must not show an half-composed object.
- **Printed or saved pages**, where motion does not exist.
- **Screen readers and keyboard navigation** passing over an animated product.
- **Long sessions** where repeated reveals accumulate and the page begins to feel busy again — the specific
  failure this whole initiative is trying to avoid.

## Requirements *(mandatory)*

### Presentation Principles

- **FR-001**: Product presentation MUST make the product the dominant element of its surface, with
  supporting information and a single action arranged around it rather than competing with it.
- **FR-002**: Interface chrome that is not the product, its information, or its action MUST be removed
  rather than styled more quietly. Decoration used to imply premium quality MUST NOT be added.
- **FR-003**: Whitespace, proportion, and scale MUST carry hierarchy; borders, panels, fills, and shadows
  MUST NOT be relied upon to do it.
- **FR-004**: Typography MUST play a structural role at display scale, and MUST remain subordinate to the
  product rather than framing it.
- **FR-005**: Where a surface presents products for a decision, it MUST offer one clear primary action and
  MUST NOT present several visually equivalent alternatives.

### Dimensional Presence

- **FR-006**: Product presentation MUST read as an object occupying a space rather than a rectangular image
  placed in a box. The chosen route is **background removal across the 188 source photographs to produce
  genuinely isolated objects** (Resolved Q2 = B), placed on the existing dark ground (Resolved Q1 = A).
  Isolation is therefore the mechanism for every product surface in this feature, and a product that has not
  been isolated MUST NOT be presented as though it has.
- **FR-007**: The boundary between a product photograph and the surface behind it MUST be either invisible
  or deliberately composed. An accidental seam — where the photo's own background shows as a rectangle —
  MUST NOT appear anywhere the treatment is applied.
- **FR-008**: Products MUST hold visual separation from the page ground across the full tonal range
  established by feature 002, including at every intermediate point of its transitions.
- **FR-009**: An isolated object on a dark ground needs a grounding cue, or it reads as pasted rather than
  suspended; depth devices such as contact shadow, reflection, or falloff MAY be used to provide it, which
  consciously overrides the reference's prohibition on shadows (Resolved Q3 = B). Their use MUST be
  systematic rather than per-instance: a cue that looks right on one hero product must be proven on a grid
  of twenty and on the busiest and lightest objects in the catalog, because this is the mechanism most likely
  to reintroduce the visual noise features 001 and 002 exist to remove.

### Motion

- **FR-010**: Motion and dimensional presence are **central to this feature, not optional**, following the
  animated product-page experience rather than the attached reference as written (Resolved Q3 = B). The
  reference is partial evidence: its principles of product-as-protagonist and stripped chrome apply, while
  its prohibitions on animation, depth cues, and three-dimensional treatment are explicitly not adopted.
  Within that freedom, any product motion MUST still reveal or confirm something about the product and MUST
  NOT exist purely to attract attention.
- **FR-011**: Product motion MUST NOT loop indefinitely, MUST come to rest, and MUST settle immediately when
  the shopper stops interacting.
- **FR-012**: All content reachable through motion MUST also be reachable without triggering it, on any
  input method.
- **FR-013**: A shopper with reduced motion enabled MUST receive an identical product, information set, and
  action, with the motion absent. (002/FR-020, 002/FR-021)
- **FR-014**: Product motion and the page's scroll-driven ground behavior MUST coexist as one coherent
  choreography; neither MUST make the other feel unstable.
- **FR-015**: Motion MUST remain smooth on a mid-range phone and MUST NOT degrade page responsiveness or
  delay access to product information.

### Catalog and Device Realities

- **FR-016**: The presentation MUST be a systematic rule that holds across all 188 available photographs
  without per-product exception work.
- **FR-017**: The presentation MUST accommodate both square and portrait source images without letterboxing,
  distortion, or cropping that removes the product.
- **FR-018**: Sharpness wins over scale (Resolved Q1 = A). The ground stays dark and products MUST NOT be
  displayed at a size where the source resolution reads as soft or visibly enlarged. Each presentation size
  MUST be chosen from the resolution actually available for that product rather than from a layout ideal,
  and the isolation in FR-006 is expected to buy additional apparent scale by removing wasted background —
  which MUST NOT be used as a reason to exceed what the pixels support.
- **FR-019**: The record with no image MUST be presented honestly and intentionally, with no substitute
  object created. (Constitution I)
- **FR-020**: Where a photograph cannot support the treatment it was designed for, the fallback MUST be a
  deliberate composition rather than a degraded version of the intended one.

### Information Integrity

- **FR-021**: No presentation treatment may obscure, crop away, or reduce the legibility of price,
  availability, brand, or product name. (Constitution I; 001/FR-030, 001/FR-034)
- **FR-022**: Presentation MUST NOT imply anything about the product that its record does not support — no
  rendered finish the product does not have, no accessories, no scale reference suggesting a size it lacks,
  and no view that is not of that actual product. (Constitution I)
- **FR-023**: Where the treatment makes a product appear larger, more numerous, or in a context that is not
  real, that framing MUST NOT mislead a shopper about what they are buying.

### Cultural and Structural Fit

- **FR-024**: Every composition in this feature MUST be designed for right-to-left reading, not mirrored
  afterwards. Directional staging, asymmetry, and the placement of product against headline MUST be
  re-derived for Persian. (Constitution II)
- **FR-025**: Reference-derived patterns that assume left-to-right alignment MUST be adapted or dropped,
  with the adaptation documented.

### Design Freedom

- **FR-026**: This specification MUST NOT adopt the reference's specific colors, typefaces, radii, spacing
  values, or button treatments. Its principles transfer; its token values do not, and its typefaces are
  proprietary. (Constitution IV)
- **FR-027**: This specification MUST NOT fix the number of animation stages, their durations, their easing,
  or the visual method used to produce depth. Those are design decisions. (Constitution IV)

### Derived Asset Integrity

Added because Resolved Q2 selected background removal across 188 source photographs.

- **FR-028**: Every isolated object MUST be derived from that product's own existing photograph. No product
  may be shown as an object that was never photographed, and no generated or substituted imagery may be used
  where a cut-out proves difficult. (Constitution I)
- **FR-029**: A derived asset MUST preserve the product's true shape, finish, color, and proportions. Clipping
  part of the product, leaving a halo or residue of the original background, or shifting color or tone during
  removal MUST be treated as a defect that blocks that product from use, not as an acceptable imperfection.
  (Constitution I)
- **FR-030**: Every one of the 188 derived assets MUST be individually reviewed against its source before use.
  A batch process is acceptable for producing them; a batch approval is not.
- **FR-031**: Source photographs MUST be retained unchanged alongside their derived assets, so any isolation
  can be audited against what the merchant actually photographed and reversed without loss.
- **FR-032**: Derived assets MUST support transparency and MUST NOT increase the weight a shopper downloads
  enough to make a product listing meaningfully slower to become usable than it is today.
- **FR-033**: Where a clean isolation is not achievable — fine detail, translucent material, cables and
  straps, reflective surfaces, packaging or accessories shown with the product, or a source too small to
  survive the crop — that product MUST fall back to a deliberately framed presentation. It MUST NOT be
  presented with a visibly failed edge, and MUST NOT be excluded from the catalog to hide the problem.
- **FR-034**: The proportion of products that cannot be cleanly isolated MUST be measured and reported before
  the treatment is relied upon across the storefront, because the answer determines whether this is a
  catalog-wide presentation or a curated one.

## Key Entities

- **Product Presentation**: the complete treatment by which a product is shown — its scale, its surface, its
  motion, and what surrounds it.
- **Source Photograph**: one of the 188 opaque, background-bearing, at-most-900-pixel images available. The
  limiting entity in this feature.
- **Isolated Object**: a product with its background removed, allowing it to sit on any surface. Not
  currently available for any product.
- **Presenting Surface**: the tone and region of the page a product sits on, whose color the reference's
  effect depends upon, and which feature 002 is making variable.
- **Dimensional Cue**: anything that contributes to the sense of a physical object — scale, edge treatment,
  depth relationship, viewpoint, motion.
- **Reveal Motion**: the animation by which a product arrives or responds.
- **Systematic Rule**: the treatment expressed once so it holds across 188 records rather than being
  composed per product.
- **Degradation Case**: a source file that cannot support the treatment (smallest, portrait, busy
  background, absent) and its deliberate fallback.
- **Legibility Guard**: the guarantee that price, availability, and name survive every treatment and every
  motion.
- **Reference Pattern**: an idea taken from the attached document, recorded separately from its literal
  values so the transfer is auditable.

**Citation notation.** `FR-0nn` alone refers to a requirement in *this* specification. Requirements borrowed
from sibling features are written with their feature prefix — `001/FR-031`, `002/FR-020` — because this
feature's own numbering overlaps theirs. The overlap is real: this file defines FR-030, FR-031 and FR-034 and
also cites 001/FR-030, 001/FR-031 and 001/FR-034.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Shown a single product surface for three seconds, at least 8 of 10 viewers name the product as
  the most important element, unprompted and without mentioning any surrounding decoration.
- **SC-002**: At least 7 of 10 viewers describe the presentation as premium when compared against the
  current storefront, and fewer than 2 of 10 describe it as busier.
- **SC-003**: Zero accidental seams. Reviewed across all 188 product presentations, no product appears as a
  visible rectangular image resting in a frame unless that framing is deliberate.
- **SC-004**: The whole catalog passes: all 188 presentations, including the portrait files, the two
  smallest, and the one with no image, render as intended with no per-product exception work.
- **SC-005**: On a common laptop and a common phone, at least 8 of 10 reviewers judge the product image
  quality at the size shown as sharp rather than soft or enlarged.
- **SC-006**: Price, availability, brand, and product name remain legible on every treated surface, verified
  by inspecting each surface type — not an average.
- **SC-007**: Every animation on a product surface has an identifiable purpose: reviewers asked what a
  movement communicated can answer for at least 8 of 10 instances, and no reviewer reports motion that
  repeats without reason.
- **SC-008**: A shopper with reduced motion enabled reaches the same products, information, and actions as
  every other shopper, with no additional step and nothing absent.
- **SC-009**: After two minutes of browsing treated surfaces, at least 8 of 10 reviewers still describe the
  page as calm rather than busy — the specific regression this initiative exists to avoid.
- **SC-010**: Scrolling and interacting remain as responsive as they are today on a mid-range phone,
  measured on the same device and route.
- **SC-011**: Right-to-left correctness holds: reviewers find no composition that reads as an afterthought
  mirror of a left-to-right layout, on any surface this feature touches.
- **SC-012**: Every one of the 188 derived assets passes individual review against its source, with zero
  accepted instances of a clipped product, a residual halo, or a shifted color or finish.
- **SC-013**: Products shown as isolated objects are judged by at least 8 of 10 reviewers to depict the same
  product as the original merchant photograph — same object, same finish, nothing missing.
- **SC-014**: Every product that could not be cleanly isolated is still presentable and browsable through its
  fallback treatment, and none is hidden, and the count of such products is known and reported rather than
  estimated.
- **SC-015**: Isolation is confirmed to pay for itself: at least 7 of 10 reviewers judge a treated product as
  reading like an object in a space rather than a picture in a rectangle, measured against the same product
  shown in the current presentation.

## Out of Scope

- Modeling or rendering a product as a three-dimensional object that was never photographed. Resolved Q2
  chose isolation of existing photographs, not synthetic geometry, and Q3 = B does not extend to modeling
  products that do not exist as assets. (FR-028)
- Video, cinematic sequences, and 360-degree product viewers.
- Effects requiring imagery that does not exist — lifestyle photography, studio renders, environment scenes,
  or generated backdrops. (Constitution I; feature 001 Resolved Q2)
- Any change to product data, the catalog seam, availability behavior, or pricing.
- Cart, checkout, account, payment, and administrative surfaces.
- Adopting the reference's palette, typefaces, radii, spacing scale, or button system as values.
- Per-product art direction of individual hero screens; the deliverable is a rule, not a composition.

## Assumptions

- **The reference is inspiration, not a specification.** Its ideas may be adopted; its token values may
  not, and after Resolved Q3 = B its prohibitions on depth cues and its silence on motion are not binding.
- **Principles transfer; the mechanism does not.** The reference's float works through white-on-white color
  matching. This storefront's ground is dark and, if feature 002 proceeds, changing. The transferable part is
  product-as-protagonist and stripped chrome, which is User Story 1.
- **User Story 1 remains the safe floor.** It needs no asset change, so it can ship and be validated while
  the isolation work in User Story 2 is still in progress. The two are sequenced, not coupled.
- **The 900-pixel ceiling is real and is accepted rather than solved.** Resolved Q1 = A keeps the dark
  ground and chooses sharpness over scale; higher-resolution sources are not assumed to be obtainable.
- **Isolation is assumed achievable for most but not all products.** Cables, straps, translucent plastic,
  SIM cards, reflective finishes, and the smallest sources are the expected failures. FR-033 and FR-034 make
  the failure case explicit and require the count to be measured rather than guessed, because if the failure
  rate is high this becomes a curated treatment rather than a catalog-wide one.
- **The dark ground is settled for this feature but not for the site.** Feature 002's two questions remain
  unanswered; Resolved Q1 = A fixes only the environment these product treatments are designed against.
- **One systematic rule, not hand composition.** With 188 records the treatment must be general. A screen
  that is individually art-directed is treated as a demonstration, not a deliverable.
- **Motion is decorative and must never be load-bearing.** No product information may exist only inside an
  animation.
- **Feature 002's two open questions are still unanswered**, and they determine the surface this feature
  works on. A decision to lighten the page ground, or to keep the existing glow field, changes what is
  possible here. The three specifications share one undecided identity question.

## Resolved Clarifications

All three were answered by the owner on 2026-09-20 and are now binding. **Open questions remaining: none.**

### Question 1: What environment do products float inside, and at what scale?  —  **RESOLVED: A**

**Answer recorded**: Keep the dark ground, and cap product scale so images stay sharp. The reference's
white-on-white floating mechanism is abandoned as inapplicable; separation from the surface must come from
isolation, edge treatment, and grounding cues.

**Consequence**: this also settles the resolution question in FR-018 by preference — sharpness beats size,
and the 900-pixel ceiling is accepted rather than worked around. It does not settle feature 002's two open
questions, which still decide what that dark ground actually looks like while scrolling.

### Question 2: Which route to dimensional presence?  —  **RESOLVED: B**

**Answer recorded**: Remove the backgrounds across the 188 source photographs to produce genuinely isolated
objects.

**Consequence, and it is the expensive one**: this is new asset production and it **contradicted feature
`001/FR-031` as that requirement was written**, which is why 001 was amended on 2026-09-20 — see "Amendment
Applied to Feature 001." It also converts this feature's central risk from "can the product float"
into "can 188 cut-outs be produced and trusted," which is why FR-028 … FR-034, SC-012, SC-013, and SC-014
exist. Under Constitution I a bad matte is a misrepresentation of the product, not a rough edge.

### Question 3: How far must the reference be departed from?  —  **RESOLVED: B**

**Answer recorded**: Follow the animated, dimensional product-page experience rather than the attached
reference as written. The reference becomes partial evidence: its restraint and product-as-protagonist
principles hold, its prohibitions on depth cues and its total silence on animation do not.

**Consequence**: motion and dimensional presence move from optional to central (FR-010), and FR-009 now
permits contact shadows and grounding cues that the reference forbids. Because depth cues applied to a grid
of 188 products is precisely how this initiative reintroduces visual noise, FR-009 requires them to be
proven systematically rather than on a hero.

---

**Combined effect of the three answers.** Q1 = A and Q2 = B are mutually reinforcing rather than in tension:
isolated objects suspended on a dark ground is the closest available analogue to the experience Q3 = B asks
for, and it is a stronger result than the reference's white-on-white trick would give on this brand. The
combined scope is therefore larger than any single answer suggests — asset production across 188 files, a
systematic depth-cue treatment, and a motion language — and it is gated on amending feature 001.
