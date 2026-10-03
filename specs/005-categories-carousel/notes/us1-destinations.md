# T014 — The nine destinations, walked in a browser

**Run**: 2026-09-22, production build on `:3001`, 1280×900, Playwright.

Every panel's `href` was visited and the rendered listing counted, not the API's `total`.

| # | Department | Route slug | Seam `reachableCount` | Cards rendered | Empty state? |
|---|---|---|---|---|---|
| 1 | گوشی موبایل | `موبایل` | 8 | 8 | no |
| 2 | هدفون و ایرپاد | `هدفون-ایرپاد-و-هندزفری` | 19 | 12 (page size) | no |
| 3 | شارژر و کابل | `آداپتور-کابل-و-شارژر` | 9 | 9 | no |
| 4 | ساعت هوشمند | `ساعت-و-مچ-بند-هوشمند` | 7 | 7 | no |
| 5 | پاوربانک | `پاور-بانک` | 6 | 6 | no |
| 6 | لوازم کامپیوتر | `تجهیزات-کامپیوتر-و-لبتاب` | 5 | 5 | no |
| 7 | سیم‌کارت | `سیمکارت` | 3 | 3 | no |
| 8 | شارژر فندکی | `شارژر-فندکی` | 3 | 3 | no |
| 9 | خدمات آنلاین | `خدمات-آنلاین` | 1 | 1 | no |

**FR-002 / SC-002 hold: zero dead doors.** Counts match the seam exactly wherever they are below the
12-item page size, and audio is the only department where the rendered number is a page rather than a
total.

**One probe artifact, recorded so it is not mistaken for a defect.** The first pass reported 0 cards for
`موبایل`. That was the measurement, not the page: `موبایل` was the first `/shop` navigation after the
homepage, and Next dev-mode compiles that route on first request, so the check fired inside a 2.6s window
before the client fetch resolved. Re-run against the production build with a 9s settle, it renders 8
products with 8 `/images/catalog/<id>.jpg` photographs. The lesson is the same one feature 004 wrote down:
never measure a dev-mode route on its first visit.

**Two actions from panel to product (SC-001)**: a panel that is already active navigates on a single press;
an inactive one centres first and navigates on the next press. That is two actions for the shopper who
taps a neighbour rather than the centre, and one for the panel they were already holding — which is what
US1/2 and US1/5 jointly ask for.
