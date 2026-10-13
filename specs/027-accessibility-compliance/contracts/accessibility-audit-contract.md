# Contract: Component Accessibility Standards & Audit Rules

**Feature**: `027-accessibility-compliance`  
**Specification Reference**: `specs/027-accessibility-compliance/spec.md`  
**Target Standard**: WCAG 2.2 Level AA / FarsiUI Accessibility Compliance

---

## 1. Icon Buttons & Interactive Triggers Contract

All interactive elements without visible text MUST fulfill this contract:

```typescript
export interface AccessibleIconButtonProps {
  /** Unambiguous Persian description spoken by screen readers */
  "aria-label": string;
  /** Optional programmatic id for tooltip / popover anchoring */
  id?: string;
  /** Explicit keyboard focus behavior */
  tabIndex?: number;
}
```

### Invariants & Rules:
1. Every `<button>` containing only an SVG icon MUST have an explicit `aria-label` or `<span className="sr-only">...</span>`.
2. All child SVG elements MUST specify `aria-hidden="true"` and `focusable="false"`.
3. Minimum touch target on mobile viewports MUST be `>= 44x44px` (e.g. `min-h-[44px] min-w-[44px]` or `p-2.5`).

---

## 2. Accessible Modal & Drawer Dialog Contract

All modal overlays and slide-overs MUST implement the following DOM contract:

```html
<!-- Dialog Backdrop / Scrim -->
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title-id"
  aria-describedby="dialog-desc-id"
  tabIndex="-1"
  class="fixed inset-0 z-50 ..."
>
  <div class="relative ...">
    <!-- Required Accessible Title -->
    <h2 id="dialog-title-id" class="text-base font-bold ...">
      عنوان پنجره
    </h2>

    <!-- Dialog Content Body -->
    <div id="dialog-desc-id">
      ...
    </div>

    <!-- Explicit Dismiss Action -->
    <button
      type="button"
      aria-label="بستن پنجره"
      class="..."
    >
      <X size={20} aria-hidden="true" />
    </button>
  </div>
</div>
```

### Operational Lifecycle:
1. **On Mount / Open**:
   - Save `document.activeElement` as `previousActiveElement`.
   - Transfer focus to dialog container (`tabIndex={-1}`) or first input.
2. **While Open**:
   - Listen for `keydown`:
     - If `e.key === 'Tab'`: Trap focus within dialog's focusable elements.
     - If `e.key === 'Escape'`: Invoke close handler.
3. **On Unmount / Close**:
   - Restore focus to `previousActiveElement`.

---

## 3. Accessible Form Fields & Dynamic Error Contract

```html
<div class="space-y-1.5">
  <!-- Programmatically Associated Label -->
  <label htmlFor="national-code-input" class="block text-xs font-semibold text-zinc-300">
    کد ملی متقاضی:
  </label>

  <!-- Input with Error & Description Associations -->
  <input
    id="national-code-input"
    type="text"
    aria-required="true"
    aria-invalid="true"
    aria-describedby="national-code-error"
    class="... focus-visible:ring-2 focus-visible:ring-amber-400"
  />

  <!-- Live Announcing Error Container -->
  <p
    id="national-code-error"
    role="alert"
    aria-live="polite"
    class="text-xs text-rose-400 mt-1"
  >
    کد ملی وارد شده ۱۰ رقمی و معتبر نیست.
  </p>
</div>
```

---

## 4. Skip-to-Content Landmark Contract

Root layout MUST render this landmark before any header or navigation elements:

```html
<a
  href="#main"
  class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-amber-400 focus:text-zinc-950 focus:font-bold focus:shadow-2xl focus:outline-hidden focus:ring-2 focus:ring-zinc-950"
>
  پرش به محتوای اصلی
</a>
```

And primary view container MUST provide:
```html
<main id="main" tabIndex="-1" class="outline-none ...">
  {children}
</main>
```

