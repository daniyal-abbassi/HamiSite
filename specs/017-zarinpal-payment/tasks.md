# Tasks: Zarinpal Order Payments

**Input**: Approved specification and plan in this directory.

**Task tracking**: Beads is authoritative for status, acceptance criteria, and dependencies. This file is an ID index only; it is not a second checklist.

## Execution order

1. `HamiSite-basic-structure-vlc.1` — Approve and record the Zarinpal payment scope.
2. `HamiSite-basic-structure-vlc.2` — Harden Zarinpal gateway currency and environment behavior. Depends on `.1`.
3. `HamiSite-basic-structure-vlc.3` — Harden authenticated order payment initiation and zero-total settlement. Depends on `.2`.
4. `HamiSite-basic-structure-vlc.4` — Complete retry-safe Zarinpal callback verification. Depends on `.3`.
5. `HamiSite-basic-structure-vlc.5` — Add Persian payment result page and checkout connection. Depends on `.4`.
6. `HamiSite-basic-structure-vlc.6` — Document Zarinpal configuration and operations. Depends on `.5`.
7. `HamiSite-basic-structure-vlc.7` — Validate Zarinpal integration in an isolated environment. Depends on `.6`.

See `bd show <issue-id>` for the task description and acceptance criteria, and `bd ready` for currently unblocked work.
