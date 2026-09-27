# Jev advisory — the three judgement calls in 009

**Asked**: 2026-09-26, via `.scratch/jev-009-decisions.mjs` against `tools/jev/client.mjs`.
**Policy** (`tools/jev/README.md`): Jev is advisory. It never authorizes anything, and an answer is not a reason
to act. Nothing below was done *because* Jev voted for it; each is recorded so the human weighing it can see the
odds and the dissent.

`isDecisive()` requires a top probability ≥ 0.80 **and** a margin ≥ 0.25. Two of three answers failed that bar,
and the failure is the finding — a near-tie is Jev saying *ask a human*, not a weak vote for the leader.

---

## 1. Hero asymmetry — **not decisive, and it argues with the owner**

| Option | p |
|---|---|
| All nine tiles equal area; hierarchy by label weight and scrim only | **0.66** |
| Keep as chosen: hero 2×2 + two mediums + six smalls | 0.30 |
| Hero + eight equal smalls (drop the medium tier) | 0.03 |
| Nine identical tiles, no hierarchy at all | 0.01 |

**Read**: Jev's top choice is *not* the owner's pick. It accepts hierarchy in typography while refusing it in
**area**, which is a coherent position — FR-006 says size must not imply a lesser doorway, and area is exactly
the channel that does.

**Action**: **none.** The owner chose the mosaic with a size hierarchy deliberately, after seeing all three
options rendered in `mockup.html`. This note exists so that if a shopper later reads the six small tiles as
second-class, there is a record that the risk was named before the build rather than discovered after.

Notably, Jev ranked "flatten to nine identical tiles" last at 0.01 — it agrees with the owner that a uniform
grid is the wrong answer; it only disputes how much asymmetry is safe.

---

## 2. Lock escalation — **decisive (0.81), and it matches the plan already written**

| Option | p |
|---|---|
| Build only what needs no lock; leave the carousel mounted; escalate to the human | **0.81** |
| Write a parallel component and switch the mount point, leaving locked files untouched | 0.19 |
| Edit the locked files anyway because the holder looks inactive | **0.00** |
| Keep waiting for a board answer | 0.00 |

**Read**: the two zero-probability options are the two an agent under deadline pressure is most tempted by.
`copy_and_swap` at 0.19 is the interesting dissent — it is technically clean and it is also the path that leaves
the codebase with two category components and a future reader unable to tell which is real.

**Action**: already the plan. `plan.md` §"Lock contingency" states exactly this: no lock violation, unlocked work
first, stop with the old presentation still mounted, escalate. Jev corroborates the decision; it did not create
it.

---

## 3. The two 1.2–1.5 MB PNGs — **not decisive, and genuinely the owner's call**

| Option | p |
|---|---|
| Do not ship until every panel is under ~500 KB | **0.49** |
| Ship now with lazy loading and explicit dimensions | 0.42 |
| Ship now, convert later, no mitigation | 0.09 |

**Read**: a coin flip between two positions that differ in one respect only — whether the phone panel is the
hero. It is, and it is a PNG, so the worst case is not "a slow page" but "a slow *first* page for the shopper on
TD-LTE who is the entire audience". The 0.09 on unmitigated shipping is the one clear signal in this answer.

**Action**: none taken. This is recorded as an open pre-ship decision for the owner, with the note that
`plan.md` already defers conversion and that `quickstart.md` §10 requires the no-layout-shift behaviour
regardless of which way it goes.

---

## What this run also proved about the client

`router.bynara.id` publishes a AAAA record and this box's IPv6 path is dead, so every call hung until its abort
and reported **"Jev unreachable"** — the exact false negative that made a provider outage look like a bug in this
repo. Two lines in `client.mjs` (`dns.setDefaultResultOrder('ipv4first')` +
`net.setDefaultAutoSelectFamily(false)`) took the smoke suite from "unreachable" to **ALL CHECKS PASSED**, and a
5xx now reports as an upstream outage instead of a transport failure. Both changes were requested by the lock
holder itself on `.agent-pair/BOARD.md` at 03:18.
