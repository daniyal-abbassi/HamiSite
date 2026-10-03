# Design Sheet — Task 015-C: the back-office frame

**Date**: 2026-10-01 · **Worker**: `qoder` · **Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)
**Skill run**: `ui-ux-pro-max` (design-system pass + `ux`/`product` domain searches), then implementation.

This sheet is the decision record for the shell only: `app/(admin)/layout.tsx`, `AdminSidebar`,
`AdminPageHeader`. It does not decide the dashboard home screen (015-D) or the shared primitives (015-B).

---

## 1. What the skill recommended, and what was kept

The `--design-system` pass on *"admin back-office dashboard tool content-dense minimal dark luxury
professional"* returned:

| Field | Recommendation | Kept? | Why |
|---|---|---|---|
| Product type | Analytics / Financial dashboard → **Dark Mode (OLED) + Minimalism**, secondary **Flat Design** | ✅ | Flat + minimal is precisely the "work surface, calmer than the shop" the brief asks for. |
| Nav pattern | `adaptive-navigation` — ≥1024 px uses a sidebar, smaller uses bottom/top nav; `bottom-nav-limit` ≤ 5; `nav-label-icon`; `nav-state-active`; `destructive-nav-separation` | ✅ | Drives the whole two-breakpoint design (§4). |
| Palette | Navy `#1E3A5F` + paid-green `#059669` on `#F8FAFC` | ❌ **rejected** | Light canvas and a navy/green scheme is not Hami. Assumption 5 of the spec pins obsidian `#0B0204` + champagne `#E5D3B3`. FR-007 also forbids shipping a new palette — the site's existing tokens are the only vocabulary. |
| Typography | Fira Code + Fira Sans, Google Fonts | ❌ **rejected** | Constitution II: the site is Estedad/Vazirmatn + DM Mono, self-hosted, offline-safe. A Google Fonts `@import` would also break the local-first rule in `app/globals.css`. |
| Key effects | "Minimal glow (`text-shadow: 0 0 10px`)" | ❌ **rejected** | The brief forbids glow on this surface, and `body` in `globals.css` already records that glow-as-depth was removed (T073 / FR-052). |
| Avoid | "Light mode default", "Slow rendering" | ✅ | Consistent with the dark work surface. |

**Net effect of the run**: the skill's *structural* rules were adopted wholesale (adaptive nav, 44 px
targets, safe-area clearance, `min-h-dvh`, transform/opacity motion, active-state redundancy); its
*aesthetic* suggestions were discarded because they are generic-dashboard defaults that Constitution IV
and the brand both forbid.

---

## 2. Layout grid

Mobile-first: the base rule is the 360 px phone and each breakpoint only adds.

### 360 px

```
┌─────────────────────────────┐  h-14, sticky, solid, z-30
│حامی همراه · پنل مدیریت   خروج│
├─────────────────────────────┤
│                             │
│   main  px-4 (16 px gutter) │  scrolls under both bars
│                             │
│                             │
├─────────────────────────────┤  min-h-16 (64px) + safe area, fixed, z-40
│ ⌂  ▤  ▦  ◍  ▦ همه           │
└─────────────────────────────┘
```

- Horizontal gutter `px-4` (16 px) at 360 → `md:px-6` → `lg:px-8`. `px-5/md:px-8` (the old values) put
  2.5 × 16 = 40 px of the 360 px viewport in margins before any card padding; 16 px is the Material
  phone inset and gives a row back to content.
- `pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-10` on `main` — the fixed rule in the skill
  checklist (`fixed-element-offset`, `safe-area-awareness`): content must clear the rail and the gesture
  bar, not slide under them. `6rem` = 96 px, which is the 64 px rail plus a 32 px breath so the last row is
  not flush against the chrome. Matches the `calc(… + env(safe-area-inset-bottom))` convention already used
  by `Footer.tsx:54` and `ProductDetail.tsx:226`.
- Content column: `mx-auto w-full max-w-6xl`. The desktop rail is `shrink-0` in flex flow, not
  `position: fixed`, so the column never needs a hand-tuned `ps-` offset to dodge it.

### 1280 px

```
┌──────────┬────────────────────────────────┐
│ rail     │  main  px-8                    │
│ w-64     │  ┌ mx-auto max-w-6xl ────────┐ │
│ sticky   │  │  header + page content    │ │
│ top-0    │  └───────────────────────────┘ │
│ h-dvh    │                                │
└──────────┴────────────────────────────────┘
```

- Break at `lg` (1024 px), the skill's `adaptive-navigation` threshold, and it is a hard swap — the rail
  is `hidden lg:flex`, the phone bars are `lg:hidden`. Nothing renders in both.
- Rail width `w-64` (256 px) instead of the old `w-60`: 13 px Persian labels with an 18 px icon and a
  start-edge marker need the extra 4 px to keep «دسته‌بندی‌ها» off a truncate.
- The rail is `sticky top-0 h-dvh overflow-y-auto`, so a short viewport scrolls its own nav rather than
  clipping the logout row off the bottom (the exact failure the phone strip had).

---

## 3. Type scale and spacing rhythm

| Role | 360 px | 1280 px | Treatment |
|---|---|---|---|
| Page title (`h1`) | `text-2xl` (24 px) | `text-3xl` (30 px) | `font-black`, no `tracking-tight` (see §7) — unchanged from the header it replaces |
| Context line | `text-xs` | `text-[13px]` | `text-muted-foreground`, one line, wraps rather than truncates |
| Eyebrow (index + section) | `text-xs` | same | `tabular-nums text-muted-foreground`, hairline rule between index and label |
| Desktop nav item | — | `text-[13px]` | `font-bold` idle → `font-black` active |
| Rail label | `text-xs` | hidden | shortened label (`short`), one word |
| Body / controls | `text-[13px]`–`text-sm` | same | unchanged from the primitives |

- **Spacing rhythm** is the 4/8 scale only: `4 · 8 · 12 · 16 · 24 · 32 · 40`. The header closes at
  `mb-6 lg:mb-8`; nav rows at `gap-1`; rail sections at `p-4`.
- **Vertical rhythm of the shell**: top bar 56 px, rail 64 px, desktop rail 256 px. Those three numbers
  are the whole frame; nothing else in the shell is a magic size.
- **Font sizes are the one axis the project has never tokenised.** `tailwind.config.ts` has no `fontSize`
  extension, and `text-[13px]` is already the house body size — ~40 occurrences repo-wide, most of them
  pre-existing, across `components/admin` and `components/shop`. The frame joins that size rather than
  inventing a rival one. It ships **no Persian below 12 px at any width**: the `@media (max-width: 767px)`
  rule in `globals.css:945` silently promotes `text-[10px]` to 12 px, but the phone chrome is live to
  1023 px, so a 10 px label would render at a genuine 10 px on a tablet — the "two definitions of mobile"
  trap `globals.css:872` warns about. Every micro-label here is `text-xs` on purpose. The page title stays
  on the real scale (`text-2xl` → `text-3xl`, which is what the header it replaces already used).
  Defining `fontSize.body`/`fontSize.micro` in the shared config is the right fix for `text-[13px]`, but
  that is a site-wide type decision with ~40 existing call sites, not one for three files; recorded as
  finding C4 in [design-review.md](./design-review.md) rather than made silently.

## 4. The nav model (one list, two placements)

`DESTINATIONS` in `AdminSidebar.tsx` is the single array of the seven admin sections — `href`, `label`,
`short`, `icon`. The desktop rail maps all seven; the phone maps `RAIL_HREFS` (four) into the bottom rail
and the same array into the sheet. **No path or label is written twice**, which is the brief's "one nav
model" requirement (FR-008's cousin).

**Phone: bottom rail (4 + «همه») + sheet.** The old control was a horizontally scrolling tab strip that
pushed logout off-screen. Replaced with:

- A sticky **top bar**: brand monogram + wordmark at the start, with the **current section's name** as its
  second line (so the bar answers "where am I" even when the section lives behind «همه»), and «خروج» at the
  end. Logout is now always on screen and always exactly one tap — the bug the brief names.
- A fixed **bottom rail** of five slots, thumb-height, in the thumb zone: داشبورد · سفارش‌ها · محصولات ·
  کاربران · «همه». `RAIL_HREFS` is chosen as the four a shop manager actually visits daily; the other
  three (دسته‌بندی‌ها، برندها، کوپن‌ها) are configuration, visited occasionally.
- **«همه» opens a bottom sheet** listing all seven with icons and full labels, the current one marked,
  then a hairline and «مشاهده فروشگاه».

**Deviation from the brief, written down as required.** The brief asked the rail to "reach every
destination in one tap"; the skill's `bottom-nav-limit` rule caps a bottom navigation at five items, and
seven 20 px icons plus one-word labels do not fit 360 px without either truncation or horizontal scroll —
which is the bug being fixed. So: **four destinations in one tap, three in two** (tap «همه», tap the
section), and the sheet is itself one tap from any page at any scroll depth. The rejected alternatives:

1. *Seven slots in the rail* — 49 px each, below the 44 px control floor once padding is accounted, and
   «دسته‌بندی» truncates. Rejected on `touch-target-size` + `nav-label-icon`.
2. *Keep the scrolling strip but pin logout* — preserves a horizontally scrolling nav, which fails
   `horizontal-scroll` and hides four of seven destinations off-edge. Rejected.
3. *A rotating "most recent section" in the fifth slot* — nav placement would change per page, which
   fails `navigation-consistency` and would train the operator to re-learn the bar. Rejected.
4. *Hamburger + full sheet for everything* — costs an extra tap on the four daily sections to save one on
   three rare ones, and `drawer-usage` puts the drawer on secondary navigation, not primary. Rejected.

**Desktop: quiet rail**, brand block at the top, the seven sections, then a hairline and «مشاهده
فروشگاه» + «خروج» pinned to the bottom of the column. `destructive-nav-separation`: خروج sits below the
hairline, alone, in `destructive`, spatially removed from every destination at both breakpoints.

**Active item — never colour alone** (`nav-state-active`, `color-not-only`). Four redundant channels:
`aria-current="page"` (assistive), `font-black` vs `font-bold` (weight), a 2 px champagne marker on the
logical **start** edge of the row / above the rail icon, and a filled surface `bg-foreground/10`
(`bg-foreground/5` on hover).
A grayscale screenshot still shows which section you are in.

**The `ADMIN` chip is gone.** It was Latin, uppercase, and carried `tracking-[0.1em]` — three
Constitution II violations in nine words of markup, and named as such in `plan.md`. It is replaced by the
Persian wordmark «حامی همراه» with a quiet «پنل مدیریت» beside it, and no letter-spacing anywhere.

**«همه» is marked, but not `aria-current`.** When the current section is one of the three behind the sheet,
«همه» carries the weight + marker treatment so the rail is never blank — but `aria-current="page"` is not
put on it, because the operator is not *on* the «همه» page and a dialog trigger is not a location. The
screen-reader answer to "where am I" is the page's own `h1` in `AdminPageHeader`, plus the section name in
the phone top bar.

**One row recipe, not four.** `ROW_BASE`/`ROW_ACTIVE`/`ROW_QUIET`/`ROW_DESTRUCTIVE` and
`RAIL_SLOT*` are defined once at the top of the file and composed at each call site with `cn()`, so the
desktop rail, the sheet rows, the two «مشاهده فروشگاه» links and the two خروج buttons are literally the same
button-look. Height and inset stay at the call site (44 px on the rail, 56 px under a thumb) because those
are two different things, not a drift.

## 5. Colour roles (all existing tokens; nothing added)

The skill's palette was discarded, so the whole frame is built from what `tailwind.config.ts` already
exposes. **`app/globals.css` and `tailwind.config.ts` are not edited by this task** — no new token was
needed, which is the cheapest way to satisfy FR-007 and it leaves the two shared files alone for the
agent who holds them next.

| Role | Token | Used for |
|---|---|---|
| Ground | `bg-background` (obsidian `#0B0204`) | page, top bar of the sheet backdrop |
| Work surface | `bg-ink-2` (`#14060A`) | rail, phone bars, sheet — **solid**, no alpha |
| Raised row | `bg-foreground/10` | active nav row; `bg-foreground/5` on hover |
| Rule | `border-line` (champagne @ 12 %) | rail edge, sheet top edge, header hairline |
| Primary text | `text-foreground` | current section, titles |
| Secondary text | `text-muted-foreground` (full opacity) | idle nav, context lines |
| Brand accent | `text-champagne` / `bg-champagne` | marker bar, brand dot, sheet handle |
| Destructive | `text-destructive` + `hover:bg-destructive/10` | خروج only |

Contrast against `bg-ink-2` (`#14060A`, L ≈ 0.012): `foreground` `#F0ECE9` ≈ 17:1 · `muted-foreground`
`#A99E9C` ≈ 6.6:1 · `champagne` `#E5D3B3` ≈ 12:1 · `destructive` `#E4573F` ≈ 5.3:1. All clear 4.5:1 for
body text and 3:1 for the marker's edge (FR-011). The old `text-muted-foreground/85` and `/80` washes were
dropped: at 85 % that pairing sits near 4.8:1 which is a pass with no margin, and this is a work surface
read in daylight.

**Flat by construction.** No `backdrop-blur-*`, no gradient fill, no `glass`, no `.lux-card`, no
`animate-bob`, and no glow shadow (`shadow-glow-*`) anywhere in the shell. The storefront keeps those; a
surface you operate all day is not a surface you admire.

One exception, declared: the sheet carries `shadow-deep` — the project's existing modal shadow, the same
token `components/ui/dialog.tsx` uses. A bottom sheet is the one element in the frame that overlaps other
content rather than sitting in the flow, and without a falloff it separates only by a 1 px hairline, which
on an obsidian ground reads as a seam in the page rather than a panel above it. Every *in-flow* surface —
rail, top bar, thumb rail — is a flat solid fill with no shadow at all.

## 6. Active state, focus, and keyboard

- **Focus**: the shell defines *no* focus styling of its own. `app/globals.css:155` already paints a 2 px
  champagne `:focus-visible` outline with a 3 px offset on every `a`/`button`/`input`, and re-declaring it
  per component is how a shell ends up with three different rings. Verified present, not assumed.
- **Order**: DOM order is the visual order in both directions — top bar → content → rail → sheet
  (rendered last, so a keyboard user reaches it after the page, as a modal should). Under RTL, tab order
  runs right-to-left through the rail because the rail is a plain flex row.
- **Sheet lifecycle**: opens on «همه», closes on Escape, on backdrop click, on choosing a destination, and
  on resize past `lg` (a desktop operator must not inherit a modal). Focus moves to the panel on open and
  returns to «همه» on close. Tab is trapped inside the panel while it is open. `aria-modal="true"` +
  `aria-label`; the panel itself is not focusable, it forwards focus to its first control.
- **Scroll lock** while open, on `documentElement` (which is what carries `overflow-x: hidden` in
  `globals.css:141`, so the phone does not jump sideways when the sheet appears).
- Target sizes at the phone: top-bar controls `min-h-11` (44 px) explicit; rail slots `min-h-16` (64 px)
  across a `flex-1` width of ~72 px at 360 px; sheet rows `min-h-14` (56 px). The
  `@media (pointer: coarse)` block in `globals.css:1136` also enlarges hit areas for `size-8/9/10`
  controls, which covers the icon-only close affordance.

## 7. Deliberate rejections

| Rejected | Where it was tempting | Why |
|---|---|---|
| Glass / `backdrop-blur` | The old rail and top strip both used it | A blurred fixed bar over a long scrolling list is the one place glass costs real frames, and the brief says no glass on the work surface. |
| Glow shadows (`shadow-glow-*`) | Brand accent on the active item | FR-052/T073 removed glow-as-depth site-wide. Weight + marker + fill carry active state with no light. |
| Gradient cards | Section surfaces | Constitution IV: gradient cards are the component-library-demo look this feature is specifically accused of drifting toward. |
| Decorative metrics in the frame | A "logged in as" chip, a clock, a badge count on سفارش‌ها | FR-006: every visible control does something or is removed. A count badge on nav is information the operator cannot act on from the rail, and 015-D owns real numbers. |
| `tracking-tight` on the `h1` | Inherited from the old header | `specs/001-premium-rtl-storefront/audits/04-language-typography.md` flags it: negative letter-spacing on Persian breaks the joining cursive. Removed here. |
| `font-mono` on the index digits | The old header set them in mono | `DM Mono` ships a Latin-only subset (`globals.css:61-74`); «۰۰۱» is U+0660-0669 and silently falls back to Estedx anyway, so the class was a lie. `font-sans tabular-nums` states the real intent. |
| A second nav array for the sheet | Would have been ~5 fewer lines | The brief's "must not be duplicated in two places" — and a drift between the two is exactly the bug nobody notices until an operator cannot reach a section. |
| Radix / shadcn Dialog | `components/ui/dialog.tsx` exists | It is a centred glass modal — wrong geometry for a thumb sheet, and it would drag glass back into the frame. ~60 lines of local sheet, same conventions, zero dependency. |

## 8. Motion rules

- **Colour only** on nav rows and buttons: `transition-colors duration-fast` (150 ms). Nothing moves.
  Note on what `duration-fast` actually emits: `tailwindcss-animate` registers `duration-*` alongside core
  Tailwind's, so the class sets `animation-duration` **as well as** `transition-duration` — the project
  already documents that doubling at `app/globals.css:391-412`, where it cost `.shiny-edge` a runaway loop.
  Here it is harmless: a nav row has no animation to time, and the sheet's own `duration-normal` needs the
  animation side. Both values come from the project's `transitionDuration` scale, so the frame is on the
  real token ladder either way.
- **The sheet** enters once: `animate-in slide-in-from-bottom-5 fade-in-0 duration-normal` (220 ms, the
  project's `DEFAULT` curve) — `duration-normal` not `duration-200`/`duration-150`, so the shell stays on
  the project's own duration scale rather than the plugin's arbitrary-value ladder. transform + opacity
  only, per `transform-performance`. It is a bottom-anchored panel, so no enter offset is needed in RTL —
  there is no direction to mirror (that is why `slide-in-end`/`slide-in-start` exist in
  `tailwind.config.ts` and are *not* used here).
- **No exit animation.** The sheet unmounts on close. `exit-faster-than-enter` allows ~150 ms and the
  tailwindcss-animate v1 ladder has no sub-fast exit value, so an honest snap beats a fake fade. Noted as
  a known small loss in [design-review.md](./design-review.md).
- **No page-level motion in the frame at all** — no `fade-up` on the shell, no stagger. An operator opens
  `/admin/orders` forty times a day; an entrance animation is a tax they pay forty times.
- **`prefers-reduced-motion`**: covered by the project-wide floor at `app/globals.css:416`, which forces
  `animation-duration`/`transition-duration` to `0.01ms !important` on `*`. Because the shell's only motion
  is a colour transition and one `animate-in`, that floor makes the frame genuinely still rather than
  merely slower (FR-013, US-2 AC-4) — and it needed no new CSS. Verified by reading the rule, not assumed.
- The backdrop is `bg-ink/85`, inside the 40–60 %-of-*white*-equivalent band the skill asks of a scrim on
  a dark ground — the panel must separate, not tint.

## 9. RTL correctness

Every edge is logical: `border-e`, `ps-`/`pe-`, `ms-`/`me-`, `start-`/`end-`, `text-start`. The active
marker is `absolute start-0`, which puts it on the physical **right** under RTL — the edge nearest the
reader's eye-start, which is where a marker belongs in a right-to-left list. The sheet is
`inset-x-0 bottom-0`, so it has no side to get wrong.

## 10. Added after the self-review

The four `design-review` passes in [design-review.md](./design-review.md) found nine things that were fixable
here, and they are now in the build. They are listed in full there; what they changed about the *design*, as
opposed to the code, is four items:

- A **skip link** («پرش به محتوای اصلی») is the first tab stop of every admin page, before ten nav rows.
- The content column is marked **`inert` while the sheet is open**, so a modal's background is unreachable by
  keyboard as well as by pointer — which is the second reason `#main` exists.
- The thumb rail's cluster is **capped at `max-w-md`** and both phone bars take the **horizontal safe area**,
  so a tablet does not get five 167 px slots and a notched phone in landscape does not lose two labels to the
  cutout. Neither touches 360 px.
- The sheet has a **`max-h-[75dvh]` with internal scroll**. Its content fits a 390 px-tall landscape phone
  with 53 px spare today; that ceiling is what stops one more destination from becoming unreachable content.

## 11. Open items handed to the Boss

Recorded in full in [design-review.md](./design-review.md). Short version: the products list
(`components/admin/products/ProductsAdminClient.tsx`) **overflows 360 px on its own** — a `w-64` search input
in a non-wrapping flex, and a table wrapped in `overflow-hidden` where the columns need ~400 px, so the edit
column is clipped with no scroll and `body { overflow-x: hidden }` hides the spill to the left, where nobody
looks under RTL. That is the highest-priority handoff from this review and it is not in these three files.
Beyond it: `StatCard`, `EmptyState`, `StatusBadge` and the products client still speak the storefront's glass
dialect (`bg-ink-2/60`, `text-aqua`, `font-mono` + `tracking-[0.1em]` on Persian) inside a frame that no
longer does, `StatusBadge.tsx:55` paints `bg-emerald-400` from the raw Tailwind palette where the project has
a `success` token, `npm run lint` does not exist despite `plan.md` listing it, and the detail routes
(`orders/[id]`, `products/[id]`) will want a back affordance this frame does not supply.
