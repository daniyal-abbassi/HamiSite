import { BrandRows } from "@/components/home/BrandRows";
import { Reveal } from "@/components/home/Reveal";
import { SectionHead } from "@/components/home/SectionHead";
import { brandProductCounts } from "@/lib/brand-counts";

/** Brands chapter.
 *
 * This used to be a wall of nine text wordmarks under a single story card. Eight of the
 * nine were `disabled` buttons captioned «روایت این برند به‌زودی», the card showed one
 * brand at a time and only ever Apple unless the shopper found the invisible wiring, and
 * the whole thing read as a list of things the page did not have. `BrandRows` replaces
 * it: every brand is a row, every row is a destination.
 *
 * Server component on purpose: the per-brand counts come from `lib/catalog.ts`, which
 * reads a 2.2 MB JSON export. Resolved here and handed down as six numbers, so the
 * catalogue never enters the client bundle. */
export function BrandShowcase() {
  return (
    <section id="brands" className="wrap relative overflow-hidden pt-0 pb-14" aria-labelledby="brands-title">
      {/* T070 deleted `ModernWhiteWave` — a stock page-builder divider with four
          gradients, an SVG blur filter and dashed specular crests, and the element
          least belonging to this brand world. T071 removed the 96×96 champagne blob
          that used to float above it: a `blur-3xl` wash is not section depth, and the
          section now separates from its neighbours with the space it already has. */}
      <div className="container relative">
        <Reveal>
          <SectionHead
            variant="split"
            id="brands-title"
            eyebrow="برندها"
            title={<>برندهایی که می‌شناسید، انتخاب‌هایی که به آن‌ها اعتماد دارید.</>}
            description="مجموعه‌ای از برندهای معتبر موبایل، تکنولوژی و لوازم جانبی، در یک تجربهٔ خرید واحد."
          />
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-10">
            <BrandRows counts={brandProductCounts()} />
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-14 flex flex-wrap items-baseline justify-center gap-3 text-center">
            <p className="m-0 text-lg text-foreground/60">یک مقصد.</p>
            <strong className="text-2xl font-black text-aqua">همه‌اش در مشهد.</strong>
            <span className="font-mono text-xs tracking-[0.12em] text-foreground/60">HAMI HAMRAH</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
