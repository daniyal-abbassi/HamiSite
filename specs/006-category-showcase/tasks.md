# Tasks: Category Vitrine

**Spec:** [spec.md](./spec.md)  
**Plan:** [plan.md](./plan.md)  
**Task tracking:** Beads is authoritative. This file indexes the implementation phases and acceptance gates; do not use it as a second status tracker.

## Execution order

1. `HamiSite-basic-structure-hvr.3.1` — Remove category counts from the presentation contract; preserve nine names/routes and server-rendered links.
2. `HamiSite-basic-structure-hvr.3.2` — Build the RTL vitrine carousel, keyboard/touch behavior, and no-JS fallback. Depends on `.3.1`.
3. `HamiSite-basic-structure-hvr.3.3` — Apply the token frame and validate all nine supplied assets, the cream mark, luminance, label contrast, and prohibited content. Depends on `.3.1`; the mark is a hard visual-completion gate.
4. `HamiSite-basic-structure-hvr.3.4` — Integrate and verify all responsive, accessibility, LCP, layout-shift, and scroll-height criteria. Depends on `.3.2` and `.3.3`.

## Acceptance gates

- FR-065–FR-083 and SC-016–SC-023 in `spec.md` pass, with evidence; any changed requirement needs an owner-approved spec amendment.
- No guessed image quality or accessibility claims. Record the per-asset measurements and browser outcomes.
- `npm run typecheck`, focused tests, `git diff --check`, and `graphify update .` pass after implementation.

Use `bd show <issue-id>` for descriptions and acceptance criteria, and `bd ready` for currently unblocked work.
