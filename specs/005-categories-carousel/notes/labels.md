# T020 — Labels are live Persian text

**Run**: 2026-09-22, 360×740, Playwright.

| Label | Clipped by its panel | Overflowing its box | `letter-spacing` | Rendered size |
|---|---|---|---|---|
| گوشی موبایل | no | no | `normal` | 16.8px |
| هدفون و ایرپاد | no | no | `normal` | 16.8px |
| شارژر و کابل | no | no | `normal` | 16.8px |
| ساعت هوشمند | no | no | `normal` | 16.8px |
| پاوربانک | no | no | `normal` | 16.8px |
| لوازم کامپیوتر | no | no | `normal` | 16.8px |
| سیم‌کارت | no | no | `normal` | 16.8px |
| شارژر فندکی | no | no | `normal` | 16.8px |
| خدمات آنلاین | no | no | `normal` | 16.8px |

- **T1 / FR-022 / SC-006**: every label is a text node inside the `<Link>`. A `Range` selection over one
  returned its full string from `getSelection().toString()`, so the names are selectable and copyable —
  the reference drew labels into bitmaps at a fixed pixel size, which forfeits this and screen-reader
  access in one mechanism.
- **T5 / 001/FR-057**: `letter-spacing` computes to `normal`. Note that `getComputedStyle` returns the
  string `"normal"` for a zero value, not `"0"` — feature 004's quickstart asserted `"0"` and was wrong,
  so this check accepts `normal`.
- **T3 / FR-024**: no label is clipped by its panel and none overflows, at 360px. Checked at 200% browser
  zoom as well.
- **T4 / Constitution II**: `grep` for physical properties in `category-carousel.css` returns nothing —
  `margin-inline`, `padding-block` and `inset` only.

**Counts** render in Persian digits (`۱۹ محصول`, `۷ محصول`, `۳ محصول`, `۱ محصول`) and are absent for the
three departments whose route does not hold their whole kind — phones, chargers, power banks (FR-005, C3).
