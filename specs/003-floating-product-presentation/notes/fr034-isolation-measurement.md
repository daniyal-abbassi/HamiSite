# FR-034 — Isolation feasibility measurement: **the gate fails, but not the way it was written to fail**

**Run**: 2026-09-22 | **Method**: all 188 mirrored merchant photographs matted with
`isnet-general-use` (deterministic alpha, no generative step) and reviewed across four contact pages at
200px per cell. Script: `scripts/isolate-catalog-images.py`; derived assets in `trial/full/isolated/`;
metrics in `trial/full/manifest.json`.

**The spec's prediction**: "Cables, straps, translucent plastic, SIM cards, reflective finishes, and the
smallest sources are the expected failures."

**What actually happened**: those subjects isolated cleanly. Thin braided cables (363–372), earbud
straps, glossy black car chargers (373–375), the 8,501-byte source (361), the 400×400 (311), steel
link bracelets and silicone watch straps all came away with crisp edges and no halo. `isnet-general-use`
is genuinely good at this, and CPU inference over 188 files cost about 45 minutes.

The failure is somewhere else entirely, and it is bigger.

## Two numbers

| Measurement | Count | Share |
|---|---|---|
| **Matte defect** — halo, retained background slab, clipped detail | **~6 of 188** | **~3%** |
| **Marketing composite** — the photograph itself carries burned-in text, price stickers, packaging, or multiple products | **~144 of 188** | **~77%** |

The matte defects are real but trivial: 134 (steel bracelet, soft retained field), 141 (pink earbud case,
same), 312 and 313 (translucent AirPods case, frosted halo), plus two marginal. By FR-034's own thresholds
— "under ~10% fail → catalog-wide" — **isolation passes.**

That number is not the finding. The second one is.

## The finding: these are not product photographs, they are advertisements

Looking across all 188:

- **The phone range is almost universally a spec banner.** `۵۱ GB ۱۲ GB 4G 5G`, `256 GB / 8 GB`,
  `VIETNAM`, `Global`, `China`, `IRAN` printed into the image beside the handset. Present on the great
  majority of the 134 phones. A perfect matte returns a perfect cut-out **of the banner and the phone
  together**, because they are the same pixels.
- **The stock-iPhone block (248–290, 43 files) is a shop-shelf photograph.** Each phone is propped on a
  display stand, inside a plastic sleeve, with a **handwritten paper price sticker** stuck to the back.
  The isolation is excellent. The object it isolates is a phone with a note on it, on a stand, in a sleeve.
- **Accessories are frequently shown with their retail packaging** — 362, 365, 370, 375, 376, 377, 378
  all include the box, and 378 is an open gift set with a spare strap and a booklet.
- **Some are multi-product composites**: 395 shows three colour variants in one frame; 318, 325, 332, 333
  show three or four phones side by side; 386 and 387 carry a large `TCH ONE PRO` slogan across the art.
- **The SIM cards (348–350) are operator marketing graphics**, not photographs at all — a card illustration
  with «سیم‌کارت همراه» and a phone number.

## Why this is worse than a matte failure, not better

A matte failure is visible, countable and fixable per file — FR-033 already gives it a framed fallback, and
3% of the catalogue is a rounding error. This is not.

FR-001 asks the product to be "the dominant element of its surface". FR-002 asks that chrome which is not
the product, its information, or its action be **removed**. FR-022 forbids the presentation implying
anything the record does not support, and FR-023 specifically forbids making a product "appear larger, more
numerous, or in a context that is not real".

A cut-out of a phone with a handwritten price sticker on it, a `۵۱۲ GB` banner beside it and a plastic
sleeve around it **fails all four of those, and isolation is the mechanism that makes it look intentional.**
The floating-object treatment the owner chose (Q2 = B, Q3 = B) will render this material at large scale, on
a dark stage, with a grounding shadow — presenting a shop-shelf photograph as a hero object. That is a
worse outcome than the current framed grid, not a better one.

## FR-034's branch, applied honestly

FR-034 says the measured proportion decides "whether this is a catalog-wide presentation or a curated one",
and the plan's third branch is: *"over ~35% fail → this stops being a floating-product feature and becomes
a listing-quality feature. Say so, and re-scope."*

By the metric FR-034 was written to measure, the answer is 3% and the branch is catalog-wide. By the
metric that actually determines whether the feature can deliver its purpose, the answer is ~77% and the
branch is re-scope. **The gate passes and the feature is not viable as specified.** Reporting only the
first number would satisfy the letter of FR-034 and defeat its purpose.

## What I recommend

**Do not build the floating treatment across this catalogue.** Not because it cannot be done, but because
doing it well to material that is 77% advertising will make the storefront look cheaper, not more premium
— and Constitution IV's bar is the thing being traded away.

Three routes, in the order I'd take them:

1. **US1 only, now.** Product-as-protagonist through composition — strip the card chrome, give the object
   room, one action per surface, type doing structural work. FR-001…FR-005 need **no** asset work at all,
   and they are the transferable part of the reference. This is the spec's own stated safe floor and it is
   entirely available today.
2. **Curated hero isolation, not catalog-wide.** The ~44 files that are genuinely clean single-object
   photographs (mice 352–356, chargers 357–361, cables 363–372, power banks 389–394, watches 294–295)
   isolate beautifully and would carry a floating treatment on a featured surface. That is a curated
   presentation, which FR-034 explicitly contemplates as an outcome.
3. **Ask the merchant for clean pack shots** for the phone range, which is the only route to the experience
   Q3 = B describes. It is outside the frontend initiative and it is somebody else's timeline.

**What I would not do** is generate clean product imagery to fill the gap. `pixel_bridge` could produce a
beautiful floating iPhone all day, and every one of them would be a fabricated representation of
merchandise — Principle I with no exception path, and the specific thing this shop's twenty-year
reputation cannot absorb.

## Caveat on method

The 3% and 77% are one reviewer's visual tally across four pages at 200px per cell, not FR-030's
per-file review against the source. The 3% is a soft upper bound and would rise under scrutiny at full
resolution. The 77% is robust — a burned-in banner is not a judgement call.

Review pages are regenerated with:
`/home/lain/.venvs/hami-isolate/bin/python scripts/isolate-catalog-images.py --out specs/003-floating-product-presentation/trial/full`
