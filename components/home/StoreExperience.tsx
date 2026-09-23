import Link from "next/link";
import { ArrowLeft, Headphones, ShieldCheck, Smartphone } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import { buttonVariants } from "@/components/ui/button";
import { storeContact } from "@/lib/content/contact";
import { storeWarranty } from "@/lib/content/verified-facts";
import { storeExperiencePoints, storeExperienceSlots, storeExperienceStatement } from "@/lib/content/home";

const pointIcons = [Smartphone, Headphones, ShieldCheck];

export function StoreExperience() {
  return (
    <section id="store-experience" className="wrap py-16 md:py-20" aria-labelledby="store-experience-title">
      <div className="container">
      <Reveal>
        <div className="text-center">
          <span className="eyebrow"><i /> تجربه حضوری</span>
          <h2 id="store-experience-title" className="mt-4 text-3xl font-black tracking-normal md:text-4xl">
            خرید را <span className="emphasis">لمس کنید.</span>
          </h2>
          <p className="mt-3 text-sm text-foreground/60">از انتخاب محصول تا دریافت مشاوره، حامی همراه در کنار شماست.</p>
        </div>
      </Reveal>

      /*
       * A wide photograph of the store used to sit here, captioned «نور، ویترین،
       * قفسه‌ها و فضای واقعی مجموعه». It was an AI re-lit derivative, and FR-006
       * admits no store imagery as proof — owner's decision, 2026-09-23: removed
       * everywhere. The slot is left empty rather than filled with something
       * nearby; the facts below are what the business can stand behind.
       */

      <div className="mt-10 grid gap-5 sm:grid-cols-3" aria-label="اجزای تجربه خرید حضوری">
        {storeExperiencePoints.map((point, index) => {
          const Icon = pointIcons[index] ?? ShieldCheck;
          return (
            <Reveal key={point.index} delay={index * 70}>
              <article className="glass h-full rounded-2xl p-6">
                <span className="font-mono text-xs text-primary">{point.index}</span>
                <Icon className="mt-3 size-5 text-primary" strokeWidth={1.45} aria-hidden="true" />
                <h3 className="mt-2 text-sm font-extrabold">{point.title}</h3>
                <p className="mt-1 text-xs leading-6 text-foreground/55">{point.description}</p>
              </article>
            </Reveal>
          );
        })}
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2" aria-label="ویژگی‌های خرید حضوری">
        <Reveal>
          <div className="glass-smoked relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:border-champagne/40">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs tracking-wider text-champagne">AUTHENTIC SHOWCASE</span>
              <span className="rounded-full border border-champagne/20 bg-champagne/10 px-2.5 py-0.5 font-sans text-xs text-champagne">{storeWarranty.label}</span>
            </div>
            <div className="my-6">
              <h4 className="text-base font-extrabold text-foreground">فروشگاه حضوری در مشهد</h4>
              <p className="mt-2 text-xs leading-6 text-foreground/70">
                برای دیدن محصولات و دریافت {storeWarranty.label}، به فروشگاه حضوری مراجعه کنید.
              </p>
            </div>
            <div className="flex items-center gap-2 border-t border-champagne/10 pt-3 text-xs text-champagne font-bold">
              <span>مشهد • فروشگاه حضوری حامی همراه</span>
            </div>
          </div>
        </Reveal>
        <Reveal delay={70}>
          <div className="glass-smoked relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:border-champagne/40">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs tracking-wider text-champagne">HANDS-ON EXPERIENCE</span>
              <span className="rounded-full border border-champagne/20 bg-champagne/10 px-2.5 py-0.5 font-sans text-xs text-champagne">مشاوره حضوری</span>
            </div>
            <div className="my-6">
              <h4 className="text-base font-extrabold text-foreground">مشاوره تخصصی و تجربه مستقیم</h4>
              <p className="mt-2 text-xs leading-6 text-foreground/70">
                امکان دیدن و بررسی هدفون، ساعت هوشمند و اکسسوری قبل از خرید، با راهنمایی کارشناس فروشگاه.
              </p>
            </div>
            <div className="flex items-center gap-2 border-t border-champagne/10 pt-3 text-xs text-champagne font-bold">
              <span>همه‌روزه از ساعت ۹:۳۰ تا ۲۱:۳۰</span>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={120}>
        <div className="glass mt-12 flex flex-col items-center justify-between gap-6 rounded-2xl p-8 md:flex-row">
          <div>
            <span className="font-mono text-xs tracking-[0.12em] text-primary">HAMI / ONLINE + OFFLINE</span>
            <h3 className="mt-2 text-xl font-black">{storeExperienceStatement}</h3>
            <p className="mt-2 text-sm text-foreground/60">برای اطلاعات حضور فروشگاهی یا گفت‌وگو با ما، از مسیرهای زیر استفاده کنید.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            {/* Contact CTAs. The phone number is user-confirmed and lives in
                lib/content/contact.ts — the single source of truth. Before it
                arrived these pointed at stopgaps (#contact no-op, /contact
                404); the primary action now dials the real store. */}
            <a
              href={storeContact.phoneHref}
              className={buttonVariants({ variant: "oxblood" })}
              dir="ltr"
            >
              {storeContact.phoneDisplay}
            </a>
            <Link href="#store-experience" className={buttonVariants({ variant: "outline" })}>
              اطلاعات فروشگاه <ArrowLeft className="size-4" />
            </Link>
          </div>
        </div>
      </Reveal>
      </div>
    </section>
  );
}