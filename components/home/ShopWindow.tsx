import Image from "next/image";
import shopPhoto from "@/public/store/shop.jpg";

/**
 * The hero's shop window — a framed opening onto the real Mashhad store.
 *
 * The photograph is a re-lit version of the owner's own shot of the store,
 * not stock: ChatGPT was given the original frame and asked to keep the wall
 * logo, both illuminated cases and the crimson wall pixel-faithful while
 * re-lighting the room low-key, clearing the loose product boxes off the
 * floor and straightening the wide-angle verticals. The return came back
 * amber-gold, so a second numeric pass pulls it onto the palette: green
 * dropped out of the golden mid-tones (amber -> ember), the floor rolled off
 * toward the bottom edge, and the deepest shadows blended toward
 * --background so the frame's corners are the same ink as the page. The
 * brand red and the white lettering fall outside that mask by construction.
 *
 * See public/store/ for the whole chain: shop-original -> shop-upright ->
 * shop-ai-relight -> shop-hero-master -> shop.jpg.
 */
export function ShopWindow() {
  return (
    <div className="relative">
      {/* Light thrown onto the wall around the opening. */}
      <div
        aria-hidden="true"
        // -inset-8 on a phone pushes this bleed past the viewport edge and
        // gives the document a horizontal overflow, so the spill is tightened
        // below md where there is no room for it.
        className="pointer-events-none absolute -inset-4 -z-10 opacity-70 md:-inset-8"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 45%, rgba(142, 10, 30, 0.28), transparent 70%)",
        }}
      />

      <div className="relative overflow-hidden rounded-3xl border border-champagne/30 bg-ink-2/90 shadow-monolith ring-1 ring-champagne/15 transition-all duration-500 hover:border-champagne/50">
        {/* Flagship vitrine badge */}
        <div className="absolute start-4 top-4 z-20 flex items-center gap-2 rounded-full border border-champagne/30 bg-black/60 px-3.5 py-1 backdrop-blur-md">
          <span className="relative flex size-2" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          <span className="font-mono text-xs font-bold tracking-wider text-champagne">MASHHAD FLAGSHIP</span>
        </div>

        {/* The opening itself. */}
        <div className="relative aspect-[4/5] w-full">
          <Image
            src={shopPhoto}
            alt="فروشگاه حامی همراه در مشهد — ویترین سامسونگ و لوازم جانبی"
            fill
            priority
            sizes="(max-width: 1024px) 28rem, 28rem"
            placeholder="blur"
            className="object-cover transition-transform duration-700 hover:scale-105"
          />

          {/* Grounds the photo in the page: a wash of the page's own ink at the
              bottom so the frame does not end on a hard bright edge. */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(11, 2, 4, 0.25) 0%, transparent 35%, transparent 60%, rgba(11, 2, 4, 0.75) 100%)",
            }}
          />

          {/* Glass sheen across the opening, plus the thin bright line an
              inner pane catches at its top edge. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(115deg, rgba(229, 211, 179, 0.12) 0%, transparent 38%, transparent 62%, rgba(229, 211, 179, 0.06) 100%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-champagne/50 to-transparent"
          />
        </div>

        {/* Sill. */}
        <div className="flex items-center justify-between border-t border-champagne/20 bg-ink/95 px-6 py-3.5 text-foreground">
          <span className="font-mono text-xs font-bold tracking-[0.16em] text-champagne">
            SHOWROOM
          </span>
          <span className="text-[12px] font-medium text-foreground/85">فروش حضوری در مشهد</span>
        </div>
      </div>
    </div>
  );
}
