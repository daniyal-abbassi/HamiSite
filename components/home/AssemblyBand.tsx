import "./assembly-band.css";

import Link from "next/link";
import { ArrowLeft, BadgeCheck, Headphones, ShieldCheck, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
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

/** The choreographed vocabulary (blueprint §2): every node below carries one of
 *  these ids and is addressed by `[data-band-part]` in assembly-band.css. */
export type BandPartId =
  | "stack-store"
  | "point-1"
  | "point-2"
  | "point-3"
  | "showcase-card"
  | "hands-on-card"
  | "statement-band"
  | "stack-trust"
  | "capability-store"
  | "capability-wholesale"
  | "capability-assortment"
  | "capability-assurance"
  | "warranty-row"
  | "stack-close"
  | "partners-link";

const pointIcons = [Smartphone, Headphones, ShieldCheck];

// Inline copy of the three replaced sections (§1a/§1b); `lib/content/*` strings
// are imported below instead of restated.
const sectionLead = "از انتخاب محصول تا دریافت مشاوره، حامی همراه در کنار شماست.";
const trustLead = "چهار چیزی که درباره حامی همراه دقیق است؛ بقیه را در فروشگاه بپرسید.";
const showcaseTitle = "فروشگاه حضوری در مشهد";
const showcaseFooter = "مشهد • فروشگاه حضوری حامی همراه";
const handsOnBadge = "مشاوره حضوری";
const handsOnTitle = "مشاوره تخصصی و تجربه مستقیم";
const handsOnCopy =
  "امکان دیدن و بررسی هدفون، ساعت هوشمند و اکسسوری قبل از خرید، با راهنمایی کارشناس فروشگاه.";
const statementMono = "HAMI / ONLINE + OFFLINE";
const statementCopy = "برای اطلاعات حضور فروشگاهی یا گفت‌وگو با ما، از مسیرهای زیر استفاده کنید.";

function part(id: BandPartId, className?: string) {
  return { "data-band-part": id, className: cn("assembly-band__part", className) };
}

export function AssemblyBand() {
  return (
    <section id="store-experience" className="wrap assembly-band" aria-labelledby="store-experience-title">
      <div className="assembly-band__track">
        <div className="assembly-band__shell">
          <div {...part("stack-store")} className="assembly-band__part text-center">
            <span className="eyebrow">
              <i /> تجربه حضوری
            </span>
            <HeadingArrival id="store-experience-title" level={2} className="mt-4 text-3xl font-black tracking-normal md:text-4xl">
              خرید را <span className="emphasis">لمس کنید.</span>
            </HeadingArrival>
            <p className="mt-3 text-sm text-foreground/60">{sectionLead}</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3" aria-label="اجزای تجربه خرید حضوری">
            {storeExperiencePoints.map((point, index) => {
              const Icon = pointIcons[index] ?? ShieldCheck;
              return (
                <article key={point.index} {...part(`point-${index + 1}` as BandPartId, "glass h-full rounded-2xl p-6")}>
                  <span className="font-mono text-xs text-primary">{point.index}</span>
                  <Icon className="mt-3 size-5 text-primary" strokeWidth={1.45} aria-hidden="true" />
                  <h3 className="mt-2 text-sm font-extrabold">{point.title}</h3>
                  <p className="mt-1 text-xs leading-6 text-foreground/55">{point.description}</p>
                </article>
              );
            })}
          </div>

          <div className="grid gap-5 sm:grid-cols-2" aria-label="ویژگی‌های خرید حضوری">
            <div {...part("showcase-card", "glass-smoked relative flex flex-col justify-between overflow-hidden rounded-2xl p-6")}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs tracking-wider text-champagne">AUTHENTIC SHOWCASE</span>
                <span className="rounded-full border border-champagne/20 bg-champagne/10 px-2.5 py-0.5 font-sans text-xs text-champagne">
                  {storeWarranty.label}
                </span>
              </div>
              <div className="my-6">
                <h4 className="text-base font-extrabold text-foreground">{showcaseTitle}</h4>
                <p className="mt-2 text-xs leading-6 text-foreground/70">
                  برای دیدن محصولات و دریافت {storeWarranty.label}، به فروشگاه حضوری مراجعه کنید.
                </p>
              </div>
              <div className="flex items-center gap-2 border-t border-champagne/10 pt-3 text-xs font-bold text-champagne">
                <span>{showcaseFooter}</span>
              </div>
            </div>
            <div {...part("hands-on-card", "glass-smoked relative flex flex-col justify-between overflow-hidden rounded-2xl p-6")}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs tracking-wider text-champagne">HANDS-ON EXPERIENCE</span>
                <span className="rounded-full border border-champagne/20 bg-champagne/10 px-2.5 py-0.5 font-sans text-xs text-champagne">
                  {handsOnBadge}
                </span>
              </div>
              <div className="my-6">
                <h4 className="text-base font-extrabold text-foreground">{handsOnTitle}</h4>
                <p className="mt-2 text-xs leading-6 text-foreground/70">{handsOnCopy}</p>
              </div>
              <div className="flex items-center gap-2 border-t border-champagne/10 pt-3 text-xs font-bold text-champagne">
                <span>{storeContact.hours}</span>
              </div>
            </div>
          </div>

          <div {...part("statement-band", "glass flex flex-col items-center gap-6 rounded-2xl p-8 text-center")}>
            <span className="font-mono text-xs tracking-[0.12em] text-primary">{statementMono}</span>
            <h3 className="text-xl font-black">{storeExperienceStatement}</h3>
            <p className="text-sm text-foreground/60">{statementCopy}</p>
          </div>

          <div {...part("stack-trust")} className="assembly-band__part text-center">
            <span className="eyebrow">
              <i /> چرا حامی همراه
            </span>
            <HeadingArrival id="trust-title" level={2} className="mt-4 text-3xl font-black tracking-normal md:text-5xl">
              اعتماد، با <span className="emphasis">واقعیت</span> ساخته می‌شود.
            </HeadingArrival>
            <p className="mt-4 text-sm leading-8 text-foreground/60">{trustLead}</p>
          </div>

          <ul className="grid list-none gap-x-6 gap-y-7 p-0 sm:grid-cols-2 lg:grid-cols-4" role="list">
            {trustFeatures.map((feature) => (
              <li key={feature.key} {...part(`capability-${feature.key}` as BandPartId, "flex items-start gap-3.5")}>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-champagne/35 bg-champagne/5 text-champagne">
                  <TrustGlyph name={feature.key} />
                </span>
                <div>
                  <h3 className="m-0 text-base font-black">{feature.title}</h3>
                  <p className="mt-1 text-[13px] leading-7 text-foreground/65">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>

          <div {...part("warranty-row", "flex flex-col items-start gap-4 border-t border-line pt-7 sm:flex-row sm:items-center")}>
            <p className="m-0 flex items-center gap-2 text-sm text-foreground/75">
              <BadgeCheck className="size-4 shrink-0 text-champagne" aria-hidden="true" />
              {storeWarranty.label}
            </p>
          </div>

          <div {...part("stack-close")} className="assembly-band__part text-center">
            <span className="font-mono text-xs tracking-normal text-aqua/80">{finalConversionCopy.eyebrow}</span>
            <HeadingArrival
              id="final-conversion-title"
              level={2}
              className="mt-4 text-3xl font-black leading-[1.4] tracking-normal md:text-5xl md:leading-[1.35]"
            >
              {finalConversionCopy.titleLead}،
              <em className="block font-black not-italic text-aqua">{finalConversionCopy.titleTail}</em>
            </HeadingArrival>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-8 text-foreground/65">{finalConversionCopy.subtitle}</p>
          </div>

          <div className="flex justify-center">
            <Link
              href="/partners"
              {...part("partners-link", "inline-flex items-center gap-1 text-xs font-bold text-foreground/70 hover:text-aqua")}
            >
              همکاری با ما <ArrowLeft className="size-3.5" />
            </Link>
          </div>

          {/* The immovable layer (FR-007/FR-018): no data-band-part, matched by no
              keyframe, fixed at the shell's bottom while pinned. The two old
              «مشاهده محصولات» links merged into the one shop action here (blueprint
              §8 Q4), and the «فروشگاه حضوری» → #store-experience self-link is retired
              on the T091 precedent (§8 Q3) rather than rendered here. */}
          <div className="assembly-band__immovable">
            <a href={storeContact.phoneHref} className={buttonVariants({ variant: "oxblood" })} dir="ltr">
              {storeContact.phoneDisplay}
            </a>
            <Link href="/shop" className={buttonVariants({ variant: "default" })}>
              مشاهده محصولات <ArrowLeft className="size-4" />
            </Link>
          </div>
        </div>
      </div>
      {/* Ground anchor for the `close` stage after the band replaces final-conversion
          (blueprint §5); re-anchored by driver together with the page swap. */}
      <div id="band-settled" />
    </section>
  );
}
