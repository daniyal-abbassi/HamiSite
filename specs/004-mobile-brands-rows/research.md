# Phase 0 Research: Mobile Brands Row Presentation

Resolved 2026-09-21. Every decision below was checked against this repository, not assumed. Each carries a
`Resolves:` line naming the requirement or ambiguity it closes.

---

## D1 — Brand destinations do not resolve, and the failure is silent

**Finding (verified):** `/api/brands` derives each slug from the **Persian** brand name via `slugify()`, so the
real slugs are `اپل`, `سامسونگ`, `شیائومی`, `تی-سی-اچ`, `نوکیا`, `ریلمی`. The homepage links use **Latin**
slugs — `/shop?brand=apple`, `samsung`, `xiaomi`. In `ShopClient.tsx`:

```
const brandId = brandSlug ? (brands ?? []).find(b => b.slug === brandSlug)?.id : undefined;
if (brandId) params.set("brandId", String(brandId));
```

No match → `brandId` is never sent → the request returns the **entire catalog**. The page renders normally,
shows 189 products, and looks correct. The same line of code makes all eight `/shop?category=…` hrefs from
`CategoryHub` fail identically, because export category slugs are also Persian (`موبایل-و-تبلت`,
`هدفون-ایرپاد-و-هندزفری`, `سامسونگ-samsung`).

**Decision:** fix in the client and content layers, and make the failure loud.
1. Store the authoritative destination on each brand entry as the **real slug** the API emits, not a
   hand-written Latin guess.
2. When a `brand` or `category` param is present but resolves to nothing, the listing MUST NOT render an
   unfiltered catalogue. It resolves to an explicit empty/unknown state naming the requested brand.
3. Category hrefs are corrected in the same change, since the defect is one line shared by both.

**Rationale:** Principle I and FR-002 cannot pass while a wrong filter looks like a right one. A silent
fallback is the worst available failure mode because it defeats review — which is precisely how eleven broken
links survived to this point.

**Alternatives considered:**
- *Add a Latin→id alias map inside `/api/brands`.* Rejected: Principle III freezes the route, and the route is
  not where the bug is.
- *Percent-encode the Persian slugs into the hrefs and leave the code alone.* Rejected as primary: it fixes
  the links but preserves the silent-fallback defect, so the next mistyped slug fails invisibly again. It is
  however the correct **output** once resolution is authoritative — see D2.
- *Defer to a separate fix.* Rejected: this feature's acceptance criteria depend on it.

**Resolves:** FR-002, FR-005, Principle I. Blocks: every acceptance scenario in User Story 1 and 3.

---

## D2 — Latin hrefs are kept; the mapping is data, not code

**Decision:** row links keep readable Latin hrefs (`/shop?brand=apple`) for shareability, and
`lib/content/home.ts` carries the authoritative Persian slug beside each brand. Resolution prefers the stored
slug and falls back to a name match.

**Rationale:** `001` already treats shared links as a first-class concern, and a percent-encoded Persian slug
in a URL is fragile across messaging apps — an edge case `001` records for product slugs. Keeping the pretty
href while making the mapping explicit means the truth lives in one editable table rather than in a string
that happens to match.

**Alternatives considered:** pure-slug hrefs (accurate, ugly, fragile in chat); id-based hrefs (`?brand=5`,
brittle across data refreshes and meaningless to a shopper).

**Resolves:** FR-002, and `001`'s percent-encoding edge case.

---

## D3 — Motion mechanism: CSS transition, not a library

**Decision:** emphasis transitions are CSS transitions on transform/opacity with a height change, driven by
React state. GSAP is not used in this section.

**Rationale:** the interaction is a two-state change on one element at a time — exactly what CSS transitions
do well, with zero runtime cost, automatic `prefers-reduced-motion` handling via a media query, and no
per-row animation loop. GSAP's value here (timelines, scrubbing, physics) is not needed, and the reference's
own desktop hover choreography is explicitly out of scope after Q2 = C. `tailwindcss-animate` and existing
duration utilities already cover it.

**Alternatives considered:** *GSAP timeline per row* — rejected, adds a runtime and a cleanup obligation for a
two-state toggle; *`motion` package* — rejected, unused elsewhere in this section and would create a second
animation idiom, which `FR-032` forbids; *embla-carousel* — irrelevant, this is not a carousel.

**Resolves:** FR-017 … FR-022, and the "one motion language" clause of FR-032.

---

## D4 — No marquee in the mobile presentation

**Decision:** the reference's infinite marquee band is **not** implemented for phones. Emphasis is expressed by
surface change, mark, label, and story text.

**Rationale:** the reference runs a `repeat: -1` loop per row, and does so whether or not the row is visible —
six perpetual animations on the homepage's longest section, directly contrary to FR-017 and FR-019 ("motion
MUST NOT loop indefinitely"). It also collides with `004`'s own Q3 = C decision, which removed the page's
existing marquee to keep one travelling element per region. Re-adding six internally contradicts that.

**Alternatives considered:** *marquee only on the active row* — still a perpetual loop, still violates FR-019,
and reintroduces the noise the initiative exists to remove; *a single reveal sweep that terminates* — retained
as an option for the design phase, since it satisfies FR-019, but not required.

**Resolves:** FR-017, FR-019, FR-022, Q3 = C consistency.

---

## D5 — Emphasis must not move a target under a thumb

**Decision:** the row's resting height is fixed; emphasis changes surface and reveals the story within a
reserved area rather than growing the row and pushing siblings.

**Rationale:** FR-011 forbids taking a target out from under a thumb mid-press, and FR-046 of `001` requires
async regions to reserve space so content does not jump. A fixed-height row with a surface change and a
contained story reveal satisfies both without a layout shift, and keeps the tap target for the *next* row
stable — which matters because the expand control sits inside the row.

**Alternatives considered:** the reference's 92px → 190px growth, which shifts every row below and is the
behaviour FR-011 was written against; an overlay sheet, which is a different component pattern and would
diverge from `005`'s in-place emphasis under FR-032.

**Note:** this is a structural constraint, not a visual one. Whether the reserved area is above, below, or
behind the label remains a design decision under Principle IV.

**Resolves:** FR-011, FR-009, and `001`/FR-046.

---

## D6 — Component testing is impossible today; the browser is the harness

**Finding:** Vitest runs with `environment: "node"` and includes only `tests/**/*.test.ts`. There is no
testing-library, jsdom, or happy-dom in the dependency set. Nothing in this repository can currently assert
that a component renders, holds focus, or transitions correctly.

**Decision:** acceptance for this feature is verified in a real browser through the connected `browser-use`
MCP, following the quickstart. No test-harness dependency is added by this plan.

**Rationale:** the failure modes that matter here — silent filter fallback, RTL mirroring, focus visibility,
layout shift, reduced-motion equivalence — are all only observable at the rendered page, which is also the
seam chosen in decision D0 of the initiative. Adding a DOM harness would be a new dependency and a new
convention, which Principle III's spirit and the "no new dependency" constraint both argue against for a
single feature.

**Consequence to record honestly:** the pure functions that *can* be unit tested — slug resolution and
brand→destination mapping — should be, and belong in `tests/unit/` where the existing harness already runs.
Everything visual stays browser-verified.

**Resolves:** the verification strategy for all FRs; prevents an untestable acceptance list.

---

## Open items carried forward

| Item | Owner | Note |
|---|---|---|
| Three category tiles with no artwork (computer accessories, SIM cards, car chargers) | feature 005 | Unresolved from the previous turn: AI raster vs hand-authored SVG. Generated rasters arrive at ~2 MB and **without alpha**, so they neither match the existing flat SVG badges nor solve isolation. |
| `CLAUDE.md` states "Next.js 14"; installed is 15.5.25 | docs | Correct when the file is next touched. |
| Letter-spacing on Persian headings site-wide (001/FR-057) | 001 follow-up | The reference's tight tracking must not be copied into row labels. |
| MCP server restart for `DISPLAY` | done | Verified working: image generation completed end-to-end on 2026-09-21. |
