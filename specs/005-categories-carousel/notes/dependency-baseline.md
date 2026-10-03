# Dependency Baseline — feature 005

**Captured**: 2026-09-22 (T003) | **Branch**: `Hami-v3`

`package.json` at the start of this feature, verbatim — this is the set the plan's decisions were checked
against, and the record of what "no new dependency" actually meant at the time.

## dependencies (13)

```
@prisma/client ^5.20.0     bcryptjs ^2.4.3           class-variance-authority ^0.7.1
clsx ^2.1.1                embla-carousel-react ^8.6.0  gsap ^3.15.0
lucide-react ^1.38.0       motion ^13.2.0            next 15.5.25
react 19.2.8               react-dom 19.2.8          tailwind-merge ^3.6.0
zod ^3.23.8
```

## devDependencies (14)

```
@types/bcryptjs  @types/node  @types/react  autoprefixer  dotenv  dotenv-cli
postcss  prisma  tailwindcss  tailwindcss-animate  ts-node  typescript  vitest
```

## What this changes about the plan

**`embla-carousel-react@8.6.0` is already installed and already running on this page** —
`components/home/NewArrivals.tsx:22` uses it with `direction: "rtl"`. So `research.md` D2's decision to build
the carousel on Embla adds nothing to `package.json`. That is not why it was chosen — it was chosen because
Embla owns drag, inertia, snap, loop and RTL scroll physics and structurally cannot reproduce the reference's
document-level scroll capture — but it removes the only objection that was ever raised against it during
planning.

**`gsap@3.15.0` and `motion@13.2.0` are also installed and in use** (`components/ui/CardSwap.tsx`,
`components/layout/PillNav.tsx`, `components/home/FeaturedProducts.tsx`). Neither is used by this feature: a
document-level scroll tool is the wrong guest in a section whose first requirement is never to touch page
scroll (FR-016). The same fact points the other way for feature 002, whose reopened Question 1 asks for scroll
physics — see `specs/002-scroll-atmosphere/research.md` D2's correction.

**The owner ruled on 2026-09-22 that quality outranks dependency cost.** So this file is a record, not a
ceiling. If the arc needs a package later, adding one is a decision to state here with its reason — not a
rule violation. An earlier draft of `research.md` D8 rejected hand-rolling partly on a "no new package"
constraint that turned out not to be the real trade; the correction is in D2.

## Verification

```bash
node -e "console.log(Object.keys(require('./package.json').dependencies).join('\n'))"
grep -rn "useEmblaCarousel" components/ --include=*.tsx
```

Re-run this at the end of the feature (T039) and diff. Any new entry must be justified in
`notes/validation.md`.
