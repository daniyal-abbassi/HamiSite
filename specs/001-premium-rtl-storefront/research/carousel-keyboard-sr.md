# R3 — What does a full-bleed category carousel still owe keyboard and screen-reader users once the chevrons and the "N از 9" status are deleted?

**Question (qoder-ide, board 12:39 +0330):** Today `CategoryCarousel.tsx` carries a roving tabindex,
one tab stop for the whole strip, ArrowLeft/ArrowRight mapped to reading order, Home/End, and an
`aria-live` status region. The visible controls are going away. What is the minimum that survives, and
is a visually-hidden control set a legitimate answer or a trap?

---

## Verdict first, both halves flatly

**Finding 1 — a visually-hidden control set is legitimate *only if it becomes visible on focus*. A
sr-only control that never appears when focused is a WCAG failure, stated as such in the skip-link
guidance, which is the same pattern.** The anti-pattern list read today: "A skip link that never becomes
visible when focused — the sighted keyboard user tabs onto an invisible link, sees focus apparently
vanish… **(fails 2.4.7)**", and "Do not reuse a generic `.sr-only` / `.visually-hidden` utility for a
skip link unless it has a paired `:focus` rule that brings the element back on screen."

**Evidence:** accessibility.build skip-link / WCAG 2.4.1 guide (fetched 2026-09-24), mapping 2.4.7
Focus Visible (AA) and 2.4.11 Focus Not Obscured (AA, WCAG 2.2) to this exact pattern, and noting
`display:none`/`visibility:hidden` remove the element from the tab order altogether (making the control
*unreachable* — 2.4.1/2.1.1 territory). WCAG's own 2.4.7 wording ("a mode of operation where the
keyboard focus indicator is visible") is satisfied by *any* visible indicator on *any* focus landing —
so hidden-until-focus passes **iff** focus actually reveals it. **Confidence: high.**
**Affects:** the redesigned CategoryCarousel's control story.

**Finding 2 — the one thing that must NOT be deleted is keyboard movement between panels, and with the
roving tabindex it is not optional.** With one tab stop (`tabIndex={isActive ? 0 : -1}`,
`CategoryCarousel.tsx:267`), exactly one of the nine links is in the Tab sequence. The other eight are
reachable *only* through whatever key handling moves `activeIndex`. Delete the chevrons **and** the key
handling and eight of nine destinations become keyboard-unreachable → every panel is a link to a route a
keyboard user cannot activate → WCAG 2.1.1 (A) failure. The APG carousel pattern read today is built
the other way around: "Tab and Shift + Tab: Move focus through the interactive elements of the carousel
as specified by the page tab sequence — scripting for Tab is not necessary" — the pattern's baseline is
*natural tab sequence through all controls*, arrows as enhancement, never as the sole gate.

**Evidence:** W3C APG Carousel pattern (w3.org/WAI/ARIA/apg/patterns/carousel/, fetched today) +
`CategoryCarousel.tsx` lines 261-289 (roving tabindex, `aria-current`, per-slide
`role="group" aria-roledescription="slide"` "۱ از ۹") and 295-317 (live region + two buttons).
**Confidence: high** — code as written plus 2.1.1's text.

---

## The minimum that survives (the actual answer)

### Must survive (inference from read sources; high confidence)

1. **A key path to every panel.** Either keep roving tabindex *plus* ArrowLeft/ArrowRight (reading
   order, as now), or drop roving and give every link `tabindex="0"` (nine tab stops; APG's tab-sequence
   baseline; less friendly but conformant — the pattern itself warns many tab stops are "the least
   friendly for keyboard users"). Roving + arrows is the better pattern; **it just makes the key
   handling load-bearing accessibility infrastructure, not a nicety.** Confidence: high.
2. **The links stay real links in document order.** They already are (`<Link href>` per panel);
   sticky/transform presentation never reorders DOM — and the guide read today says to *confirm* that:
   "Tab order follows the markup… worth confirming, because an implementation that reorders cards with
   `order` or absolute positioning will not." A full-bleed redesign must not change this. Confidence: high.
3. **A visible focus indicator on whatever remains focusable.** Already present:
   `.cat-panel:focus-visible { outline: 2px solid #e5d3b3; … }` (`category-carousel.css:153-157`) and
   `.cat-carousel__nav button:focus-visible` (:238). Risk the redesign *introduces*: panels become
   photographs, and 2.4.7 reasoning read today evaluates the outline "over the background over which the
   outline appears" — a fixed champagne outline over nine different photos, some bright. **This is a new
   failure surface the current dimmed-art design does not have.** Confidence: high on the requirement,
   medium that it gets missed (your design, not yet built).
4. **Off-screen panels must NOT be `aria-hidden`.** APG: "the screen reader experience can be confusing
   and disorienting if slides that are not visible on screen are incorrectly hidden." Panels are
   translated off-screen by transform and today are correctly exposed. Keep them exposed — or, if the
   redesign truly hides slides one-at-a-time, switch to a strict active-slide model (a bigger change than
   deleting buttons). Confidence: high (read from APG).

### Should survive (strong recommendation; medium confidence)

5. **Some position announcement for screen-reader users after movement.** The current
   `aria-live="polite"` status region (`CategoryCarousel.tsx:296-298`) is the only thing telling a user
   who just pressed ArrowRight that the strip moved and where they are. APG's carousel material and the
   live-region guidance read today treat polite announcements of content change as the standard
   mechanism. Deleting the *visual* status is a visual decision; deleting the *live region* removes the
   only non-visual feedback of movement. Recommendation: keep the region, `sr-only` it — and note
   `sr-only` **text** does not need to become visible on focus (Finding 1 applies to *controls*, not to
   status text). Confidence: medium — no source read *requires* a live region for non-autoplay
   carousels (pattern, not WCAG); absence noted honestly.
6. **An accessible name on the strip.** APG-adjacent guidance read today: an unlabelled focusable/
   announced region announces as "region" and nothing else; `aria-label`/`aria-labelledby` tells the
   reader what they arrived at. Whether the redesign is `role="region"` + `aria-roledescription=
   "carousel"` or a labelled list is a design call — it needs a name either way. Confidence: high.

### May go (with the visible controls)

7. The two `<button>` chevrons — *provided (1) holds*. The component's own comment says they are "pointer
   users advance without dragging (FR-029, K4)" — a pointer affordance, which a touch-first full-bleed
   panel design reasonably absorbs into the panels themselves. 2.1.1 requires functionality be operable
   by keyboard, not that a button exist for it. Confidence: high.
8. The visible "۱ از ۹" text — as long as (5) keeps an sr-only equivalent, or the per-slide
   `aria-label="۱ از ۹"` (`CategoryCarousel.tsx:250`) remains, which it already does. Confidence: high.

---

## The trap list (what a redesign could easily get wrong here)

- **sr-only chevrons with no `:focus` reveal** → 2.4.7 failure (Finding 1). The skip-link pattern is the
  *positive* precedent only when paired with `:focus` visibility.
- **`display:none` on off-screen slides** → removes them from the tab order entirely; combined with
  roving tabindex, keyboard users hit a wall (read: display:none/visibility:hidden "both remove an
  element from the tab order").
- **Focus lands inside a full-bleed panel whose `:focus-visible` outline sits on a bright photo region**
  → indicator exists but may be imperceptible; WCAG technique material read today reasons explicitly
  about contrast "over the background over which the outline appears". WCAG 2.2's 2.4.11 (focus not
  obscured) matters too if the fixed header overlaps a focused panel after it is scrolled into view.
- **Reordering with CSS `order`/absolute positioning for the full-bleed layout** → Tab order diverges
  from visual order (2.4.3), the classic stacked-card trap named in the keyboard-access guide.
- **Trusting "browsers make scroll containers focusable automatically"** — that guide says the behaviour
  "is not universal across engines and versions, so the explicit attribute is still the reliable form":
  if the strip becomes its own scroll container, keep explicit `tabindex`/focusable children.

**Sources read (2026-09-24):** W3C APG Carousel pattern; accessibility.build skip-links & bypass blocks
(2.4.1/2.4.7/2.4.11 mapping); WCAG technique/evaluator material on focus indicators (scope of 2.4.7,
indicator-over-background reasoning); css-scroll-driven.com "Keyboard access to scroll-driven interfaces"
(nested scroll containers, `tabindex="0"`, document order for pinned/stacked sections);
`components/home/CategoryCarousel.tsx` and `category-carousel.css` here (read-only).

**Method note:** documentation and source reads only; no build, no server, no lock, no source edits.
Persian label strings quoted from the component as-is.
