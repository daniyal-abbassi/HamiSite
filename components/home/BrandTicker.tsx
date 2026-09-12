import { partnerMarks } from "@/components/brand/BrandMarks";

/**
 * The trust band under the hero: the twenty-year claim pinned at the reading
 * start, and the partner logos running past it on a seamless loop.
 *
 * This replaced a seven-panel static grid. The grid gave every brand an equal
 * box and a repeated "برند همکار" caption, which read as a specification table;
 * a moving strip of marks reads as a shop that carries them. The claim is
 * pinned rather than scrolled because it is the one item with no logo, and
 * because a number that keeps sliding out of view stops being a claim.
 *
 * **Inverted on purpose, and the direction of the inversion has flipped once.**
 * The band's job is to be the one surface that contrasts with the hero around
 * it — a printed strip laid over the room. While the hero was dark this meant a
 * cream band with RAL 3004 marks. The duo chapters made the hero paper, cream
 * on paper measured 1.21:1, and the band quietly stopped being a band. It is now
 * RAL 3004 with cream marks: 12.19:1 against the hero, and the marks themselves
 * hold 10.08:1 — the same legibility the cream version had, in the other
 * direction. The colours are pinned in `globals.css` rather than left to the
 * chapter tokens, precisely so a future palette move cannot silently repeat
 * this.
 *
 * Three mechanics, all in CSS so nothing here needs to be a client component:
 *
 * - **Seamless loop.** The list is rendered twice inside one `w-max` track and
 *   the track translates exactly -50%. At the end of the cycle copy two sits
 *   precisely where copy one started, so the reset is invisible. This only
 *   holds while both copies are identical — do not filter one of them.
 *
 *   The `min-w-[100vw]` on each copy is load-bearing, and the reason is worth
 *   keeping: six marks come to ~843px, but the strip on a desktop is ~1235px.
 *   Once the track has travelled its -50%, everything past the second copy is
 *   empty, so ~390px of blank band swept through at the end of every cycle.
 *   Forcing each copy to at least a viewport guarantees one copy is never
 *   narrower than the strip that shows it, at any width. It has to be `vw` and
 *   not `100%` — a percentage on a flex item inside a `w-max` track resolves
 *   against an indefinite size, and `translateX(-50%)` resolves against the
 *   track's own box, so the two would not agree.
 * - **Hover/focus pause.** `animation-play-state: paused`, so a visitor can
 *   stop the strip to read a mark. Focus counts too: a keyboard user tabbing
 *   into the band gets the same pause a mouse user gets.
 * - **Edge fade.** A mask, not a pair of gradient overlays painted in the band
 *   colour. Overlays have to be re-tinted by hand every time the palette moves
 *   and they silently rot when it does — this project has already been bitten
 *   three times by exactly that. A mask fades to transparent whatever the
 *   background happens to be.
 *
 * `dir="ltr"` goes on the **strip**, not just the track, and that placement is
 * the whole fix for a bug this had. Under the page's RTL direction, a child
 * that overflows its `overflow-hidden` box hangs off to the *left* — so the
 * track sat at -1645px, the strip was already showing copy two at rest, and
 * translating further left marched the marks out of frame until the band was
 * empty. Making the clipping box itself LTR puts the track's origin back at the
 * strip's left edge, where `0 -> -50%` means what every ticker recipe says it
 * means. The marks are Latin and their order carries no meaning, so pinning the
 * axis costs nothing.
 */
export function BrandTicker() {
  return (
    <div className="brand-ticker-band border-y border-oxblood/15">
      <div className="flex flex-col items-stretch sm:flex-row">
        {/* The pinned claim. */}
        <div className="flex shrink-0 items-center justify-center gap-3 px-6 py-4 sm:border-s sm:border-oxblood/15">
          <b className="text-2xl font-black leading-none">۲۰ سال</b>
          <span className="text-[11px] leading-tight text-oxblood/70">
            سابقه
            <br />
            در بازار مشهد
          </span>
        </div>

        {/* The strip. The whole moving track is hidden from assistive tech and
            the partner list is exposed once, statically, below it. Marks are
            repeated for the loop, so anything that reads the track reads the
            same six brands over and over. */}
        <div
          className="brand-ticker relative min-w-0 flex-1 overflow-hidden border-t border-oxblood/15 py-5 sm:border-t-0"
          dir="ltr"
          aria-hidden="true"
        >
          <div className="brand-ticker-track flex w-max items-center">
            {[0, 1].map((copy) => (
              <ul
                key={copy}
                className="m-0 flex min-w-[100vw] shrink-0 list-none items-center justify-around p-0"
              >
                {/* The list twice inside each copy, so a wide viewport gets a
                    strip of logos rather than four marks adrift in white. Both
                    copies stay identical, which is what the -50% relies on. */}
                {[...partnerMarks, ...partnerMarks].map((mark, i) => (
                  <li
                    key={`${mark.name}-${i}`}
                    className="flex h-8 items-center px-8 opacity-90 sm:px-11"
                  >
                    {mark.node}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        <ul className="sr-only" aria-label="برندهای همکار">
          {partnerMarks.map((mark) => (
            <li key={mark.name}>{mark.label}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
