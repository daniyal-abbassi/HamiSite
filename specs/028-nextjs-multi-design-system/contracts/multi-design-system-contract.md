# Interface Contracts: Next.js Multi Design System

**Feature**: `specs/028-nextjs-multi-design-system`  
**Date**: 2026-10-13  
**Status**: Completed  

---

## 1. Storage & Cookie Contract

- **Cookie Name**: `design-system-preview`
- **LocalStorage Key**: `design-system-preview`
- **Cookie Attributes**: `path=/; max-age=31536000; samesite=lax`
- **Supported Values**: `"default"` | `"comfort"` | `"glass"`
- **Fallback**: Any unrecognized value resolves to `"default"`

---

## 2. Pre-Paint Bootstrap Script Contract

The script must be placed directly inside `<head>` or at the very top of `<body>` before any content renders:

```html
<script>
  try {
    var key = 'design-system-preview';
    var fromCookie = (document.cookie.match(new RegExp('(?:^|; )' + key + '=([^;]*)')) || [])[1];
    var ds = localStorage.getItem(key) || (fromCookie ? decodeURIComponent(fromCookie) : '') || 'default';
    var map = { default: 'style-nova', comfort: 'style-vega', glass: 'style-glass' };
    if (!map[ds]) ds = 'default';
    document.cookie = key + '=' + ds + ';path=/;max-age=31536000;samesite=lax';
    try { localStorage.setItem(key, ds); } catch (_) {}
    var styleClass = map[ds];
    var body = document.body;
    if (body) {
      Array.prototype.slice.call(body.classList).forEach(function (c) {
        if (c.indexOf('style-') === 0) body.classList.remove(c);
      });
      body.classList.add(styleClass);
    }
  } catch (_) {}
</script>
```

---

## 3. Component Preview & Embed Route Contract

- **Route**: `/preview` or embedded view component
- **Query Parameters**:
  - `style` (string, optional): `"default"` | `"comfort"` | `"glass"`
  - `embed` (number/boolean, optional): `1` (hides site header, dock, and navigation bars)
- **Iframe Embedding Contract**:
  - Parent component renders: `<iframe src="/preview?style={activeStyle}&embed=1" key={activeStyle} />`
  - Remount on style change ensures clean hydration and zero cross-document script leakage.

