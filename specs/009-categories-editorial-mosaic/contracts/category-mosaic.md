# Contract: Category Mosaic

**Surface**: `components/home/CategoryHub.tsx` + the `.cat-mosaic` block in `app/(main)/home.css`
**Spec**: [../spec.md](../spec.md) · **Decisions**: [../research.md](../research.md) · **Model**: [../data-model.md](../data-model.md)

Eight clauses. Each names the evidence that settles it, because the failure mode of this chapter has been an
agent looking at it, liking it, and calling that verification.

---

### M1 — All nine are visible, and nothing sideways is required

Every department the shop currently supports appears within the chapter's vertical scroll at 360 px. Zero
horizontal gestures, zero pager controls, zero hidden set.

**Evidence**: scroll the chapter at 360 px and count distinct department tiles seen; assert nine, and assert the
chapter introduces no element with horizontal overflow.

*Rejects*: the current presentation, where a keyboard shopper is shown one panel per visit and must already know
the arrow keys to reach the other eight.

---

### M2 — A department is recognisable before its label is read

A person shown the chapter for five seconds names at least six of nine departments from the panels alone.

**Evidence**: the owner or a colleague, cold, once. Recorded as a count, not a vibe.

---

### M3 — One press, one destination, and the tile is the target

Each tile is a single link to its department's listing; pressing anywhere on the tile activates it; there are no
nested interactive elements.

**Evidence**: nine presses at 360 px, each landing on the matching listing. Also assert the smallest tile is at
least **148 px** wide at 360 (the corrected floor — see research D1; 164 px is arithmetically impossible inside
the container's 312 px content width).

---

### M4 — A number on a tile is a promise the listing keeps

A count appears only where `showsCount` is true, and equals what the destination displays. Five of nine
departments qualify today; the phone, charger and powerbank tiles show **no number**, because their route is a
subset of their kind and a confident small figure is as dishonest as an inflated one.

**Evidence**: compare each tile against its destination. Then assert no tile renders "coming soon", a disabled
state, or a dimmed treatment (M8).

---

### M5 — The label is live text, on a plate that survives future imagery

Department names are rendered text, never pixels inside a panel, and sit on the scrim plate. Contrast of label
against what is behind it is at least **4.5 : 1**; the current nine measure a minimum of **16.8 : 1** against
sampled bottom bands.

**Evidence**: grep the panel set for rendered glyphs (there must be none), and compute contrast against the
composited background rather than against the plate colour alone.

*Why the scrim*: the panels were generated with an empty dark bottom third, but that rule lives in a document
an image generator never reads. The plate is what keeps this clause true after the next regeneration.

---

### M6 — Keyboard and screen reader see a grid, not a carousel

Nine tab stops in DOM order, each with a visible focus indicator; the section announces as a list of nine items,
and each tile announces as one link with its name (plus its count where shown). No `aria-roledescription`
claiming "carousel" or "slide" survives.

**Evidence**: tab through at 1280 and record the stop count and order; run a screen reader over the section and
record the announcement. The deleted component's roles must be absent, not merely unused.

---

### M7 — The old presentation is gone, and so is the machinery that served it

`CategoryCarousel.tsx`, `category-carousel.css`, and the band-paper mount patch that existed to support it are
removed. `embla-carousel-react` remains a dependency — `components/home/NewArrivals.tsx` still imports it — but
it is no longer reachable from the categories path.

**Evidence**: the files do not exist; no import of them remains; the mount patch's selectors are absent from the
stylesheet.

---

### M8 — Equal doorways, unequal size

Every tile carries the same treatment: same label style, same scrim, same focus ring, same press behaviour.
Hierarchy is expressed **only** through area.

**Evidence**: compare all nine tiles at rest. Any difference other than size fails — including a small tile that
reads as an afterthought, which is the accepted tradeoff in research D3 and still must not become a stub.

---

## Non-negotiables inherited, not re-decided

- **No Persian text baked into any panel image.** Models render Persian script as gibberish every time; the
  label is overlay text so it stays sharp, translatable and repositionable.
- **No real-brand trade dress** in any panel, and no image that presents a specific product as merchandise the
  shop sells (Constitution I, which has no exception path).
- **The light ground stays.** The owner asked for it by name: *"the white background is so pretty, keep it"*.
- **Missing data stays visibly missing** — no stand-in photograph, no assumed value.
- **The chapter works with scripting disabled** (FR-018), because it contains no script.
