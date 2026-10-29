import "./assembly-band.css";

import Link from "next/link";
import { ArrowLeft, BadgeCheck, Clock, Phone } from "lucide-react";
import { HeadingArrival } from "@/components/home/HeadingArrival";
import { TrustGlyph } from "@/components/home/primitives";
import { storeContact } from "@/lib/content/contact";
import { storeWarranty } from "@/lib/content/verified-facts";
import { finalConversionCopy, storeExperiencePoints, trustFeatures } from "@/lib/content/home";

/**
 * The closing band, in the order a hesitant shopper needs it: why the shop can be trusted (four verified
 * facts), what happens when they walk in (three steps, one card), then one clear way to act.
 *
 * Every string still comes from `lib/content/*` — no claim is invented here. The earlier three-statement
 * version said the same things twice (a «store experience» block and a «trust» block both argued
 * «we are a real shop in Mashhad»); this one says them once, at about half the height.
 *
 * The phone number stays in normal flow so the persistent MobileDock cannot cover it; the band reserves the
 * dock's clearance instead (see assembly-band.css).
 */
export function AssemblyBand() {
  return (
    <section id="store-experience" className="home-section-ground home-section-ground--dark wrap assembly-band" aria-labelledby="trust-title">
      <div className="container px-4 py-14 md:py-24">
        <div className="text-center">
          <span className="eyebrow">
            <i /> چرا حامی همراه
          </span>
          <HeadingArrival id="trust-title" level={2} className="mt-4 text-3xl font-black tracking-normal md:text-5xl">
            اعتماد، با <span className="emphasis">واقعیت</span> ساخته می‌شود.
          </HeadingArrival>
          <p className="mx-auto mt-4 max-w-md text-sm leading-8 text-foreground/65">
            چهار چیزی که درباره حامی همراه دقیق است؛ بقیه را در فروشگاه بپرسید.
          </p>
        </div>

        <ul className="assembly-trust" role="list">
          {trustFeatures.map((feature) => (
            <li key={feature.key} className="assembly-trust__item">
              <span className="assembly-trust__medal">
                <TrustGlyph name={feature.key} />
              </span>
              <h3 className="m-0 text-sm font-black leading-6">{feature.title}</h3>
              <p className="m-0 text-xs leading-5 text-foreground/65">{feature.description}</p>
            </li>
          ))}
        </ul>

        <article className="assembly-visit">
          <h3 className="m-0 text-lg font-black">فروشگاه حضوری در مشهد</h3>
          <p className="mt-2 text-xs leading-6 text-foreground/70">
            برای دیدن محصولات و دریافت {storeWarranty.label}، به فروشگاه مراجعه کنید.
          </p>
          <ol className="assembly-visit__steps" role="list">
            {storeExperiencePoints.map((point) => (
              <li key={point.index}>
                <span className="assembly-visit__index" aria-hidden="true">{point.index}</span>
                <span>
                  <strong className="block text-sm font-extrabold">{point.title}</strong>
                  <span className="mt-0.5 block text-xs leading-6 text-foreground/65">{point.description}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="assembly-visit__facts">
            <span><BadgeCheck className="size-4 shrink-0" aria-hidden="true" /> {storeWarranty.label}</span>
            <span><Clock className="size-4 shrink-0" aria-hidden="true" /> {storeContact.hours}</span>
          </p>
        </article>

        <div className="assembly-close">
          <HeadingArrival
            id="final-conversion-title"
            level={2}
            className="text-3xl font-black leading-[1.4] tracking-normal md:text-5xl md:leading-[1.35]"
          >
            {`${finalConversionCopy.titleLead}،`}
            <em className="block font-black not-italic text-aqua">{finalConversionCopy.titleTail}</em>
          </HeadingArrival>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-8 text-foreground/70">{finalConversionCopy.subtitle}</p>

          <div className="assembly-band__actions">
            <a href={storeContact.phoneHref} className="cta-lux cta-lux--call" dir="ltr">
              <Phone aria-hidden="true" />
              <span>{storeContact.phoneDisplay}</span>
            </a>
            <Link href="/shop" className="cta-lux cta-lux--gold lightbeam-cta">
              <span>مشاهده محصولات</span>
              <ArrowLeft aria-hidden="true" />
            </Link>
            <Link href="/partners" className="assembly-close__ghost">
              همکاری با ما <ArrowLeft className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* Ground anchor for the `close` stage: a div, never a second landmark. */}
      <div id="band-settled" />
    </section>
  );
}
