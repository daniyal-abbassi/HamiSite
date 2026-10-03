# Research: Liquid Dock Navigation

Every decision below names what was **verified** versus what was **judged**, because the two fail differently.
A wrong judgment gets overruled by the owner; a wrong verification silently ships.

---

## D1 — Take the source, not the package

**Decision.** Vendor three files from the reference into `components/liquid/` under its MIT licence, with
attribution. Do not add a dependency.

**Rationale — verified.** `.scratch/liquid-taffy/package.json`:

```json
{ "name": "liquid-taffy", "private": true, "version": "0.2.0", "type": "module",
  "scripts": { "dev": "vite", "build": "tsc -b && vite build", "preview": "vite preview" },
  "dependencies": { "gsap": "^3.15.0", "react": "^19.1.0", "react-dom": "^19.1.0" } }
```

`"private": true` blocks publishing and blocks `npm install <git-url>` from yielding something importable;
there is no `main`, no `exports`, no build output, and its `dependencies` are the app's own runtime needs. Its
`LICENSE` is MIT, Copyright (c) 2026 arknow91 — copying substantial portions is permitted with the notice
retained. `gsap`, `react` and `react-dom` are already in this project, so the port adds nothing.

**Alternatives considered.**
- *Install from GitHub as instructed, literally.* Not possible; verified above. Recorded because the owner
  asked for it twice and deserves the exact reason rather than a refusal.
- *Reimplement from the README description.* What the first draft of this spec assumed. Strictly worse: it
  paraphrases motion constants that are right there, and it loses the three documented workarounds (D6).
- *Add it as a git submodule or vendored npm tarball.* Solves nothing the copy doesn't, and drags in Vite
  config, `index.html`, `App.tsx` and the five components we are refusing.

---

## D2 — `PillTabs` is the feature; the metaball filter is not

**Decision.** Adopt the travelling pill and its motion. Do not adopt `goo.ts` or any SVG filter.

**Rationale — verified.** `PillTabs.tsx`'s own header comment: *"one shared pill floats UNDER the labels and
GSAP carries it from tab to tab, going a little gelatinous on the way — it stretches long and low as it takes
off, leaning into the direction of travel, then rings back to shape on an elastic once it lands. Width tweens
alongside x, so the pill is already becoming the next label's size while it flies."* Its import list is
`react`, `gsap`, `../liquid/motion`, `../liquid/sfx`, `../liquid/theme`, `./PillTabs.module.css` — **`goo` is
not among them.** The blur-and-alpha-threshold filter lives in `liquid/goo.ts` and belongs to the switch,
menu, morph and burst components.

**Why this mattered.** The README's headline is *"blur → alpha-threshold filter (the classic metaball trick)"*,
and the first draft of this spec took that as describing everything in the repo. It wrote three requirements
(FR-030, FR-031, FR-034) bounding a filter cost the adopted surface does not incur. Reading the file instead
of the summary retired the mechanism and left only the motion.

**Alternatives considered.** *Adopt the goo filter too, for authenticity.* Rejected: per-frame rasterisation
on seven surfaces, for a look the reference's own tab row does not use.

---

## D3 — The motion, exactly, and why not to tune it blind

**Decision.** Keep upstream's numbers on the first build. Revisit only against the owner's handset.

**Rationale — verified, from `PillTabs.tsx`:**

| phase | values | duration / ease |
|---|---|---|
| travel | `{x, width}` to the new slot | `0.26s`, `power3.inOut` |
| squash | `scaleX 1.25`, `scaleY 0.78`, `skewX ±8` (sign follows direction) | `0.11s`, `power2.out` |
| settle | `scaleX/scaleY → 1`, `skewX → 0` | `0.5s`, `elastic.out(1, 0.32)` |

Total flight ≈ 620 ms, which upstream's own comment names.

**Why this is a judgment and not a fact.** 620 ms is a long time for a five-slot bar on a phone, and the
`28px` pill height, `0 15px` padding and `4px` gap are all sized for a demo stage, not a bottom dock with
icons stacked over Persian labels. Those will need to change. The *easing relationships* — fast-in, squash
mid, slow elastic settle — are the thing worth preserving, and are not being touched until there is a real
device verdict on them.

**Alternatives considered.** *Shorten to ~300 ms up front for snappiness.* Rejected for this feature: the
owner's standing instruction is that this machine cannot judge motion quality, so pre-empting their handset
with a number chosen here replaces one guess with another.

---

## D4 — Drag-to-select declined

**Decision.** Press deforms; navigation commits on release at the pressed destination; dragging across
neighbours does not change the commit. FR-012a.

**Rationale — judged, on the owner's explicit delegation ("your call").** The reference lets you grab its
shape and pull it between slots. Adopting that would make the marker briefly mean *"where you might go"* on
the control where it must only ever mean *"where you are"* — which is precisely what FR-016 forbids by
requiring the marker and the active label to be unable to disagree.

**The argument I made and then dropped.** My first reason was that the dock sits over the phone's bottom
gesture area and a misfiring nav bar is worse than a misfiring decoration. That is weak: the system gesture is
a vertical swipe from the screen edge, so a horizontal drag inside the bar does not compete with it, and
slide-to-correct before release is an affordance people already know from every other control on their phone.
Recording the bad argument so nobody re-raises it as if it were load-bearing.

**Dissent, on the record.** The advisory model preferred the full drag at **0.65** versus 0.17 for this
decision — below its own 0.80 decisiveness bar, so not a verdict, and escalated rather than adopted. See
`notes/jev-advisory.md`.

---

## D5 — Seven surfaces, found by a criterion

**Decision.** The marker goes on every shopper-facing control that already publishes a current, selected or
pressed state. Seven. Not "everything with a hover".

**Rationale — verified.** `grep -rn 'aria-current|aria-selected|role="tab"|aria-pressed'` across
`components/` and `app/`. Results and their kind:

| File | Line | Attribute |
|---|---|---|
| `layout/MobileDock.tsx` | 102 | `aria-current={active ? "page" : undefined}` |
| `layout/PillNav.tsx` | 300, 313 | `aria-current={isActive ? "page" : undefined}` |
| `home/FeaturedProducts.tsx` | 116–165 | `role="tablist"` / `role="tab"` / `aria-selected` |
| `shop/CategoryTiles.tsx` | 29 | `aria-current={active || undefined}` |
| `shop/ShopResults.tsx` | 242 | `aria-current={target === page ? "page" : undefined}` |
| `shop/ProductGallery.tsx` | 90 | `aria-pressed={index === current}` |
| `shop/ProductDetail.tsx` | 80–105 | variant selection by `selectedVariantId` |

The criterion is reproducible, which is the point: "everywhere you can" has no stopping rule until someone
supplies one, and a list derived by search can be checked by anyone.

**Excluded, with reasons.**
- `admin/AdminSidebar.tsx:42` — also `aria-current="page"`, and the easiest surface in the repo to change.
  Out: Constitution III says the back office is not modified to unblock frontend work.
- The stacking-card deck, the categories arrival, the cart drawer, dialogs, body text — none asks a one-of-N
  question. Named explicitly (FR-044) because they are the plausible over-reach.

**Alternatives considered.** *Two surfaces only* — what the spec said before the owner answered; superseded.
*Every interactive element* — no criterion, and it would put a marker on things with nothing to be current
about.

---

## D6 — Three upstream workarounds are kept, with their reasoning

**Decision.** FR-068 requires them, because each one is a bug the upstream author already paid for.

**Rationale — verified, quoted from the source.**

1. `gsap.killTweensOf(pill)` before a new trip — *"Without it, a click landing inside the 620ms flight leaves
   both timelines alive and both writing width to the same pill every frame — and width is layout, so a
   flurry of clicks piles up synchronous reflows underneath the stage swap."*
2. The same-slot early return — *"on the selected tab that read as the pill bouncing in place under the
   pointer, which is not a thing the selection did."* Guards against a parent re-render or a fresh `items`
   array re-firing the travel.
3. First-paint read off `pill.style.width === ""` rather than a ref — *"StrictMode's throwaway mount reverts
   the inline styles the set wrote, and an armed ref would leave the real mount animating a pill that is back
   to zero width."*

This project runs React 19 with the same double-mount behaviour, so number 3 applies verbatim.

---

## D7 — `will-change` only while in flight

**Decision.** Strip the permanent hint; apply it at trip start, remove it at trip end. FR-034.

**Rationale — verified, and a difference in kind between the two projects.** Upstream's CSS sets
`will-change: transform` on the marker unconditionally, with a comment explaining that width is deliberately
*not* listed because "the compositor cannot hold it". Correct on a stage with one pill. This feature puts the
same element on seven surfaces, and a shop page can show category tiles, pagination and a filter row at once
— a persistent hint per group is a layer per group, held whether or not anything is moving.

**Alternatives considered.** *Leave it, it's one property.* Rejected: it is not one property, it is one
compositor layer per resting group, indefinitely.

---

## D8 — CSS Modules stay

**Decision.** Keep `*.module.css` for the ported component rather than converting to Tailwind or the
`app/(main)/home.css` block style.

**Rationale — judged.** Next.js supports CSS Modules natively, so this costs nothing structurally. It keeps
the ported geometry legible against the ported component, which matters because FR-068 requires the
comment-to-rule locality to survive: three of the upstream workarounds are explained in the CSS as well as
the TSX. The rest of the site's styling convention is untouched — this is one new folder with one new file,
not a second styling system for the app.

**Alternatives considered.** *Convert to Tailwind.* Would scatter the geometry away from its explanations and
make the diff unreviewable against upstream.

---

## D9 — Pagination's distance problem is unresolved on purpose

**Decision.** FR-046 requires the behaviour to be stated and tested, and does not state which of the two
options wins.

**Rationale.** Pagination is the only surface where the gap is unbounded — `ShopResults.tsx:242` renders page
numbers, and a shopper can go from page 1 to page 20. A pill crawling through nineteen slots is absurd and a
pill teleporting is a different object. The honest answer depends on the real maximum page count and on how
many numbers are rendered at once with ellipsis collapsing, which is measurable in ten minutes during T0xx
and is not worth guessing at now.

**Options, both acceptable.** Bound the travel to a maximum visible distance and suppress beyond it; or
suppress above one slot. Whichever is chosen MUST be recorded with the measurement that justified it.

---

## D10 — Token mapping is where "harmony" is actually decided

**Decision.** FR-063 requires the marker's colours to come from this storefront's tokens, and names the eight
custom properties upstream reads that do not exist here: `--liquid-surface`, `--liquid-rim`, `--liquid-shadow`,
`--font-family`, `--ease-out-strong`, `--color-text-primary`, `--color-text-secondary`, `--font-size-md`,
`--line-height-md`.

**Rationale — judged, and flagged as the highest-consequence decision in the feature.** The owner's original
brief on the brand cards, and the standing bar in Constitution IV, is that a borrowed treatment must not read
as pasted-in. A travelling pill wearing the reference's own grey-on-white surface and rim would look exactly
like that. The mapping onto champagne/ink/aqua/line/foreground is a design decision, not a mechanical one, and
it is the part most likely to be done lazily by an implementer who just wants the motion to work.

**Not decided here on purpose.** The specific values. They belong to the port task, where whoever does it can
see the result against the bar's existing `bg-ink-2` and `border-champagne/25` rather than picking from a list
of token names.
