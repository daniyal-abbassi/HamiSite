import "./assembly-band.css";

import Link from "next/link";
import { ArrowLeft, BadgeCheck, Headphones, ShieldCheck, Smartphone } from "lucide-react";
import { HeadingArrival } from "@/components/home/HeadingArrival";
import { TrustGlyph } from "@/components/home/primitives";
import { buttonVariants } from "@/components/ui/button";
import { storeContact } from "@/lib/content/contact";
import { storeWarranty } from "@/lib/content/verified-facts";
import {
  finalConversionCopy,
  storeExperiencePoints,
  storeExperienceStatement,
  trustFeatures,
} from "@/lib/content/home";

const pointIcons = [Smartphone, Headphones, ShieldCheck];

/**
 * The closing band: the store-experience, trust and final-conversion sections as one composition.
 *
 * It is a composed static layout, not a scroll mechanism — the pin was measured and removed; see
 * `specs/007-motion-assembly-band/notes/band-geometry-measured.md`. What survives of the original idea is
 * the arrival: each of the three statements lifts into place in word units, once per page load.
 *
 * Three things this file is deliberately not doing:
 *  - **No new claims.** Every string comes from `lib/content/*` or is a section heading the page already
 *    carried. The English mono labels the old sections used («AUTHENTIC SHOWCASE», «HANDS-ON EXPERIENCE»,
 *    «HAMI / ONLINE + OFFLINE», «CUSTOMER JOURNEY») are gone — they were decoration arguing trust in a
 *    font, and removing content is allowed while inventing it is not (Principle III, FR-004).
 *  - **No 360px column of four identical cards.** The capabilities are a 2×2 grid at phone width because
 *    four full-width rows was the flattest arrangement available, and «squeeze the sections into one»
 *    has to show up in the layout, not only in the motion.
 *  - **No position tricks for the phone number.** It is in flow. Inside `.wrap` (z-index: 2) it could never
 *    outrank `MobileDock` (z-40), so instead of fighting the stacking context the band reserves the dock's
 *    measured 62px + inset and lets the number sit where a thumb already is.
 */
export function AssemblyBand() {
  return (
    <section id="store-experience" className="wrap assembly-band" aria-labelledby="store-experience-title">
      <div className="container px-4 py-16 md:py-24">
        {/* Statement 1 — the physical shop. */}
        <div className="text-center">
          <span className="eyebrow">
            <i /> تجربه حضوری
          </span>
          <HeadingArrival id="store-experience-title" level={2} className="mt-4 text-3xl font-black tracking-normal md:text-5xl">
            خرید را <span className="emphasis">لمس کنید.</span>
          </HeadingArrival>
          <p className="mx-auto mt-4 max-w-md text-sm leading-8 text-foreground/60">
            از انتخاب محصول تا دریافت مشاوره، حامی همراه در کنار شماست.
          </p>
        </div>

        <ul className="mt-10 grid list-none gap-px overflow-hidden rounded-2xl border border-line p-0 sm:grid-cols-3" role="list">
          {storeExperiencePoints.map((point) => (
            <li key={point.index} className="flex items-start gap-3.5 bg-surface/40 p-5">
              <span className="mt-0.5 shrink-0 text-champagne">
                {(() => {
                  const Icon = pointIcons[Number(point.index) - 1] ?? ShieldCheck;
                  return <Icon className="size-5" strokeWidth={1.45} aria-hidden="true" />;
                })()}
              </span>
              <div>
                <h3 className="m-0 text-sm font-extrabold">{point.title}</h3>
                <p className="mt-1 text-xs leading-6 text-foreground/60">{point.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="glass-smoked rounded-2xl p-6">
            <h3 className="m-0 text-base font-black">فروشگاه حضوری در مشهد</h3>
            <p className="mt-2 text-xs leading-6 text-foreground/65">
              برای دیدن محصولات و دریافت {storeWarranty.label}، به فروشگاه حضوری مراجعه کنید.
            </p>
            <p className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs font-bold text-champagne">
              <BadgeCheck className="size-4 shrink-0" aria-hidden="true" />
              {storeWarranty.label}
            </p>
          </article>
          <article className="glass-smoked rounded-2xl p-6">
            <h3 className="m-0 text-base font-black">مشاوره تخصصی و تجربه مستقیم</h3>
            <p className="mt-2 text-xs leading-6 text-foreground/65">
              امکان دیدن و بررسی هدفون، ساعت هوشمند و اکسسوری قبل از خرید، با راهنمایی کارشناس فروشگاه.
            </p>
            <p className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs font-bold text-champagne">
              {storeContact.hours}
            </p>
          </article>
        </div>

        <p className="mx-auto mt-10 max-w-xl text-center text-lg font-black leading-8 md:text-xl">
          {storeExperienceStatement}
        </p>

        {/* Statement 2 — the four things that are actually true about the shop. */}
        <div className="mt-16 text-center">
          <span className="eyebrow">
            <i /> چرا حامی همراه
          </span>
          <HeadingArrival id="trust-title" level={2} className="mt-4 text-3xl font-black tracking-normal md:text-5xl">
            اعتماد، با <span className="emphasis">واقعیت</span> ساخته می‌شود.
          </HeadingArrival>
          <p className="mx-auto mt-4 max-w-md text-sm leading-8 text-foreground/60">
            چهار چیزی که درباره حامی همراه دقیق است؛ بقیه را در فروشگاه بپرسید.
          </p>
        </div>

        <ul className="m-0 mt-8 grid list-none gap-x-6 gap-y-6 p-0 grid-cols-2 sm:grid-cols-4" role="list">
          {trustFeatures.map((feature) => (
            <li key={feature.key} className="flex flex-col items-start gap-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-champagne/35 bg-champagne/5 text-champagne">
                <TrustGlyph name={feature.key} />
              </span>
              <h3 className="m-0 text-sm font-black leading-6">{feature.title}</h3>
              <p className="m-0 text-[11px] leading-5 text-foreground/60">{feature.description}</p>
            </li>
          ))}
        </ul>

        {/* Statement 3 — the close. */}
        <div className="mt-16 text-center">
          <HeadingArrival
            id="final-conversion-title"
            level={2}
            className="text-3xl font-black leading-[1.4] tracking-normal md:text-5xl md:leading-[1.35]"
          >
            {finalConversionCopy.titleLead}،
            <em className="block font-black not-italic text-aqua">{finalConversionCopy.titleTail}</em>
          </HeadingArrival>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-8 text-foreground/65">{finalConversionCopy.subtitle}</p>
        </div>

        <div className="assembly-band__actions mt-10">
          <a href={storeContact.phoneHref} className={buttonVariants({ variant: "oxblood", size: "lg" })} dir="ltr">
            {storeContact.phoneDisplay}
          </a>
          <Link href="/shop" className={buttonVariants({ variant: "default", size: "lg" })}>
            مشاهده محصولات <ArrowLeft className="size-4" />
          </Link>
          <Link href="/partners" className={buttonVariants({ variant: "ghost", className: "text-xs font-bold" })}>
            همکاری با ما <ArrowLeft className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Ground anchor for the `close` stage (blueprint §5): a div, never a second landmark, and outside any
          pinned box because useAtmosphereGround measures anchors on mount and never on scroll. */}
      <div id="band-settled" />
    </section>
  );
}
