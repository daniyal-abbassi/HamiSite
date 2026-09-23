import Image from "next/image";
import { trustFacts, storeWarranty } from "@/lib/content/verified-facts";

/**
 * The hero's shop window: the shop's own photograph, and the four facts FR-006 admits.
 *
 * The image has been on this page, off it, and now back on it, and both moves were the owner's. It was
 * removed on 2026-09-23 under FR-006 because what stood in the frame was not the shop: `public/store/`
 * keeps the whole chain — `shop-original` → `shop-upright` → `shop-ai-relight` → `shop-hero-master` →
 * `shop.jpg` — and the AI steps **cleared the counter of every box in the room** and replaced the ceiling
 * with showroom lighting. A picture of a shop that does not exist, captioned as the one that does, is the
 * most expensive kind of claim a storefront can make.
 *
 * It came back the same day, and what came back is `shop-upright.jpg` — the merchant's own file with the
 * EXIF orientation applied and nothing else done to it: the counter stacked with stock, the PS5 box, the
 * plants, the dome cameras, the «SAMSUNG» and «ACCESSORIES» lightboxes that are fixtures of the room and
 * were never invented. The two UI badges that used to sit on top of it — `MASHHAD FLAGSHIP` and
 * `SHOWROOM` — stay out, because those were claims, not captions.
 *
 * So the frame is the premises, not evidence of anything. The twenty years, the warranty and the phone
 * number carry the proof in words, below the picture, where a shopper reads them as statements rather than
 * as a photograph's caption.
 *
 * Sized for the phone first because that is where the panel is full-bleed: the photograph is capped at
 * 42vh so the panel's own text stays reachable, and `object-position` favours the wall branding, which is
 * the part that identifies the place. The desktop column is where the whole frame can stand up.
 */
export function ShopWindow() {
  return (
    <figure className="relative m-0 overflow-hidden rounded-3xl border border-champagne/30 bg-ink-2/90 shadow-monolith ring-1 ring-champagne/15">
      <div className="relative h-[42vh] max-h-[380px] min-h-[220px] w-full lg:h-[460px]">
        <Image
          src="/store/shop-hero.jpg"
          alt="نمای داخلی فروشگاه حامی همراه در مشهد؛ پیشخوانی با جعبه‌های گوشی و لوگوی برند روی دیوار سرخ"
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
