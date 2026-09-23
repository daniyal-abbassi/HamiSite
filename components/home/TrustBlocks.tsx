import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import { buttonVariants } from "@/components/ui/button";
import { finalConversionCopy } from "@/lib/content/home";

/** Final full-bleed conversion band.
 *
 * The old CustomerTrust section (PENDING placeholders, an awaiting-verification
 * social gallery, a duplicate customer journey) was removed: it shipped
 * visible "empty room" cards that argued trust by apologizing for missing
 * content. Its live content (journey, trust signals, quote) already renders
 * in TrustBento. If verified customer content ever arrives, build that
 * section from real material — not from placeholders. */
export function FinalConversion() {
  return (
    <section id="final-conversion" className="final-conversion mt-10" aria-labelledby="final-conversion-title">
      <div className="beam" aria-hidden="true" />
      <div className="glow" aria-hidden="true" />
      <div className="container py-16 text-center">
        <Reveal>
          <span className="font-mono text-xs tracking-normal text-aqua/80">{finalConversionCopy.eyebrow}</span>
          <h2 id="final-conversion-title" className="mt-4 text-3xl font-black leading-[1.4] tracking-normal md:text-5xl md:leading-[1.35]">
            {finalConversionCopy.titleLead}،
            <em className="block font-black not-italic text-aqua">{finalConversionCopy.titleTail}</em>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-8 text-foreground/65">{finalConversionCopy.subtitle}</p>
          <div className="mt-8 flex flex-col items-center gap-4">
            {/* Page-final CTA: the money moment, on the Button system's
                champagne default rather than a hand-rolled pill. */}
            <Link
              href="/shop"
              className={buttonVariants({ variant: "default", size: "lg" })}
            >
              مشاهده محصولات <ArrowLeft className="size-4" />
            </Link>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <Link href="#store-experience" className="inline-flex items-center gap-1 text-xs font-bold text-foreground/70 hover:text-aqua">
                فروشگاه حضوری <ArrowLeft className="size-3.5" />
              </Link>
              <Link href="/partners" className="inline-flex items-center gap-1 text-xs font-bold text-foreground/70 hover:text-aqua">
                همکاری با ما <ArrowLeft className="size-3.5" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
