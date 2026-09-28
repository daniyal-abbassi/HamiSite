# 012-SURF-A — worker status (write-back substitute)

**Worker:** qoder · **Brief:** `012-SURF-A` · **Owned files:** `components/layout/PillNav.tsx`,
`components/home/FeaturedProducts.tsx` · **`components/liquid/` FROZEN throughout.**

Written instead of flipping boxes in `tasks.md`, per the 04:20 scope change that moved that file to
another session.

## ️ Reconcile this before you trust `tasks.md`

Before the scope change arrived I had already edited `specs/012-liquid-dock-navigation/tasks.md`.
The whole delta is two lines of box state plus evidence notes:

- **T029: `- [ ]` → `- [x]`** — this is correct work, keep it or re-flip it, your call.
- **T030: still `- [ ]`** — I did not flip it.
- Long blockquote notes appended under both. They are evidence, not plan changes. Nothing else in the
  file was touched: `git diff -- specs/012-liquid-dock-navigation/tasks.md | grep -E "^[+-]- \[" `
  returned exactly the two T029 lines and nothing else.

`tasks.md` is yours now; I will not edit it again.

## Completed task IDs

### T029 — `components/layout/PillNav.tsx` — DONE, verified

Substitution, not addition. `LiquidSelection` configured `groupRole="menubar"`,
`itemRole="menuitem"`, `announce="page"`, `markerInset={4}`, content-width slots, `value` = the live
route or `null` when no pill matches (FR-017).

Deleted with the old mechanism: `hover-circle` spans, `circleRefs` / `tlRefs` / `activeTweenRefs`, the
per-pill radius arithmetic, the resize + `document.fonts` re-measure, `handleEnter` / `handleLeave`,
`.pill-label`, `.pill-label-hover`, PillNav's private `prefersReducedMotion` (now the port's single
one, FR-021), and the props that existed only to feed it: `circleColor`, `pillColor`, `pillTextColor`,
`hoveredPillTextColor`, `ease`. Net −86 lines.

Evidence, all `surf-a-` prefixed in this directory:

| claim | file | what it shows |
|---|---|---|
| 14/14 browser checks | `surf-a-t029.mjs` → `surf-a-t029.json` | the full gate, exits non-zero on any failure |
| travel | `surf-a-t029.json` `.travel` | trusted `page.mouse.click`, in-page rAF: **31 distinct x over 55 frames, peak `scaleX 1.250`** = `DEFORM.scaleX`, not the 1.06 of a press |
| old mechanism gone | `surf-a-geometry-before.json` / `-after.json` `.legacy` | `hover-circle` 3→0, `.pill-label` 3→0, `.pill-label-hover` 3→0; `willChangeMarkers` 0 both |
| SC-010 / FR-047 | `surf-a-a11y-before.json` / `-after.json` | every AT field on all three pills **byte-identical**; menubar+menuitem role count stays 4 |
| resting geometry | `surf-a-geometry-after.json`, `surf-a-pills-1280-rest.png` | inset 4 px, 28 px tall in a 36 px slot, inside slot and group; slot boxes unchanged (65.38 / 89.89 / 119.56 × 36) |
| desktop-only | `surf-a-pills-360.png` | wrapper `display: none`, nothing painted; the dock marker is the only one visible |
| honest degradation | `surf-a-pills-1280-nojs.png` | scripting blocked: current pill still carries `background rgb(229 211 179 / .16)` from the server |
| end state | `surf-a-pills-1280-after-click.png`, `-rest-partners.png` | marker rests under the pill you actually navigated to |
| **FR-017 `null` branch** | `surf-a-t029-fr017-v2.mjs` → `-fr017.json` | **3/3**: on a real nested product route (`/shop/گوشی-…poco-x7-pro…`) and on `/cart` the marker is absent and **no** pill carries `aria-current`; on `/` exactly one does. The click-based nested case is reported SKIP, not PASS — the harness could not land it (see below) |
| **parking, over time** | `surf-a-t029-parktrace.mjs` → `-parktrace-cold.json` / `-warm.json` | the marker is **never** `data-ls-placed="1"` with a zero width — "parked nowhere" is ruled out. On a cold dev home load it parks at ~4.8 s (warm: ~8.6 s), and until then the server-rendered `.itemActive` ground is what shows |

### Three harness bugs I hit, so nobody re-reads them as product defects

`surf-a-t029-fr017.mjs` (v1) is kept as evidence of a **bad probe**, not a bad surface. It reported
FAIL on the nested route while never leaving `/shop`, where the marker resting under «فروشگاه» is
correct. v2 fixes three things worth knowing about when writing any probe against this header:

1. **`nav[aria-label="ناوبری اصلی"] [role="menubar"]` matches more than one group at 1280** — the dock
   is `md:hidden` but still in the document, and `querySelector` returned *it*, whose marker is a
   legitimate 0-width hidden shape. v1 therefore "proved" the marker was missing on a working home
   page. Scope to the group whose `getBoundingClientRect().width > 1`.
2. **A fixed post-load wait is not a hydration wait.** The port parks on a layout effect, and on this
   box that lands ~5 s after a cold dev-mode home load. Sampling at 1.4 s measures a page that has not
   hydrated. Wait for `data-ls-placed`, or you will report a working surface as broken.
3. **`location.pathname` is percent-encoded for Persian slugs** while `a[href]` in the markup is raw
   UTF-8, so `route === href` fails on a route that loaded perfectly. Compare decoded.


**Do not read `surf-a-pills-1280-midflight.png` as mid-flight.** It is at rest. A `page.screenshot()`
round-trip is slower than the 620 ms flight, and a dev-mode route commit lands 600–900 ms after the
click, so the flight is over before pixels return — even when a CDP screencast frame is matched to the
page's own peak-stretch timestamp (`surf-a-midflight.mjs`). The rAF sample is the proof. The
`surf-a-pills-1280-flight-NNNNms.png` set is from abandoned offset-guessing passes; ignore or delete.

Gates: `npm run typecheck` → one error, `Header.tsx(125,11)`, see below. `npm run test:unit` →
**338/338, `setup 0ms`** (no DB loaded, so `resetDb()` never ran).

### Open defect inside T029 that I cannot fix in my owned files

`components/layout/Header.tsx:125-128` still passes the four deleted colour props, so typecheck fails:

    TS2322: Property 'circleColor' does not exist on type 'IntrinsicAttributes & PillNavProps'

Fix is a four-line deletion (keep `className`, `showLogo`, `logo`, `items`, `baseColor`). Header.tsx is
outside my owned list and was unclaimed; REQUEST posted on `.agent-pair/BOARD.md` 03:40. Runtime is
unaffected — unknown props are dropped — which is why the browser evidence above stands.

## Blocked task IDs

### T030 — `components/home/FeaturedProducts.tsx` — BLOCKED, file untouched

The frozen port cannot express this surface. `LiquidSelection.tsx:541-555` renders the item as

    <button key type="button" className data-ls-item data-ls-marked ref disabled onClick {...aria}>

and `aria` (line 501-505) is only `announceProps(isActive)` + `role` + `aria-label`. So there is no
path to the three attributes the brief says to preserve exactly:

1. **`tabIndex`** — the roving tabindex at `FeaturedProducts.tsx:135` (`active ? 0 : -1`) makes the pair
   one Tab stop. Every button the port renders is focusable, so wiring it as written turns the app's
   only tablist into two stops — the thing the comment at `:132-134` says T095 existed to prevent.
2. **`id`** — `featured-tab-<key>` at `:130` is the target of the panel's `aria-labelledby` at `:166`.
   Without it that reference dangles.
3. **`aria-controls`** — `aria-controls={PANEL_ID}` at `:136`. No field for it.

What the port *does* support here: `groupRole="tablist"` + `itemRole="tab"` + `announce="selected"`
already exist (`:456-460`), and `onKeyDown` survives by moving to a wrapper, since keyboard events
bubble. That is the extent of it — note that `tabRefs`' `.focus()` can **not** be re-pointed at the
port's nodes, because the port attaches its own internal ref and exposes no handle; an arrow-key
handler would have to find the button another way, which is out-of-band again.

**Measured, not argued** — `surf-a-t030-tabstops.mjs` walks the live page and contrasts the two kinds
of group on it:

| group | items | Tab stops | `tabindex` values | `id` | `aria-controls` |
|---|---|---|---|---|---|
| featured tabs, hand-rolled (what T030 must preserve) | 2 | **1** | `["0","-1"]` | `featured-tab-newest`, `featured-tab-special` | both `featured-panel` |
| header pills, port-rendered (my T029 output) | 3 | **3** | all `null` | none | none |
| mobile dock, port-rendered | 5 | **5** | all `null` | none | none |

The port emits no tab-order management of any kind. Wiring the featured tabs to it as it stands turns
the app's one true tablist from 1 stop into 2 and deletes both ids and both `aria-controls` — the exact
three regressions above, reproduced on a rendered page at 360 and 1280.


Not done on purpose: setting the three attributes by mutating the port's rendered buttons from a
`useLayoutEffect`. It would paint correctly and it is out-of-band writes into a frozen component's
output rather than a configuration of it — the "looks the same but written separately" shape FR-040
exists to refuse, and it breaks the moment the port re-renders those nodes.

**Cheapest unblock, for whoever owns `components/liquid/`:** add one optional field to
`LiquidSelectionItem`, spread onto the rendered element. ~3 lines, additive, cannot disturb the six
surfaces already wired. `surf-a-t030-pending-patch.md` holds the exact FeaturedProducts diff to apply
the moment it lands, so T030 becomes a one-shot.
