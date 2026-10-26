---
description: "Task list for feature 044-mobile-first-redesign"
---

# Tasks: Mobile-First First-Screen Redesign

**Input**: Design documents from `/specs/044-mobile-first-redesign/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: No unit/contract tests requested. Acceptance is the real-browser validation in quickstart.md (constitution DoD).

**Organization**: Tasks grouped by user story (US1 first-screen composition, US2 real photograph, US3 background system, US4 desktop coherence).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Owning user story (US1–US4)
- Exact file paths included in every task

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 [P] Copy supplied background artwork into the public asset tree: `specs/044-mobile-first-redesign/mockups/background-mobile-silk.png` → `public/images/hero/home-silk-mobile.png`, `specs/044-mobile-first-redesign/mockups/banner-silk-wide.png` → `public/images/hero/home-silk-wide.png` (keep spec mockups untouched as provenance)
- [x] T002 [P] Extend `lib/content/verified-facts.ts` with the two owner-confirmed facts (2026-10-25, spec FR-007): `{ key: "priceMatch", label: "قیمت برد به برد" }` and `{ key: "officialDealership", label: "نمایندگی رسمی" }`; also fix the existing `redmi` label orthography to «نماینده‌ی فروش برند ریلمی» (ZWNJ, no spaced ی). Do not remove existing keys.

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T003 In `app/(main)/page.tsx`, extend the `trustFactIcons` and `trustFactShortLabels` records (typed against `typeof trustFacts[number]["key"]`) with the new keys — `priceMatch`: short label «قیمت برد به برد», icon `Medal`; `officialDealership`: short label «نمایندگی رسمی», icon `ShieldCheck`; switch `history` icon to `Clock` and `store` icon to `MapPin` (lucide-react). `npm run typecheck` must pass again after T002+T003.

**Checkpoint**: content layer ready — US1 markup can compile against the extended facts.

---

## Phase 3: User Story 1 — First screen tells the brand story in one view (P1) 🎯 MVP

**Goal**: At 390×844 the first screen matches the approved mockup: oxblood header + white lockup + four actions, ticker, photo-left/two-tone-headline-right hero, two CTAs, 2×2 outlined-icon trust grid, silk background.

**Independent Test**: Load `/` at 390×844, compare against `specs/044-mobile-first-redesign/mockups/mobile-home-design.png`; tap both CTAs and the category menu.

### Implementation for User Story 1

- [x] T004 [US1] Mobile header surface in `components/layout/Header.tsx` + `components/layout/header-glass.css`: on <768px render a solid `--oxblood` bar with rounded bottom corners carrying (a) the white lockup composed from `public/brand/hami-mark-alpha.png` + `public/brand/hami-wordmark-fa.png` via CSS `filter: brightness(0) invert(1)`, mark visually right of the wordmark, replacing the current white-tile brand; (b) the four existing actions (search, category GlassMenu, account, bag) as bare white icons ≥44×44. Desktop (≥768px) markup and styles unchanged.
- [x] T005 [US1] Category trigger treatment on the oxblood bar in `components/discover-button.tsx` + `header-glass.css`: hide the closed-pill glass surface on the mobile header so the trigger reads as a bare white icon (mockup), keeping pillHeight/44px behavior and the open glass panel unchanged; preserve the 2026-10-25 tap fix.
- [x] T006 [US1] Hero composition in `app/(main)/page.tsx` + `app/(main)/home.css`: on <768px use `public/images/hero/home-silk-mobile.png` as the hero band background (top-anchored cover) replacing the `home-mobile-*.webp` artwork; add the store photograph `public/store/shop-ai-relight.png` as the second grid column — rounded block bleeding to the page's left edge per the mockup, space fully reserved (explicit frame/fill, no shift); text column keeps «۲۰ سال اعتماد» pill, two-tone headline («حامی همراه،» ink + «فروش عمده و تکی تلفن همراه و لوازم جانبی» oxblood) with a gold underline accent; both CTAs styled per mockup («مشاهده محصولات» oxblood solid, «شروع همکاری» cream with gold edge — existing variants).
- [x] T007 [US1] Trust-facts grid restyle in `app/(main)/home.css` + `app/(main)/page.tsx`: 2×2 grid with thin center divider, each fact an outlined circular ring icon (oxblood stroke, transparent fill) + Persian label, per mockup; grid fits the first screen.
- [x] T008 [US1] First-screen verification in the live browser at 390×844 (dev server): compare against the mockup; confirm ticker link, CTA routes, category menu open/close (tap + Escape) still work; iterate styles until composition, palette and hierarchy match (this is the owner-mandated comparison loop — repeat until the first screen visually matches `mockups/mobile-home-design.png`).

**Checkpoint**: US1 complete — first screen matches the mockup at 390×844 and stays interactive.

---

## Phase 4: User Story 2 — The real shop, not a render (P2)

**Goal**: The hero photograph is the real store interior with a reserved frame.

**Independent Test**: Throttled reload at 390×844 — no movement of CTAs/headline while the photo loads; photo fills its rounded frame without distortion.

### Implementation for User Story 2

- [x] T009 [US2] Load-stability pass on the hero photo in `app/(main)/page.tsx` + `home.css`: verify the reserved frame under network throttling (or before image load), adjust dimensions/crop (`object-fit`/frame ratio) so the photograph fills the mockup's shape without stretching; confirm CLS-imperceptible load in the browser.

**Checkpoint**: US1 + US2 both hold.

---

## Phase 5: User Story 3 — Branded background carries the whole page (P3)

**Goal**: Silk artwork composes the first screen and the wide banner improves the desktop closing band; everything stays legible.

**Independent Test**: Scroll the full homepage at 390 and 1280 widths checking contrast/legibility over the artwork.

### Implementation for User Story 3

- [x] T010 [P] [US3] Wide silk banner on the desktop closing CTA band (heading «همراه شما، از انتخاب تا تجربه», content from `lib/content/home.ts`, rendered by its `components/home/` band component): apply `public/images/hero/home-silk-wide.png` as that band's background at ≥1024px in `app/(main)/home.css` (or the band's stylesheet), preserving text contrast and the band's content.
- [x] T011 [US3] Full-page legibility pass in the live browser at 390×844 and 1280×800: scroll every homepage section over the background system; fix any text-over-text or contrast failure introduced by the artwork (no section restyling beyond the closing band).

**Checkpoint**: US1–US3 complete; the page reads as one brand surface.

---

## Phase 6: User Story 4 — Desktop keeps its composure (P3)

**Goal**: No desktop regression; mobile styles stay confined to <768px.

**Independent Test**: Load `/` at 1280×800 and compare against the pre-redesign state for completeness and function.

### Implementation for User Story 4

- [x] T012 [US4] Media-query audit in `app/(main)/home.css` + `header-glass.css`: confirm every new mobile rule is scoped <768px, the desktop hero artwork/scene and glass header are untouched, and the closing band improvement applies ≥1024px; fix any leak; verify at 1280×800.

**Checkpoint**: All four user stories hold together.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T013 [P] Accessibility audit of the first screen in `app/(main)/page.tsx` + `header-glass.css`: 44×44 targets on all header actions and CTAs, visible focus states on oxblood surfaces, `prefers-reduced-motion` stops the ticker animation (existing rule must survive the restyle)
- [x] T014 Run `npm run typecheck` and `npm run build`; restart the dev server after the build (CLAUDE.md stale-build trap: `next-server` is the process name; port 3000 must serve the fresh build) and re-confirm `/api/health`
- [x] T015 Run the full `specs/044-mobile-first-redesign/quickstart.md` validation and save the acceptance screenshots (390×844 first screen + 1280×800 desktop) as evidence

## Dependencies & Execution Order

- T001, T002 (parallel) → T003 → US1 phase (T004–T008, sequential within the shared files) → T009 → T010/T011 → T012 → T013/T014/T015.
- T010 can run any time after T001 (different file); T011 depends on T006 (silk in place) and T010.
- The comparison loop in T008 is the owner-mandated gate: style iterations repeat until the 390×844 render matches `mockups/mobile-home-design.png`.

## Parallel Example

```bash
# After setup, T001 and T002 touch different files — run together:
Task: "T001 copy background artwork into public/images/hero/"
Task: "T002 extend lib/content/verified-facts.ts"
```

## Implementation Strategy

- MVP = US1 (T001–T008): the mockup's first screen, verified by the owner-mandated visual loop.
- Then US2 load stability, US3 background system, US4 desktop audit, polish.
- No commits without owner instruction (conservative git profile) — report changed files at handoff.
