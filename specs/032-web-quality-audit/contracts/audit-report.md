# Contributor Contract: Web Quality Audit Report

**Audience**: Project contributors and site owner. This is a documentation interface; it adds no HTTP endpoint or application data contract.

## Required report shape

1. **Scope and method**: date, build/environment, routes and journeys, access state, device widths, browser/tool versions, and limits.
2. **Evidence table**: category, target/conditions, result with units, and evidence type/source for each signal. Label field, real-user, lab, browser observation, direct request, and source hypothesis separately.
3. **Findings**: severity, visitor impact, exact evidence, affected route and source location when known, and a concrete correction or follow-up.
4. **Corrections and verification**: changed surface and reason, then an equivalent repeat check with after-result. Code inspection alone cannot close a finding.
5. **Uncertainty and follow-up**: inaccessible states, missing field data, contradictory diagnostics, human checks, and Beads IDs for unresolved work.

The first report is [../audit.md](../audit.md). Its presentation may expand, but these evidence fields remain required.

## Severity and confidence

| Severity | Meaning | Required action |
| --- | --- | --- |
| Critical | Security exposure or complete user task failure | Correct promptly and verify the journey. |
| High | Confirmed major accessibility barrier or user-visible performance failure | Correct before launch if bounded; otherwise record blocker and follow-up. |
| Medium | Measurable problem with narrower visitor impact | Correct within scope or schedule follow-up. |
| Low | Small improvement or compatibility warning | Resolve when proportionate. |

Confidence is independent of severity. One local lab score with a slow-CPU warning is a concern, not a confirmed real-user failure.

## Invariants

- Never present source-only observations as measured browser failures.
- Check the response sent to the relevant crawler before calling a user-agent metadata difference an SEO defect.
- Report failed checks and metrics; an aggregate score alone is insufficient.
- Never mark unavailable or authenticated journeys as passed.
- Preserve truthful product, price, stock, and contact copy and Persian RTL behavior.
- Close a finding after its repeat observation is recorded; carry broader work in Beads.
