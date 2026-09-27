# Baseline geometry and accessibility — captured 2026-09-27 02:14 +0330

Tool: `node specs/012-liquid-dock-navigation/verification/measure-dock.mjs` against
`http://localhost:3000/` on a 360×740 viewport, device scale 2.

## The dock — T001 (FR-018 / SC-006)

**Honesty note on ordering.** T001 asked for this *before* anything changed. US1 (T011) was already
dispatched and had landed by the time this file was written, so the numbers below are measured **after** the
cart entry was removed. The pre-feature value is nevertheless established, by two independent routes rather
than by assumption:

1. **By inspection.** `git diff components/layout/MobileDock.tsx` deletes no class from the `<nav>` container
   and none from the item's `cn(...)`. It removes an import, a type field, a hook call, one array entry, and a
   JSX expression that rendered nothing at rest when the badge was zero. Height and inset cannot move.
2. **Against feature 008's own recorded constant.** `specs/008-brands-stacking-cards/research.md:64` reserves
   **88 px (5.5rem)** as "mobile dock clearance (<768px, from feature 007)".

| measurement | value |
|---|---|
| outer height | **62.00 px** |
| bottom inset (`bottom-3`) | **12.00 px** |
| height + inset | **74 px** |
| 008's reserved clearance | 88 px |
| margin still in the deck's budget | **14 px** |

**Conclusion: FR-018 and SC-006 hold.** The deck's fit budget is not invalidated. Any future change that
pushes height + inset past 88 px must re-run `specs/008-brands-stacking-cards/verification/measure-deck.mjs`.

Also captured: `border-radius` is a full pill, background `bg-ink-2`, container `inset-x-3`,
`z-index: 40`.

## The five slots — T014 (SC-002)

At 360 px the bar's five destinations each measure **66.8 px** wide.

| label | text width | spare to slot edge | overflow | verdict |
|---|---|---|---|---|
| خانه | 21.75 px | 45.05 px | 0.25 px | clear |
| فروشگاه | 42.77 px | **24.05 px** | 0.23 px | clear — the widest |
| همکاری | 39.58 px | 27.22 px | 0.42 px | clear |
| تماس | 29.72 px | 37.08 px | 0.28 px | clear |
| حساب | 33.64 px | 33.16 px | 0.36 px | clear |

The sub-pixel `overflow` column is the label element's own `scrollWidth` against its content box, not a
clipped glyph — every row has ≥ 24 px of clearance to its slot edge, so nothing is close to clipping. Five
slots is **wider per slot** than six, which is the direction that helps; the check exists because this repo
has silently clipped a control twice (the header search field, and the desktop call button at 768 px).

**FR-001 verified**: 5 links, none with `href="/cart"`, and `hasStrayBadgeSpan` false on all five — no badge
element survives inside any item.

## Accessibility baseline — T002

Captured from the same render, and to be diffed against at SC-010.

| surface | what it publishes today |
|---|---|
| dock | `aria-current="page"` on the matching link only; `aria-label="ناوبری سریع فروشگاه"` on the `nav`; every icon `aria-hidden="true"`; the `tel:` link carries no `aria-current` |
| header pills (`PillNav`) | `aria-current="page"`, two sites — `PillNav.tsx:300` and `:313` |
| featured tabs (`FeaturedProducts`) | `role="tablist"` + `role="tab"` + `aria-selected`, roving `tabIndex` (0 on the selected tab, −1 elsewhere), `id="featured-tab-<key>"`, `role="tabpanel"` at `:165` |
| category tiles (`CategoryTiles`) | `aria-current={active \|\| undefined}` at `:29` |
| pagination (`ShopResults`) | `aria-current="page"` on the current number at `:242` |
| image views (`ProductGallery`) | `aria-pressed={index === current}` at `:90`, `aria-label="نمای N از M"` with Persian digits, group labelled «نمای دیگر این محصول» |
| variant chips (`ProductDetail`) | selection by `selectedVariantId`, defaulting to `isDefault` then the first variant; option groups keyed by the label the export actually uses |

Current-page link destinations observed on the home page: `/`, `/shop`, `/partners`,
`tel:+989331214000`, `/orders`. The account target is `/orders` when signed in and `/login` for a guest, and
`/orders` here means auth had resolved — **the auth race in T023 is real and observable**: on first paint
`status` is `"loading"` and the bar renders the signed-in target.

## Not yet captured

The other six surfaces' geometry (widths, wrap rows, item heights) is recorded when each is wired, in its own
verify task — T001's intent is a comparable before, and a before for a surface nobody is about to touch can be
taken at the moment it is touched.

## Correction, 02:55 — the bar has no horizontal padding, deliberately

The section above says the row is 334 px and the slots 66.8 px, which was measured and is right, but the
reason was assumed and was wrong. `app/globals.css:912` overrides the dock's `px-2`:

```css
nav[aria-label="ناوبری سریع فروشگاه"] {
  /* Raw env, not max(): this bar has no horizontal padding by design, and in
     portrait the insets are 0, so this must add nothing there. */
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

Confirmed by enumerating every stylesheet rule that matches the rendered nav and sets padding: `.px-2 →
0.5rem` and this one, and the later, more specific selector wins. In portrait the env values are 0, so
`padding-left` computes to **0px**.

**Consequences.** `px-2` on `MobileDock.tsx` is dead and always has been — do not "restore" it, it is
overridden on purpose for notched phones in landscape. The real row is 334 px, five slots of **66.8 px**, and
the longest trip the bar can ever ask for is **267 px**, not the 256 px that both this file's first draft and
the port's `MAX_TRAVEL_PX` comment claimed. The 320 px ceiling still clears it with 53 px to spare, so the
decision stands; only the arithmetic written down to justify it was wrong.
