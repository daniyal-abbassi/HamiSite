# Validation: quickstart §1–§9

Run 2026-09-21 against the running dev server (`next dev`, one process, port 3000, first
`/_next/static/chunks/*.js` → 200). Every number below is read off the rendered page or the API the
page itself calls, not asserted from the source. Script: `/tmp/hami-verify/validate.js`.

## §1 — Unit-testable core

`npx vitest run tests/unit` → **12 files, 113 tests, 0 failures**. `npm run typecheck` clean.

**Not run: bare `npm test`.** `package.json` defines it as `dotenv -e .env.test -- vitest run`, and
`.env.test` does not exist in this repo — only `.env`. `DATABASE_URL` therefore falls through to the
development database, and `tests/setup.ts` registers a global `beforeEach` that calls `resetDb()`,
which `deleteMany()`s all 19 tables. That applies to the pure unit tests too, which never touch a
database. `hami_site_api` currently holds 0 rows in every table, so nothing was destroyed, but the
harness will empty whatever database it points at. Recorded as an open item in
[coherence.md](./coherence.md).

## §2 — Destination truth (the hard gate)

Six brand destinations. `ui` is the count the shop page renders; `apiTotal` and `wrongBrand` come from
`/api/products?brandId=…`, the same call the page makes — `wrongBrand` is the number of returned
products whose `brand.id` is not the requested one.

| Brand | Expected | UI | API total | Wrong brand |
|---|---|---|---|---|
| اپل | 49 | 49 | 49 | 0 |
| سامسونگ | 42 | 42 | 42 | 0 |
| شیائومی | 30 | 30 | 30 | 0 |
| نوکیا | 3 | 3 | 3 | 0 |
| ریلمی | 1 | 1 | 1 | 0 |
| تی-سی-اچ | 23 | 23 | 23 | 0 |

Every listing is filtered, not merely non-empty, and every product in it belongs to the brand named.

Six category destinations: `موبایل` 8 · `هدفون-ایرپاد-و-هندزفری` 19 · `آداپتور-کابل-و-شارژر` 9 ·
`پاور-بانک` 6 · `ساعت-و-مچ-بند-هوشمند` 7 · `خدمات-آنلاین` 1 — all matching, none showing the unknown
state.

**REALME is the one-result case and renders as a listing**, not a failure: toolbar `۱ محصول`, product
cards present, no `[role="status"]` panel.

**Negative case:** `/shop?brand=apple` renders
`«apple» در برندها یا دسته‌بندی‌های ما پیدا نشد. این پیوند ممکن است قدیمی باشد؛ …` with the toolbar
showing `—` instead of a number and zero product cards. The pre-fix behaviour — silently listing all
189 — is gone. **C12, C13, C14.**

## §3 — Rows, RTL and Persian at 360px

Six rows, all `allLinks: true`, all `allButtons: true`. Ordinals `۰۱ ۰۲ ۰۳ ۰۴ ۰۵ ۰۶`.
`letterSpacing` zero on every Persian label (Chrome reports `normal` for `0` — the quickstart's
original `=== "0"` assertion was corrected before this run). Ordinal at the reading start on all six.
No row overflows its container. Widths `[312]`, heights `[115]` — a single set each, so the list is
uniform. **C1, C3, C21, 001/FR-010.**

## §4 — Press semantics

Offsets are measured against the list's own top edge, which makes them scroll-invariant.
`n/h` per row, `*` marking the holder:

```
resting         1/115  116/115  231/115  346/115  461/115  576/115
press row 1     1/115* 116/115  231/115  346/115  461/115  576/115   holders 1
press row 4     1/115  116/115  231/115  346/115* 461/115  576/115   holders 1
same control    holders 0
press outside   holders 0
Escape          holders 0
back to rest    1/115  116/115  231/115  346/115  461/115  576/115
```

Nothing moved, nothing grew, and the resting geometry after all of it is byte-identical to before.
Navigate-away-and-return was verified separately: emphasis is released because the section remounts.
**C6, C7, C8, C9, C10, C11.**

## §5 — Equal finish

APPLE (has a story), NOKIA and REALME (none): label opacity 1, mark opacity 1, no `[disabled]`, no
pending string, story band 44px on all three. The only difference between them is the presence of a
story line. **C5, FR-004.**

## §6 — Motion budget and reduced motion

Running animations inside `.brand-rows`: **0** at rest in view, **0** settled after a transition,
**0** with the section scrolled off screen (and 0 emphasis holders, because the observer released it).
Mid-transition, every running animation belongs to the emphasised row and none to a sibling.

Reduced motion, measured in an emulated context: the six-row snapshot — ordinals, labels, mark markup,
hrefs, story text — is **identical** to the full-motion run; the story still becomes visible on
activation; the chevron's computed `transform` is `none`. **C15, C16, C17, FR-017 … FR-020.**

## §7 — Keyboard

Thirteen stops from the first row. The first twelve alternate `a` → `button` exactly, every one has a
visible `solid 2px` focus outline, and every accessible name is Persian with no ASCII letter. First
stop: `a`, `محصولات اپل`. Enter on a row link navigates (verified separately: third row →
`/shop?brand=شیائومی`).

**Limit, stated:** this is the role and name tree read out of the DOM, not a screen reader speaking it.
VoiceOver/NVDA phrasing is unverified. **C18, C19, C20, FR-013 … FR-016.**

## §8 — Coherence with feature 005

**Cannot be run.** Feature 005 is unbuilt — `components/home/CategoryHub.tsx` is still the static
mosaic, so there is no carousel to press. What was settled instead is the written reconciliation in
[coherence.md](./coherence.md): 004's five shared behaviours, each measured above, and the exact values
005 must match — including **C24, which binds 005 in return**.

## §9 — Responsiveness on a throttled phone

Measured on a **production build** (`next start`), because dev-mode style recalculation dominates the
numbers otherwise — an initial dev run showed 50ms median with transitions against 33ms without, which
is not this section's cost.

At 360px with 4× CPU throttling, six expansions at 130ms intervals, rAF frame gaps sampled:

| | median | p95 | worst |
|---|---|---|---|
| transitions on | 33.4ms | 100ms | 166.6ms |
| transitions off | 33.3ms | 83.3ms | 133.3ms |

Median cost is nil; a small tail difference remains, within the noise of ~90 sampled frames. Every
click registered and exactly one row held emphasis throughout. The dev server was restarted after the
build, per the stale-build warning. **A real mid-tier handset is still the honest final word here.**

## Passing definition

The quickstart asks for 1, 2, 4, 5, 6 and 7 to pass clean and 3, 8 and 9 to pass with no visual
regression. **1–7 pass clean as measured above. §8 is blocked on feature 005 existing. §9 passes on a
production build under emulation, not on a device.**
