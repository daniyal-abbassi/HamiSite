# T002 — 008 gate baseline, captured 2026-09-26 20:21 +0330 BEFORE any 011 change

Command: `node specs/008-brands-stacking-cards/verification/measure-deck.mjs` at 360×640, dev server :3000. Note: the first capture attempt failed hydration (an 008-closeout build had killed the live server — the documented CLAUDE.md trap); hh-dev was restarted per this task's standing rule and this baseline is a fully hydrated run (fiber yes, 17/17 Reveal post-mount). Chapter length: **3.06 screens**. Every R7 check in T026 compares against this file, not against memory.

```
008 fit gate — http://localhost:3000 at 360 × 640  (card budget 460px, ceiling 6.5 screens)
hydration: react fiber on body yes · in #brands yes · below-fold wrappers 17/17 hidden by Reveal (post-mount state)
cards: 6 via "[data-deck-card]" · position sticky · sticky yes · chapter 1959px at y=4544 · dock top 566px · doc 12879px

walking 1319px of chapter in 30 steps of 44px

  4544         card#-1          —  vis  1  h    —  mark     —..   —  label     —..   —  approaching (no card at top, excluded from C2)
  4588         card#-1          —  vis  1  h    —  mark     —..   —  label     —..   —  approaching (no card at top, excluded from C2)
  4632         card#-1          —  vis  1  h    —  mark     —..   —  label     —..   —  approaching (no card at top, excluded from C2)
  4676         card#-1          —  vis  1  h    —  mark     —..   —  label     —..   —  approaching (no card at top, excluded from C2)
  4720         card#-1          —  vis  1  h    —  mark     —..   —  label     —..   —  approaching (no card at top, excluded from C2)
  4764         card#-1          —  vis  1  h    —  mark     —..   —  label     —..   —  approaching (no card at top, excluded from C2)
  4808         card# 0 اپلمینیمال، دقیق،   vis  1  h  193  mark    67.. 107  label   115.. 148  ok
  4852         card# 0 اپلمینیمال، دقیق،   vis  1  h  193  mark    29..  69  label    77.. 109  ok
  4896         card# 0 اپلمینیمال، دقیق،   vis  1  h  193  mark    29..  69  label    77.. 109  ok
  4940         card# 0 اپلمینیمال، دقیق،   vis  1  h  193  mark    29..  69  label    77.. 109  ok
  4984         card# 0 اپلمینیمال، دقیق،   vis  1  h  193  mark    29..  69  label    77.. 109  ok
  5028         card# 1 سامسونگقدرتی که با  vis  1  h  193  mark    60.. 100  label   108.. 141  ok
  5072         card# 1 سامسونگقدرتی که با  vis  1  h  193  mark    45..  85  label    93.. 125  ok
  5116         card# 1 سامسونگقدرتی که با  vis  1  h  193  mark    45..  85  label    93.. 125  ok
  5160         card# 1 سامسونگقدرتی که با  vis  1  h  193  mark    45..  85  label    93.. 125  ok
  5204         card# 2 شیائومیفناوری پویا  vis  1  h  218  mark    98.. 138  label   146.. 178  ok
  5248         card# 2 شیائومیفناوری پویا  vis  1  h  218  mark    61.. 101  label   109.. 141  ok
  5292         card# 2 شیائومیفناوری پویا  vis  1  h  218  mark    61.. 101  label   109.. 141  ok
  5336         card# 2 شیائومیفناوری پویا  vis  1  h  218  mark    61.. 101  label   109.. 141  ok
  5380         card# 2 شیائومیفناوری پویا  vis  1  h  218  mark    61.. 101  label   109.. 141  ok
  5424         card# 3 نوکیا۱ محصول  vis  1  h  180  mark   115.. 155  label   163.. 196  ok
  5468         card# 3 نوکیا۱ محصول  vis  1  h  180  mark    77.. 117  label   125.. 157  ok
  5512         card# 3 نوکیا۱ محصول  vis  1  h  180  mark    77.. 117  label   125.. 157  ok
  5556         card# 3 نوکیا۱ محصول  vis  1  h  180  mark    77.. 117  label   125.. 157  ok
  5600         card# 3 نوکیا۱ محصول  vis  1  h  180  mark    77.. 117  label   125.. 157  ok
  5644         card# 4 realmeریلمی  vis  1  h  180  mark    95.. 135  label   143.. 176  ok
  5688         card# 4 realmeریلمی  vis  4  h  180  mark    93.. 133  label   141.. 173  ok
  5732         card# 4 realmeریلمی  vis  6  h  180  mark    93.. 133  label   141.. 173  ok
  5776         card# 4 realmeریلمی  vis  6  h  180  mark    93.. 133  label   141.. 173  ok
  5820         card# 5 TCHتی‌سی‌اچ۱ محصول  vis  6  h  180  mark   119.. 159  label   167.. 200  ok
  5863         card# 5 TCHتی‌سی‌اچ۱ محصول  vis  6  h  180  mark    76.. 116  label   124.. 157  ok

  ──────────────────────────────────────────────────────────────────────────────
C1  six cards hold the top:      PASS — 6 distinct card(s) held it, in order: اپلمینیمال، دقیق،  → سامسونگقدرتی که با → شیائومیفناوری پویا → نوکیا۱ محصول → realmeریلمی → TCHتی‌سی‌اچ۱ محصول
    in source order:              PASS — 0,1,2,3,4,5 (expected 0,1,2,3,4,5)
    all six stay visible stacked: PASS — min 6 card(s) showing any pixel once fully stacked
C2  no clipped mark or label:    PASS — 0 bad sample(s) of 25 evaluated (6 approach samples with no card at the top, excluded — see clipFlags)
FR-008 chapter length:           PASS — 1959px = 3.06 screens (ceiling 6.5)
D2  card height vs budget:       PASS — tallest 180px vs 460px (460 = 640 − 88 dock − 80 edges, less 12 slack)
    scroll drift samples:         0 of 31 (smooth scroll or Lenis would show here)

C8 — reloading with prefers-reduced-motion: reduce (D7: same six cards, mechanism off)
  emulated: yes · cards 6 · sticky 0 · height 1719px = 2.69 screens (motion: 3.06)
  C8  static stack:               PASS — six cards, no sticky offsets, no extra scroll length
  PASS  reload mid-chapter                 landed on card#2 (the walk recorded #2) scrollY 5204 (was 5204)
  PASS  back/forward into the chapter      landed on card#2 (the walk recorded #2) scrollY 5204
  PASS  End past the chapter               first card top  -6342px, last card bottom -6149px at scrollY 12239/12239 — nothing held, the page below is reachable

C9  three arrivals:              PASS — each landed in the state belonging to its position, not its opening frame

PASS — the deck fits at 360 × 640: six cards hold the top, no mark or name is ever clipped, and the chapter stays inside FR-008's ceiling.
```
