# 001. Reject premature seam for Deepen Catalog Filter and Search Coordination

- **Date**: 2026-10-18
- **Status**: Rejected / Permanent Decision
- **Candidate ID**: cand-filter-coordination

## Context
Candidate evaluated during architectural review. Deletion outcome: concentrates_complexity. Adapters: 2.

## Decision
Do not extract a new abstraction layer; retain direct in-process callers to prevent shallow wrapper proliferation.

## Consequences
Maintains low module indirection. Revisit only if 2+ distinct production adapters emerge.
