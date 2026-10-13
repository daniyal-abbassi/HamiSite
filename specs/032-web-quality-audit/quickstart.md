# Quickstart: Repeat the Web Quality Audit

Read `.agents/skills/web-quality-audit/SKILL.md` and the [report contract](contracts/audit-report.md). Use [audit.md](audit.md) and [repeat-audit.md](repeat-audit.md) as examples of evidence labels and explicit limits.

## Install the audit skill in a clean checkout

This repository ignores `.agents/skills/`, so the project-local skill must be installed on each fresh checkout. The [FarsiUI listing](https://farsiui.ir/skills/web-quality-audit) points to `addyosmani/web-quality-skills`. Install the exact two files reviewed for this audit from revision `afa8da942115f2961fdbfa80807ea0b232ff6c00`:

```bash
revision=afa8da942115f2961fdbfa80807ea0b232ff6c00
base="https://raw.githubusercontent.com/addyosmani/web-quality-skills/$revision/skills/web-quality-audit"
mkdir -p .agents/skills/web-quality-audit/scripts
curl --http1.1 --retry 2 --retry-all-errors --fail --location --silent --show-error "$base/SKILL.md" -o .agents/skills/web-quality-audit/SKILL.md
curl --http1.1 --retry 2 --retry-all-errors --fail --location --silent --show-error "$base/scripts/analyze.sh" -o .agents/skills/web-quality-audit/scripts/analyze.sh
printf '%s  %s\n' \
  '1903cfb4dcba987d50dc7a51f6c19ec43830ff924c2c8f78979d8775fbe20f91' '.agents/skills/web-quality-audit/SKILL.md' \
  'b1b28663af412f746baf5008618e3ae798e322b10ff5ab7ae1830826a6d8e4e2' '.agents/skills/web-quality-audit/scripts/analyze.sh' | sha256sum --check
chmod +x .agents/skills/web-quality-audit/scripts/analyze.sh
```

If the download or checksum check fails, stop and inspect the source before using it. The revision URLs and expected hashes match the files installed for the initial audit; the installation does not change tracked application files.

## Prerequisites

- Work from the repository root with dependencies and the existing development database available. Keep `.env.test` separate from `.env`; do not reset or reseed for this audit.
- Use a browser with mobile and desktop viewport controls. Lighthouse 13.5 requests Node 22.19 or newer; use a compatible runtime or an available browser audit capability.
- Choose `/`, `/shop`, and one available `/shop/[slug]`. Record the exact slug and access state.

## Run sequence

1. Inspect `git status --short` and preserve existing edits. Check port 3000 and stop any server serving `.next` before the build. Run:

   ```bash
   npm run typecheck
   npm run test:unit
   npm run build
   ```

2. Start the built app with `npm run start`. Confirm the homepage and one referenced `/_next/static/chunks/*.js` both return 200; an HTML 200 alone does not prove hydration.
3. Visit all three targets at approximately 390px mobile and 1280px desktop widths. Exercise primary navigation and one product interaction. Check page title, description, canonical URL, `lang="fa"`, `dir="rtl"`, images, accessible names, keyboard behavior, and document-level overflow. Mark inaccessible states unverified.
4. Collect a focused Lighthouse or equivalent browser audit. For a performance decision, run at least three equivalent navigations and report median and range for LCP, INP or the relevant lab interaction measure, CLS, and diagnostic timings. Do not compare one lab run directly with field p75 data.
5. Run `.agents/skills/web-quality-audit/scripts/analyze.sh app` only as a source smoke test. It scans standalone `.html`/`.htm` source files; it cannot audit rendered Next.js pages, so zero findings on this app do not validate the storefront.
6. Re-run affected browser and automated checks after a correction. Record before/after evidence in `audit.md` and unresolved work in Beads. Stop the temporary production server after verification to avoid stale chunks at the next build.

## Expected outcomes

- The public targets render with Persian RTL metadata and loadable client chunks. Mobile and desktop browsing remain usable.
- Homepage discounted product links have names that include their visible offer/product content; Lighthouse `label-content-name-mismatch` has no affected elements.
- `robots.txt` responds successfully and is assessed independently of a transient lab timeout.
- Browser-streamed and crawler-head metadata are interpreted using [research.md](research.md).
- The report meets [contracts/audit-report.md](contracts/audit-report.md), and unverified performance concerns remain explicit follow-up work.
