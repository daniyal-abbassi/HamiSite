# T009 gate result and T010 escalation — 009 categories mosaic

**Evaluated**: 2026-09-26 13:3x, during `/speckit-implement`.
**Phase 1–2**: delegated to the `qoder` worker in tmux `hh-qoder` and **in progress** at the time of writing.
Everything below was established independently of its report, by reading the files.

---

## The gate: five files, all still held

Checked live against `.agent-pair/locks/` (not from the plan's assumption — the count was wrong there, it said
four):

| File | Holder | Needed for |
|---|---|---|
| `components/home/CategoryHub.tsx` | `qoder-ide` | T012, T013, T018 — the mosaic markup |
| `components/home/CategoryCarousel.tsx` | `qoder-ide` | T027 — deletion |
| `components/home/category-carousel.css` | `qoder-ide` | T027 — deletion |
| `lib/category-departments.ts` | `qoder-ide` | T011 — the `image` field |
| `tests/unit/category-departments.test.ts` | `qoder-ide` | T020 — the derivation guard |

`app/(main)/home.css` is held by **qoder**, inside this effort. A REQUEST was posted to `qoder-ide` at 12:0x and
has gone unanswered; its last heartbeat (2026-09-25 21:41) says "no further writes without direction".

**No locked file was edited and no lock was removed.**

---

## The finding that makes this urgent, not merely blocked

**The mosaic CSS is dead code right now.** Grepping every `.tsx` in `app/` and `components/` for
`cat-mosaic` and `cat-tile` returns **nothing**. `CategoryHub.tsx:19` still renders
`className="category-catalogue band-paper wrap container"` and `CategoryHub.tsx:4` still imports
`CategoryCarousel`.

Consequence: **the homepage a shopper sees today is unchanged.** The 165 lines are verified but unreachable. The
feature is 0 % visible to a customer until T011 and T012 land, and both are behind `qoder-ide`'s locks.

That is the honest status, and it is worth stating plainly because "the CSS is done and audited" could otherwise
be reported as progress for two more days while nothing a shopper can see has changed.

---

## What the independent audit did confirm about the candidate

Checked by reading `app/(main)/home.css`, not by trusting the worker's summary:

| Claim | Verified |
|---|---|
| Scrim plate present (research D6) | `#050101` appears 4× |
| No layout shift from late images | `aspect-ratio` appears 5× |
| Focus ring exists | `.cat-tile:focus-visible` present |
| Forced-colors handling | 2 blocks |
| Reduced-motion handling | 4 blocks |
| RTL: no physical properties | **zero** `left:`/`right:`/`top:`/`padding-left`/`margin-right` inside the mosaic rules |
| Column steps (research D2) | `repeat(2, minmax(0,1fr))` base → `repeat(3,…)` at 768 → `repeat(4,…)` at 1280 |

**Still unverified, and only measurable once the markup exists**: the rendered 148 px floor at 360, the hero's
2×2 behaviour at 1280, and whether the band-paper mount patch can be removed without orphaning something else.

---

## What is asked of the human

1. **Release the five locks**, or tell `qoder-ide` to hand its lane over. This is the only action that makes the
   feature visible; everything else is preparation.
2. **Two open decisions** (from `notes/jev-advisory.md`, both genuinely yours):
   - The two 1.2–1.5 MB PNG panels — ship and convert, or hold until converted? Jev scored it 0.49 / 0.42 and
     refused to decide. The one clear signal from it: shipping with no mitigation scored 0.09.
   - Jev disagrees with the hero asymmetry you chose (0.66 for equal-area tiles, 0.30 for your option A). It
     ranked a flat uniform grid **last** (0.01), so it is not arguing for the thing you rejected — only for less
     size inequality than you approved. **No action was taken on it**, and none should be unless you want to
     revisit.

---

## What happens if the locks never clear

Nothing is half-applied. The homepage keeps rendering the existing carousel, which works. The reviewed stylesheet
stays in `home.css` (harmless, unreferenced) or is reverted on request, and `tests/unit/category-mosaic.test.ts`
stays red naming the missing `image` field. **A blocked feature with a clean tree is a better outcome than a
swapped section with a stolen lock.**
