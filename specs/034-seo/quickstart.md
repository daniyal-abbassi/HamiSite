# Quickstart: Reproduce the Storefront SEO Review

**Feature**: [spec.md](spec.md) | **Expected behavior**: [SEO contract](contracts/seo-contract.md)

## Prerequisites

- A clean checkout with Node dependencies installed, configured application environment, and access to the existing catalog database. Keep development and test database schemas separate; do not reset or reseed catalog data for this audit.
- A browser that can inspect rendered pages at mobile and desktop widths. Lighthouse SEO is useful when available.
- Use a nonproduction environment for corrections. Record its origin and date; do not infer production indexing from local results.

## Install the selected guidance

The FarsiUI SEO listing corresponds to the upstream `seo` skill in `addyosmani/web-quality-skills`. From the project root on a clean checkout, run the published installation command:

```bash
npx --yes skills add https://github.com/addyosmani/web-quality-skills --skill seo --yes
```

Select Codex/project installation if prompted. Confirm `.agents/skills/seo/SKILL.md` and its `references/STRUCTURED-DATA.md` are available. Record the installed source revision or skill version in the audit report. The local skill directory is ignored by Git, so rerun this step on a clean checkout. The [upstream listing](https://www.skills.sh/addyosmani/web-quality-skills/seo) and [source](https://github.com/addyosmani/web-quality-skills/blob/main/skills/seo/SKILL.md) are the provenance.

## Start and sample

Start the existing application with its normal database configuration:

```bash
npm run dev
```

Verify the actual bound port before recording the origin; a stale Next server may occupy port 3000. Open the page in a browser and verify that client assets and interactions work. Set the URL for the confirmed server in a separate terminal:

```bash
export SEO_AUDIT_BASE_URL=http://localhost:3000
curl -i "${SEO_AUDIT_BASE_URL}/robots.txt"
curl -i "${SEO_AUDIT_BASE_URL}/sitemap.xml"
```

The first HTML request may time out while Next compiles a route. Retry it after compilation and record both the cold behavior and warm response; do not infer an application error solely from a cold timeout. Inspect an image URL and one `/_next/static/` client chunk from the rendered page to confirm resources load.

Choose current product, category, and brand samples from the returned public URL listing, then check they open and show current catalog content. Also sample `/`, `/shop`, one private journey (for example `/account`), and a deliberately nonexistent product URL. If a page type lacks a current record, mark it unverified with the reason. Do not invent sample data.

## Audit and record

For every sampled public page, record the requested and final URL, response status, redirect chain, preferred URL, indexing signal, sitemap membership, title/summary, heading and main content, representative internal links, and image descriptions. Inspect the rendered page at desktop and mobile widths. Check that essential content and navigation remain available. Compare product/organization structured facts with visible content and verified catalog/contact facts.

Include representative sort, filter, pagination, and alias URLs. Compare the product links on `/shop` and `/shop?page=2` and check the preferred URL on both; inspect a category or brand filter and a search variant too. Decide whether each actually changes substantial content before choosing its preferred URL. Record requested and final URLs even when no redirect occurs. Check `robots.txt` rules together with page responses: a disallow alone does not prove that a page is absent from a search index. A streaming 404 UI can arrive with HTTP 200, so record both status and visible result.

Run Lighthouse SEO if available and retain its detailed findings, not just its score. For performance or Search Console conclusions, record the measured report or mark the outcome unverified. Save the environment, date, sample URLs, checks, findings, and repeated-check results in `specs/034-seo/audit-report.md` using the format specified by the [contract](contracts/seo-contract.md). The report itself is created during implementation.

## Verify corrections

Repeat the exact failed observation after each correction. Run focused regression checks for behavior that was changed:

```bash
npx vitest run --config vitest.frontend.config.ts tests/unit/seo.test.ts tests/unit/persian-seo.test.ts
npm run typecheck
```

Before `npm run build`, stop any running Next server because the build replaces its `.next` files. Run the build, restart the application, and verify browser interactions and client chunks again. Review mobile/desktop layout, Persian RTL, and the accuracy of all product claims. A local pass establishes only local behavior; indexing, ranking, and rich-result display need later search-platform evidence.
