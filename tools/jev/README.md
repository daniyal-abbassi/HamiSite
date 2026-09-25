# Jev — structured second-opinion client

A thin client for TypeSafe **Jev** through NaraRouter's System One endpoint. Jev answers closed
questions about a state you supply and returns probabilities. It is an input to a decision, not a
decision.

```
Qoder/GLM  thinks, plans, writes code, executes
Spec Kit   defines what the product requires
Superpowers  defines how engineering work is done
Beads      tracks execution state and dependencies
.agent-pair  controls ownership, locks, coordination
Jev        answers "which of these, and how sure" — advisory only
```

## Setup

`JEV_API_KEY` lives in `.env` (gitignored — never move it into a tracked file, `BOARD.md`, a Beads
issue, or a commit). `.env.example` carries the empty template.

```
JEV_API_KEY=            # sk-nry-… — never printed by this client
JEV_SYSTEMONE_URL=https://router.bynara.id/v1/systemone
JEV_MODEL=jev
```

Verify with one harmless live request:

```bash
node tools/jev/smoke.mjs
```

## Use

```js
import { jev, isDecisive } from '../tools/jev/client.mjs';

const { answers, usage } = await jev({
  state: {
    spec: 'FR-012: unavailable products stay visible with an explicit out-of-stock state.',
    currentBehavior: 'CategoryHub filters out-of-stock products before render.',
    riskIfWrong: 'a shopper sees a product that cannot be bought',
  },
  questions: {
    approach: {
      type: 'choice',
      instructions: 'Which change best satisfies the quoted requirement?',
      criteria: {
        keep_visible: 'Render the product with an out-of-stock label and disabled purchase.',
        hide: 'Continue filtering unavailable products out.',
      },
    },
    needs_human: { type: 'noul', instructions: 'Does this contradict an explicit requirement?' },
  },
});

if (isDecisive(answers.approach)) {
  // strong separation between options — worth weighing
} else {
  // close probabilities. That is Jev declining, not a weak vote for the leader.
}
```

`state` accepts a string, object or array. Keep it to the minimum the question needs — never a
repository dump. Batch independent questions into **one** call when they share a state.

## Verified response shape

Confirmed against a live 200 on 2026-09-25 (`node tools/jev/smoke.mjs`, 13 live + 4 offline checks):

| type | fields |
|---|---|
| `choice` | `choice`, `probabilities` (sums to 1), `confidence` |
| `score` | `score` (interpolated float), `legend` (index → label), `probabilities` (index-keyed), `confidence` |
| `noul` | `noul` — a number 0..1, **no confidence field** |

Envelope: `model`, `answers`, `usage.input_tokens` / `usage.output_tokens` — snake_case.
There is **no `providerMetadata`**, unlike the Vercel AI Gateway surface.

## What this is not for

Do not ask Jev to: write code, generate files or explanations, design architecture, replace Spec Kit
requirements, override `.agent-pair` locks or Beads state, or authorize anything destructive,
irreversible, security-sensitive, financial or deployment-related.

**Secrets and security decisions are explicitly out of scope** — Jev must not adjudicate them.

A Jev failure is not permission to act. `JevError.kind` is one of `config`, `validation`, `network`,
`http`, `parse`; every branch means "continue with normal reasoning and say Jev was unavailable."
Never fabricate a result, and never re-issue a request that had a side effect.

## Two properties measured, not assumed

**It drifts.** The identical state produced `risk` = 1.17 / confidence 0.67 on one run and 1.12 /
0.71 on the next. Treat a score as a sample, not a measurement — do not build a threshold that one
re-run can cross.

**It will pick an option you did not intend to offer.** The first probe, prompted with "a modern
smartphone", returned an unmistakable iPhone — mute switch, two volume keys, pill speaker slit —
with no logo requested and none produced. Closed-set judgement is only as good as the options the
caller writes. If the right answer is not in your `criteria`, a confidence of 1.0 means nothing.

## Audit trail

When Jev materially influences a decision, record the compact form and nothing more:

```
[JEV] decision: choose implementation approach
      options: A / B / C
      jev_choice: B   confidence: 0.91
      final_decision: B
      reason: aligned with FR-012 + lower integration risk
```

No payloads, no state dumps, no key.
