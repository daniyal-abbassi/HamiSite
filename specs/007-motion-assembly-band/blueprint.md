# Blueprint — Feature 007: Motion Assembly Band

**Author**: Architect-Agent (subagent of the qoder boss session) · 2026-09-24
**Consumers**: owner (approval gate), `driver` (US2 assembly sequence), `qoder` (US1 heading arrival, after the structure exists).
**Status of claims**: every statement about existing code cites `file:line`. Items marked *(inference)* are design reasoning, not read from code; unmarked code statements are read-facts.

---

## 1. Content inventory — the contract (FR-004 / SC-008)

Source of truth: `app/(main)/page.tsx:220-222` renders exactly `<StoreExperience />`, `<TrustBento />`, `<FinalConversion />` at the back half. The headings match the spec table (`specs/007-motion-assembly-band/spec.md:15-19`): «تجربه حضوری / خرید را لمس کنید» = `StoreExperience.tsx:17-19`, «چرا حامی همراه / اعتماد، با واقعیت ساخته می‌شود» = `TrustBento.tsx:43-45`, «همراه شما، از انتخاب تا تجربه» = `TrustBlocks.tsx:23-26` (`finalConversionCopy`, `lib/content/home.ts:219-224`). The 230-word / 2,961px figures are the spec's measurement (spec.md:15-19) *(inference: not re-measured here; the enumeration below matches it element-for-element)*.

Every moving/kept item today, by section. **No new string, icon, or link may appear in the band** (FR-004, FR-014, SC-008); every string below must survive in the served document and the settled composition (FR-003).

### 1a. StoreExperience — `components/home/StoreExperience.tsx`

| ID | Item | Exact content | Source |
|---|---|---|---|
| SE-H1 | heading block | eyebrow «تجربه حضوری» (:17); h2 «خرید را **لمس کنید.**» (:18-20, emphasis span); lead «از انتخاب محصول تا دریافت مشاوره، حامی همراه در کنار شماست.» (:21) | inline strings |
| SE-P1..P3 | three point cards | ۰۱ «مشاهده و انتخاب» / «محصول را ببینید، مقایسه کنید و انتخاب کنید.»; ۰۲ «مشاوره تخصصی» / «پیش از خرید، انتخاب مناسب خودتان را پیدا کنید.»; ۰۳ «پشتیبانی پس از خرید» / «همراه شما بعد از خرید.» | `storeExperiencePoints`, `lib/content/home.ts:207-211`; icons Smartphone/Headphones/ShieldCheck (`StoreExperience.tsx:9`); grid `aria-label="اجزای تجربه خرید حضوری"` (:33) |
| SE-P4 | showcase card | mono «AUTHENTIC SHOWCASE» (:53); badge = `storeWarranty.label` «گارانتی ۱۸ ماهه شرکتی» (:54, from `lib/content/verified-facts.ts:21`); h4 «فروشگاه حضوری در مشهد» (:57); p «برای دیدن محصولات و دریافت گارانتی ۱۸ ماهه شرکتی، به فروشگاه حضوری مراجعه کنید.» (:58-60); footer «مشهد • فروشگاه حضوری حامی همراه» (:63) | inline + verified-facts |
| SE-P5 | hands-on card | mono «HANDS-ON EXPERIENCE» (:70); badge «مشاوره حضوری» (:71); h4 «مشاوره تخصصی و تجربه مستقیم» (:74); p «امکان دیدن و بررسی هدفون، ساعت هوشمند و اکسسوری قبل از خرید، با راهنمایی کارشناس فروشگاه.» (:75-77); footer «همه‌روزه از ساعت ۹:۳۰ تا ۲۱:۳۰» (:80, = `storeContact.hours`, `lib/content/contact.ts:18`); grid `aria-label="ویژگی‌های خرید حضوری"` (:49) | inline |
| SE-P6 | statement band | mono «HAMI / ONLINE + OFFLINE» (:89); h3 `storeExperienceStatement` «از صفحه نمایش تا فروشگاه، همراه شما هستیم.» (:90, `lib/content/home.ts:218`); p «برای اطلاعات حضور فروشگاهی یا گفت‌وگو با ما، از مسیرهای زیر استفاده کنید.» (:91) | inline + content lib |
| SE-**TEL** | phone link | `href="tel:+989331214000"`, display «۰۹۳۳ ۱۲۱ ۴۰۰۰» with `dir="ltr"`, oxblood variant (:98-104); single source `lib/content/contact.ts:14-18` | **immovable layer** |

**Images: zero.** The store photograph was removed by owner decision 2026-09-23 (`StoreExperience.tsx:25-31`). `storeExperienceSlots` is imported (`StoreExperience.tsx:7`) but never rendered *(inference: grep shows no other consumer repo-wide — dead content; dropping its import at deletion time is in scope, deleting `lib/content/home.ts:213-216` is optional cleanup)*.

### 1b. TrustBento — `components/home/TrustBento.tsx`

| ID | Item | Exact content | Source |
|---|---|---|---|
| TB-H2 | heading block | eyebrow «چرا حامی همراه» (:43); h2 «اعتماد، با **واقعیت** ساخته می‌شود.» (:44-46); p «چهار چیزی که درباره حامی همراه دقیق است؛ بقیه را در فروشگاه بپرسید.» (:47-49) | inline |
| TB-P7..P10 | four capabilities | store «فروش حضوری» / «تجربه خرید حضوری از فروشگاه حامی همراه»; wholesale «پخش عمده» / «تأمین عمده برای همکاران»; assortment «تنوع محصولات» / «موبایل، لوازم جانبی و محصولات دیجیتال»; assurance «خرید مطمئن» / «گارانتی ۱۸ ماهه شرکتی و تجربه خریدی روشن» | `trustFeatures`, `lib/content/home.ts:23-28`; `TrustGlyph` inline SVGs (`components/home/primitives.tsx:4-12`); `role="list"` ul (:54) |
| TB-P11 | warranty row | BadgeCheck + `storeWarranty.label` (:71-74) | verified-facts |
| TB-CTA | shop link | `href="/shop"`, «مشاهده محصولات», champagne default variant (:78-80) | merges with FC-CTA → **immovable layer** |

The file's own comment records that `id="trust"` survives *only* for the ground and the drift guard (`TrustBento.tsx:31-32`) — §5 re-declares both, so that constraint lifts.

### 1c. FinalConversion — `components/home/TrustBlocks.tsx`

| ID | Item | Exact content | Source |
|---|---|---|---|
| FC-H3 | heading block | mono eyebrow «HAMI HAMRAH / FINAL NOTE»; h2 «همراه شما، / از انتخاب تا تجربه.» (em); p «خرید آنلاین، فروش حضوری و همکاری حرفه‌ای؛ همه در یک مجموعه.» (:22-27, all from `finalConversionCopy`, `lib/content/home.ts:219-224`) | content lib |
| FC-CTA | primary shop link | `href="/shop"`, «مشاهده محصولات» + ArrowLeft, size lg (:31-36) | **immovable layer** |
| FC-L1 | «فروشگاه حضوری» link | `href="#store-experience"` + ArrowLeft (:38-40) | destination becomes the band — see §8 Q3 |
| FC-L2 | «همکاری با ما» link | `href="/partners"` + ArrowLeft (:41-43) | survives |
| FC-DEC | `.beam`, `.glow` divs | `aria-hidden="true"`, no CSS rule for either class exists anywhere in `app/` *(inference: grep across globals.css and home.css found only the JSX site)* | delete; they paint nothing |

Links in the inventory: `/shop` ×2 (TB-CTA, FC-CTA — identical href **and** label; see §8 Q4), `/partners` ×1, `#store-experience` ×1, `tel:` ×1. Inbound anchors from outside the three sections that the replacement must not silently break: `components/layout/Footer.tsx:32` («درباره ما» → `/#store-experience`) and `mobileQuickRoutes` (`lib/content/home.ts:36`, rendered by `MobileQuickRoutes`) — both keep working if the band carries `id="store-experience"` (§5).

---

## 2. Module tree

The band is **one new server component + one new CSS file + one thin client component (qoder's)**. Deletion, not dormancy (ponytail + FR-016): `StoreExperience.tsx`, `TrustBento.tsx`, `TrustBlocks.tsx` are removed from `app/(main)/page.tsx:220-222` and deleted in the same change as the band's landing.

```
components/home/AssemblyBand.tsx      RSC (server)
components/home/assembly-band.css     plain CSS, imported by AssemblyBand.tsx
components/home/HeadingArrival.tsx    "use client" — qoder's US1 unit
app/(main)/page.tsx                   one line: <AssemblyBand /> replaces three (§5 coordination)
```

| Module | RSC/Client | Why |
|---|---|---|
| `AssemblyBand.tsx` | **Server** | Renders 100% of §1 content from `lib/content/*` (existing convention: every section component imports its own content — `StoreExperience.tsx:5-7`, `TrustBento.tsx:4-7`, `TrustBlocks.tsx:5`). Zero interactivity, zero measurement: the choreography lives in CSS (§4), so a client boundary would add hydration cost for nothing. SC-004 (no-JS) falls out of this by construction. Takes **no props** — same as all three replaced sections. |
| `assembly-band.css` | static asset | All pin/scrub geometry lives here, inside `@supports (animation-timeline: view())` and `@media (prefers-reduced-motion)` blocks. Kept separate from `app/(main)/home.css` (partner-owned per `.agent-pair/README.md`) so the band's mechanism has one owner. |
| `HeadingArrival.tsx` | **Client** (the one thin shell) | Once-per-visit (FR-001, US1-AC2 "does not replay") is the one behaviour a scroll-linked mechanism cannot express — a `view()` timeline replays when the shopper scrolls back. This needs a ~20-line IntersectionObserver + class toggle, i.e. exactly the `Reveal` pattern (`Reveal.tsx:26-49`), scoped to word units. |

Prop interfaces (TypeScript, load-bearing):

```ts
// AssemblyBand.tsx — internal part vocabulary; each rendered node carries data-band-part={id}
// so the CSS and the QA script address parts without touching markup.
export type BandPartId =
  | "stack-store" | "point-1" | "point-2" | "point-3"
  | "showcase-card" | "hands-on-card" | "statement-band"
  | "stack-trust" | "capability-store" | "capability-wholesale"
  | "capability-assortment" | "capability-assurance" | "warranty-row"
  | "stack-close" | "partners-link";

// The immovable layer is NOT a part — it receives no data-band-part and is matched
// by no keyframe rule.
// <section id="store-experience" aria-labelledby="store-experience-title"> … one section,
// three h2 heading nodes (§6, §7).

// HeadingArrival.tsx (qoder implements; the band consumes it like this)
"use client";
export function HeadingArrival(props: {
  /** id lands on the heading element itself; "store-experience-title" must be reusable (§7). */
  id: string;
  level: 1 | 2 | 3;
  /** Persian text plus inline <span className="emphasis">/…; splitting is per
   *  whitespace-delimited WORD only — never per character (FR-002). */
  children: React.ReactNode;
  className?: string;
}): JSX.Element;
```

---

## 3. Sequence contract — stacked → explode → lock

**Track.** `AssemblyBand` renders a wrapper of height `--band-track` at 360 (budget: pin run ≤ 1,600px + settled composition ≤ 800px ⇒ total ≤ 2,400px, SC-001 binding). Inside it, a `position: sticky; top: 0` shell exactly `100svh` tall holds every part plus the immovable layer. `svh`, not `dvh`: dvh resizes exactly when mobile toolbars show/hide (research file, contradiction 1, `mobile-scroll-pin-failure-modes.md:56-61`); svh is the stable floor *(inference: svh also never under-fills mid-collapse, which only overlaps the pin's own scroll)*.

**Beats**, expressed as scroll progress `t ∈ [0,1]` of the track (each part is one CSS keyframe animation on the same timeline):

| Beat | t | Arrangement |
|---|---|---|
| 0 — stacked | 0 → 0.15 | All §1 parts sit in a tight vertical fan around the shell's centre axis: final reading order compressed, gaps ≈ 0, each card's text still fully legible (**no overlap of text** — US2-AC1 "all of the band's text present and legible" rules out a literal pile). Headings SE-H1/TB-H2/FC-H3 read as three statements stacked; this is the "still three blocks" starting image. |
| 1 — explode | 0.15 → 0.55 | Parts fan outward to their maximum offsets (spread along the block axis, with ±small inline offsets and ≤2° rotations). Every offset is declared as **magnitude + "toward reading start/end"**, never screen left/right (FR-008); the site is permanently `dir="rtl"` (`app/layout.tsx:95`), so the CSS maps "toward start" → `+x` under a one-line comment convention, mirroring the hero's RTL reasoning (`app/(main)/page.tsx:62-64`). |
| 2 — gather | 0.55 → 0.85 | Offsets shrink; parts cross into **new positions** (not the old vertical stack): capabilities TB-P7..P10 form a horizontal 4-up row under TB-H2; SE-P1..P3 merge into the statement band SE-P6; cards SE-P4/SE-P5 become a 2-up pair; FC-H3 sits as the closing statement above the composition. |
| 3 — lock | 0.85 → 1 | Final grid holds (all transforms at their settled identity: `translate: none; rotate: none`), shell stays pinned for the last beat, then releases naturally as the wrapper ends; the locked composition flows on into the footer. DOM order **never changes** — beats are transform-only, so reading/tab order is the §1 order in the served document at all times (FR-011, research addendum `mobile-scroll-pin-failure-modes.md:156-166`: "sticky/transforms don't reorder DOM"). |

**Per-part stage table** (part → beat-0 position → beat-3 position): every part of §1 appears exactly once; nothing is a prop invented to have something to move (FR-004).

| Part | Beat 0 | Beat 3 (locked) |
|---|---|---|
| SE-H1 heading | centre of stack | statement 1, top of composition (arrival treatment attaches here, §6) |
| SE-P1..P3 points | stacked column | merged row beneath SE-H1 |
| SE-P4/P5 cards | stacked | 2-up pair, mid band |
| SE-P6 statement | bottom of stack | full-width rule beneath the pair |
| TB-H2 heading | centre of stack | statement 2, above the 4-up |
| TB-P7..P10 capabilities | stacked column | 4-up capability row |
| TB-P11 warranty row | stacked | beneath the 4-up |
| FC-H3 heading | stacked | statement 3, closing position |
| FC-L2 partners link | stacked | beneath FC-H3 (FC-L1 fate = §8 Q3) |

**Immovable layer (FR-007/FR-018, veto power = US3).** SE-**TEL** (`tel:+989331214000`, «۰۹۳۳ ۱۲۱ ۴۰۰۰», `dir="ltr"`) and the single primary shop action (`/shop` «مشاهده محصولات») render inside the sticky shell at a fixed bottom placement, **outside** the `data-band-part` tree: no keyframe ever selects them, `position: absolute` at a constant offset, above the flying parts in z-order, `pointer-events` always on, never `aria-hidden`, text never changes (US3: Persian digits from `lib/content/contact.ts:15-16` verbatim). Positional fixity is the FR-018-A answer: their box does not move between frames at any `t` while pinned. Before/after the pin window they are in-flow at the composition's bottom, one position each. SC-006 is additionally backstopped by the persistent «تماس» dial in `components/layout/MobileDock.tsx:72`, which never animates.

---

## 4. Mechanism decision

**Chosen: CSS `position: sticky` pin + CSS scroll-driven animation (`animation-timeline`) scrub, `@supports`-gated; zero JavaScript in the loop.** No new dependency — and no use of the installed motion stack for the sequence either: `gsap@3.15` with `ScrollTrigger.js` **is already in `package.json:33` and `node_modules`** (read-fact), so this choice is a rejection on mechanism grounds, not an availability compromise.

Why not the JS-pinned alternative (GSAP ScrollTrigger scrub + pin):

1. ScrollTrigger's pin is implemented in px measured from `window.innerHeight`; the mobile toolbar show/hide changes `innerHeight` and the pin jumps when those measurements go stale (`mobile-scroll-pin-failure-modes.md:17-27`, first-party iOS reports + maintainer diagnosis). A `position: sticky` pin has **no measurement to invalidate** (research lines 69-75: "holds structurally").
2. The two GSAP mitigations are both disfavoured by the evidence the spec itself commissioned: `ignoreMobileResize` has mixed field reports ("does nothing!" — research:29-35, medium confidence), and `normalizeScroll()` "hacks the default scrolling" (research:30-33). FR-017 resolved *phone first* — it is methodologically wrong to pick as the primary path the mechanism whose known mobile defect has only partially-proven patches, on the reference the owner named.
3. Lenis interplay: pin + smooth-scroll + toolbar-resize is a documented three-body failure zone (research:37-47; Lenis #288 jump-to-top, whose workaround was… `ignoreMobileResize`). This checkout's Lenis is desktop-only (`ScrollSmooth.tsx:82-88` refuses `any-pointer: coarse`) and drives *real* document scroll (`ScrollSmooth.tsx:17-22`), so a CSS scroll timeline follows it correctly on desktop and touch devices are untouched — with GSAP's pin you inherit that whole intersection instead of sidestepping it. *(Inference, flagged: "CSS scroll-driven animation tracks Lenis's window.scrollTo positions" follows from the "real document scroll" property documented at ScrollSmooth.tsx:17-22; it needs one desktop-browser confirmation by the driver.)*
4. The trade-off the research names — "a sticky pin cannot re-layout three sections as freely as a scrubbed JS timeline" (research:74-75) — is dissolved here, not paid: the layout change is done by the **scrubbed keyframes on parts inside the sticky shell**, not by re-parenting DOM. Sticky supplies the fixed stage; the timeline supplies the choreography. Neither does measurement.

What each requirement binds:

- **SC-007 (mid-sequence reload, 5/5):** band state is a pure function of `scrollY` (sticky geometry + progress-mapped keyframes); browsers restore `scrollY` on reload/back-forward, so the matching state is returned by definition — no replay logic, no persisted flags. Fast fling → lands in locked composition, same property (Edge Cases). The one non-scroll function is the heading's once-per-visit flag, which correctly *resets* on reload (a fresh visit) and starts settled-if-in-view via the `Reveal` in-view guard pattern (`Reveal.tsx:33-35`).
- **SC-001 (≤ 2,400px at 360):** the track budget in §3. A JS pin would need the same scroll distance, so this is neutral between mechanisms — but note a no-pin variant (scrub only across the band's natural pass) was rejected because three beats (stack/explode/lock) need more scroll than a ~800px composition passes through a viewport; the sticky track is what buys them within the budget.
- **SC-004 (no-JS = 100% content):** with scripting off, the RSC HTML already holds every §1 string in the locked DOM order, and sticky + scroll-driven animations are CSS — the motion even runs script-less. The only script-dependent piece (HeadingArrival) fails open exactly like `Reveal`: SSR-visible, hidden only after JS measures (`Reveal.tsx:9-11` comment).
- **Support reality (owner sign-off = §8 Q1):** `animation-timeline` is Safari 26+/Samsung 23+/recent Chrome-Firefox per caniuse fetched in the research pass (research:106-108); it silently does nothing on Safari ≤18.x, Samsung ≤22, and the unknown no-GMS engines the research explicitly could not date (research:119-136: "feature-detect, never UA-sniff"). Everything therefore lives inside `@supports (animation-timeline: view())`: **unsupported engines render the static locked composition** — the fail-visible rule from the research file (lines 112-117), which is also what reduced-motion and no-JS users see. Sticky itself is universal, so no engine ever sees a broken pin.

Rejected third option: CSS scroll-driven **without** the sticky track — cheaper still, but three distinct beats cannot fit in the band's natural pass height, and FR-016's own words call the result "one **pinned** closing movement" (`spec.md:240`).

---

## 5. Ground coupling (FR-010) — re-declaration, old → new

Today the ground's six stages anchor to section ids (`lib/atmosphere/progression.ts:30-41, 96-103`), measured via `getElementById` offsets in `components/atmosphere/useAtmosphereGround.ts:63-67`, and the drift guard compares `HOMEPAGE_SECTIONS ∪ UNANCHORED_SECTIONS` against the rendered `<section>` ids captured from the live DOM (`tests/unit/atmosphere-progression.test.ts:47-59`; capture method: `specs/001-premium-rtl-storefront/verification/capture-baseline.mjs:101` reads `document.querySelectorAll("section")`); the current rendered list is `[…, "store-experience", "trust", "final-conversion"]` (`specs/001-premium-rtl-storefront/baseline/manifest-after.json`). Three of the six stages/band anchors die with the sections: `counter`@store-experience, `close`@final-conversion, plus bare-listing `trust` (whose survival is justified only by the guard — `TrustBento.tsx:31-32`).

**Mapping table (binding for `driver`, who owns `components/atmosphere/**`, `lib/atmosphere/**` and the page — `.agent-pair/README.md` ownership table):**

| Old anchor (element) | Old consumer | New anchor (element) | Contract after the band lands |
|---|---|---|---|
| `store-experience` (section, `StoreExperience.tsx:13`) | stage `counter` (`progression.ts:101`); Footer «درباره ما» (`Footer.tsx:32`); `mobileQuickRoutes` (`lib/content/home.ts:36`) | `store-experience` (**the band's single `<section>`**, at the track top) | id moves onto the band wrapper: stage anchor, Footer and quick-route links all keep resolving with zero edits; measured offset = band start, so `counter` ember `#320B0A` arrives exactly where the stack begins. |
| `trust` (section, `TrustBento.tsx:39`) | membership in `HOMEPAGE_SECTIONS` only | *(none — deleted)* | remove the string from `HOMEPAGE_SECTIONS`; guard set-sizes recompute (see below). |
| `final-conversion` (section, `TrustBlocks.tsx:17`) | stage `close` (`progression.ts:102`); "runs from first section to the last" assertion (`test:71-76`) | `band-settled` (**an in-flow `div` id at the locked composition**, just after the track) | `HOMEPAGE_SECTIONS` last entry becomes `"band-settled"`; `close` anchors there. `getElementById` is id-based and accepts a div (`useAtmosphereGround.ts:64`). The existing test requires every stage anchor to be a member of `HOMEPAGE_SECTIONS` (`test:65-69`) and `PROGRESSION.at(-1).anchor === HOMEPAGE_SECTIONS.at(-1)` (`test:71-76`) — both hold with this edit. **Boss-review correction (2026-09-24 19:20):** a third assertion does NOT hold as written — the order check (`test:57-59`) compares the manifest-captured `<section>` list ∩ `HOMEPAGE_SECTIONS` against the full `HOMEPAGE_SECTIONS`, and `band-settled` is a `div` that will never appear in that manifest (8 ≠ 9, red). The wiring change must compare order against `HOMEPAGE_SECTIONS − SUBTREE_ANCHORS` (i.e. the same subtraction the size formula uses). |
| rendered-section set (guard input) | `test:47-59`: `rendered.length === accountedFor.size` | new exported `SUBTREE_ANCHORS = ["band-settled"] as const` in `progression.ts` | guard computes `accountedFor = HOMEPAGE_SECTIONS ∪ UNANCHORED_SECTIONS − SUBTREE_ANCHORS` (10→9 vs 9 rendered: `top, obtainable-now, featured, categories, brands, new-arrivals, b2b, online-services, store-experience[band]`). `UNANCHORED_SECTIONS` otherwise unchanged (`progression.ts:54`). |

`close` being the darkest tone and the final stage (test:71-76, 188-191) is preserved: the locked composition sits at page bottom, so the ember→dark leg now completes **inside** the band, ending at `band-settled`. SC-009 tone-at-position inside the band: `counter` at the stack beat, interpolating to `close` no later than the lock beat (t≈0.85), holding `#160406` after. *Note:* while the shell is pinned, the tone keeps travelling with the scroll (the ground is always a function of scroll, never of time — `useAtmosphereGround.ts:73-79`; 002's forbidden thing is *lag/overshoot*, not scroll-correlation), so "ground moves while content is stationary" during 0→0.85 is the authored behaviour, not drift — flagged here so QA doesn't call it a bug.

**FR-010 control run (mandatory, not optional):** after wiring, delete any one band-adjacent section id from the page *without* touching the lists and show `npx vitest run tests/unit/atmosphere-progression.test.ts` go red on the set-size assertion; restore, re-run green. The guard's own file records why a green-by-construction guard is decoration (`progression.ts:44-53`; the 2026-09-24 incident).

Also lands in the same change (driver): `app/(main)/page.tsx:220-222` → single `<AssemblyBand />`; deletions of `TrustBlocks.tsx` (whole file), and the `#store-experience` self-link handling (§8 Q3). The dead `.beam`/`.glow` divs and the `.final-conversion` CSS block (`app/(main)/home.css:400-409`) go with them.

---

## 6. Arrival-treatment interface (qoder's US1 seam)

`AssemblyBand` renders each of the three heading statements **only** through:

```tsx
<HeadingArrival id="store-experience-title" level={2}>{/* words, with <span className="emphasis"> allowed */}</HeadingArrival>
```

- The section keeps `aria-labelledby="store-experience-title"` (matching today's `StoreExperience.tsx:13`), so the heading id must survive on the heading element itself. TB-H2/FC-H3 keep `trust-title`/`final-conversion-title` ids for in-page SR heading navigation even though their `<section>` landmarks are gone (FR-016: one section, headings remain navigable text — one `h2` each is today's level, `StoreExperience.tsx:18`, `TrustBento.tsx:44`, `TrustBlocks.tsx:23`; keep all three at `h2`, they sit inside one section now, which is valid).
- **Unit = whitespace-delimited word (or whole wrapped line), never per-letter** (FR-002, verified in-checkout: `spec.md:175-180`). Split at text-node granularity inside `HeadingArrival`; `emphasis`/`em` inline spans pass through and their words are split within the span. Properties: `opacity` + `translateY` + `filter: blur()→0` only; **zero** letter-spacing, zero `display: block` on fragments (orphaning risk on long Persian headings — Edge Case: the split keeps normal white-space wrapping, `inline-block` per word preserves the line-break opportunities since spaces remain between elements).
- Settled state must be pixel-identical to today's heading (US1 independent test / SC-002): the wrapper adds classes only; no structural DOM change in the settled tree.
- The heading sits **inside a flying part** (stack table §3): `HeadingArrival` owns the arrival (one-shot, IO-gated), the band CSS owns the scrub (transform on the *parent part*). Transforms compose; neither touches the other's properties. qoder must not select `[data-band-part]` nodes and driver must not animate `filter`/arrival classes — the seam is: **parent transforms = sequence; own-word opacity/blur/translateY = arrival.**
- Reduced motion (SC-003/FR-005): `HeadingArrival` returns children with no hidden state when `prefers-reduced-motion: reduce` (same guard as `Reveal.tsx:31`), and the band's CSS carries its own reduce block (§7). First paint: sharp, in place, zero elements hidden.

---

## 7. Accessibility & fallbacks

- **Reduced motion.** Ground: already handled — hook swaps in `reducedMotionTone` (`useAtmosphereGround.ts:70-78`; FR-020 semantics in `progression.ts:262-270`). Band: `@media (prefers-reduced-motion: reduce)` in `assembly-band.css` must set `position: static` on the shell, collapse the track to content height, and `animation: none` on every part — leaving the §3 beat-3 composition flat. **Do not rely on the site-wide floor** at `app/globals.css:416-438`: it neutralises via `animation-duration: 0.01ms !important`, and scroll-driven animations do not progress by duration (CSS scroll-driven-animations spec) — an explicit band rule is required *(inference from spec semantics; driver should confirm once in a browser)*. Same for the `.reveal` collapse pattern (`app/(main)/home.css:16-22`). The existing floor's transition/loop neutralisation still covers hover/idle decoration the band may add.
- **Print.** Ground: `display: none` on the fixed layer (`page-ground.css:49-53`). Band: same treatment — `position: static`, `animation: none`, all content flows once in §1 DOM order; no motion exists on paper (Edge Cases, spec.md:161).
- **Forced colours.** Ground steps aside (`page-ground.css:42-46`). The band adds nothing the mode can't take: parts are ordinary text cards with `border`/`currentColor` styling like the sections they replace; the rule is "no colour-only meaning" — the icons stay `aria-hidden` (as today, `StoreExperience.tsx:40`, `TrustBento.tsx:72`).
- **Keyboard / SR (FR-011).** DOM order is reading order at every beat (transform-only choreography; research:158-161: visual stacking must not imply unreachability). One `<section>`, three navigable `h2`s, `role="list"` semantics preserved for the capability row (`TrustBento.tsx:54`) and the points grid labels (§1). Focus into a mid-flight off-centre part: native scroll-into-view consults the transformed box *(inference: standard browser behaviour)*; the immovable layer's two controls are on-screen at every pinned frame, so the two actions that matter are never the ones being hunted by Tab.
- **Reload / back-gesture (FR-006/SC-007).** Nothing persists in JS state; sequence position ≡ scroll position; browser scroll restoration + sticky + scroll timelines return the matching frame (no `history.state` keys, no replay flags).

---

## 8. Open questions for the Boss gate (5) — ALL RESOLVED, owner + boss, 2026-09-24 18:47

Resolved by the owner at the Phase-1 gate (Q1–Q5 below are kept verbatim as the record):

1. **ACCEPTED** — static locked composition is the fallback on unsupported engines. No JS-scrub fallback (§4 mechanism stands).
2. **BOSS PROCEDURE** — board REQUEST posted for `driver`'s stale T089 locks (`StoreExperience.tsx`, `TrustBento.tsx`, `SectionHead.tsx`, held since 11:47 though T089 is committed in `47fce40`); Phase 2 starts on the *new* band files, which no agent owns; deletions/ground re-wire wait on lock release.
3. **RETIRE** the «فروشگاه حضوری» → `#store-experience` self-link (T091 precedent; SC-008 is set, not multiset).
4. **MERGE** to one immovable `/shop` action; the second instance is deleted with its section.
5. **PER PAGE LOAD** — no storage; `Reveal` semantics extended to word units.

1. **Silent-fallback acceptance (FR-017 tension).** On Safari ≤18.x, Samsung ≤22, and the engine-unknown no-GMS browsers the research pass could not date (`mobile-scroll-pin-failure-modes.md:106-136`), the band renders as its static locked composition — complete, honest, but *no assembly*. That is the research-recommended fail-open, but "phone first" was the owner's answer. Does the owner accept motionless-but-correct on those engines, or is a JS scrub fallback for them being asked for (which reopens §4's rejected mechanism)?
2. **Ownership grant for the deletions.** `StoreExperience.tsx`, `TrustBento.tsx`, `TrustBlocks.tsx` and `app/(main)/home.css` sit in the `partner` row of `.agent-pair/README.md`; the band's files and the page-composition line are `driver`'s. New locks for `components/home/AssemblyBand.*` and the three deletions need a boss-issued ownership amendment / board GRANT before the implement phase — today `StoreExperience.tsx` and `TrustBento.tsx` are *currently locked* (`.agent-pair/locks/`).
3. **Fate of «فروشگاه حضوری» → `#store-experience` (`TrustBlocks.tsx:38-40`).** Its destination becomes the band itself. Precedent says retire a button that points at the section it lives in (`StoreExperience.tsx:105-109`, T091); the literal SC-008/(US2b) "holds all the same content" reading says keep it. Recommendation: retire it. Ruling needed.
4. **Two identical `/shop` CTAs → one immovable action.** TrustBento (`:78-80`) and FinalConversion (`:31-36`) both render «مشاهده محصولات» → `/shop`; FR-018 names *the* primary shop action singular. Recommendation: one immovable instance (set-difference SC-008 still passes — same string, same href). Confirm multiset equality is *not* intended.
5. **"Once-per-visit" scope for the arrival (FR-001).** Per page-load (no storage; reload re-shows the settle once, matching `Reveal` semantics, shortest diff) or per browser visit (sessionStorage flag)? Recommendation: per load; SC-007's reload test explicitly expects a settled-but-not-replaying band, and the same reading should govern headings.

---

*Coordination note: this file only — no source touched, locks honoured (`.agent-pair/locks/specs__007-motion-assembly-band__blueprint.md.lock` held by qoder; the concurrent `StoreExperience`/`TrustBento`/`Header` locks were respected read-only).*
