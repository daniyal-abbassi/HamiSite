# Data Model: Audit Evidence

**Feature**: [spec.md](spec.md) | **Persistence**: Markdown report and Beads follow-ups only; no application schema change.

## Audit Run

One bounded review. Fields: date, reviewer, environment/build, browser and tool versions, access state, route scope, mobile/desktop conditions, and limitations. A run has one or more targets and evidence records.

**Validation**: A localhost or single-session result is never labeled field performance. Conditions identify the tested build and viewport or form factor.

## Audit Target

A page or journey. Fields: route, page state, access level, viewport, device profile, and interaction tested. A target belongs to a run and can have many evidence records and findings.

**Validation**: An inaccessible target is `unverified` with the missing condition stated. It cannot pass by inference.

## Evidence

A specific signal. Fields: category (performance, accessibility, SEO, best practices, agentic browsing), evidence type (field, real-user, trace, lab, browser observation, direct request, source hypothesis), conditions, result, source/tool, and timestamp when relevant. Evidence supports one or more findings.

**Validation**: Metrics include units and scope. Lab results record tool version and conditions. A source hypothesis is never called a measured failure.

## Finding

A visitor-facing concern. Fields: target, category, severity (`critical`, `high`, `medium`, `low`), confidence, impact, evidence reference, proposed correction or follow-up, and status (`open`, `corrected`, `unverified`, `deferred`). A finding can have a correction and repeat verifications.

**Validation**: Every finding identifies evidence type, target, severity, impact, and next action. `corrected` requires a comparable repeat check.

## Correction and Verification

Correction fields: finding reference, affected surface/file, behavior changed, reason. Verification fields: finding reference, date, equivalent target/conditions, after-result, check method, and residual limitation.

**State transition**: `open` → `corrected` only after a passing repeat check. `open` → `deferred` requires a Beads follow-up and blocker. `unverified` → `open` requires direct evidence. A later regression reopens the finding.

## Limitation

Missing evidence such as credentials, real-user data, Search Console access, a screen-reader session, or a stable lab host. Fields: affected target/category, reason, consequence for conclusions, and verification path.
