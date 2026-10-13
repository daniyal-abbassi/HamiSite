# Research: Web Quality Audit

**Date**: 2026-10-13 | **Feature**: [spec.md](spec.md)

## Source and installation

**Decision**: Use the two-file skill linked by [FarsiUI](https://farsiui.ir/skills/web-quality-audit), pinned for the initial audit to upstream revision `afa8da942115f2961fdbfa80807ea0b232ff6c00`. Keep both files unchanged in `.agents/skills/web-quality-audit/`.

**Rationale**: This matches the requested Codex project install path and preserves the upstream method and smoke-test script. The script only scans standalone HTML, so a zero result on this Next.js source tree is not a rendered-page pass.

**Alternatives considered**: Rewriting the skill breaks provenance; installing sibling skills broadens scope. The project skill path is gitignored, so this is currently a local checkout installation.

## Measurement and performance decisions

**Decision**: Separate field, first-party real-user, browser trace, Lighthouse lab, direct browser observation, and source hypotheses. Record exact target, state, tool version, viewport, throttling, and cache conditions. Before acting on a headline performance metric, use at least three equivalent runs and report median and range.

**Rationale**: The [upstream measurement workflow](https://github.com/addyosmani/web-quality-skills/blob/main/skills/performance/references/MEASUREMENT.md) makes these evidence distinctions. The initial production lab run showed LCP 4.33 seconds and TBT 4.52 seconds, but warned of a slow host CPU. It is a diagnostic concern, not proof of field Core Web Vitals failure.

**Alternatives considered**: Treating the 43/100 score as a release verdict hides environmental uncertainty. Static inspection alone cannot establish runtime impact.

## Scope and persistence

**Decision**: Review the public homepage, shop, and an available product page at mobile and desktop widths. Keep findings in `audit.md` and unresolved work in Beads. Mark authenticated journeys unverified without suitable test access.

**Rationale**: These pages cover discovery through product inspection without creating transactions. An occasional contributor report needs no database schema.

**Alternatives considered**: Marking inaccessible routes passed overstates coverage; PostgreSQL report storage adds complexity without a user need.

## Metadata interpretation

**Decision**: Preserve the existing `htmlLimitedBots` policy and inspect the actual crawler response when browser-mode Lighthouse disagrees with visible metadata.

**Rationale**: [Next.js 15 metadata documentation](https://nextjs.org/docs/15/app/api-reference/functions/generate-metadata) explains body streaming for ordinary browsers and head metadata for HTML-limited bots. A Googlebot request received the description in `<head>` locally. Disabling streaming to change a lab score could increase response latency.

**Alternatives considered**: Globally blocking metadata for every browser without evidence of crawler failure.

## Tool and build compatibility

**Decision**: Use existing typecheck, unit tests, production build, browser checks, and focused Lighthouse runs. Keep Lighthouse temporary. Use a compatible Node runtime for future Lighthouse 13 runs; 13.5 requests Node 22.19 or newer, while the initial run used 22.17 with an engine warning.

**Rationale**: The constitution requires real-browser and build verification. Building while a server serves `.next` can leave stale, unhydrated HTML.

**Alternatives considered**: Development-server performance scores include compilation noise. Adding Lighthouse permanently is unnecessary for an occasional audit.

## Resolution

No technical clarification remains. Public-homepage mobile performance is the open investigation in `HamiSite-basic-structure-abi`.
