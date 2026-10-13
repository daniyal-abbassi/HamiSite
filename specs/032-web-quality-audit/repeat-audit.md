# Repeat audit example: public shop baseline

**Date/reviewer:** 2026-10-13 / Codex. **Purpose:** Demonstrate the [report contract](contracts/audit-report.md) on an independently revisited public route. No new shop page change was made during this audit, so this is a **repeat baseline**.

## Scope and method

- **Environment/build:** Local `npm run build` served by `npm run start` at `http://localhost:3000`; public guest state. The configured `APP_BASE_URL` is localhost.
- **Browser:** Playwright with headless Chromium 154.0.8037.57; new browser contexts at 390×820 and 1280×820 CSS pixels, device scale factor 1; no CPU or network emulation. Production user conditions were not measured.
- **Journey:** Open `/shop`, inspect rendered metadata and controls, use the homepage's shop navigation, then follow the first available product link to `/shop/گوشی-موبایل-تی-سی-اچ-مدل-one-pro-دو-سیم-کارت-ظرفیت-128-گیگابایت-و-رم-6-گیگابایت`. The product slug is an observed local catalog example and may differ in another database.
- **Access:** Public pages only. Checkout, partner, and admin flows require accounts and were not exercised.

## Evidence

| ID | Category | Target and conditions | Result | Evidence type/source |
| --- | --- | --- | --- | --- |
| R1 | Accessibility / agentic browsing | `/shop`, 390px and 1280px | The first Tab reached the visible Persian skip link; a desktop shop checkbox sat within the visible `فقط پیشنهادهای ویژه` label. | Browser observation / rendered DOM and keyboard flow |
| R2 | SEO | `/shop`, both widths | HTTP 200; title `فروشگاه \| حامی همراه`, route-specific description and canonical, one `فروشگاه` H1, `lang="fa"`, `dir="rtl"`. | Browser observation / DOM and response |
| R3 | Best practices | `/shop` to product detail, both widths | The first product card opened the expected public detail route; no uncaught page error or smooth-scroll warning occurred. An expected guest `/api/auth/me` request logged HTTP 401. | Browser observation / navigation and console |
| R4 | Responsive layout | `/shop`, both widths | Document scroll width matched the viewport (390px and 1280px), with no document-level horizontal overflow. | Browser observation / DOM geometry |
| R5 | Performance | `/shop` | No shop-specific field or lab performance measurement was taken in this repeat baseline. Homepage lab results in [audit.md](audit.md) do not transfer to this route. | Unverified / no measurement |

The initial image probe found incomplete **lazy** images below the viewport before loading was requested. It did not establish an image failure. A simple control-name heuristic flagged the checkbox only because it did not inspect its containing `<label>`; the rendered label was present. Neither signal is reported as a confirmed defect.

## Findings and next action

**Confirmed findings: none in this bounded public shop repeat.** There is therefore no severity or confidence to assign to a visitor-facing defect, no code correction, and no correction verification to claim. The actionable uncertainty is R5: if shop performance becomes a decision point, run route-specific equivalent mobile labs and obtain a production field population. The broader homepage concern is Beads `HamiSite-basic-structure-abi`, with evidence in [audit.md](audit.md).

## Corrections and verification

No application file was changed for this shop baseline. The browser checks above verify only the observed public flow and metadata at the stated widths; they do not close an unrelated finding.

## Limitations and follow-up

- **Real-user performance:** No production URL, CrUX population, or first-party RUM dashboard was available. Obtain the deployed origin and period before making a field claim.
- **Authenticated states:** No suitable test account was supplied; checkout, partner, and admin behavior remains unverified.
- **Human accessibility:** No screen-reader session or end-to-end assistive-technology task was performed. The observed names and keyboard entry point are narrower checks.
- **Source hypotheses:** No source-only concern was promoted to a measured shop failure. A future report should label any such concern `source hypothesis` until reproduced.

## Contract check

The report includes scope and method, target-specific evidence with categories and source labels, the explicit zero-finding outcome, correction/verification state, and uncertainty with a follow-up path. No inaccessible or unmeasured check is marked passed. The finding-specific severity, confidence, impact, and code-location fields are inapplicable because this repeat found no confirmed visitor-facing issue; when a future finding exists, use the full fields in [contracts/audit-report.md](contracts/audit-report.md).
