# Project completion plan

**Updated:** 2026-10-04  
**Task tracker:** Beads is authoritative for issue state; this file records the execution order and gates, not a second issue list.

## Current position

The board showed 9 open issues and 2 in progress when this execution began. The two in-progress chores (Feature 006 carousel acceptance and payment QA) are complete and closed. Feature 007's no-pin scope has been reconciled with its canonical documents and Beads graph; foundational verification, heading arrival, and composed-layout polish are also complete. The next ready Feature 007 chore is the phone-access check. Beads is authoritative; query it for current counts and dependencies.

The checkout contains substantial pre-existing edits. Preserve them; do not restore, stash, or bulk-stage them. Do not commit, push, or sync Beads unless separately authorized.

## Execution order

### 1. Finish Feature 006 once the visual inputs are available

- `HamiSite-basic-structure-hvr.3.3` is blocked on compliant supplied category art and the approved transparent cream Hami mark. The asset audit documents the supplied files and contrast measurements. Do not invent a logo or silently upscale/recolor the current files.
- When the owner supplies conforming assets or approves a written scope change, complete the frame and asset checks, then run `HamiSite-basic-structure-hvr.3.4` for homepage integration, LCP, layout shift, scroll height, responsive behavior, no-JS, keyboard, and reduced-motion evidence.

### 2. Finish Feature 007 under the reconciled no-pin scope

- Completed: `HamiSite-basic-structure-8sv.2` foundational verification, `.3` heading arrival, and `.4` composed layout polish. The canonical spec, blueprint, task index, and Beads graph follow the amendment; old pinned/lock requirements are retired. Missing historical screenshots/content baseline remain disclosed and are not represented as passes.
- Completed: `HamiSite-basic-structure-8sv.5` phone access at 360/390, keyboard and touch destination checks, and 184px dock clearance.
- `HamiSite-basic-structure-8sv.6` cross-cutting checks are recorded. It is blocked at T049 because its production build would overwrite `.next` while two Next servers are active, per `CLAUDE.md`; do not stop or restart those processes without owner direction. SC-008 remains unavailable and SC-010 remains a human judgement.
- Feature 006 visual completion is blocked at `HamiSite-basic-structure-hvr.3.3` by missing owner-approved category art and the transparent cream mark. Its integration task `.3.4` depends on those inputs and is therefore blocked too; do not invent or alter assets to force progress.
- The real Zarinpal round trip remains separately blocked on a sandbox merchant ID and public HTTPS callback origin. The remaining project work resumes when the owner supplies the required assets/credentials and clears the build/server gate.

### 4. Run the real Zarinpal sandbox round trip when its environment is configured

- `zarinpal.txt` contains a sandbox merchant identifier, but it is not configured in `.env` or `.env.test`. `HamiSite-basic-structure-36v` remains blocked on an approved public HTTPS callback origin and sandbox environment configuration; no credential value is copied into this plan.
- Then run request, payment, callback verification, callback replay, and cancellation against the sandbox; confirm integer Rial amounts and persisted order/payment states. Keep credentials out of source control and chat.

## Completed in this pass

- Feature 006 carousel: nine destinations checked at 360/390/1280; keyboard Home/End and RTL arrows, vertical-scroll escape, no-JS fallback, reduced motion, focus, and no-spacer behavior checked. Fixed the keyboard jump being constrained by the gesture travel cap.
- Payment QA: local checkout validation, blank postal behavior, wholesale credit route, responsive widths, result-state recovery link, and fixed-dark-theme contrast measured. Temporary test categories/products, QA orders, and cart items were removed. The real provider round trip remains separately blocked as above.
- Feature 007 scope reconciliation: recorded no-pin decision supersedes pinned choreography; obsolete setup gate closed, historical evidence gap retained.
- Feature 007 `.2`/`.3`/`.4`: foundation and negative-control drift checks, heading-arrival behavior, responsive composition, comma wrapping fix, print/forced-colours visibility, authored ground, and mobile dock clearance verified. SC-008 historical comparison and SC-010 human judgement remain explicitly unavailable.
- Feature 007 `.5`: phone and shop links verified by keyboard and mobile touch; 184px of clearance above the dock at 360/390.
- Feature 007 `.6`: contrast, print, forced-colours, parity, unit-test, and source gates recorded in Beads; T049 build/baseline remains blocked while the active Next servers share `.next`.
