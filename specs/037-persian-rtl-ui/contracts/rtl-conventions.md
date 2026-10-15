# Contract: Persian RTL UI Conventions & Rules

**Feature**: [spec.md](../spec.md) | **Branch**: `037-persian-rtl-ui`

---

## 1. Logical Properties Migration Table

Components must strictly use the logical utility equivalents:

| Prohibited Physical Class | Required Logical Class | Semantics in Persian RTL |
|---------------------------|------------------------|--------------------------|
| `ml-*`                    | `ms-*`                 | Start margin (right side) |
| `mr-*`                    | `me-*`                 | End margin (left side)   |
| `pl-*`                    | `ps-*`                 | Start padding (right side) |
| `pr-*`                    | `pe-*`                 | End padding (left side)  |
| `left-*`                  | `start-*`              | Inset start              |
| `right-*`                 | `end-*`                | Inset end                |
| `text-left`               | `text-start`           | Text aligned to right    |
| `text-right`              | `text-end`             | Text aligned to left     |
| `border-l` / `border-l-*` | `border-s` / `border-s-*` | Start border          |
| `border-r` / `border-r-*` | `border-e` / `border-e-*` | End border            |
| `rounded-l-*`             | `rounded-s-*`          | Start corner radii       |
| `rounded-r-*`             | `rounded-e-*`          | End corner radii         |
| `space-x-*`               | `gap-*`                | Flex/grid gap            |
| `flex-row-reverse`        | (removed)              | Standard RTL flex flow   |

---

## 2. Icon Directional Mapping Registry

| Semantic Action | English / LTR Icon | Persian / RTL Icon | Example Usage |
|-----------------|--------------------|--------------------|---------------|
| Proceed / Next / Detail CTA | `ArrowRight` | `ArrowLeft` | «مشاهده جزئیات», «خرید محصول» |
| Next Page (Pagination) | `ChevronRight` | `ChevronLeft` | «صفحه بعد» in table/catalog |
| Return / Back | `ArrowLeft` | `ArrowRight` | «بازگشت به سفارش‌ها», «بازگشت» |
| Previous Page (Pagination) | `ChevronLeft` | `ChevronRight` | «صفحه قبل» in table/catalog |
| Breadcrumb Separator | `ChevronRight` | `ChevronLeft` | `خانه > فروشگاه > موبایل` |
| Drawer / Sheet Dismiss | `X` | `X` | Unflipped |
| Search / Find | `Search` | `Search` | Unflipped |
| Cart / Bag | `ShoppingBag` | `ShoppingBag` | Unflipped |
| User Profile | `User` | `User` | Unflipped |

---

## 3. Form Input Bidi Contract

Inputs handling Latin data or structured numbers must adhere to this interface:

```tsx
interface BidiInputProps {
  id: string;
  name: string;
  dir: "ltr";
  className?: string; // Must include text-start
  inputMode?: "tel" | "numeric" | "text" | "email" | "url";
  placeholder?: string; // Persian example string allowed (e.g. "مثلاً ۰۹۱۲۱۱۱۲۲۳۳")
}
```

Applicable fields:
- Mobile Phone: `dir="ltr"`, `inputMode="tel"`
- Password: `dir="ltr"`
- Email: `dir="ltr"`, `inputMode="email"`
- Sheba / IBAN: `dir="ltr"`, `inputMode="text"`
- Bank Card Number: `dir="ltr"`, `inputMode="numeric"`
- SKU / Technical Model Code: `dir="ltr"`

---

## 4. Typography Contract

```css
/* Global Persian Typography Rules */
body, [lang="fa"] {
  letter-spacing: 0 !important;
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
  letter-spacing: 0;
  line-height: 1.25;
}
```

Components MUST NOT apply:
- `tracking-tight` (`letter-spacing: -0.025em`)
- `tracking-tighter` (`letter-spacing: -0.05em`)
- `tracking-wide` / `tracking-wider` on Persian text strings.
