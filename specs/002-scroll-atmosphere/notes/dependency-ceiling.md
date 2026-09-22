# Dependency Ceiling — feature 002

Recorded at T003, before any work, because [research.md D2](../research.md) rejects GSAP, `motion`,
embla and every smooth-scroll library for this feature. Any addition below is a plan violation, not a
convenience.

`package.json` dependencies at record time (2026-09-22):

- @prisma/client: ^5.20.0
- bcryptjs: ^2.4.3
- class-variance-authority: ^0.7.1
- clsx: ^2.1.1
- embla-carousel-react: ^8.6.0
- gsap: ^3.15.0
- lucide-react: ^1.38.0
- motion: ^13.2.0
- next: 15.5.25
- react: 19.2.8
- react-dom: 19.2.8
- tailwind-merge: ^3.6.0
- zod: ^3.23.8

**Thirteen packages. Feature 002 must leave this list at thirteen.**

`gsap`, `motion` and `embla-carousel-react` are already installed and are deliberately **not** used by
this feature — D2's reasoning is that the requirement is one scalar consumed by CSS, which is the
smallest possible job, and that adding a runtime and a cleanup obligation for it would create a second
animation idiom on a page Constitution IV punishes for excess. A smooth-scroll library is rejected more
strongly still: Q1 = A forbids intercepting, easing or substituting the shopper's own scrolling, which is
precisely what such a library does.

Verify before closing the feature:

```bash
node -e "console.log(Object.keys(require('./package.json').dependencies).length)"   # expect 13
git diff --stat package.json package-lock.json                                      # expect empty
```
