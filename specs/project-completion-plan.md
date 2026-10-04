# Project completion plan

**Updated:** 2026-10-05
**Task tracker:** Beads is authoritative for issue state; this file records the execution order and gates, not a second issue list.

## Current position

Feature 007's execution graph is complete and closed, including the production-build gate that was blocked while Next servers shared `.next`. Feature 006's carousel and functional browser checks pass. The owner approved the current nine category panels, waived their former image floors and the cream-mark requirement, and approved the measured page-height change; the written amendment and verification evidence are in `specs/006-category-showcase/`. Beads is authoritative; query it for live counts and dependencies.

The checkout contains substantial pre-existing edits. Preserve them; do not restore, stash, or bulk-stage them. Do not commit, push, or sync Beads unless separately authorized.

## Execution order

### 1. Feature 006 — accepted for the current asset set

- `.3.3` and `.3.4` are ready to close under the 2026-10-05 owner-approved scope amendment. Measurements and the historical scroll-height deltas remain documented; no superseded threshold is claimed as passed.

### 2. Run the real Zarinpal sandbox round trip when its environment is configured

- `zarinpal.txt` contains a sandbox merchant identifier, but it is not configured in `.env` or `.env.test`. `HamiSite-basic-structure-36v` remains blocked on an approved public HTTPS callback origin and sandbox environment configuration; no credential value is copied into this plan.
- Then run request, payment, callback verification, callback replay, and cancellation against the sandbox; confirm integer Rial amounts and persisted order/payment states. Keep credentials out of source control and chat.

## Completed in this pass

- Feature 006 carousel: 18 focused unit tests pass; production browser checks cover nine destinations at 360/390/1280, touch progression through all panels, 10/10 vertical swipes, keyboard Home/End and RTL arrows, visible focus, no-JS links, and hydration/layout stability. The owner-approved visual exceptions and before/after height measurements are recorded in `specs/006-category-showcase/owner-approval-2026-10-05.md` and `verification/README.md`.
- Payment QA: local checkout validation, blank postal behavior, wholesale credit route, responsive widths, result-state recovery link, and fixed-dark-theme contrast measured. Temporary test categories/products, QA orders, and cart items were removed. The real provider round trip remains separately blocked as above.
- Feature 007 scope reconciliation: recorded no-pin decision supersedes pinned choreography; obsolete setup gate closed, historical evidence gap retained.
- Feature 007 `.2`/`.3`/`.4`: foundation and negative-control drift checks, heading-arrival behavior, responsive composition, comma wrapping fix, print/forced-colours visibility, authored ground, and mobile dock clearance verified. SC-008 historical comparison and SC-010 human judgement remain explicitly unavailable.
- Feature 007 `.5`: phone and shop links verified by keyboard and mobile touch; 184px of clearance above the dock at 360/390.
- Feature 007 `.6`: production build and final cross-cutting browser checks pass; 43 focused tests, typecheck, and diff check pass. The drift guard's negative control is detected. Historical SC-008 comparison and human SC-010 judgement remain explicitly unavailable; see the Beads close note and `specs/007-motion-assembly-band/notes/contrast-sweep.md`.
