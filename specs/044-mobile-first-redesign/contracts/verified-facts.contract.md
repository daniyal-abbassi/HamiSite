# Contract: verified-facts content module

**Feature**: 044-mobile-first-redesign · **Type**: internal content contract (TypeScript module)

## Exported surface (unchanged shape, extended data)

```ts
export const trustFacts: readonly [
  { key: "history"; label: string },
  { key: "store"; label: string },
  { key: "redmi"; label: string },
  { key: "tch"; label: string },
  { key: "priceMatch"; label: string },
  { key: "officialDealership"; label: string },
]
```

- `key` values are stable identifiers; new keys are append-only.
- `label` is the verified Persian sentence — the only text a surface may render as a full claim.
- Consumers MUST key icon/short-label records against `typeof trustFacts[number]["key"]` so the compiler enforces full coverage when a key is added.
- Adding a fact REQUIRES owner confirmation before the label enters this file (Constitution I). The 2026-10-25 owner confirmation covers `priceMatch` («قیمت برد به برد») and `officialDealership` («نمایندگی رسمی») — recorded in `specs/044-mobile-first-redesign/spec.md` FR-007.

## Consumers (current)

- `app/(main)/page.tsx` — hero trust grid: `trustFactIcons` and `trustFactShortLabels` records keyed by fact key; this feature updates both to the mockup's four-key rendering.

## Compatibility rules

- No runtime/datastore dependency: the module stays a pure static import.
- Existing keys and labels never change meaning; the `redmi` label's orthography fix (ZWNJ in «نماینده‌ی») is wording-level and does not alter the claim.
