# Quickstart: Validate Storefront Performance

## Prerequisites

Use the existing checkout and production-equivalent configuration. Keep catalog data stable and obtain approved customer/partner test sessions without exposing credentials in evidence. Read [performance-validation.md](contracts/performance-validation.md) and [data-model.md](data-model.md) for sample rules and acceptance semantics. These are implementation-phase validation instructions; no new measurement runner is claimed to exist.

## Safe production build

From the repository root:

```bash
git status --short
node --version
npm run typecheck
npm run test:unit
pgrep -af 'next-server|next dev|next start'
ss -ltnp
```

Identify the exact process serving this checkout and stop it before building; never kill unrelated app processes. Preserve any needed old build outside the checkout with a unique path. Do not build into `.next` while its server is running.

```bash
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

If port 3000 belongs to another application, select and document a free port consistently across baseline/final runs. In another terminal, validate HTML and a referenced JavaScript chunk:

```bash
python3 - <<'CHECK'
import re
from urllib.request import urlopen
base = 'http://127.0.0.1:3000'
with urlopen(base) as response:
    html = response.read().decode()
    assert response.status == 200
chunk = re.search(r'/_next/static/chunks/[^" ]+\.js', html)
assert chunk, 'No client chunk found'
with urlopen(base + chunk.group(0)) as response:
    assert response.status == 200
print('HTML and referenced client chunk returned 200')
CHECK
```

Also open the real browser and activate a navigation control and the cart drawer. HTTP 200 alone is not proof of hydration. For subsequent builds, repeat the stop/build/restart procedure.

## Capture baseline

1. In browser developer tools or the authorized browser measurement interface, set the contract's viewport, CPU, and network profile and verify the controls are effective. If unavailable, report the exact missing capability; do not substitute screenshots or unthrottled runs for timing evidence.
2. Record browser/build versions, theme/motion, server warm state, route URLs, sample identities and session aliases in the evidence manifest. Use consistent product images and amounts; explain changed live data rather than comparing mismatched samples.
3. Record five fresh and five returning visits for each required route. Save raw timing results, traces, principal-content selectors and screenshots. Check that real content—not loading placeholders—is ready.
4. Execute each contract interaction at least 20 times from an equivalent initial state. Record feedback and completed-state timing separately; include rapid changes, delayed replies, empty/error states, and account switching where affected. Do not initiate payment or alter non-test orders.
5. Rank observed bottlenecks by measured impact. Link every proposed code change to its relevant evidence and semantic regression checks.

## Validate each change and final result

Repeat the same profile/content sequence after selected changes. Compare median content timing, CLS, and p95 action feedback/completion as defined in the contract. Keep improvements only when their measured gain does not violate semantic or visual requirements. Inspect changed public reader semantics with focused unit tests; inspect private-data and mutation behavior in approved accounts. Run DB integration tests only after verifying an isolated disposable database; never reseed the existing application database.

```bash
npm run typecheck
npm run test:unit
git diff --check
```

Run the production build using the safe lifecycle above, then confirm browser hydration again. Run `graphify update .` after implementation source changes. Complete all seven route comparisons, affected admin/TMA smoke scenarios, both viewport captures, keyboard/reduced-motion checks, and owner visual assessment. Record unsupported throttling, unavailable accounts, external outages, and unmet targets as limitations; none is an automatic pass. Update the Beads implementation issue and Spec Kit evidence without claiming incomplete gates are complete.
