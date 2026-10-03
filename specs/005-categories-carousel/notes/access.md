# T033 — Keyboard, focus, and the reachability comparison

**Run**: 2026-09-22, 1280×900, Playwright, real key events.

| Key | Expected | Measured |
|---|---|---|
| `Tab` into the section | one tab stop | `tabbableCount: 1` |
| `ArrowLeft` ×3 | active advances 1→2→3 in reading order | active 1, 2, 3 |
| same | DOM focus follows the active panel | focused 1, 2, 3 — **equal at every step** |
| `End` | jumps to the last department | active 8 |
| any of the above | must not scroll the page | `scrollY` unchanged (2574 throughout) |

**K3 was failing and is fixed.** The first run showed `focused: 0` at every step while the active panel
moved to 1, 2 and 3 — the roving tabindex stayed on the panel the shopper had tabbed into. That is exactly
the disagreement K3 forbids: the keys were acting on one department and `Enter` would have activated
another. `goTo` now moves focus with the selection, using `focus({ preventScroll: true })` so doing it
cannot become the one way this component touches vertical scroll.

**K2 / FR-028**: `ArrowLeft` advances. In RTL reading runs right-to-left, so forward is visually left; a
physical mapping would have made `ArrowLeft` go back.

**K1**: `Enter`/`Space` activate the focused link natively — nothing is intercepted, which is also the
FR-038 interaction contract shared with feature 004's rows.

**K4 / FR-029**: prev/next buttons advance without dragging. The wheel is deliberately not bound —
consuming a vertical wheel over the section is contract I4's failure case.

**K5 / FR-030**: each panel carries an `aria-label` of "N از ۹" and a live-region status announces the
active department name with its position and the total.

**Touch targets (K7 / FR-032)**: 11 interactive elements measured at 360px, minimum 44×44 CSS px, and
none intersecting the fixed header island at the section's centred scroll position.

**SC-005 caveat**: "reachable by screen reader alone" was verified structurally — roles, labels, live
region, one tab stop, focus movement — and not with a running AT and a human ear. The destination set is
identical to the swipe route by construction, since both drive the same `scrollTo`. That distinction is
recorded rather than smoothed over.
