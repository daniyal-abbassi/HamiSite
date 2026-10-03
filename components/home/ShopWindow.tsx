import Image from "next/image";
import { trustFacts, storeWarranty } from "@/lib/content/verified-facts";

/**
 * The hero's shop window: the shop's own photograph, and the four facts FR-006 admits.
 *
 * The image has been on this page, off it, back on it, and now on it in its polished form — every move the
 * owner's. `public/store/` keeps the whole chain, so the provenance is on the record rather than in this
 * comment: `shop-original` → `shop-upright` (the merchant's camera, orientation applied) →
 * `shop-ai-relight` → `shop-hero-master` → `shop.jpg`. The AI steps clear the counter of the roughly fifteen
 * phone cartons, PS5 box and two plants that are actually in the room and stand four phones under wall
 * spotlights instead. That is not a re-grade of a photograph, it is a different room, which is why an
 * earlier pass of this file used the merchant's own frame.
 *
 * The owner chose the polished frame on 2026-09-23 over that objection, and it is their storefront. What
 * keeps the choice honest is the text around it, so three things are load-bearing and stay:
 *
 *  - **No "real" caption.** «فضای واقعی مجموعه» ("the real space of the collection") was attached to this
 *    image before, and it is a false sentence about this particular file. The caption is the brand and the
 *    city, which the picture does show.
 *  - **No proof badges.** `MASHHAD FLAGSHIP` and `SHOWROOM` were UI text laid over the frame and were never
 *    in the room. The «SAMSUNG» and «ACCESSORIES» lightboxes are fixtures, visible in the merchant's own
 *    photograph, and they survive because they are true.
 *  - **The `alt` describes this image, not the shop.** A screen-reader user is being told what the picture
 *    contains; saying "a counter stacked with stock" would describe the file that was rejected.
 *
 * The twenty years, the warranty, the representations and the phone number stay in words below the picture,
 * where a shopper reads them as statements rather than as a photograph's caption. That is FR-006's line:
 * imagery is the premises, never the evidence.
 *
 * Sized for the phone first because that is where the panel is full-bleed: the photograph is capped at
 * 42vh so the panel's own text stays reachable, and `object-position` favours the wall branding, which is
 * the part that identifies the place.
 */
export function ShopWindow() {
  return (
    <figure className="relative m-0 overflow-hidden rounded-3xl border border-champagne/30 bg-ink-2/90 shadow-monolith ring-1 ring-champagne/15">
      <div className="relative h-[42vh] max-h-[380px] min-h-[220px] w-full lg:h-[460px]">
        <Image
          src="/store/shop-hero.jpg"
          alt="نمایی رندرشده از فضای داخلی فروشگاه حامی همراه؛ لوگوی برند روی دیوار سرخ و چهار گوشی روی پیشخوان"
          fill
          priority
          sizes="(min-width: 1024px) 46vw, 92vw"
          className="object-cover object-[50%_28%]"
        />
        {/* One scrim, so the caption stays legible over a bright ceiling without tinting the whole
            photograph — the image is the shop's, and the page should not appear to improve it. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-2 via-ink-2/70 to-transparent"
        />
        <figcaption className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-1 px-5 pb-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
          <span className="whitespace-nowrap font-mono text-[11px] font-bold tracking-[0.14em] text-champagne">
            HAMI HAMRAH / MASHHAD
          </span>
          {/* The street address stays out of this caption: decision 3 removed it from the site until the
              merchant supplies it, and a photo of a shop is exactly where an invented one would read as
              fact. «فروشگاه حضوری در مشهد» is the most the verified list allows. */}
          <span className="text-[11px] leading-5 text-foreground/65">فروشگاه حضوری در مشهد</span>
        </figcaption>
      </div>

      <div className="border-t border-champagne/15 p-5 md:p-6">
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
          {trustFacts.map((fact) => (
            <li key={fact.key} className="flex items-start gap-2.5 text-[13px] leading-6 text-foreground/85">
              <i className="mt-2.5 inline-block size-1.5 shrink-0 rounded-full bg-champagne" aria-hidden="true" />
              {fact.label}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-champagne/15 pt-3.5">
          <span className="font-mono text-[11px] tracking-[0.14em] text-champagne/80">WARRANTY</span>
          <span className="text-[14px] font-bold text-foreground">{storeWarranty.label}</span>
        </div>
      </div>
    </figure>
  );
}
