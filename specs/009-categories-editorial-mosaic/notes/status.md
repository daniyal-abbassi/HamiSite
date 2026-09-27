# 009 status — CLOSED BY SUPERSESSION (task mosaic-phase12, worker qoder, 2026-09-26 ~19:00)

009's layout was rejected by the owner at ~16:20 after seeing both variants rendered; feature
**010-categories-masonry-gallery** replaced it and completed T002–T031 by 18:28 (suite 281/281,
typecheck clean, build clean). This file records what phase-12 (T001–T008) reached before the
supersession landed, and what is now moot.

| Task | State | Record |
|---|---|---|
| T001 | done, then moot | The governing numbers (312 px content, 150 px paired tiles, 148 px floor) were real, but they governed a layout the owner rejected. 010's research restates the surviving rules. |
| T002 | **skipped** | No browser automation driver in `node_modules` (only raw `chromium-browser`/`google-chrome` binaries), and `baseline/` was not in my owned-files list at dispatch time. 010 has since taken its own before/ captures via `tools/shots/viewport.mjs`. |
| T003 | done | `npm run test:unit` at 14:48:44 → `Duration 14.89s (transform 2.39s, setup 0ms, import 7.05s, tests 1.86s, environment 5ms)` — `setup 0ms` proves no database was touched. 21 files, 240 tests, 1 failed (`categoryImageFor`, the known 010-T028 item, since fixed). |
| T004 | done, findings moot | Audit of my own `.cat-mosaic` block found four gaps: (1) smallest tile was 137 px at 360 under the section's own padding — D1's 150 px only closes if the grid bleeds past it; (2) physical right/left via expanded `inset:` shorthand (the count chip's `inset: auto 14px 44px auto` is a physical `right`), contradicting research D8's "no physical left/right" claim; (3) M8 breaches — hero label font-size steps and the 1280 letterbox plate made something other than area differ; (4) img `aspect-ratio` (T005) is structurally inert once the tile owns the ratio — recorded rather than added. All four are now 010's concern at most; the block was deleted by 010 T013. |
| T005 | partial, deleted | Two edits applied (padding var `--mosaic-pad-x`, bleed rule) — both removed with the whole block by 010's rewrite. Home.css verified to contain zero mosaic selectors today. |
| T006 | done as arithmetic, moot | With the bleed: (312 − 12)/2 = 150 px ≥ 148. Without: 137 px, below floor — the design could not satisfy FR-005 at 360 without the bleed or the rejected container-padding trade. |
| T007 | **never created** | Interrupted by the supersession before the file was written, so there is no orphaned red test to migrate and `tests/unit/category-masonry.test.ts` (010's, 38 tests at close of this task, green) already carries
the surviving claims. |
| T008 | not run | Nothing to run. |

**Locked files:** the five original qoder-ide locks were released by the human's order at 14:46
(moved to `.agent-pair/released/`); none was edited by me at any point in this task. My own locks
(`tests__unit__category-mosaic.test.ts`, `specs__009…status.md`, and the earlier
`app__(main)__home.css`) are all released now. The `.cat-tile__label` edit the pane was parked on
at 16:11 was never applied — the class it wrote is deleted, per the board's 18:28 note.

Nothing further is owed on 009.
