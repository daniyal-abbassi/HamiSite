# Worker Dispatch Layer

Transport from the Boss session (Qoder + GLM) to three worker CLIs installed on this box:
**qoder**, **hermes**, **opencode**.

It is a transport, not a second orchestrator. It plans nothing, chooses nothing, and never runs a worker
it was not told to run. Everything about *what to build, in what order, and whether it is good* stays with
the Boss. This layer exists because spawning a worker by hand was already costing ownership mistakes: a
dispatched agent that edits a file another agent locked is the failure this script refuses before it starts.

```
Spec Kit      = requirements / source of truth   (specs/**/spec.md, blueprint.md, tasks.md)
Superpowers   = engineering methodology          (skills, not code)
Beads         = live execution + dependency state (bd, when reachable)
.agent-pair   = ownership: board, locks, heartbeats
Jev           = optional decision layer          (tools/jev)
Qoder + GLM   = the only Boss
worker CLIs   = execution specialists, spawned on demand and non-interactive
```

## Files

| Path | Role |
|---|---|
| `dispatch-worker` | the dispatcher. Bash, `set -u`, no dependencies beyond `python3`, `timeout`, `git`. |
| `workers.json` | the capability manifest — every flag with the command that proved it, and what is unverified. |
| `contract.example.json` | the task contract shape. |
| `smoke.prompt.md` | the read-only smoke brief. |

Artifacts land in the gitignored coordination dir, not in the board:

```
.agent-pair/inbox/<worker>/<task-id>.json   the compact result the Boss reads
.agent-pair/inbox/<worker>/<task-id>.log    the worker's full output, kept out of the board
.agent-pair/dispatch/active/<task-id>.json  live scope markers, used for the overlap refusal
```

## Worker capability matrix (detected 2026-09-25, `--help` output only)

| | qoder | hermes | opencode |
|---|---|---|---|
| binary | `/home/lain/.local/bin/qodercli` | `/home/lain/.local/bin/hermes` | `/home/lain/.opencode/bin/opencode` |
| on PATH for this session | yes (`qoder` shim, 1.1.63) | **no** | **no** |
| non-interactive | `-p/--print` + positional query | `-z/--oneshot <prompt>` | `run [flags] <message...>` |
| cwd | `-w/--cwd <dir>` | none → dispatcher sets process cwd | positional `[<directory>]` |
| structured output | `-o/--output-format <format>`, **values unverified** | none in `--help` | `--format default\|json` **verified** |
| write gate | `--permission-mode default\|accept_edits\|dont_ask\|auto\|bypass_permissions` | only `--yolo` (refused here) | `--auto` auto-approves; **absent = not approved** |
| tool restriction | `--tools`, `--allowed-tools`, `--disallowed-tools` | `-t/--toolsets <list>` | `--agent <name>` |
| resume | `-c`, `-r [id]`, `--session-id <id>`, `-n`, `--fork-session` | `--resume <id\|title>`, `--continue [name]`, `--pass-session-id` | `-c`, `-s <id>`, `--fork` |
| worktree | `--worktree [name]` | `--worktree` | none |
| model | `-m`, `--list-models`, budgets, `--reasoning-effort` | `-m`, `--provider` | `-m provider/model#variant`, `--agent`, `--title` |
| default routing | implementation, repo-heavy, spec-aligned | browser/runtime, visual QA, reproduction | independent implementation, review, second opinion |

Detection was done from this box, not from upstream docs:

```bash
ps -eo pid,ppid,etime,cmd | grep -E "qodercli|hermes|opencode"   # what is actually installed and running
qoder --version          # -> 1.1.63
timeout 20 qoder --help | head -45
timeout 25 hermes --help | head -40
timeout 20 opencode --help | head -32 && timeout 20 opencode run --help | head -34
timeout 30 hermes tools --summary   # -> "requires an interactive terminal" (so -t cannot be enumerated)
command -v bd                       # -> nothing: Beads is not reachable from this session
```

## How the Boss dispatches

Research, read-only, browser lane:

```bash
tools/dispatch/dispatch-worker --worker hermes --task 007-T009-support-reality \
  --prompt-file .scratch/t009.md --mode research --timeout 300
```

Implementation, with an owned scope it will claim and later release:

```bash
tools/dispatch/dispatch-worker --worker qoder --task 007-T059-fallback-fixes \
  --prompt-file .scratch/t059.md --mode implement \
  --owned components/home/assembly-band.css \
  --verify "npm run typecheck" --timeout 900
```

Browser/runtime, and a review, are the same command with a different worker:

```bash
tools/dispatch/dispatch-worker --worker hermes   --task 007-T027-height --prompt-file .scratch/t027.md --mode research
tools/dispatch/dispatch-worker --worker opencode --task 007-review      --prompt-file .scratch/review.md --mode research
```

Continuing a worker that already has context (the stored session id is read from its last result):

```bash
tools/dispatch/dispatch-worker --continue 007-T027-height --prompt-file .scratch/follow-up.md
```

Dry run, which prints everything and starts nothing:

```bash
tools/dispatch/dispatch-worker --worker opencode --task demo --prompt-file tools/dispatch/smoke.prompt.md --dry-run
```

Only when two workers are genuinely equally good, ask Jev to break the tie:

```bash
tools/dispatch/dispatch-worker --worker opencode --task demo --prompt-file f.md --jev --dry-run
```

`--jev` prints a candidate answer and still leaves the choice with the Boss. It is not called automatically.

## What the dispatcher enforces, in code

1. **Non-interactive only.** `-p`, `--oneshot`, `run`. No tmux, no keystroke injection, no attaching to an
   open TUI — that was ruled out as the transport before anything was written.
2. **Ownership before spawn.** For `--mode implement`, `--owned` is mandatory; each path is checked against
   `.agent-pair/locks/`, and a lock held by a *different* agent aborts with exit 3 and a pointer to the
   REQUEST protocol. The script never overwrites a claim.
3. **Scope overlap aborts a parallel dispatch.** Live markers in `.agent-pair/dispatch/active/` carry the
   owner's pid; a new dispatch whose scope intersects a live one is refused, with the advice to serialize or
   isolate. Dead markers are reaped.
4. **Beads is verified, never faked.** `bd` is probed. If present, `bd ready` must pass and the claim is
   attempted; if absent the result records `beads_status: "skipped-unavailable"` with the reason. In this
   session `bd` is **not reachable** (see `workers.json.beads.evidence`), so every dispatch is currently
   advisory on Beads and the Boss must reconcile `.beads` state itself or fix the PATH.
5. **Exit 0 is not success.** The worker must end with the contract JSON block, *and* every `--verify`
   command must be re-run by the dispatcher and pass. `completed` requires all three: JSON, verification,
   exit 0. A worker that says `blocked` stays `blocked` even on a clean exit.
6. **`changed_files` is measured, not self-reported.** The dispatcher snapshots `git status --porcelain`
   before and after and overwrites whatever the worker claimed. Read-only git only — the script itself never
   stages, commits, stashes, restores or resets.
7. **Secrets get a redaction pass.** `sk-…`, `Bearer …`, `JEV_API_KEY=…`, `token …` are replaced before the
   summary reaches the result JSON or the board. Worker env is inherited, never printed.
8. **Board posts are compact.** One header + result path + status + a 180-char summary. Transcripts stay in
   `.agent-pair/inbox/<worker>/<task-id>.log`.
9. **Locks are released on exit** (trap on EXIT), unless `--keep-locks`. This is the failure mode that cost
   this checkout hours on 2026-09-24: a lock left on disk after its work is done blocks whoever comes next.

## Concurrency rules

Parallel is safe when **all** of these hold, and the script enforces the first three:

- writable scopes are disjoint (enforced: overlap refusal);
- the Beads dependency graph allows it (not enforceable here while `bd` is unreachable — the Boss decides);
- no lock conflict (enforced);
- they are not editing shared integration files — `app/(main)/page.tsx`, `app/globals.css`,
  `app/(main)/home.css`, `lib/atmosphere/progression.ts`, `tests/unit/*`, `skills-lock.json`, `.env*`;
- test execution does not conflict — **never** two vitest runs at once (`tests/setup.ts` truncates 19 tables),
  and no bare `npm test`.

If scopes overlap: serialize, or isolate. `qoder --worktree` and `hermes --worktree` do it natively;
**opencode has no worktree flag**, so isolation there means a separate checkout or serialization.

## Known limitations, stated plainly

- **`bd` is not on this session's PATH**, so Beads claim/update/close is advisory-only right now. The 12-issue
  graph another agent seeded exists in `.beads/embeddeddolt` and was last touched at 22:38 by a process I
  cannot see. Fixing this is a PATH/ install question for the owner, not something to fake in code.
- **hermes has no verified read-only mechanism.** `-t/--toolsets` is accepted but its vocabulary cannot be
  enumerated non-interactively, and `--yolo` is refused. Research dispatches to hermes are therefore
  *prompt-restricted*, not *capability-restricted*. That is weaker than the rule asks for, and it is honest.
- **qoder's `--output-format` values are unverified** (`-o` exists, `--help` gives no choices). The dispatcher
  therefore does not request JSON from qoder and parses the fenced block out of plain output instead.
- **Session continuation is stored but not proven for all three.** qoder gets an assigned `--session-id`
  (strongest), opencode returns a session in its JSON envelope, hermes needs `--pass-session-id` which is only
  meaningful if its output actually prints the id. `--continue` warns and proceeds blind when a result has no
  stored id.
- **The worker's model config is whatever that CLI is logged into.** `--model` passes the flag; it does not
  validate the name. `qoder --list-models` is the way to check.
- **Cost and wall time.** A dispatched worker re-reads context from scratch, so a dispatch is not cheaper
  than doing the work inline — it is cheaper in *contamination* (its transcript never enters the Boss's
  context). Use it for lanes that produce artifacts, not for five-line edits.
- Nothing here touches application source, Spec Kit requirements, `.agent-pair/` infrastructure, Beads, or
  Superpowers. No new framework was added, and the thing named in the brief as forbidden was not installed.

---

# Persistent worker mode (tmux) — added after the first version

The headless mode above spawns a CLI per task. The owner's actual setup is **one GNOME Terminal window with
three tabs — Qoder, Hermes, OpenCode — running as persistent interactive workers**, and the requirement is to
command *those*, never to open another window or tab. `worker-ctl` is that layer. tmux is transport only; the
worker in each pane is still the same CLI.

## Why a migration is unavoidable, stated up front

The audit of the live box (2026-09-25 23:2x) says:

| worker | pid | controlling terminal | session leader | in tmux? |
|---|---|---|---|---|
| qodercli | 4416 | `pts/0` | bash 4138 | **no** |
| hermes | 17028 | `pts/3` | bash 16836 | **no** |
| opencode | 19627 | `pts/1` | bash 19438 | **no** |

All three `cwd` = this repo. The tmux server owned **zero panes**, and `hh-qoder`/`hh-hermes`/`hh-opencode` did
not exist. A running full-screen process cannot be moved into tmux without restarting it: that needs `reptyr`
(ptrace), which is not installed and blocked by `ptrace_scope=1`, and hijacking a live TUI's terminal is
unreliable even when permitted. **So adoption is refused rather than faked, and the one-time migration restarts
each CLI once — inside its existing tab, resuming its own session id.** `worker-ctl migrate` prints the exact
commands and runs nothing; nothing in this layer kills or restarts a worker by itself.

`tmux` itself was absent and is now installed (`apt install tmux`, tmux 3.2a — Ubuntu's documented method per
the wiki). Two unrelated DKMS packages (`openvpn-dco-dkms`, `v4l2loopback-dkms`) fail to configure on any apt
run on this box; tmux installed fine beside them.

## Commands

```bash
tools/dispatch/worker-ctl status                       # session / state / verified identity / pane pid
tools/dispatch/worker-ctl send hermes --task T027 --prompt-file f.md [--mode implement --owned a,b] [--dry-run]
tools/dispatch/worker-ctl output hermes --lines 400    # tmux capture-pane -p
tools/dispatch/worker-ctl stop   hermes                # C-c into the pane: turn aborts, CLI survives
tools/dispatch/worker-ctl continue hermes <session-id> # native --resume, same pane
tools/dispatch/worker-ctl migrate                      # the one-time per-tab procedure, printed only
```

## How a send works

Verify session exists → verify the pane really runs that worker → verify locks (`.agent-pair` convention, slash
to double underscore) → verify no live overlapping scope → probe Beads → refuse if the pane is BUSY or
WAITING_INPUT → build the brief → `tmux load-buffer` → `tmux paste-buffer -p` (bracketed paste, so no shell
interpolation touches backticks, `$`, quotes or newlines) → `send-keys Enter` → poll `capture-pane -p -S -3000`
for **this task's** contract JSON → write `.agent-pair/inbox/<worker>/<task>.json` + a `.pane` dump → one
compact board line → refresh `HEARTBEAT-<worker>.md`.

## What was proven, not assumed

- `status` with no tmux sessions → three honest `NO_SESSION` rows.
- **Identity is checked against the process tree, never the session name.** A `hh-qoder` running a
  hermes-named process returned `MISMATCH(hermes)` and `send` refused with `WORKER_IDENTITY_MISMATCH`. A pane
  running `sleep` returned `EMPTY-PANE` and was refused too. The first version only walked children of the pane
  and therefore reported a real worker as absent; it now uses tmux's own `pane_current_command` plus the pane pid
  and all descendants, and passes for both shapes (worker as pane process, and worker as child of the pane shell
  — which is what the migration produces).
- Dry run prints target pane, verified identity, state, scope, transport and prompt size, and pastes nothing.
- `changed_files` is diffed from `git status` by the tool, not self-reported.
- **Terminal presence is not permission**: `send --mode implement` without `--owned` is refused, and a locked
  path is refused, identically to headless mode.

## Field evidence from the headless lane, one honest failure

`dispatch-worker --worker hermes --task 007-T027-band-geometry` (the band measurement the 007 ruling needs) was
dispatched headless and came back `timeout`: exit 124 after 540s with an **empty log** — hermes' one-shot mode
produced nothing, almost certainly because a tool call wanted approval and nobody was there to give it. The
tool reported `timeout` and refused to call it success, which is the designed behaviour; the number is still
missing. That failure is itself an argument for persistent mode: inside a pane, `WAITING_INPUT` is *visible*
in `status` instead of silently burning the timeout.

## Persistent-mode limitations

- **State detection is a heuristic.** tmux cannot see a CLI's internal busy flag; `pane_state` reads the last
  non-empty lines for prompt/idle/approval markers. When it cannot tell, it says `UNKNOWN` — and a send into a
  `BUSY`/`WAITING_INPUT` pane is refused rather than queued into a running turn.
- **Completion is only proven by the contract JSON.** Otherwise the result says `COMPLETION_UNKNOWN`; there is
  no exit code to read from a pane, and the tool does not pretend there is one. `--verify` commands must be
  re-run by the Boss (headless `dispatch-worker` is the mode that runs them itself).
- **`continue` stores the wrong id for hermes.** The result's `worker_session_id` is the uuid the dispatcher
  generated, not one hermes issued; `--pass-session-id` output was not captured in the timeout run, so
  `--continue` is proven for qoder (assigned `--session-id`) and opencode (real `ses_…` in its JSON envelope),
  and unproven for hermes.
- No worker was adopted, restarted, killed or duplicated while building this.
