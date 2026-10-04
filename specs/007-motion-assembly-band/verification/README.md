# Band 007 verification harnesses

These instruments reflect [`../scope-amendment-no-pin.md`](../scope-amendment-no-pin.md). The pinned experiment
and its red pin assertions are historical; current verification measures the composed band in normal flow.

```bash
npm run dev &                        # then, once it answers:
node specs/007-motion-assembly-band/verification/content-parity.mjs
node specs/007-motion-assembly-band/verification/no-pin-foundation.mjs
```

- `content-parity.mjs` — compares the served HTML and hydrated DOM. It checks SC-004 and reports SC-008 as
  `UNAVAILABLE` while the missing historical source set remains unrecovered.
- `no-pin-foundation.mjs` — measures height at 360/390/1280, section/anchor integrity, horizontal overflow,
  forbidden sticky/spacer/timeline artifacts, no-JS headings and links, and reduced-motion heading visibility.
- `band-length.mjs` remains a compatibility entry point for `no-pin-foundation.mjs`.

Both scripts accept `BASE_URL` (default `http://localhost:3000`). The foundation harness also accepts `CHROME`
(default `/snap/bin/chromium`). Check the existing server before starting another process.

## Harness dependencies and limitations

- Playwright is loaded from `/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs`.
- Chromium is passed explicitly as `executablePath`; the default is `/snap/bin/chromium`, overridable with
  `CHROME`.
- The browser foundation harness reads the declared ground-anchor lists from `lib/atmosphere/progression.ts`
  and compares them with the current rendered page. `--negative-control` removes `#featured` from the page in
  the browser context and succeeds only if the drift check detects the missing anchor; it does not edit source.
- No frame-rate claim is made. The old pinned-sequence measurements are retained only as historical context.
- The pre-change screenshots and `baseline/content-before.json` do not exist. SC-008's historic comparison is
  reported as unavailable, never as a pass.
