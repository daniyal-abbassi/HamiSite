# Quickstart: Verifying the Scroll-Driven Atmosphere

Validation guide. Run after implementation; every step maps to a clause in
[contracts/page-ground-behaviour.md](./contracts/page-ground-behaviour.md).

## Prerequisites

- Node via nvm (repo builds on Node 22), `npm ci`
- A running dev server, and the `browser-use` MCP or scripted Playwright for page inspection
- No database and no catalog access — this feature changes no data

```bash
npm run dev            # never while another Next server holds :3000
npm run typecheck
npx vitest run tests/unit
```

**Never run bare `npm test` here.** It is `dotenv -e .env.test -- vitest run`, `.env.test` does not
exist, so `DATABASE_URL` falls through to `.env` → the development database, and `tests/setup.ts` runs
`resetDb()` in a global `beforeEach` that truncates 19 tables — including for pure unit tests.

**Three measurement traps already learned on this repository, because each will bite here:**

1. `npm run build` rewrites `.next` under a live dev server — the page looks fine, every button is dead,
   and `curl` still returns 200. After any build, restart dev and confirm a 200 on the first
   `/_next/static/chunks/*.js`, not on the page.
2. `rect.top + window.scrollY` is **not** a stable document position on this page — feature 002's own
   scroll handling moves content. Measure against a stable ancestor's bounding box instead.
3. `getComputedStyle(el).letterSpacing` returns `"normal"` for a zero value, and Chrome reports
   `getBoundingClientRect()` of a fixed layer relative to the viewport, not the document.

## 1 — Pure core, no browser

```bash
npx vitest run tests/unit
```

Expected: the progression module passes for stage-anchor validity, ≥ 2 stages, `toneAt(0)` and
`toneAt(1)` correctness, monotonicity along the declared axis, **band containment at every interpolated
step**, and the reduced-motion mapping yielding the same stage set. Band containment is the one that
matters: it is what stops someone editing a single stage value from silently breaking contrast
somewhere in the middle of a transition.

## 2 — The ground responds, and never seams

At 360px, scroll the full document in small increments (about 2% of document height) and capture the
rendered ground colour behind a fixed probe point at each step.

- More than one distinct tone across the document — **P1**
- The sequence of captured colours is monotonic along the declared axis, with no reversal and no jump
  larger than the sampling step implies — **P2, P3**
- Pause at five arbitrary positions and screenshot; each must read settled, not mid-fade — **P4**
- Scroll to the bottom, then jump to the end with the `End` key in one motion: the ground arrives
  correctly and does not sprint through every intermediate — **P3**
- Scroll to the top: the first frame is byte-identical to the first frame on arrival — **P5**

## 3 — Legibility at every intermediate point (SC-004, the hard gate)

Step the scroll position across the whole document and, at each step, compute contrast for a fixed set of
representative nodes: product name, price, availability label, section heading, body copy, and a header
label.

**Zero failing measurements, not an average.** A single failing step is a fail. Include the fixed header
in each of its own appearance states, and include the seam into the footer. **L1, L2, L3, P7.**

Then repeat with the operating system's forced-colors / high-contrast emulation on. **L4.**

## 4 — Scroll feel is native, and stays responsive

- Keyboard: press and hold `ArrowDown`, `PageDown`, `Space`, then `End`. Movement begins on input with no
  perceptible lag at any point. **S2**
- Wheel/trackpad: continuous, no stutter or dropped frames at 4× CPU throttling. **S1, S4**
- Touch emulation: flick, then stop mid-gesture; the page stops with the gesture. **S3**
- Assert directly that the document's own scroll position is produced by the browser: no
  `preventDefault` on wheel/touch, no synthetic scroll. **S1**
- Anchor jump from the header nav to a mid-page section: it animates as before and lands at the correct
  tone. **S5**
- Reload at a scrolled position and via back/forward: correct tone on the first frame, 100% of attempts.
  **P5**

## 5 — Cost

Compare, on the same device profile and the same route, before and after:

- Time to reach the bottom and to interact with content there. **S6**
- Long-task count and total blocking time during a full scroll.
- Frame pacing during a scripted scroll: median and p95 frame interval, with the effect on and with the
  layer hidden. The difference is the feature's real cost and it must be small.

## 6 — Reduced motion and resilience

Run §2, §3 and §4 with `prefers-reduced-motion: reduce`:

- Distinct settled tones per region, no animated travel. **A1**
- A DOM diff against the animated page: same sections, products, prices, links, reading order. **A2**
- The accessibility tree contains no node for the ground, focus never moves because of it, and reading
  order is unchanged. **A3**

Then:

- Background the tab for 30 seconds, return: correct immediately, no catch-up, and no work ran while
  hidden. **A5**
- Hide the layer entirely (the "before" state). The page must remain complete and honest — no
  information, state or navigation is lost. This is the direct test of **G1** and it is the clause that
  outranks the others.

## 7 — Drift

Fifteen minutes of scripted continuous up-and-down scrolling. Then re-run §2's capture and diff it
against the first pass. Identical, with no accumulated state, no listener growth, and no memory pressure.
**A6.**

## 8 — Busyness, against the thing it must beat

Show the page before and after — same viewport, same scroll position, side by side — and ask the same two
questions of at least ten people: which is more premium, and which is busier.

SC-001 requires ≥ 7 of 10 for "more premium" and ≥ 8 of 10 for "no busier". **This is the clause the plan
expects to be at risk**, because Resolved Q2 = C keeps the existing five-glow field exactly as it is and
FR-005 requires the combination to read calmer. If this gate fails, the correct response is to revisit
Q2 toward option B — reduce the existing field to a quiet base — and not to weaken FR-005. Record the
result either way; do not average it away.

## Passing definition

Sections 1, 2, 3, 4 and 6 pass clean. Section 3 is a **hard gate** with no tolerance: a progression that
drops text below readable contrast at its midpoint is a defect that only exists while the page is moving,
which is exactly when nobody checks. Section 5 shows no measurable regression. Section 7 shows no drift.
Section 8 is a human panel and cannot be self-certified — if it has not been run, say so rather than
implying it passed.
