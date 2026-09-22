# T040 / T041 — Quickstart walkthrough and the gates that stay unmeasured

**Run**: 2026-09-22. tsc clean; **137 unit tests pass** (14 files); production build succeeds; every
browser check below ran against a real Chromium with client chunks confirmed loading, not against an HTML
200.

| § | What it proves | Result | Evidence |
|---|---|---|---|
| §1 | The derived table is honest | **PASS** | `tests/unit/category-departments.test.ts`, 11 cases |
| §2 | Two actions from panel to product, all nine destinations | **PASS** | `notes/us1-destinations.md` |
| §3 | **The gate** — page scroll is never captured | **PASS** | `notes/scroll-capture.md` |
| §4 | Labels are live Persian text | **PASS** | `notes/labels.md` |
| §5 | Keyboard and pointer without dragging | **PASS**, with one caveat | `notes/access.md` |
| §6 | Nothing runs unseen; the page is no heavier | **PASS**, one frame unexplained | `notes/cost.md` |
| §7 | Fallback, reduced motion, forced colours | **Partial** — see below | `fallbackNoJs: 9 panels, all with hrefs and live text` |
| §8 | Coherence with 004 | **PASS** on all five behaviours | `notes/coherence.md` |
| §9 | Human judgement | **NOT MEASURED** | below |

## §7 is partial, and says so

- **JS disabled**: nine panels render as real links with readable text. FR-021 and contract F1 hold — the
  fallback is the default markup, not a branch.
- **Reduced motion**: implemented (transitions off, arc kept, movement resolves instantly) and matches
  004's rule in code, but **not yet observed** with the OS setting toggled in a real browser.
- **Forced colours**: the CSS block exists and gives the active panel a `CanvasText` border, but it was
  **not exercised**. `emulateMedia({ forcedColors: 'active' })` is the missing check.

## §9 — the gates that cannot be closed here

**SC-010** (7 of 10 find it at least as premium, fewer than 2 find it busier), **SC-011** (8 of 10 call the
homepage one coherent experience) and **SC-012** (7 of 10 can state how many departments exist) all need
people. They are recorded as **unmeasured**, not estimated.

That is the same discipline feature 004 had to apply: its ten-person reception gate (T049) was dropped on
2026-09-22 because the panel could not be assembled, and the owner's own read on the finished brands
surface was that it is "somehow simple, boring, not styled and mis-placed in desktop". There is no reason
to expect a panel here that did not exist there.

**SC-011 additionally cannot be judged honestly right now.** It asks about categories, brands, the scroll
ground and product motion together — feature 002's ground failed its own FR-005 gate and its Question 1
was reopened the same day, and feature 003 has not been built. Four of the five moving systems on that
homepage are not settled.

## What a reviewer should be told, unprompted

1. The section is about 40px taller than the grid it replaces at 360px.
2. Only about two and a half of nine panels are visible at once on a phone. That is what an arc costs, and
   it is the single most likely source of a "how many are there" failure against SC-012 — the count is
   stated in the status line, but only when a shopper looks at it.
3. Three departments show no product count at all (phones, chargers, power banks). That is a deliberate
   honesty rule, not a missing feature: their routes do not hold their whole kind.
