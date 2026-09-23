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

## 2026-09-24 — T-P2: three of the four named defects are not defects, and one is worse than described

**Chosen:** fix the one real defect (`AddToCartButton`'s silent failure), delete the code that pretends the
other three still exist, and report the measurements that killed the claims.
**Rejected:** implementing §7 as written. Two of its four items describe a loading model the page no longer
has, and the third describes a reflow that does not happen. Building them would have added a skeleton to a
section that cannot be empty-by-loading, and reserved space for a badge that is out of the flow.
**Verified by:** `.scratch/cartbadge-reflow.mjs` (header geometry across a badge mount),
`.scratch/addfail2.mjs` (forced 409, card and button geometry sampled four times),
`npx tsc --noEmit` clean, `npx vitest run tests/unit` 221/221.

| §7 item | Verdict | Evidence |
|---|---|---|
| 1. `FeaturedProducts` skeletons gated on `isLoading && products === null` | **Obsolete.** There is no `isLoading` and no `products === null` — band 1 ("browsing stops round-tripping through the API") removed the fetch. `ProductSkeletonCard` was defined and never referenced; `activeBadge` was computed and never read. Both deleted. |
| 2. `NewArrivals` reserves 4 skeletons against a 6-item result | **Unreachable.** `useState(initialProducts)` with no setter and `useState(false)` for `error` — the null branch and the error branch could never render. Deleted with them went the `\| null` in `RailProps` and the now-meaningless `aria-busy`. |
| 3. `CartButton` badge reflows the header on first add | **False.** The badge is `position: absolute` inside a `relative` button, so it is out of the flow. Mounting it moved nothing: header height 78→78 at 360 and 90→90 at 1280, the button's box identical to 0.01px, all five siblings unmoved, document height unchanged. The same is true of `MobileDock`'s badge (`absolute` inside `<span class="relative">`), which is where a reader might have gone looking for the reflow. §7's fix — "reserve the space always" — would have changed no measurement and put a permanent empty dot beside an empty cart. |
| 4. `AddToCartButton` swallows every non-auth failure | **Real, and under-stated.** See below. |

## 2026-09-24 — the failed add says itself in a solid chip, not in the house error idiom

**Chosen:** a `role="alert` chip — solid `#8E1B10`, white 11px text, absolutely positioned at the card's
bottom-start, `pointer-events-none` so the control underneath stays pressable for a retry. Held 4s, then the
button returns to idle and the alert unmounts.
**Rejected, twice:**
- *`text-destructive` on `bg-destructive/10`* — the idiom in twelve files across this repo. Measured on the
  ground it would actually sit on: the only live caller renders this control inside a **white** product card,
  and `#E4573F` on `#ffffff` is **3.66:1**, with the `/10` wash itself at **1.13:1**. The house idiom fails AA
  at this size on this ground. That is worth someone's attention beyond this task.
- *`sr-only` + an icon change* — my own first version. It passed the accessibility-tree assertion and was
  still wrong: the only live caller passes `iconOnly`, so a sighted shopper would have gotten a `Ban` glyph
  and a colour with no Persian sentence anywhere on screen. §7 asks that the user "see that nothing happened,
  in Persian"; an `sr-only` string is seen by nobody.
**Verified by:** card height invariant across the whole failure — 392.06px at 360, 567.6px at 1280, identical
before, during and after. The button's box looked like it grew 6px until the pointer was moved away: that is
`hover:scale-105` on the control, not the error state. Its apparent 127px vertical jump afterwards was
Playwright scrolling to take the element screenshot — `scrollY` 954→827 against `btnY` 480.1→607.1, which
cancel exactly, so the document-space position never moved.
