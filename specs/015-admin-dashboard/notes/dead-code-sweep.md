# 015-T040 — repo-wide junk and dead-file sweep

**Mode: report only. Nothing was edited, deleted, moved, or `git rm`'d.** This file is the entire
output of the task.

Method, so the coverage claims below can be audited:

- Unimported files were found by parsing **exported symbol names** out of all 205 `.ts`/`.tsx` files
  under `components/`, `lib/`, `app/` (function / const / class / interface / type / enum / named-export
  lists, plus the basename), then searching the whole tree — including `tests/`, `types/`, `scripts/`,
  and `tools/` — for each name as a word. Next entrypoints (`page`, `layout`, `route`, `loading`,
  `error`, `not-found`, `template`, `default`) were excluded from the candidate list because they are
  reachable without an import. **Two first-pass false negatives were caught and corrected by a second,
  per-name pass**: a word-boundary match inside a *doc comment* (`Alert` appears in `Tooltip.tsx:15`
  prose) and a self-referencing type name (`Spinner` in `spinner.tsx:36`) both made two genuinely dead
  files look imported. The table below reflects the corrected result.
- No `jg` / jevgrep was run. No installs, no build, no dev server, no browser.
- `npm run typecheck` — **passes clean, zero errors.**
- `npm run lint` — **the script does not exist.** `package.json` has no `lint` entry and there is no
  `eslint.config.*` or `.eslintrc*` anywhere in the repo. So there is no lint signal to report, and
  there never has been. This is itself a finding, listed below.

Sorted by **risk of leaving it in**, highest first. "Risk of leaving it in" ranks how bad the outcome
is if nobody acts — things that look live and ship broken rank above things that are merely untidy.

| file:line | what it is | why it is junk | safe to remove? |
|---|---|---|---|
| `components/admin/coupons/CouponsAdminClient.tsx:38` | 132-line finished-looking coupons CRUD client | **Exported and never imported.** The live page `app/(admin)/admin/coupons/page.tsx:8` renders `<EmptyState title="مدیریت کوپن‌ها آماده‌سازی نشده است." />` instead. Confirmed the 2026-09-28 audit at line 29 — still true. It also invents persistence the product does not have: `admin_coupons_session` in `localStorage` (lines 47, 56) keeps a *list of coupons this browser made*, which reads as real inventory to an admin and vanishes on another device. Shipping it as-is would be worse than the empty state. | **needs-owner** — either wire it in *and* drop the localStorage fiction, or delete. `app/api/admin/coupons` does exist, so the backend half is real; only the client is orphaned. Owner decides which way. |
| `components/admin/ui/Alert.tsx:34` | admin alert/banner component | **Zero importers.** The word-boundary search returns exactly one hit outside the file, and it is prose in `Tooltip.tsx:15`, not an import. | **needs-owner** — part of the untracked `components/admin/ui/` kit that landed today; the kit's owner may still intend to wire it. Check with whoever built the kit before removing. |
| `components/admin/ui/Tooltip.tsx:32` | admin tooltip | **Zero importers.** Only non-definition hit is the `Tooltip` name inside `docs/inspires/**` (reference tree, not code). | **needs-owner** — same as Alert. |
| `components/admin/ui/Checkbox.tsx:52` | admin checkbox | **Zero importers.** Same name exists in `docs/inspires/techBazar` and `hami-hamrah-luxury`, but those are the frozen reference tree — they do not import from this repo. | **needs-owner** — same as Alert. |
| `components/admin/ui/spinner.tsx:44` | admin loading spinner | **Zero importers.** The only other occurrence of "spinner" in the codebase is a *comment* in `components/ui/button.tsx:79` describing the button's own loading state. | **needs-owner** — same as Alert. |
| `components/admin/StatCard.tsx:13` | admin stat card | **Zero importers.** The dashboard was just rebuilt to composition (`sections/*` + `states/SectionState`), and none of the four new sections import it. This is what the rebuild superseded. | **needs-a-check-first** — confirm no in-flight lane is reintroducing it. It is *tracked and modified-adjacent* to the dashboard work, so it may be mid-decision, not mid-deletion. |
| `lib/shop-query.ts:75` | `subtreeCounts()` | Exported, **zero references** anywhere in the repo. Carried over unresolved from the 2026-09-28 audit line 31. | **yes** — one-line deletion, no callers to break. |
| `components/liquid/motion.ts:71` | `EASE_OUT_STRONG` easing constant | Exported, **zero references**. The sibling easings in the same file *are* used, so the omission is specific. Audit line 32; still live. | **yes** — but see "needs-a-check-first" note in the risk table's sibling row below; if call sites hand-write the same curve, the better fix is to import it. |
| `components/atmosphere/useAtmosphereGround.ts:132` | `STAGE_COUNT` | Exported, **zero references** (audit line 93 listed it). | **yes** — same as subtreeCounts. |
| `lib/content/home.ts:213` | `storeExperienceSlots` | Exported array, **zero references** (audit line 93). | **yes** — confirm with the home-page owner first that it is not staged content; the array being populated makes it *look* deliberate. |
| `package.json` (no `lint` key) | missing lint gate | There is no `lint` script and no ESLint config in the repo. `npm run lint` exits `Missing script: "lint"`. Nobody has been linting this codebase; type errors are caught, style and hook-rule violations are not. | **needs-owner** — adding a gate is a decision, not a cleanup. Flagging so it stops being assumed to exist. |
| `start-err.txt` (root, 0 bytes) | empty file | **Tracked, 0 bytes.** `*.log` is gitignored, which is why the sibling escaped the pattern. Audit line 51 flagged it; still tracked. | **yes** — `git rm --cached start-err.txt` + gitignore entry. Zero content to lose. |
| `start-log.txt` (root, 148 B) | stale `next start` log | **Tracked.** Content is a `Next.js 14.2.35` startup log — and the project is on Next 15.5.25. Doubly dead: wrong version *and* a log. | **yes** — same treatment. |
| `aura-landingSample.html` (root, 41.7 KB) | scratch landing page | **Tracked.** Not referenced by any build input. It *is* cited in `tailwind.config.ts:6` and `.superdesign/init/*.md` as the design reference the palette was derived from — so the file has documentary value, but it is not source and does not belong at repo root. | **needs-a-check-first** — the design provenance is real. Move it under `docs/` rather than delete; only the location is wrong. |
| `.specify/integrations/.cache/*.json` (4 files) | tool cache | **Tracked.** Hash-named catalog caches; regenerable by the specify CLI, machine-specific, and already noted as junk at audit line 92. | **yes** — untrack and add `.specify/integrations/.cache/` to `.gitignore`. |
| `components/admin/Pagination.tsx` | older pagination | **Already deleted in the worktree** — `git status` shows ` D`, and nothing imports it (all three admin clients import `@/components/admin/ui/Pagination`). The brief's suspected duplicate is resolved; the duplicate is `ui/Pagination.tsx` (tested, via `tests/unit/admin-pagination-range.test.ts`). **The file is still in the index**, so the deletion is uncommitted. | **needs-owner** — belongs to whoever holds the working tree. Reported, not touched: staging a deletion is a git write, and another agent may be mid-commit. |
| `components/ui/badge.tsx:31` | generic `Badge` + `badgeVariants` | **Zero importers.** Meanwhile the admin uses `components/admin/StatusBadge.tsx` (`StatusBadge`, `ActiveBadge`) in five files. Two badge systems, one live. | **needs-owner** — `components/ui/badge.tsx` may predate the admin and be intended for the storefront. Not dead if a storefront lane is open. |
| `components/admin/EmptyState.tsx:10` vs `components/admin/states/SectionState.tsx:19` | two empty-state renderings | **Not a duplicate in the way it looks.** `SectionEmpty` is a thin wrapper that delegates to `EmptyState`. There is one implementation with two entry shapes — legitimate. Listed so nobody "de-duplicates" the wrapper. | **no** — keep both. Recorded to prevent a wrong cleanup. |
| `components/admin/coupons/page.tsx:8` — *the page itself* | half-finished feature | Not junk — a deliberate stub, and it is honest: it says "not ready". Listed because it is the thing gating the `CouponsAdminClient` decision above, and because the sidebar nav (`AdminSidebar.tsx:33`) **does** point at `/admin/coupons`, which resolves to a real page. **No nav entry 404s.** All seven nav hrefs (`/admin`, `/orders`, `/products`, `/users`, `/categories`, `/brands`, `/coupons`) have a matching `page.tsx`. | **no** — working as intended. |

### What the sweep found nothing of

Stated plainly so the coverage is not overclaimed:

- **No `TODO`, `FIXME`, `XXX`, "not implemented", or stub-gate comments** in `components/`, `lib/`,
  or `app/`. The grep returned zero hits.
- **No nav entry pointing at a 404.** All seven admin routes exist.
- **No tracked-but-gitignored files.** Every path `.gitignore` claims is genuinely untracked; the
  ignore rules and the index agree.
- **No untracked scratch leaking in.** The untracked set is entirely today's intentional work
  (`components/admin/ui/`, `sections/`, `states/`, `useSection.ts`, `specs/015-*`, the new tests,
  the new `tools/` scripts) — plus nothing stray. `.agent-pair/`, `.scratch/`, `.next/`,
  `graphify-out/`, and the `.qoder/`/`.claude/` trees are all correctly ignored.
- **No duplicate Toman/decimal formatters.** `formatToman` and `toFaDigits` each have exactly one
  definition (`lib/utils.ts:9`, `lib/utils.ts:24`). Every call site imports from there. The
  `.toLocaleString("fa-IR")` calls scattered across admin and checkout are counting *quantities*,
  not money — a different job, not a second money formatter.
- **`lib/payment/zarinpal.ts`** — the 2026-09-28 audit's unguarded `payload.data.code` is still
  unguarded (lines 35, 58) and still has no `response.ok` branch. Real, but **out of scope**: money
  path, and the brief excludes `app/api/**` from proposed changes. Recorded, not proposed.

## I did not check

- **`npm run lint` — not run, because it does not exist.** No ESLint config, no script. Nothing was
  substituted for it; there is no alternate lint gate in this repo.
- **Nothing under `app/api/**`, `data/**`, or `prisma/**`** — excluded by the brief (Constitution III).
  The zarinpal note above is the one place I looked adjacent to that boundary; I did not read the
  route handlers.
- **Dead code inside `app/api/**`, `prisma/**`, `data/**`** — not swept at all. If the owner wants
  that surface covered, it needs a separate task with the frozen-lane question settled first.
- **Test-file dead code.** `tests/**` was searched *as an importer* (which is how
  `admin-pagination-range.test.ts` proved `ui/pagination-range.ts` alive), but unused exports *within*
  tests were not audited.
- **Runtime verification of any kind.** No dev server, no browser, no build, no request to a live
  page. Every claim here is static: a name that no file in the tree mentions is unimported *as far as
  static search can see*. A component mounted only by a string-concatenated import path would not be
  found by this method — I searched symbol names, not just paths, which closes the barrel-re-export
  case, but a purely dynamic `import(\`./${name}\`)` would still slip through. I found no such
  pattern, but I did not prove none exists.
- **`npm run test:unit`** — not run. No test signal was needed: every finding above is a static
  reachability question, and the brief says to run it only if I needed one.
- **`docs/inspires/**`** — name collisions there (`Checkbox`, `Tooltip`, `pagination.tsx`) are the
  frozen reference tree, excluded from root `tsconfig.json`. I confirmed they do not import from this
  repo rather than treating them as false negatives.
- **`.claude/worktrees/ecstatic-tereshkova-83e205/`** — a stale git worktree checkout, ~a full second
  copy of the tree, present on disk. I did not assess it (removing a worktree is a git write and
  another agent's call), but it is worth the owner looking at.
- **Repo weight.** Tracked files total ~153 MB, dominated by `assets/products-untrimmed-backup/`
  (5.3 MB), `assets/generated-products/` (6.0 MB) and `assets/generated-placeholder/` (1.5 MB) —
  none referenced from code, though `scripts/make-product-placeholder.py:31` does write the last one,
  so it is regenerable rather than orphaned. Not ranked in the table: it is a size question, not a
  correctness one, and the owner may want the backup images deliberately.
