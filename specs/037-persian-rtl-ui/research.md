# Research: Persian RTL UI Standards & Technical Implementation

**Feature**: [spec.md](spec.md) | **Branch**: `037-persian-rtl-ui`

---

## 1. Tailwind CSS Logical Properties & Modern RTL Layout

### Background
Traditional CSS and legacy Tailwind code relied on physical directions (`left`, `right`, `margin-left`, `padding-right`, `text-align: left`). When `dir="rtl"` is applied to the document:
- Physical properties remain fixed to the physical viewport (e.g. `ml-4` still pushes the element away from the physical left edge, which is the *end* edge in RTL, completely reversing the intended layout relationship).
- Developers historically attempted to compensate using `flex-row-reverse` or `rtl:ml-0 rtl:mr-4`, leading to unmaintainable class soup and subtle hydration/rendering glitches.

### Modern Solution: CSS Logical Properties
Tailwind CSS 3+ provides native support for CSS Logical Properties. The browser resolves logical directions based on the `dir` attribute on the root document (`<html lang="fa" dir="rtl">`):

| Physical Class | Logical Class | Computed CSS in RTL |
|----------------|---------------|----------------------|
| `ml-4` | `ms-4` | `margin-inline-start: 1rem` (right margin) |
| `mr-4` | `me-4` | `margin-inline-end: 1rem` (left margin) |
| `pl-4` | `ps-4` | `padding-inline-start: 1rem` (right padding) |
| `pr-4` | `pe-4` | `padding-inline-end: 1rem` (left padding) |
| `left-0` | `start-0` | `inset-inline-start: 0` (right: 0) |
| `right-0` | `end-0` | `inset-inline-end: 0` (left: 0) |
| `text-left` | `text-start` | `text-align: start` (right-aligned in RTL) |
| `text-right` | `text-end` | `text-align: end` (left-aligned in RTL) |
| `rounded-l-lg` | `rounded-s-lg` | `border-start-start-radius`, `border-end-start-radius` |
| `rounded-r-lg` | `rounded-e-lg` | `border-start-end-radius`, `border-end-end-radius` |
| `border-l` | `border-s` | `border-inline-start-width: 1px` |
| `border-r` | `border-e` | `border-inline-end-width: 1px` |

### Space-x vs Gap
`space-x-*` uses the CSS lobotomized owl selector (`> :not([hidden]) ~ :not([hidden])`) with `margin-left`. In RTL environments, Tailwind attempts to invert this with extra CSS selectors, but it frequently collides with flex wrapping, nested structures, and conditional visibility.
**Rule**: Always use `gap-*` (Flexbox/Grid gap) instead of `space-x-*`.

---

## 2. Persian Typography & Ligature Continuity

### Letter-Spacing in Cursive Scripts
Persian is an abjad-derived cursive script where characters connect via ligatures (قلم و اتصالات). In Latin typography, `letter-spacing: -0.025em` (`tracking-tight`) is commonly used to create compact headlines.
However, in Persian:
- Any negative or positive `letter-spacing` forcefully decouples character ligatures at the glyph level.
- Letters that must join (e.g., «مـ»، «ـهـ»، «ـش») are severed, producing disjointed, broken characters.
- **Rule**: All Persian typography MUST have `letter-spacing: 0` (`tracking-normal`). Never apply `tracking-tight` or `tracking-tighter` to Persian headings.

### Font Stack & Fallbacks
The project uses self-hosted Vazirmatn (`--font-sans`).
Font declaration in Tailwind theme maps `font-sans` to Vazirmatn. Line-height should be:
- Body copy: `1.7` to `1.9` (`leading-relaxed` or `leading-loose`).
- Headlines: `1.2` to `1.3` (never below `1.15`).

---

## 3. Directional Icon Semantics in RTL

Icons represent two distinct semantic categories in RTL interfaces:

### A. Directional / Flow Icons (MUST FLIP)
In RTL cultures, chronological progression and forward reading flow right-to-left:
- **Forward / Proceed / Next**: Points **Left** (`ArrowLeft`, `ChevronLeft`). E.g., «مشاهده جزئیات», «خرید», «صفحه بعد».
- **Backward / Return / Previous**: Points **Right** (`ArrowRight`, `ChevronRight`). E.g., «بازگشت به داشبورد», «صفحه قبل».
- **Breadcrumbs**: Separator chevrons point left (`ChevronLeft`), flowing from root to leaf (`خانه / فروشگاه / موبایل`).

### B. Non-Directional / Object Icons (MUST NOT FLIP)
Physical objects and universal symbols stay standard:
- Magnifying glass (`Search`), shopping bag (`ShoppingBag`), trash can (`Trash`), heart (`Heart`), checkmark (`Check`), phone (`Phone`), external link (`ExternalLink`).

---

## 4. Form Controls & Bidirectional Text Isolation

### The Bidi Dilemma
When an input field is inside an RTL container:
- English text or digits typed into the field default to starting from the right.
- For telephone numbers (`09121234567`), URLs, IBANs, and passwords (where dots mask character identity), typing in an un-isolated RTL field causes cursor jumping, erratic arrow-key navigation, and inverted prefix formatting.

### Hardened Solution
1. **Parent Label**: RTL (`text-start`, standard Persian typography).
2. **Input Element**:
   - `dir="ltr"`
   - `text-start` (aligns to physical left within the LTR input)
   - `inputMode="tel"` for mobile numbers
   - `autoComplete` attributes preserved
3. **Digit Normalization**:
   - Transparently convert Persian (`۰۱۲۳۴۵۶۷۸۹`) and Arabic-Indic (`٠١٢٣٤٥٦٧٨٩`) digits to standard ASCII (`0-9`) on input change/submit so backend validations and search queries receive clean data.

---

## 5. Persian Numeral & Currency Formatting

- **Digits**: Format visible numbers with Persian glyphs using `formatPersianPrice(amount)` or `toPersianDigits(num)`.
- **Thousand Separator**: Use Persian comma `٬` (`\u066C`) or standard formatted separator.
- **Currency Placement**: Always place «تومان» after the number separated by a space (e.g. `۱۲٬۵۰۰٬۰۰۰ تومان`).
- **Tabular Alignment**: For tables and financial reports, apply `tabular-nums` and align text to `text-start` so column numbers line up neatly on the right edge.
