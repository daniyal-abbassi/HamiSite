# Quickstart: Brands Stacking-Card Deck

Proves the feature end to end on the homepage. Two commands and one measurement — the measurement is the one
that decides whether the deck ships at all (research D2, contract C2).

## Prerequisites

- Node 24, dependencies installed (`npm ci`).
- **Do not run bare `npm test`.** `tests/setup.ts` truncates nineteen database tables and `.env.test` is absent
  in this checkout. Run the specific unit file instead, as below.
- A browser at an **exact 360 px viewport**. Resizing a desktop window is not the same measurement; the dock
  breakpoint is `768px` and the fit case is 360 × 640.

## 1. Start the app

```bash
npm run dev            # http://localhost:3000
```

To check it on a real phone over the LAN, bind to the interface and open the machine's `wlp3s0` address from
the owner's device; the firewall rule allowing `:3000` from the current subnet has to be in place — it has
gone stale twice before, so confirm rather than assume.

## 2. The cheap guarantees (unit, no DOM)

```bash
npx vitest run tests/unit/brand-deck.test.ts tests/unit/atmosphere-progression.test.ts
```

Expected: all pass. The first covers C1's ordering, C4's absence-of-placeholder, C5's count rule and the fit
budget as arithmetic; the second is the existing ground sweep, which must stay green because the brands chapter
is one of its anchors (**C7**). If `atmosphere-progression` goes red here, the deck changed the section list —
that is a finding, not a test to update.

## 3. The measurement that gates everything (C2)

Walk the deck at 360 × 640 and record where the active card's label sits at each step.

Three things this script must get right, all of them previously wrong in this repo:

1. **Scroll with `behavior: "instant"`.** `app/globals.css:128` sets `scroll-behavior: smooth`, so a naive
   `scrollTo()` samples a page that is still gliding and returns frames that belong to no real scroll position.
2. **Re-read the rect after the scroll settles**, not from a cached layout value.
3. **Wait for hydration.** A 200 response is not a working page — if the client chunks have not loaded, React
   never hydrates and the section is inert, which will look like a deck that does not move.

```
for i in 0..N:
  scrollTo({ top: chapterTop + i * step, behavior: "instant" })
  await two animation frames + ~120ms
  record: which card is topmost, that card's mark rect and label rect, viewport rect
```

**Pass**: six distinct cards hold the top position in order, and **zero** samples where the topmost card's label
rect escapes the viewport. Also record the chapter's total scroll length; it must be ≤ 6.5 screen-heights
(**C1**, **FR-008**).

**If it fails, do not tune and re-run.** FR-014 is the answer: ship the static stack. That outcome is a
completion, not a defect.

## 4. The states a shopper actually arrives in (C9)

Each of these is a separate run with what was on screen written down:

- Reload with the scroll position already inside the deck → the deck shows the state for that position, not its
  opening frame.
- Navigate away and return with the browser's back button mid-deck → same.
- Press End to jump past the chapter → the deck releases, no held layer, the rest of the page is reachable.
- Scroll backwards through the deck twice → cards un-stack in reverse, no card ends in a wrong visual state.

## 5. Honesty and equal weight (C4, C5)

With the deck stopped, look at all six cards at rest:

- the three brands without a story show no empty band, no placeholder, no dimming;
- every visible number matches that brand's own listing;
- the two brands with nothing purchasable show **no number at all**.

## 6. Reduced motion and print (C8)

Emulate `prefers-reduced-motion: reduce`, reload, and confirm six cards in source order, each still a working
destination, with no sticky offsets applied and no extra scroll length. Then confirm the same via print
preview.

## 7. Press behaviour (C3)

Mid-sequence, press the visible top card → it opens that brand's listing. Then confirm a recessed card's 16 px
edge does not steal that press.

## 8. Definition of Done (Constitution)

```bash
npm run typecheck
npm run build
```

Both clean, plus the browser confirmations above. **No frame-rate or smoothness claim is part of acceptance** —
the development machine cannot measure it honestly, and the plan deliberately contains no such target.

## Expected result

A shopper on a 360 px phone scrolls into the brands chapter and deals through it: Apple holds at the top,
Samsung slides over it leaving a strip of Apple behind, and so on through six brands — each one a complete card,
each number true, nothing cropped, and the rest of the homepage continuing normally the moment the deck
releases.
