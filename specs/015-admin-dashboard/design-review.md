# Design Review — Task 015-C: the back-office frame

**Date**: 2026-10-01 · **Worker**: `qoder` · **Contract**: [spec.md](./spec.md) · **Decisions**: [design-sheet.md](./design-sheet.md)
**Scope reviewed**: `app/(admin)/layout.tsx`, `components/admin/AdminSidebar.tsx`, `components/admin/AdminPageHeader.tsx`

Four `design-review` skills were run against the change, each by a fresh read-only context that had not seen
the design sheet's intentions and could not see a browser: `design-qa` (against the spec),
`accessibility-review`, `responsive-design`, `design-debt-review`. Findings below are theirs, triaged by me.
**Everything fixable inside the three owned files is fixed** — the file records what was fixed, what stands,
and what belongs to another worker's file. Nothing is marked acceptable because it was inconvenient.

Two caveats on the evidence, stated up front because they bound every conclusion here:

- **No browser was used.** This team's rule puts runtime verification with `hermes`. Overflow, applied
  contrast, focus-ring painting, and truncation at real Persian glyph metrics are *reasoned from source and
  arithmetic*, not measured. §5 lists the five checks that still need a browser.
- **The token files were never touched.** `git diff --stat -- app/globals.css tailwind.config.ts` is empty —
  independently confirmed by two reviewers. The frame is built entirely from the existing vocabulary.

---

## 1. `design-qa` — against the spec's own requirements

| Requirement | Verdict | Basis |
|---|---|---|
| **FR-006** simplicity cap — every visible control does something; no decorative metric | ✅ met | The frame contains 4 control types: 7 destinations, «همه», «مشاهده فروشگاه», «خروج». All act. No badge, count, sparkline, clock, or "logged in as" chip was added. |
| **FR-007** tokens only | ✅ met | `grep` for `#[0-9a-fA-F]{3,8}`, `rgb(`, `rgba(`, `hsl(`, `style={{}}` across the three files → zero hits. `duration-fast`/`duration-normal` are real `transitionDuration` tokens; `shadow-deep`, `rounded-md`, `rounded-2xl` are on the config scales. |
| **FR-008** one shell, inherited everywhere, no per-page edits | ✅ met | `npm run typecheck` exit 0 with all ten `AdminPageHeader` call sites unchanged; `description`/`actions` are optional. No admin route needed an edit. |
| **FR-009** mobile-first 360 px, no horizontal overflow | ⚠️ **met by arithmetic only** | See §5. Rail slots are `flex-1` + `min-w-0` inside a capped `ul`, so they divide the viewport and cannot force width. |
| **FR-011** contrast ≥ 4.5:1, edges ≥ 3:1 | ✅ measured, all pass | Computed by the accessibility reviewer from the token literals — table in §2. |
| **FR-012** keyboard-operable, visible focus, mobile nav without a pointer | ✅ met after fixes | Global champagne `:focus-visible` at `globals.css:157` covers every `a`/`button` the shell adds and nothing in the shell overrides it. Trap, `inert`, restore-on-close all added. |
| **FR-013** motion transform/opacity only, absent under reduced motion | ✅ met | The project floor at `globals.css:430` forces `animation-duration` *and* `transition-duration` to `0.01ms !important` on `*`, so motion is absent, not shorter. Verified by reading the rule. |
| **FR-015** storefront untouched | ✅ met | Diff is three files, all under `(admin)`/`components/admin`. |
| **SC-003** zero raw colour literals | ✅ met | As FR-007. |
| **SC-005** no overflow at 360/1280 + measured contrast | ⚠️ partial | Contrast measured from literals; the no-overflow half needs the browser pass. |
| **Constitution II** Persian-first | ✅ met | No `tracking-*`, no `uppercase`, no `capitalize`; logical properties only; the Latin `ADMIN` chip is gone. Covered by the repo's own `tests/unit/persian-typography.test.ts`, which scans `app` + `components` + `lib` and passes. |
| **Constitution IV** no generic-dashboard look | ✅ by source | Flat solid surfaces, one hairline, a weight+marker active state, a Persian monogram. Visual confirmation is still the owner's call (SC-008). |
| **US-2 AC-1..4** | ✅ | AC-2 (active not colour-only) needed a correction to the *claim* — see finding D1. |

### Declared deviations from the contract

- **D1 — "four redundant channels" was not true of the mobile rail.** The design sheet claimed assistive
  state + weight + marker + fill; the thumb rail has no fill, and at `text-xs` the `font-bold`→`font-black`
  step is a weak independent channel. **Fixed by correcting the claim, not by adding the fill**: a filled
  slot among five reads as a pressed key rather than a location, and the 2 px champagne marker measures
  13.49:1 against the rail ground, so 1.4.11 passes on the marker and `aria-current` on the four links
  carries the assistive half. `NavRow` (desktop rail + sheet) does have all four.
- **D2 — the brief's "every destination in one tap" is four in one tap, three in two.** Recorded in
  [design-sheet.md](./design-sheet.md) §4 with the four rejected alternatives. Both reviewers independently
  reached the same conclusion: seven slots at 360 px cannot hold a 44 px control with a legible label.

---

## 2. `accessibility-review`

**Measured contrast**, from the token literals (node, no browser). Backgrounds: `ink-2 #14060A`,
`background #0B0204`; the `/10` and `/5` fills blended first.

| Pairing | Ratio | Need | Verdict |
|---|---|---|---|
| `muted-foreground` on `ink-2` (idle nav, top-bar subtitle) | 7.60:1 | 4.5 | pass |
| `muted-foreground` on `background`, and on the canvas gradient's lighter top `#100306` | 7.86 / 7.77:1 | 4.5 | pass |
| `foreground` on the blended active fill `rgb(42,29,32)` | 13.80:1 | 4.5 | pass |
| `foreground` / `muted-foreground` on the blended hover `rgb(31,18,21)` | 15.51 / 6.99:1 | 4.5 | pass |
| `destructive` on `ink-2`, and on `destructive/10` | 5.41 / 4.93:1 | 4.5 | pass |
| champagne marker on `ink-2` / on the active fill | 13.49 / 11.04:1 | 3.0 (1.4.11) | pass |
| focus ring champagne on `ink-2` | 13.49:1 | 3.0 | pass |
| `champagne/25` grabber · `champagne/40` header rule · `--line` @12 % | 1.81 / 2.87 / 1.25:1 | — | below 3:1, **exempt**: each is `aria-hidden` decoration that carries no state. The `champagne/40` hairline sits at 2.87 and would fail the moment it is asked to mean something. |

**Fixed in this change:**

- **A1 (major, WCAG 2.4.3) — focus dropped to `<body>` when the sheet closed on navigation.** The old code
  closed on a `pathname` effect, which unmounted the panel with focus inside it. The effect is gone; every
  way out of the sheet — backdrop, ✕, Escape, or choosing a section — now runs `closeSheet()`, which returns
  focus to «همه».
- **A2 (major, 2.4.3 / 2.1.2) — the trap only closed at its ends.** If focus was ever outside the panel, Tab
  walked the rail and «خروج». Two fixes: Tab now pulls any escaped focus back into the panel, and the content
  column is marked `inert` for the life of the sheet (`layout.tsx` gives it `id="main"` for exactly this
  reason — it was previously an `id` with no consumer).
- **A3 (major, 1.3.1 / 4.1.2) — `aria-current="page"` on the «همه`* button*.** A dialog trigger is not a
  location, and on `categories`/`brands`/`coupons` it was the only `aria-current` in the mobile nav, so a
  screen reader announced «همه، current page» and never named the section. Removed; the marker stays
  (sufficient for 1.4.11) and the operator's location is stated by the page `h1` and by the top bar, which
  now shows the current section's name as its second line.
- **A4 (major, 2.4.1 bypass blocks) — no skip link.** `app/(admin)/layout.tsx` adds
  «پرش به محتوای اصلی» as the first tab stop, `sr-only` until focused. On desktop it skips a brand row plus
  seven nav rows plus two utility rows.
- **A5 (minor, 2.5.3 label in name) — the dialog's accessible name did not contain its visible title.**
  `aria-label="همه بخش‌های پنل مدیریت"` over a visible «همه بخش‌ها». Now `aria-labelledby` → the panel's `<h2>`,
  so name and visible text are the same string.
- **A6 (minor, 1.4.4 / the "two definitions of mobile" trap `globals.css:872` warns about) — `text-[10px]`
  rail labels.** The phone chrome is live from 360 px to 1023 px, but the repo's ≤767 px rule that silently
  promotes `text-[10px]` to 12 px stops at 768. A tablet was rendering genuine 10 px Persian. Rail labels,
  both brand subtitles, and the header's eyebrow are now `text-xs` (12 px) at every width the frame is
  visible — no Persian below 12 px anywhere in the shell.

**Verified clean, no action:** focus-visible coverage (`:where()` costs specificity, so the shell defines no
outline of its own — correct, but a future `focus:outline-none` anywhere would silently win);
targets (rail slot 72×64 px at 360 px, top-bar خروج ≈68×44, sheet ✕ 44×44 — passes 2.5.8 and HIG 44, and
`globals.css:1192` backstops every coarse-pointer button at 44 px); rail spacing (zero gap, but 24 px
exclusion circles stay ~48 px apart so 2.5.8 *Spacing* passes — mis-tap risk moderate, not a failure);
no hidden content (sticky bar keeps its flow space; fixed chrome ≤100 px against a 96 px + inset reserve);
duplicate `aria-label="بخش‌های مدیریت"` on the two `<nav>`s is harmless because `display:none` means only one
is ever exposed; one `h1` per route across all ten admin pages.

**Stands — A7 (minor, 1.3.1): the sheet's `<h2>` precedes the page's `<h1>` in DOM order**, because the
sidebar renders before `main`. A heading-order nit that a screen reader resolves from the dialog context.
Fixing it properly means moving the sheet out of the sidebar into a portal, which is a larger change than a
frame task should make unilaterally; a second option is demoting the `<h2>` to a labelled `<p>`, which trades
a real finding for a cosmetic one. Left as-is, named.

---

## 3. `responsive-design`

**Fixed in this change:**

- **B1 (major) — tablet chrome stretched to five 167 px slots.** At 768–1023 px the phone chrome is still
  active, so at 834 px each slot is 153–167 px with a 32 px marker and a ~40 px label: two-thirds empty.
  The rail's `<ul>` is now `mx-auto max-w-md`, which caps the cluster at 448 px — a value above 360 px, so
  the mandated width is bit-for-bit unaffected — and returns ~104 px slots on a tablet. Moving the swap to
  `md` was rejected: a 256 px rail leaves 512 px, which the admin tables cannot absorb.
- **B2 (minor→major latent) — the sheet had no height ceiling.** Its content computes to ~337 px, which
  fits an 844×390 landscape phone with 53 px spare but not a 568×320 one, and it is bottom-anchored so
  anything taller leaves off the *top*, unreachable. Now `max-h-[75dvh] overflow-y-auto overscroll-contain`,
  which also stops one more destination being a silent overflow.
- **B3 (minor) — the fixed rail ignored the horizontal safe area.** `viewport-fit=cover` is on, so a notched
  phone in landscape puts 44 px insets left and right and the first and last labels sat in the cutout. Both
  phone bars now take `px-[max(<floor>,env(safe-area-inset-left),env(safe-area-inset-right))]` — the worst
  side, so the mapping never has to know which physical edge is the start edge under RTL.
- **B4 (minor) — `min-w-0`/`truncate` gaps that could push a flex row wider than its container.** The rail's
  `li` are `min-w-0 flex-1` (a flex item's automatic minimum was the way a long `short` label could grow one
  slot past its share); the «همه» label now has the same `RailLabel` treatment as its four siblings; the
  desktop «مشاهده فروشگاه» and «خروج» labels are wrapped in `min-w-0 truncate`; and `AdminPageHeader`'s
  `actions` row is `min-w-0 flex-wrap lg:shrink-0`, because a `shrink-0` toolbar in a `lg:flex-row` header
  would otherwise be clipped by the body crutch the moment any page passes one.

**Verified clean:** the rail cannot overflow horizontally — five `min-w-0 flex-1` slots in a capped `ul`, and
the widest label («داشبورد», 7 glyphs) measures ~33–40 px against 64 px of box at 360 px, ~24 px of margin,
holding even at 320 px. `min-h-dvh` on the shell is a minimum, not a fixed height, so no clipping.
`main`'s bottom reserve (96 px + inset) exceeds the tallest chrome (64 px + 1 px + inset) by ~31 px on every
page, because the reserve is padding on `main` itself rather than a per-page debt.
**RTL audit is clean**: the full inventory of physical utilities in the three files is `inset-x-0`,
`inset-0`, `inset-y-3`, `top-0`, `bottom-0`, `border-t`, `border-b`, `rounded-t-2xl` — every one block-axis
or both-edge, so direction-neutral. Zero `left-`/`right-`/`pl-`/`pr-`/`ml-`/`mr-`/`text-left`/`text-right`.
The start-edge marker is `start-0`, the rail edge is `border-e`. `slide-in-from-bottom-5` and `fade-in-0`
emit `--tw-translate-y` and `opacity` only — the Y axis has nothing to mirror, which is the reason
`slide-in-end`/`slide-in-start` exist in the config and are deliberately not used here.
**Framework note the skill's own advice got wrong:** this project is Tailwind **3.4**, not v4, so
`@custom-variant`, default-on container queries, and the v4 cascade-layer order do not apply; the only
`@container` in the repo is hand-written (`globals.css:963`). Everything else in the framework does.

**Stands — B5 (minor, but named for the Boss): `main` has no horizontal safe-area inset.** Its
`px-4 / md:px-6 / lg:px-8` ladder is all below the 44 px a notched phone reserves in landscape, so content
can sit under the cutout on that one device class at that one orientation. The fix is three arbitrary-value
padding utilities (`px-[max(1rem,env(…),env(…))]` and its `md:`/`lg:` twins) — verbose, and it buys
correctness on a device nobody has reported the problem on. The bars where a mis-tap costs something are
fixed. Left as an explicit choice, not an oversight.

**Stands — B6 (nit): `main > section { scroll-margin-top: 6rem; position: relative }` (`globals.css:167`)
stopped matching admin sections**, because the shell wraps children in a `div.mx-auto.max-w-6xl`. No admin
route has an in-page anchor, so nothing is visibly wrong today. Fixing it needs either a `section`-targeting
rule in the shared CSS or removing the wrapper — both reach outside this task's scope.

---

## 4. `design-debt-review`

**Fixed in this change:**

- **C1 (major) — the same button-look written four times.** `rounded-md … text-[13px] font-bold
  text-muted-foreground hover:bg-foreground/5` existed in `NavRow`'s inactive branch, both «مشاهده فروشگاه»
  links, and twice for the destructive logout. Now `ROW_BASE` / `ROW_ACTIVE` / `ROW_QUIET` /
  `ROW_DESTRUCTIVE` and `RAIL_SLOT*` are defined once and composed with `cn()` at each call site, with
  height and inset left at the call site because 44 px and 56 px are genuinely two different things. The
  phone rail's duplicated slot recipe and the marker span collapsed into `RAIL_SLOT` + `<Marker>` /
  `<RailLabel>` while I was there for the same reason.
- **C2 (minor) — dead API surface: `onActivate` on `NavRow` was declared and never passed.** Wired to the
  sheet, where it is now the mechanism that closes the panel and restores focus (finding A1) — so it is no
  longer vestigial, it is the fix.
- **C3 (nit) — the desktop brand block carried an `aria-label` that overrode its own visible text.**
  Removed; the link is now named from its content, like every other link in the frame.

**Verified clean:** zero raw hex/`rgb`/`rgba`/`style={{}}`; `shadow-deep` *is* a config token
(`boxShadow.deep`), not an invented shadow; `rounded-t-2xl` is 28 px, on the radius scale; `bg-champagne/25`
and `bg-foreground/10` are slash-alpha on `<alpha-value>` tokens, not arbitrary colours; `z-30/40/50`,
`max-w-prose`, `size-5`, `h-11`, `min-h-14/16` are Tailwind defaults; `cursor-default` on the backdrop is
intentional (it suppresses the text cursor over an overlay); the `h-px bg-line` dividers are *not* duplicates
of `.brand-hairline`, which is a decorative champagne gradient and the wrong tool on a work surface; the
`DESTINATIONS`/`RAIL_HREFS` split is the correct anti-duplication pattern and was left exactly as it is.

**Stands — C4 (major, and the review's own headline): an untokenised type scale, inherited and briefly
amplified.** `tailwind.config.ts` has no `fontSize` extension, and `text-[13px]` is already the house body
size — 40 occurrences repo-wide, ~30 of them pre-existing. The frame joined that debt rather than inventing
it, introduced `text-[10px]` on rail labels (since removed by A6), and *removed* one arbitrary size relative
to the header it replaced (the old `text-2xl` is back in place of a `text-[22px]` I had written). The right
fix is `fontSize.body`/`fontSize.micro` in the shared config plus a sweep of ~40 call sites, which is a
site-wide type decision with owners elsewhere. Deliberately not taken unilaterally: adding two tokens that
only my three files consume would create a second name for a value 30 other files spell out, which is a
worse drift than the one it cures. Recorded in [design-sheet.md](./design-sheet.md) §3.

**Stands — C5 (minor): the «حامی همراه» / «پنل مدیریت» wordmark block is written twice** (top bar and rail)
with different density — `size-8 text-[13px]` against `size-9 text-sm`, and the top bar's second line is
dynamic where the rail's is static. A `<BrandWordmark size="compact" | "rail">` would be honest about it, but
the two blocks are not actually the same component any more and extracting one with a variant prop to hold two
differences is the kind of abstraction that costs more than the duplication. Left, named.

**Stands — C6 (minor): `description` and `actions` on `AdminPageHeader` are passed by 0 of 10 call sites.**
`actions` was already unused before this change. `description` is new. Both are kept deliberately: the brief
requires the header to carry a basis line and at most one primary action, and the pages that will pass them
are other workers' files, so a signature that cannot accept them forces someone else to edit my component.
If 015-D lands without using `description`, it should go.

**Stands — C7 (blocker, and not this file's to fix): the frame and the pages inside it now speak two
dialects.** The frame is the *flat* chapter — solid `bg-ink-2`, `text-champagne`, no blur, no tracking,
`rounded-md`. The pages it contains are still the *glass* chapter. `aqua` and `champagne` are the same hex,
so colour is not the split; the split is surface opacity, letter-spacing, radius, and mono eyebrow labels.
Concrete disagreements, all outside my write list:

| File | Speaks |
|---|---|
| `components/admin/StatCard.tsx:16,24,26,31` | `bg-ink-2/60 rounded-2xl`, `font-mono text-[10px] tracking-[0.1em]`, `text-aqua` |
| `components/admin/EmptyState.tsx:12,13` | `bg-ink-2/30 rounded-2xl`, `text-aqua/60` |
| `components/admin/StatusBadge.tsx:51,55,66` | `text-aqua`, `bg-aqua`, and `bg-emerald-400` — a raw Tailwind palette colour with no project token (the project's green is `success #4EAA86`) |
| `components/admin/products/ProductsAdminClient.tsx:103,154,163` | `bg-ink-2/60`, `tracking-[0.1em]`, `text-aqua`, `text-[11px]`/`[12px]` |

Recommendation for the Boss: the pages migrate *into* the frame, not the reverse — solid `bg-ink-2`,
`text-champagne`, drop `tracking-[0.1em]` (which also breaks Persian glyph joining), and replace
`bg-emerald-400` with `success`. `StatusBadge`'s raw palette green is the one item in that list that is a
correctness bug rather than a style drift. `font-mono` on Persian is a third, and it is a lie: `DM Mono`
ships a Latin-only subset (`globals.css:61-74`), so ۰۰۱–۰۰۷ fall back to Estedad regardless.

---

## 5. What still needs a browser (hermes' pass, not mine)

1. **Horizontal overflow at 360 px and 1280 px on all eight routes** — reasoned from flex arithmetic, and
   masked repo-wide by `body { overflow-x: hidden }` (`globals.css:132`), which *hides* spill rather than
   proving absence. The reviewer's specific warning: under RTL the spill hangs **left**, the direction nobody
   thinks to look in, which is the exact false negative already recorded at `globals.css:968`.
2. **Two real overflow bugs the shell does not cause but cannot fix** — both in
   `components/admin/products/ProductsAdminClient.tsx`, another worker's file: the search form is a
   non-wrapping flex holding a `w-64` (256 px hard) input plus a `whitespace-nowrap` button ≈ 336 px against
   328 px available at 360 px, and the table wrapper is `overflow-hidden` where the four columns compute to
   ~380–420 px. At 360 px the edit column is clipped with no scroll. **This is the single most important
   handoff from this review** — it fails FR-009/SC-005 on `/admin/products` and the frame inherits the visual
   blame for it.
3. **Applied contrast** — every ratio in §2 is computed from the token literals. Nothing accounts for the
   `body` gradient or the scroll ground bleeding under a surface, and `specs/002-scroll-atmosphere/tools/`
   `surface-separation.mjs` is the established method for measuring the real thing.
4. **That the focus ring actually paints** on the rail, the sheet rows, and the skip link —
   `:where(a, button, …):focus-visible` is specificity-zero by design, so one `outline-none` anywhere in
   Tailwind's cascade could beat it silently.
5. **Whether `duration-fast` sets `transition-duration` on the nav rows.** The two reviewers who looked
   disagreed: `app/globals.css:391-412` records that `duration-*` sets *both* animation- and
   transition-duration here, which is what [design-sheet.md](./design-sheet.md) §8 now says; the
   accessibility reviewer reasoned that `tailwindcss-animate` re-registers the class as animation-only,
   which would leave the rows on Tailwind's 150 ms default — coincidentally the same value, so no visual
   defect either way. One computed-style read settles it. The sheet's own `duration-normal` is unaffected:
   the animation side definitely applies to it.

Also noted: `npm run lint` **does not exist** in this project (`Missing script: "lint"`), although
`plan.md`'s commands block lists it. Any agent that plans to lint before reporting done will find nothing
there; the real gate is typecheck + `test:unit` + `tests/unit/persian-typography.test.ts`.

---

## 6. Fixes applied, in one list

`AdminSidebar.tsx` — sheet closes through one path that restores focus (A1) · Tab pulls escaped focus back
into the panel and marks the content column `inert` (A2) · `aria-current` removed from the «همه» button,
current section named in the top bar (A3) · dialog named from its visible `<h2>` via `aria-labelledby` (A5) ·
rail labels and both brand subtitles to `text-xs` (A6) · rail cluster capped at `max-w-md` (B1) · sheet
`max-h-[75dvh]` with internal scroll (B2) · horizontal safe-area on both phone bars (B3) · `min-w-0` and
label truncation everywhere a flex row could grow (B4) · one shared row recipe (C1) · `onActivate` wired
instead of dead (C2) · `aria-label` that overrode visible text removed (C3).
`app/(admin)/layout.tsx` — skip link (A4) · `id="main"` now has two consumers: the skip target and the
`inert` boundary · bottom reserve 6 rem with the reasoning in the comment.
`AdminPageHeader.tsx` — `text-2xl lg:text-3xl` on the real scale instead of `text-[22px]` (C4) · `actions`
row allowed to wrap and shrink (B4).

**Gate:** `npm run typecheck` clean and `npm run test:unit` 341 passed / 25 files, both re-run after every
fix above.
