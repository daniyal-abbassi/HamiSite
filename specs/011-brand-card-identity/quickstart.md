# Quickstart: Brand Card Identity

**Feature**: 011 | Proves: [contracts/brand-identity.md](./contracts/brand-identity.md) R1–R8

## Prerequisites

- 008's deck is built and its gate passes — verify before starting, because R7 is "unchanged", not "improved":
  `node specs/008-brands-stacking-cards/verification/measure-deck.mjs` must end `PASS`.
- `research/brand-identity-sources.md` present (it is; 21 KB, sourced per claim).
- Dev server in tmux `hh-dev` on `:3000`. If it is missing after a reboot:
  `tmux new-session -d -s hh-dev -c "$PWD" bash` then `tmux send-keys -t hh-dev "npm run dev -- -H 0.0.0.0 -p 3000" Enter`.
  Note the `--` — npm eats bare `-H`.

## 1. Run the tests

```bash
npm run test:unit tests/unit/brand-identity.test.ts
```

**Never bare `npm test` or bare `npx vitest run`** — that config loads `tests/setup.ts`, whose `resetDb()` deletes
nineteen tables from the real database. Expect `setup 0ms`.

Expected green, all provable without a browser: six lines, six sources, six dates; the blocklists absent; every
`L` inside 0.17–0.26 and every `C` at or below 0.055; the computed text contrast ≥ 4.5 : 1 on all six; the two
blues within 25° of each other and separated by `placement`; the two hueless records measurably different;
`hueFamily: "none"` ⇒ `placement: "house"`.

```bash
npm run typecheck
```

## 2. Look at the six cards

```bash
node tools/shots/viewport.mjs --width 360 --height 640 --scroll-to "#brands" \
  --out specs/011-brand-card-identity/verification/palette@360.png
```

The tool exists from 010. One Chromium at a time on this box; close it when done.

**R2** — the six grounds should read as one family: same lightness, hue varying. If any card looks *brighter* than
its neighbours, the envelope is broken in CSS rather than in data — check the custom properties, not the palette.

**R6** — confirm legibility on all six at 360, then at 1280. The arithmetic says one ratio covers all six; the
browser is checking that no overlay broke it.

## 3. The recognition test (R1, SC-001) — the one clause that needs a person

```bash
node specs/011-brand-card-identity/verification/recognition-test.mjs
```

It renders the six card grounds with names and wordmarks hidden into one image. Show it to someone who has never
seen the site, ask them to name the six, and record the count and the per-brand list.

**Bar: four of six**, with the two blue makers and the two hueless ones allowed to be confused (that allowance is
in the spec; do not quietly move it).

**If it misses**, take exactly one step: raise the chroma ceiling by a stated amount, re-screenshot, re-run, and
write down what the step cost. Do not adjust several things at once — the whole reason this clause is a count
rather than a discussion is that a single variable can be argued about honestly.

## 4. The truth check (R5) — a person must read this, a test cannot

Open `lib/brand-identity.ts` and `research/brand-identity-sources.md` side by side. For each of the six lines,
confirm the Persian says **what the cited source says** and no more. A test proves a blocked phrase is absent; only
reading proves an allowed phrase is not overstated.

Then confirm the four things that must appear nowhere on the page:

| Must not appear | Because |
|---|---|
| Apple's "Think different" | could not be verified this session |
| Nokia's "Connecting People" | could not be verified this session |
| Nokia presented as handset manufacturer | HMD holds the exclusive licence |
| realme presented as independent | an Oppo sub-brand again since January 2026 |

Also: no `#1428A0` labelled Samsung's, no hex labelled Nokia's or realme's or TCL's, and no maker's colour
described as official anywhere.

## 5. The deck must not have moved (R7)

```bash
node specs/008-brands-stacking-cards/verification/measure-deck.mjs
```

Compare clause by clause against 008's recorded pass: C1 six tops in order, C2 zero clipped of 25 evaluated,
FR-008 ≈ 3.06 screens, D2 height vs budget, C8 reduced-motion static stack, C9 three arrivals.

**Do not edit `measure-deck.mjs` to accommodate this feature.** It was fixed once already this cycle — for a real
bug, with a self-test added so it cannot recur — and a second edit made by the person being graded is a different
thing entirely. If a clause fails, the treatment changes.

## 6. RTL and press behaviour

- Six cards still navigate to their own brand listing in the same tab, topmost card only.
- The Latin wordmark is still isolated with `dir="ltr"` inside the RTL line (008's D8).
- No `letter-spacing` on any Persian line; product counts still Persian numerals.
- `grep -nE "(^|[;{[:space:]])(left|right|padding-left|padding-right|margin-left|margin-right)[[:space:]]*:" `
  inside the `.brand-deck` block returns nothing (R2's house rule, 008's D8).

## 7. Owner judgment

View on the phone at `http://<fresh-ip>:3000` — read `ip -br addr`, the address changes every reboot. If the
phone shows nothing, it is almost certainly the Windscribe DROP ahead of ufw; the two `iptables -I … 1` rules from
`hh-lan-dev-3000` need re-applying after any reboot or VPN reconnect.

Two questions, both from the spec and neither answerable by a measurement: does it feel like one shop's page, and
does it still feel expensive?

## 8. Definition of done

```bash
npm run test:unit && npm run typecheck && npm run build
```

All three clean, plus R1's count recorded, plus R5's human read done, plus 008's gate re-run with nothing newly
failing, plus the owner's verdict on their own phone. **Restart `hh-dev` after any `npm run build`** — a build
rewrites `.next` under the running dev server and silently breaks hydration.
