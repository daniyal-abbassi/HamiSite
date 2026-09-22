import { partnerMarks } from "@/components/brand/BrandMarks";

/**
 * The trust band under the hero: the twenty-year claim pinned at the reading start, and
 * the six partner marks standing still beside it.
 *
 * **It used to run.** This was a seamless 42s loop — the mark list rendered twice inside a
 * `w-max` track translating -50%, with a `min-w-[100vw]` guard so no blank swept through at
 * the end of a cycle, an edge mask instead of tinted overlays, and a pause on hover *and*
 * focus. All of that machinery is gone, for one reason: feature 004 resolved its Question 3
 * as **C — adopt the brand rows and rework this band into something non-moving** (FR-021).
 * The page's brand chapter is now a stack of rows the shopper chooses, so a strip of the
 * same six marks scrolling past underneath the hero was a second, louder presentation of the
 * same fact, and the only perpetual animation on a page whose whole brief is calm. One
 * travelling element per region, and here there are now none.
 *
 * **Do not rebuild this as a grid of equal boxes.** The version before the loop was exactly
 * that — seven panels, each with a repeated «برند همکار» caption — and it read as a
 * specification table. What keeps this off that rock is that the marks carry no boxes, no
 * captions and no dividers between them; they are simply set in a line, and the claim is
 * separated from them by one rule.
 *
 * The contrast decision survives untouched: RAL 3004 band with cream marks, pinned in
 * `globals.css` rather than left to the chapter tokens, because the last time the palette
 * moved this band quietly dropped to 1.21:1 and stopped being a band.
 *
 * The marks are now the only copy in the document, so they are exposed as a real list with
 * each brand's Persian name attached, instead of a duplicated `aria-hidden` strip with a
 * screen-reader-only list underneath it.
 */
export function BrandTicker() {
  return (
    <div className="brand-ticker-band border-y border-oxblood/15">
      <div className="flex flex-col items-stretch gap-y-4 py-4 sm:flex-row sm:items-center sm:gap-y-0">
        {/* The pinned claim — the one item with no logo, and the reason the band is not
            simply a row of marks. */}
        <div className="flex shrink-0 items-center justify-center gap-3 px-6">
          <b className="text-2xl font-black leading-none">۲۰ سال</b>
          {/* One continuous phrase, not «سابقه<br/>در بازار…» — the <br/> made
              copy/SR read it as «سابقه‌در». The wrap point is left to the box. */}
          <span className="max-w-24 text-xs font-medium leading-snug text-oxblood">
            سابقه در بازار مشهد
          </span>
        </div>

        <ul
          className="m-0 flex min-w-0 flex-1 list-none flex-wrap items-center justify-around gap-x-8 gap-y-4 p-0 sm:justify-between sm:border-s sm:border-oxblood/15 sm:px-8"
          /* «همکار» claimed a commercial partnership FR-006 does not admit for
             these six; that the shop *sells* them is supported by the export. */
          aria-label="برندهای موجود در فروشگاه"
        >
          {partnerMarks.map((mark) => (
            <li key={mark.name} className="flex h-8 items-center gap-2 opacity-90">
              {mark.node}
              <span className="sr-only">{mark.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
