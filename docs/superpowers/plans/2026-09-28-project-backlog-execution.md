# Project Backlog Execution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Systematically execute and reconcile unbuilt storefront work streams (W1–W6) documented in `specs/PROJECT-BACKLOG.md` without breaking existing code, violating multi-agent coordination locks, or compromising frozen directories.

**Architecture:** A staged execution model:
1. Immediate typecheck and coordination unblocking (resolving worker requests on `Header.tsx` without clobbering active worker locks).
2. Safe, isolated quick fixes (W6 Persian digit consistency and error handling ternary).
3. Verification and convergence of active Feature 012 (Liquid Dock) across its 7 surfaces once live workers finish.
4. Spec reconciliation and ground-truth recovery for Features 007 and 011 via SpecKit.
5. Implementation of verified open storefront tasks in Feature 001 and atmosphere verification harness in Feature 002.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, GSAP, Vitest (`npm run test:unit`), Playwright viewport verification scripts.

**Spec:** `specs/PROJECT-BACKLOG.md` (and individual feature specs `specs/012-*/spec.md`, `specs/011-*/spec.md`, `specs/007-*/spec.md`, `specs/001-*/spec.md`).

## Global Constraints

- **DO NOT RUN bare `npm test` or bare `npx vitest run`**: `tests/setup.ts` calls `resetDb()`, wiping 19 tables in the live database `hami_site_api`. Always run `npm run test:unit`.
- **DO NOT RUN `npm run build`** while dev server is running without restarting tmux session `hh-dev` (`-H 0.0.0.0 -p 3000`).
- **FROZEN DIRECTORIES (Constitution III)**: `data/`, `app/api/` (except safe digit formatting in order response), and `prisma/` are strictly frozen. Do not touch backend, auth, checkout, or cart logic.
- **MULTI-AGENT LOCK PROTOCOL**:
  - Check `.agent-pair/locks/` before touching any file.
  - Claim before editing: write `.agent-pair/locks/<path>.lock` containing `who`, `why`, `since`.
  - Never edit a file locked by another agent.
  - Release lock by moving it to `.agent-pair/released/` (`mv .agent-pair/locks/X .agent-pair/released/`), NEVER delete.
  - NEVER execute `git restore`, `git checkout --`, `git stash`, or `git add -A`. Stage by explicit file path.
- **NEVER INSTALL OR RUN `docs/inspires/`**.
- **MOBILE FIRST (Constitution IV)**: Verify all layouts from 360px up.

---

### Task 1: Unblock TypeScript Compilation by Fixing Header.tsx Props

**Context:** Worker `012-SURF-A` (qoder) wired `LiquidSelection` into `components/layout/PillNav.tsx` (T029) and removed obsolete circle props (`circleColor`, `pillColor`, `pillTextColor`, `hoveredPillTextColor`). `components/layout/Header.tsx:125-128` still passes these 4 props, causing `tsc --noEmit` to fail with error TS2322. Worker posted a formal REQUEST on `BOARD.md` to delete lines 125-128.

**Files:**
- Modify: `components/layout/Header.tsx:124-129`
- Lock: `.agent-pair/locks/components__layout__Header.tsx.lock`

**Interfaces:**
- Consumes: `PillNavProps` from `components/layout/PillNav.tsx`
- Produces: Clean typechecked `<PillNav />` call site in `Header.tsx`

- [ ] **Step 1: Check and acquire lock on Header.tsx**

Check that `.agent-pair/locks/components__layout__Header.tsx.lock` does not exist:
```bash
test ! -f .agent-pair/locks/components__layout__Header.tsx.lock
```
Create lock:
```bash
cat <<'EOF' > .agent-pair/locks/components__layout__Header.tsx.lock
who: qoder-ide (driver/plan-executor)
why: remove obsolete PillNav circle props to restore typecheck clean per worker REQUEST
since: 2026-09-28T03:50+03:30
EOF
```

- [ ] **Step 2: Verify the type error exists**

Run: `npm run typecheck`
Expected: FAIL with `components/layout/Header.tsx(125,11): error TS2322: Property 'circleColor' does not exist on type 'IntrinsicAttributes & PillNavProps'`.

- [ ] **Step 3: Edit Header.tsx to remove lines 125-128**

In `components/layout/Header.tsx`, remove the four obsolete props:
```tsx
        <PillNav
          className="hidden md:block"
          showLogo={false}
          logo=""
          items={navItems}
          baseColor="transparent"
        />
```

- [ ] **Step 4: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS with 0 errors.

- [ ] **Step 5: Release lock and notify on BOARD.md**

Move lock to released:
```bash
mv .agent-pair/locks/components__layout__Header.tsx.lock .agent-pair/released/
```
Append response to `.agent-pair/BOARD.md`:
```markdown
### 2026-09-28 03:52 — driver → qoder (worker 012-SURF-A) — ACK
Header.tsx lines 125-128 deleted. `npm run typecheck` is clean. Lock released.
```

---

### Task 2: W6 Quick Fix — Arabic/Latin Digit Fix & Ternary Fix (001 T111)

**Context:** Audits revealed `lib/api-error-fa.ts:26` returns the identical fallback string from both branches of its ternary, and `app/api/orders/route.ts:42-46` formats order numbers with Latin digits.

**Files:**
- Modify: `lib/api-error-fa.ts:23-27`
- Modify: `app/api/orders/route.ts:42-46`
- Test: `tests/unit/api-error-fa.test.ts`
- Lock: `.agent-pair/locks/lib__api-error-fa.ts.lock`, `.agent-pair/locks/app__api__orders__route.ts.lock`

**Interfaces:**
- Consumes: `toFaDigits` from `@/lib/utils`
- Produces: Clean error message extraction in `apiErrorToFa`, localized order number formatting in `createOrderNumber`

- [ ] **Step 1: Check and acquire locks**

```bash
cat <<'EOF' > .agent-pair/locks/lib__api-error-fa.ts.lock
who: qoder-ide
why: fix duplicate ternary return in apiErrorToFa
since: 2026-09-28T03:55+03:30
EOF
cat <<'EOF' > .agent-pair/locks/app__api__orders__route.ts.lock
who: qoder-ide
why: ensure order numbers use Persian numerals per Constitution II
since: 2026-09-28T03:55+03:30
EOF
```

- [ ] **Step 2: Write failing unit tests**

Create/update `tests/unit/api-error-fa.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { apiErrorToFa, ApiClientError } from "@/lib/api-error-fa";

describe("apiErrorToFa", () => {
  it("returns specific field error message when validation fails with details", () => {
    const error = new ApiClientError("Validation failed", {
      status: 400,
      code: "VALIDATION_FAILED",
      details: {
        fieldErrors: { phone: ["شماره موبایل نامعتبر است."] },
      },
    });
    expect(apiErrorToFa(error)).toBe("شماره موبایل نامعتبر است.");
  });
});
```

- [ ] **Step 3: Run unit tests to verify failure**

Run: `npm run test:unit tests/unit/api-error-fa.test.ts`
Expected: FAIL (or verify behavior).

- [ ] **Step 4: Implement minimal fixes**

In `lib/api-error-fa.ts:23-27`:
```typescript
    case "VALIDATION_FAILED": {
      const fieldErrors = (error.details as { formErrors?: string[]; fieldErrors?: Record<string, string[]> } | undefined);
      const first = fieldErrors?.formErrors?.[0] ?? Object.values(fieldErrors?.fieldErrors ?? {})[0]?.[0];
      return first ?? "اطلاعات ارسالی معتبر نیست.";
    }
```

In `app/api/orders/route.ts`:
Ensure `toFaDigits` from `@/lib/utils` is used when presenting or formatting the order number for user display.

- [ ] **Step 5: Run unit tests and typecheck**

Run:
```bash
npm run test:unit tests/unit/api-error-fa.test.ts
npm run typecheck
```
Expected: PASS.

- [ ] **Step 6: Release locks**

```bash
mv .agent-pair/locks/lib__api-error-fa.ts.lock .agent-pair/released/
mv .agent-pair/locks/app__api__orders__route.ts.lock .agent-pair/released/
```

---

### Task 3: Feature 012 Liquid Dock Multi-Surface Verification (W1)

**Context:** Workers `012-SURF-A` and `012-SURF-B` are wiring the 6 remaining surfaces. Once they finish and release locks, verification gates T010, T015 (deck fit), T017 (no-JS), and T028 (degradation) must be executed before convergence.

**Files:**
- Read: `specs/012-liquid-dock-navigation/tasks.md`
- Run: `node specs/008-brands-stacking-cards/verification/measure-deck.mjs`
- Run: `node tools/shots/viewport.mjs --no-js`
- Test: `tests/unit/selection-geometry.test.ts`

- [ ] **Step 1: Check worker completion in tmux**

Check pane status and lock releases:
```bash
ls -la .agent-pair/locks/
```
Wait until `components__layout__PillNav.tsx.lock`, `components__home__FeaturedProducts.tsx.lock`, `components__shop__CategoryTiles.tsx.lock`, etc., have been released.

- [ ] **Step 2: Run unit test suite**

Run: `npm run test:unit`
Expected: PASS with 0 failures across all unit test files.

- [ ] **Step 3: Execute deck clearance fit gate (T015)**

Run: `node specs/008-brands-stacking-cards/verification/measure-deck.mjs`
Expected: PASS — outer dock clearance matches 62px + 12px constant without shifting the stacking card deck baseline.

- [ ] **Step 4: Execute No-JS fallback verification (T017)**

Run: `node tools/shots/viewport.mjs --no-js`
Confirm resting marker is rendered server-side and no slot is empty.

- [ ] **Step 5: Execute convergence on Feature 012**

Run `/speckit-converge` on 012 to discover and append any remaining unbuilt surface tasks.

---

### Task 4: Feature 007 Motion Assembly Band Ground Truth Reconciliation (W3)

**Context:** The motion assembly band was shipped and accepted on the owner's phone, but 49/63 tasks in `specs/007-motion-assembly-band/tasks.md` remain unmarked. 007 has `blueprint.md` as its plan. We must run converge to establish real remaining tasks without re-writing working code.

**Files:**
- Read: `specs/007-motion-assembly-band/blueprint.md`
- Read: `specs/007-motion-assembly-band/spec.md`
- Modify: `specs/007-motion-assembly-band/tasks.md`

- [ ] **Step 1: Verify presence of blueprint.md**

Check that `specs/007-motion-assembly-band/blueprint.md` exists and contains the approved architecture.

- [ ] **Step 2: Run converge against code**

Execute `/speckit-converge` for feature 007 targeting `specs/007-motion-assembly-band/`.
Converge compares the codebase against the blueprint and appends genuine unbuilt work.

- [ ] **Step 3: Document findings in tasks.md header**

Update `specs/007-motion-assembly-band/tasks.md` with explicit notes explaining which tasks are shipped and verified, preventing duplicate work.

---

### Task 5: Feature 011 Brand Card Identity Spec Reconciliation (W2)

**Context:** The owner approved six generated brand cards on the phone and reversed the "no AI imagery" rule for this surface. `spec.md` FR-006 still requires a description line, which the cards lack. Tasks T001–T013 already landed (32 tests green), but `tasks.md` shows 0/34.

**Files:**
- Modify: `specs/011-brand-card-identity/spec.md`
- Modify: `specs/011-brand-card-identity/tasks.md`

- [ ] **Step 1: Reconcile FR-006 via speckit-clarify**

Run `/speckit-clarify` for 011 to record the owner's artwork decision and update FR-006 (omitting description line on art-led cards).

- [ ] **Step 2: Run converge for 011**

Run `/speckit-converge` for 011 to reconcile landed tasks T001–T013 and append the true remaining items (e.g. counter styling).

---

### Task 6: Feature 001 Storefront Unbuilt Slices Execution (W4)

**Context:** Feature 001 has 5 specific verified tasks ready for implementation: T113 (`/shop` entrance motion), T026/T033 (remove filler panels and «انتخاب‌های بی‌نهایت»), T089 (remove authored-filler sections), T085 (rebuild above-the-fold at 360x800).

**Files:**
- Modify: `app/(main)/shop/page.tsx`
- Modify: `components/shop/ShopResults.tsx`
- Modify: `app/(main)/page.tsx`
- Lock: Respective `.agent-pair/locks/`

- [ ] **Step 1: Implement T113 entrance motion on /shop**

Implement CSS-only reveal/stagger on `app/(main)/shop/page.tsx` and `components/shop/ShopResults.tsx` (honoring `prefers-reduced-motion` and no JS gate).

- [ ] **Step 2: Remove filler panels (T026/T033)**

Clean up CSS-composition filler panels and «انتخاب‌های بی‌نهایت» in accordance with Principle I.

- [ ] **Step 3: Remove authored-filler homepage sections (T089)**

Remove filler sections from homepage while keeping core shop sections intact.

- [ ] **Step 4: Re-measure above-the-fold at 360x800 (T085)**

Verify layout at 360px viewport using viewport capture tools.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-28-project-backlog-execution.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
