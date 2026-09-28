# T030 pending patch — apply when `components/liquid/` gains a per-item passthrough

Not applied. `FeaturedProducts.tsx` is untouched in this session and `components/liquid/` is frozen.
This exists so T030 costs one edit-round rather than a re-derivation.

## Step 1 — the port change (owner: whoever holds `components/liquid/`)

Three inert attributes are all the featured tabs need, and the port has no path for any of them
(`LiquidSelection.tsx:541-555` builds the `<button>`; `aria` at `:501-505` is only
`announceProps` + `role` + `aria-label`).

Add to `LiquidSelectionItem` (after `disabled`, ~line 67):

```ts
  /** Inert attributes the surface needs on the rendered element and the port has
   *  no opinion about: the featured tabs' `id`, roving `tabIndex` and
   *  `aria-controls`. Spread last, so a surface can carry them but not reach
   *  `role`, `aria-selected` or anything the port itself decides. */
  attrs?: Record<string, string | number | boolean>;
```

and spread it last on each of the three element branches (Link `:511-522`, anchor `:527-538`,
button `:542-555`):

```ts
  {...item.attrs}
```

Why this shape and not three named props: it is additive, it cannot disturb the six surfaces already
wired (none pass `attrs`), it adds no dependency, and it keeps the port's own decisions — `role`,
`aria-selected`, `data-ls-*` — unoverridable, because the spread lands after them. It is also the
minimum that FR-040's "one implementation, configured per surface" allows: the surface configures
attributes, it does not grow its own travel code.

## Step 2 — the surface change

`components/home/FeaturedProducts.tsx`. Delete the `motion` import (`:4`) and the whole
`{active && <motion.span layoutId="featured-tab-fill" … />}` block (`:143-150`) — that `layoutId` fill
**is** this surface's travelling indicator today, so leaving it beside the marker ships two markers on
one surface, which is the T029 failure mode and an FR-040 violation. Delete `tabRefs` (`:35`, `:58`,
`:125-127`) once `id` is passed through, because focus can then be taken by `getElementById`.

Replace the tablist block (`:114-155`) with the port, keeping every load-bearing attribute:

```tsx
<div
  className="inline-flex items-center gap-1.5 p-1 rounded-full border border-champagne/25 bg-ink shadow-card"
  // role/aria-label move onto the port's own group, below; the wrapper only
  // catches the bubbled arrow keys.
  onKeyDown={onTabListKeyDown}
>
  <LiquidSelection
    items={featuredTabs.map((t) => ({
      id: t.key,
      label: t.label,
      attrs: {
        id: `featured-tab-${t.key}`,            // the panel's aria-labelledby target
        tabIndex: tab === t.key ? 0 : -1,       // roving: one stop for the set
        "aria-controls": PANEL_ID,
      },
    }))}
    value={tab}
    onChange={(key) => setTab(key as FeaturedTabKey)}
    groupRole="tablist"
    itemRole="tab"
    announce="selected"
    markerInset={2}
    className="w-full"
    itemClassName="rounded-full px-5 py-2 text-xs md:text-sm font-bold"
  />
</div>
```

and in `onTabListKeyDown`, replace `tabRefs.current[next]?.focus()` with

```ts
document.getElementById(`featured-tab-${target.key}`)?.focus();
```

Untouched by design: the `role="tabpanel"` block (`:163-185`), its `aria-labelledby`, `PANEL_ID`, the
empty-state `role="status"`, `ProductRail`, and the RTL arrow mapping — `ArrowLeft` forward,
`ArrowRight` back, per feature 005's contract K2.

## Step 3 — what "verified" means here, and the trap to avoid

Re-run `surf-a-a11y.mjs` and `surf-a-geometry.mjs` and diff against
`surf-a-a11y-before.json` / `surf-a-geometry-before.json`, which already hold this tablist's exact
`id` / `tabindex` / `aria-controls` / `aria-selected` / `aria-labelledby` and its slot boxes
(111.58 and 113.23 × 36 px inside a 240.81 × 46 px group at 1280px). All five must still be present
after the wiring, and the accessible names must be byte-identical (SC-010).

Then run `surf-a-t030-tabstops.mjs`: the featured-tabs row of its table must read
`items: 2, stopsDeclared: 1, tabindexes: ["0","-1"]`, both ids non-null, both `aria-controls` equal to
`featured-panel`. That row is the whole gate — it is what proves the roving tabindex survived.

Two things that will produce a false pass:

1. `el.click()` on the tabs. These are buttons, so it *does* fire — but it is an untrusted event and it
   skips the pointer path the marker's press deformation listens on. Use `page.mouse.click()` at the
   element's centre, as `surf-a-t029.mjs` does.
2. Sampling the flight from Node. The trip is ~620 ms and a round-trip is slower than that; the
   `requestAnimationFrame` recorder has to run **inside** the page. See the mid-flight note in
   `surf-a-status.md` — a screenshot cannot catch this, only the in-page sample can.
