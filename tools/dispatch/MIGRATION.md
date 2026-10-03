# One-time migration card — type these in your EXISTING three tabs

Nothing here can be done by the Boss. Verified on this box at 23:39:

- `/proc/sys/dev/tty/legacy_tiocsti = 0` — the kernel forbids any process from injecting input into another
  process's terminal. There is no other door into a PTY's stdin.
- `xdotool` and `ydotool` are **not installed**, and GUI keystroke injection was ruled out as the transport anyway.
- Writing to `/dev/pts/0` (or 1, or 3) only paints the screen. The CLI would see the text appear and receive
  nothing — a fake migration with extra steps.
- Killing the workers does not help either: after a kill, each tab is a bare shell the Boss still cannot type
  into, so you end up with three dead workers and no tmux session. Strictly worse.

So: 6 lines, typed by you, once. No new window, no new tab, no relaunch per task afterwards.

---

## Tab 1 — Qoder CLI (`pts/0`, pid 4416)

Its own session transcript is `c197affe-385b-4653-ae12-5c068dbc5e09`, last written 2026-09-24 19:34 — the same
minute as its final board post, and its first message is "go and proceed with the boss agent commands". That is
the qoder agent's session, not the Boss's.

```
/exit
tmux new-session -A -s hh-qoder
qodercli --resume c197affe-385b-4653-ae12-5c068dbc5e09
```

⚠️ **Do not use `qodercli -c` / `--continue` from this tab.** `-c` picks the most recent session for the
project, and the most recent one is `79faef2e…` — the Boss's own live transcript (written at 23:39). Continuing
that from a second process puts two agents in one conversation. Same trap for the three newer files
(`068ce3e9`, `16c65165`, `8938a7bb`): those are the Boss's headless smoke dispatches, not the tab's history.

## Tab 2 — Hermes (`pts/3`, pid 17028)

No session store could be located for the live tab (`~/.hermes/sessions/` holds only `request_dump_*` files,
newest 2026-09-15), so resume cannot be verified here. The other agent on this box checked its open file
descriptors at 21:41 and found it had written nothing to the repo. Starting fresh is the honest option.

```
/exit        (or Ctrl-C)
tmux new-session -A -s hh-hermes
/home/lain/.local/bin/hermes
```

## Tab 3 — OpenCode (`pts/1`, pid 19627)

Two session ids appear in its log (`ses_f265b90bdffebG4qps0ZBKe53F`, `ses_f2a2f2c31ffebSk6t3owqEwrmk`) but
neither is provably the tab's, and the Boss's headless `opencode run` smoke tests created newer sessions in the
same store, so `--continue` may restore a smoke test instead of the researcher. `sqlite3` is not installed to
check the store. Start fresh unless you know which one is yours.

```
Ctrl-C       (or :quit)
tmux new-session -A -s hh-opencode
/home/lain/.opencode/bin/opencode
```

---

## After you type them

```
tools/dispatch/worker-ctl status
```
Expect three rows with `IDENTITY OK`. `worker-ctl send <worker> --task <id> --prompt-file <f>` then works
without ever touching a terminal window again, and closing a tab no longer kills the worker — reopen it with
the same `tmux new-session -A -s hh-<worker>` line.

**If you want the Boss to be able to type into tabs in future** (not recommended): that means
`sysctl -w dev.tty.legacy_tiocsti=1`, a machine-wide kernel security downgrade that re-enables a
CVE-class primitive for every process, plus installing xdotool and driving the GUI. The Boss will not do that on
its own; it is an explicit owner decision, and the 6 lines above cost far less than it.
