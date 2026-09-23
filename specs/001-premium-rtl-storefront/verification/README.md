# Band 2 verification probes

The scripts that produced the measurements in `../notes/findings.md` (band 2) and `../notes/discovery.md`,
kept because a number with no reproducible instrument behind it is a claim, not a measurement.

Run them against `next dev` on `:3000` with the node_modules Playwright that ships with pixel-bridge:

```bash
npm run dev &                       # then, once it answers:
node specs/001-premium-rtl-storefront/verification/t060-unclip.mjs
node specs/001-premium-rtl-storefront/verification/t067-walk.mjs
```

Two of them read `t067-cases.json`, which is one record per `quickstart.md` §2 state, selected from
`data/hami-products.json` by the same price and stock rules `lib/catalog.ts` applies. Regenerate it if the
export is refreshed; the probes then re-read the pages, not the old numbers.

- `t060-unclip.mjs` — forces `overflow-x: visible` on `body` and reports which pages actually exceed the
  viewport at 360/768/1440, and which element does it. This is the FR-041/SC-008 check: with the clip in
  place the naive measurement passes on every page and tells you nothing.
- `t067-walk.mjs` — the §2 state walk: price line, strike, discount badge, cart control, specs block,
  gallery strip and counter, related rail, and any horizontal overflow, one page at a time.
- `t066-walk.mjs` — variant-selection feedback: chooses an option and reports what changed on the page.
- `t061-walk.mjs` — SC-002 interaction counts, one deliberate input per step.
- `verify-band2.mjs`, `verify-facet-totals.mjs` — the tile row, the sidebar facets, the destination
  controls, and the dock/header chrome at three widths.
- `department-first-card.mjs` — no browser: what a department's page serves, and whether the first card is
  the match T061's task A needs. The product links here are the served HTML's, which is also Principle III.

They are probes, not tests: no assertions, no CI. `npm run typecheck` and `npx vitest run tests/unit` are
the gates; these answer the questions a gate cannot, which is what the page shows a shopper.
