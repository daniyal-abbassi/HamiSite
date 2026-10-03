# Data Model: Categories Masonry Gallery

**Feature**: 010 | **Date**: 2026-09-26 | **Plan**: [plan.md](./plan.md) · **Decisions**: [research.md](./research.md)

The department model is **not rebuilt**. `lib/category-departments.ts` already derives nine departments from the
export, resolves each route through the seam, and computes the honesty flags. This feature adds **two authored
fields** and one new pure module that carries the rhythm table and the arrival constants.

---

## Entity: Department (existing, extended)

Derived at request time by `categoryDepartments()` — never stored, never hand-counted.

| Field | Type | Source | Rule |
|---|---|---|---|
| `kind` | `DepartmentKind` (9 literals) | authored seed | The stable identity. **Also the key of the rhythm table** (D2). |
| `label` | `string` | authored seed | The name a shopper recognises, deliberately not always the stored category name. Live text, never pixels. |
| `slug` | `string` | authored seed, must match the export | Persian; resolved or the panel is skipped. |
| `categoryId` | `number` | resolved through `lib/catalog.ts` | Never authored. |
| `href` | `string` | `` `/categories/${encodeURIComponent(slug)}` `` | **The only navigation the tile may use** — same window, `<Link>` (FR-007). |
| `badge` | `string \| null` | authored seed | The monochrome line icon. **Unused by this layout** (see "What a tile may not show"). |
| `reachableCount` | `number` | `categorySubtreeCounts()` | What the destination actually holds. |
| `kindTotal` | `number` | `countProductsByKind()` | What the export holds for that kind. |
| `showsCount` | `boolean` | computed: `kindTotal > 0 && reachableCount === kindTotal` | FR-014. The only permission a number needs. |
| **`image`** | **`string`** | **NEW — authored seed** | Filename under `/images/categories/v3/`. Guarded: the path MUST exist on disk. |
| **`rhythm`** | **`NEW — Record<TierBreakpoint, Tier>`** | **authored in `lib/category-masonry.ts`, attached by `kind`** | The tier at each of the three breakpoints. See the table below. Not duplicated in the seed — two sources for one pattern is the drift FR-013 exists to prevent. |

### The nine departments as they resolve today (measured 2026-09-26)

| # | `kind` | label | route reaches | kind total | `showsCount` | panel on disk |
|---|---|---|---|---|---|---|
| 1 | `phone` | گوشی موبایل | 135 | 134 | **false** | `phone.png` |
| 2 | `audio` | هدفون و ایرپاد | 19 | 19 | true | `audio.png` |
| 3 | `charger` | شارژر و کابل | 12 | 10 | **false** | `charger.jpg` |
| 4 | `smartwatch` | ساعت هوشمند | 7 | 7 | true | `smartwatch.jpg` |
| 5 | `powerbank` | پاوربانک | 6 | 7 | **false** | `powerbank.jpg` |
| 6 | `computer_accessory` | لوازم کامپیوتر | 5 | 5 | true | `computer-accessory.jpg` |
| 7 | `sim_card` | سیم‌کارت | 3 | 3 | true | `sim-card.jpg` |
| 8 | `car_charger` | شارژر فندکی | 3 | 3 | true | `car-charger.jpg` |
| 9 | `service` | خدمات آنلاین | 1 | 1 | true | `service.jpg` |

**Six tiles show a number; three are silent by rule, not by omission.** Phones reach 135 because the route is a
subtree that carries one non-phone alongside 134 phones; chargers 12 against a kind total of 10; power banks 6
against 7. In each case *any* figure displayed would be wrong in one direction or the other, so the tile shows
none (Principle I, which has no exception path). This corrects 009's contract M4, which said five.

### Validation rules on the two new fields

1. **`image` must resolve on disk.** A hand-typed filename here has the same failure mode that made hand-written
   Latin slugs silently 404 in feature 004. `tests/unit/category-departments.test.ts` asserts
   `existsSync(join("public", department.image))` for every department.
2. **`rhythm` must be complete and square.** Every department declares all three breakpoints; across the nine
   departments each breakpoint has exactly three of each tier; and each department holds each tier exactly once.
   Asserted, not trusted (D2).
3. **Neither field may be derived from render-time position.** A panel is skipped when its slug stops resolving or
   its category empties (`lib/category-departments.ts:144-160`); an index-derived tier would rewrite the whole
   composition when one department left.

---

## Entity: Rhythm table (NEW, authored, in `lib/category-masonry.ts`)

The single artefact FR-013 demands: the pattern, written down, so the next change edits a stated table.

**Tiers** `S | M | L`. **Breakpoints** `base` (<768) · `md` (≥768) · `xl` (≥1280).

| `kind` | base | md | xl |
|---|---|---|---|
| `phone` | M | S | L |
| `audio` | M | S | L |
| `charger` | L | M | S |
| `smartwatch` | S | M | L |
| `powerbank` | L | M | S |
| `computer_accessory` | L | S | M |
| `sim_card` | S | L | M |
| `car_charger` | S | L | M |
| `service` | M | L | S |

Chosen by searching the Latin-square assignments against a simulation of the browser's auto-placement, so the
columns pack evenly at every width (D2's balance finding). It is a literal table, not a formula — a formula that
happens to look elegant was what failed the first build.

**Row → pixel spans** (from `H(n) = 8n + gap × (n − 1)`, see research D2):

| Breakpoint | columns | gap | `S` | `M` | `L` |
|---|---|---|---|---|---|
| base | 2 | 12 px | `span 8` → 148 px | `span 11` → 208 px | `span 14` → 268 px |
| md | 3 | 16 px | `span 10` → 224 px | `span 14` → 320 px | `span 17` → 392 px |
| xl | 4 | 20 px | `span 11` → 288 px | `span 15` → 400 px | `span 19` → 512 px |

**What this table forbids**, since a later editor will test it: no department appears with the same tier at two
breakpoints; no breakpoint has an uneven tier distribution; `service` (one product) is never permanently the
largest tile, which is the accident that ended 009's variant B; and the columns must still pack within 1.25:1 at
every width, which is the constraint that invalidated the table this one replaced.

---

## Entity: Arrival (NEW, constants in `lib/category-masonry.ts`)

Decorative and skippable. Every value here exists to make a bound assertable rather than felt.

| Constant | Value | Governs |
|---|---|---|
| `RISE_DURATION` | `0.44` s | opacity + `y: 18px → 0` on the tile |
| `RESOLVE_DURATION` | `0.32` s | `blur(6px) → 0` on the image layer only |
| `STAGGER` | `0.12` s | delay between consecutive tiles, shared by both |
| `EASE` | `power3.out` | both |
| `MAX_CONCURRENT_BLUR` | `ceil(RESOLVE_DURATION / STAGGER)` = **3** | **derived, asserted** (D4) |
| `TRIGGER_THRESHOLD` | `0.12` | observer |
| `TRIGGER_ROOT_MARGIN` | `"0px 0px -12% 0px"` | observer |

**State machine** — three states, one direction, no path back:

```
idle ──(section enters view)──▶ playing ──(tween complete, clearProps)──▶ settled
  └──────────────(prefers-reduced-motion | already played this visit | no IntersectionObserver)──────▶ settled
```

- `idle` is invisible from the outside: the DOM in `idle` **is** the finished composition (D1, FR-008).
- `settled` is reached by three independent paths, and `playing` is the only one that animates.
- `hasPlayed` is module-scoped, so a remount cannot replay (FR-009) — the same reason
  `CategoryCarousel.tsx:47` keeps `rememberedIndex` outside the component.
- There is no `replay` transition. A shopper who scrolls away and back is in `settled`.

---

## Entity: Tile (presentation contract, no new type)

The markup one department produces, and the whole of the DOM contract:

```html
<li class="cat-masonry__item" data-tier="L">
  <a href="/categories/<slug>" class="cat-card" aria-describedby="cat-card-n">
    <span class="cat-card__art">
      <img src="/images/categories/v3/<file>" alt="" sizes="…" loading="lazy" decoding="async">
    </span>
    <span class="cat-card__label">گوشی موبایل</span>
    <span class="cat-card__count" id="cat-card-n">۱۹ محصول</span>   <!-- only when showsCount -->
  </a>
</li>
```

- One `<a>` per department, the entire tile is the tap target, **no nested interactive elements**.
- The picture is `alt=""` because the name is adjacent live text (009 D5, carried unchanged).
- `aria-describedby` pulls the count into the link's announcement instead of leaving it floating in the list.
- The `<ul>` keeps `role="list"` semantics after Tailwind's preflight reset (`list-style` restored explicitly).
- The section announces as **a list of nine departments**. `aria-roledescription="carousel"` and `"slide"` are
  deleted with the component that carried them — a grid is not a carousel, and announcing it as one is a lie to a
  screen reader.

## What a tile may not show

- No count where `showsCount` is false (FR-014).
- No "coming soon", `pending`, disabled or dimmed state (FR-015).
- No letter-spacing, no `text-transform`, no uppercase on the label (FR-006).
- No `badge` line-icon — the layout has no room for a third element on a 148 px tile, and the panel plus name is
  already the identity (FR-013a). The field stays in the model; this surface simply does not read it.
- No stand-in picture when `image` is missing: the tile renders its ground and its name, and the absence is
  visible as absence (FR-018, Principle I).
- No physical `left`/`right` anywhere in the block — `inset-inline-*`, `padding-inline-*`, `margin-inline-*` only
  (Principle II).
