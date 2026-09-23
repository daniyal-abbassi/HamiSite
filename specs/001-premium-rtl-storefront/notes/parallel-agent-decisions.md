# Parallel-agent decisions — second agent

Decisions taken without asking, per the owner's standing instruction ("هیچی نبایپ کنسل یا بلاک بشه" and
"answer it with your gut and proceed"). Format from `parallel-agent-plan.md` §10.

## 2026-09-24 — the band styles live in `app/(main)/home.css`, not a new `bands.css`

**Chosen:** one labelled block appended to `app/(main)/home.css`, which is already mine and already
imported by `app/(main)/page.tsx`.
**Rejected:** `app/(main)/bands.css` imported from `globals.css`'s last line (§6.4's other option) — it
would have put my work inside the one file two agents share, where an append and a re-save by the driving
agent can collide. Both bands are homepage sections, so home.css is also the honest scope.
**Verified by:** `npx tsc --noEmit` → exit 0; `npx vitest run tests/unit` → 221 passed / 22 files, unchanged.

## 2026-09-24 — `text-foreground/55` is lifted, not re-grounded

**Chosen:** `.band-paper :where([class~="text-foreground/55"], [class~="text-foreground/5"])` sets the
colour at 0.62 alpha. Measured 5.83:1 on the white card it actually sits on.
**Rejected:** choosing a lighter paper. This is the one place the plan's premise did not survive
measurement: ink at 55% composites to a mid-grey **whatever is underneath**, so no ground rescues it.
Swept five candidates with the repo's own `contrastOn()` — `#f4f1ea` 4.35, `#f7f5f0` 4.42, `#faf8f4` 4.42,
`#F5F5F0` 4.41, `#ffffff` 4.50 — every one at or below the 4.5 line, and the last of them is the white the
owner explicitly refused. The tier had to move.
**Verified by:** `.scratch/paper-contrast.mjs` (the sweep above) and `.scratch/paper-audit.mjs` (the
rendered value, read off `getComputedStyle` in the browser).

## 2026-09-24 — the categories chapter gets a white mount, and the depth cue is inverted with the ground

**Chosen:** a 6px white frame plus an ink hairline and a shallow drop under each panel
(`.cat-panel__art`), and `.cat-panel__art::after` veils toward `var(--paper)` instead of `#0b0204`.
**Rejected:** shipping the token flip alone and reporting the result as passing. It did pass the contrast
gate, and it still looked wrong: 005's FR-039 objection to a light categories chapter was about the
**artwork**, not the type — nine dark-lacquer badges on ivory read as holes cut in the page, and no amount
of `--foreground` fixing changes that. Inverting the veil was necessary but not sufficient; the mount is
what makes a dark object on paper read as displayed rather than missing.
**Verified by:** screenshots at 360 and 1280 before and after (`.scratch/paper-categories@{360,1280}.png`).
Before: the lower half of the chapter was one dark mass. After: each panel is a framed plate and the arc's
recession reads as haze.

## 2026-09-24 — `#online-services` replaces `band-soft` rather than layering on it

**Chosen:** the section's class list goes `band-soft` → `band-paper`.
**Rejected:** keeping both. `band-soft` is a `rgba(11, 2, 4, 0.5)` darkening gradient — the tonal device the
owner called "wayyy too boring" — and painting paper under it would have put a translucent black wash over
the light chapter, breaking the composite the contrast gate measures. Its comment says #b2b and
#online-services are "the page's only darkened stretches"; one of them is now the opposite thing, so the
comment moved with the code.
**Verified by:** `.scratch/paper-audit.mjs` reports the band's own ground as `rgb(244, 241, 234)` with
`backdrop=0`, i.e. opaque and un-blurred.

## 2026-09-24 — a rendered source comment was fixed under T-P1 rather than filed separately

**Chosen:** wrapped the block comment inside `<li>` in `CategoryCarousel.tsx` in `{/* … */}`.
**Rejected:** leaving it for its own task while I was measured around it — it is not a style question and it
is in a file this task owns.
**Verified by:** the audit's text-node count in `#categories` fell **40 → 31** (nine copies, one per panel)
and the string `«/* * Every panel is a destin»` disappeared from the rendered pairs. **The driving agent
should know this changed the document height**: the homepage went 16,547px → 16,067px at 360, which is why
`ground-travel.mjs`'s gutter count is not comparable to the 8/13 recorded in `notes/findings.md`.
