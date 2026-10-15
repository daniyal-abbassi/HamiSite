# Quickstart: Validate the Typography Refresh

**Feature**: [spec.md](spec.md) | **Rendered behavior**: [Typography contract](contracts/typography-contract.md)

## Prerequisites

- Use the existing checkout and preserve all unrelated edits, including the ongoing RTL feature files.
- Read the installed FarsiUI guide at `.cursor/rules/persian-typography.mdc` and the current local font declarations in `app/globals.css`.
- Use real current catalog content for product samples. If cart, checkout, partner, or admin states require credentials or data that are unavailable, record the state as unverified; do not fabricate it or reset the database.
- Confirm the source and license of any font asset selected for release.

## Establish a comparable baseline

1. Capture the home, shop, one real product, cart, and checkout screens at a phone width and a desktop width. Record current font, role sizes, line spacing, and representative small labels.
2. Include at least 20 mixed Persian/Latin samples across products and operational screens, plus long names, prices, validation messages, and a numeric table.
3. Compare revised Estedad and Vazirmatn treatments against the identical content and viewport. Record the selected treatment and why it meets the [contract](contracts/typography-contract.md). Do not silently change the selected face during rollout.

## Verify implementation

1. Inspect the five core screens and representative account, partner, admin, and Telegram mini-app screens at phone and desktop widths. Check every role in the contract and count pass/fail against SC-001 through SC-004.
2. Zoom each core screen to 200%. Read headings, prices, body passages, labels, and primary actions. Confirm no clipping, overlap, or lost meaning.
3. Throttle or block the preferred font request and inspect first render, fallback glyphs, layout movement, and action usability. Confirm the client chunks load and controls work.
4. Check visible Persian numerals and units without changing canonical values. Run focused pure frontend tests only if formatting behavior changed.
5. Present before/after views of the same five screens for the owner's SC-005 assessment; record the outcome and any requested revision.

## Quality gates

```bash
npm run typecheck
npm run test:unit
npm run build
git diff --check
```

Before a build, check whether a Next server is using `.next`. A build can invalidate its client chunks; restart that server afterwards and verify a real browser interaction and a loaded chunk. Avoid the database-backed default test configuration because its setup can reset tables. The planning and tasks phases do not run these code gates because they do not change application code.
