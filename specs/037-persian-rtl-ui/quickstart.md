# Quickstart: Persian RTL UI Standards Verification

**Feature**: [spec.md](spec.md) | **Branch**: `037-persian-rtl-ui`

---

## 1. Automated Directional Audit

Verify that zero physical directional utilities remain in components and page routes:

```bash
# 1. Check for physical margins, paddings, and alignments
grep -rnE "\b(ml-|mr-|pl-|pr-|text-left|text-right)\b" components/ app/ | grep -v "node_modules"

# Expected: Zero matches (or exclusively inside explicit dir="ltr" containers)

# 2. Check for deprecated space-x
grep -rnE "\bspace-x-[0-9]+" components/ app/ | grep -v "node_modules"

# Expected: Zero matches
```

---

## 2. Automated Typography & Letter-Spacing Audit

Verify that Persian headlines and copy do not carry tracking attributes:

```bash
# Check for negative or tight tracking on Persian elements
grep -rnE "tracking-tight|tracking-tighter" components/ app/

# Expected: Zero matches on Persian components
```

---

## 3. Directional Icon Verification

Check product cards, pagination, and back buttons:

```bash
# Verify product detail CTA uses left arrow
grep -rn "ArrowRight" components/shop/ProductCard.tsx
# Should be ArrowLeft

# Verify pagination uses ChevronLeft for next and ChevronRight for previous
grep -rnE "ChevronLeft|ChevronRight" components/admin/ui/Pagination.tsx
```

---

## 4. Quality Gates

Run all quality gates:

```bash
npm run typecheck
npm run test:unit
npm run build
```
