import Link from "next/link";
import { ArrowLeft, BadgeCheck, House, Phone, Store, UserRound } from "lucide-react";
import { SectionLabel } from "@/components/home/primitives";
import { Reveal } from "@/components/home/Reveal";
import { customerContentNote, customerJourney, customerTrustSignals, finalConversionCopy } from "@/lib/content/home";
import { toFaDigits } from "@/lib/utils";

export function CustomerTrust() {
  return (
    <section id="customer-trust" className="container py-20" aria-labelledby="customer-trust-title">
      <Reveal>
        <div className="max-w-2xl">
          <SectionLabel index="۰۱۲">CUSTOMER TRUST</SectionLabel>
          <h2 id="customer-trust-title" className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
            اعتماد، با <em className="font-black not-italic text-champagne">واقعیت</em> ساخته می‌شود.
          </h2>
          <p className="mt-3 text-sm leading-7 text-foreground/60">
            تجربه‌ها و محتوای مشتریان فقط پس از تأیید منبع و دریافت اجازه، در این فضا منتشر می‌شوند.
          </p>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-5 md:grid-cols-3" aria-label="فضای شفاف اعتماد مشتری">
        <Reveal>
          <article className="h-full rounded-sm border border-border bg-card p-6 shadow-card">
            <span className="font-mono text-[9px] tracking-[0.12em] text-champagne/70">VERIFIED COMMUNITY / PENDING</span>
            <BadgeCheck className="mt-4 size-7 text-champagne" strokeWidth={1.45} aria-hidden="true" />
            <h3 className="mt-3 text-sm font-black">جای تجربه‌های واقعی مشتریان</h3>
            <p className="mt-2 text-xs leading-6 text-foreground/60">{customerContentNote.message}</p>
            <small className="mt-2 block text-[11px] leading-5 text-foreground/45">{customerContentNote.helper}</small>
          </article>
        </Reveal>

        <Reveal delay={80}>
          <article className="h-full rounded-sm border border-border bg-card p-6 shadow-card">
            <span className="font-mono text-[9px] tracking-[0.12em] text-champagne/70">CUSTOMER JOURNEY</span>
            <h3 className="mt-4 text-sm font-black">ارتباط بعد از خرید تمام نمی‌شود.</h3>
            <ol className="m-0 mt-4 list-none space-y-3 p-0">
              {customerJourney.map((step, index) => (
                <li key={step} className="flex items-center gap-3 text-xs">
                  <b className="font-mono font-medium text-champagne">{toFaDigits(String(index + 1).padStart(2, "0"))}</b>
                  <i className="h-px flex-1 bg-border" aria-hidden="true" />
                  {step}
                </li>
              ))}
            </ol>
          </article>
        </Reveal>

        <Reveal delay={140}>
          <article className="h-full rounded-sm border border-border bg-card p-6 shadow-card" aria-label="جایگاه محتوای اجتماعی پس از تأیید منبع">
            <div className="flex gap-2" aria-hidden="true">
              <i className="h-14 flex-1 rounded-sm border border-champagne/25 bg-champagne/5" />
              <i className="h-14 flex-1 rounded-sm border border-champagne/25 bg-champagne/5" />
              <i className="h-14 flex-1 rounded-sm border border-champagne/25 bg-champagne/5" />
            </div>
            <span className="mt-4 block font-mono text-[9px] tracking-[0.12em] text-champagne/70">SOCIAL CONTENT / AWAITING VERIFIED SOURCE</span>
            <p className="mt-2 text-xs leading-6 text-foreground/60">
              گالری و پیوند اجتماعی پس از تأیید حساب رسمی و دریافت محتوای مجاز فعال می‌شود.
            </p>
          </article>
        </Reveal>
      </div>

      <Reveal delay={160}>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border-t border-border pt-8" aria-label="مسیرهای اعتماد حامی همراه">
          {customerTrustSignals.map((signal, index) => (
            <span key={signal.label} className="flex items-center gap-3 text-[11px] text-foreground/55">
              {index > 0 && <i className="size-1 rounded-full bg-champagne/60" aria-hidden="true" />}
              <Link href={signal.href} className="hover:text-champagne">{signal.label}</Link>
            </span>
          ))}
        </div>
        <div className="mt-8 text-center">
          <p className="m-0 text-sm text-foreground/60">برای شروع انتخاب، مسیر فروشگاه در دسترس است.</p>
          <Link href="/shop" className="mt-4 inline-flex items-center gap-1.5 rounded-sm bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-champagne-light">
            شروع خرید <ArrowLeft className="size-4" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/** Final full-bleed conversion band. */
export function FinalConversion() {
  return (
    <section id="final-conversion" className="final-conversion mt-10" aria-labelledby="final-conversion-title">
      <div className="beam" aria-hidden="true" />
      <div className="glow" aria-hidden="true" />
      <div className="container py-24 text-center">
        <Reveal>
          <span className="font-mono text-[10px] tracking-[0.14em] text-champagne/80">{finalConversionCopy.eyebrow}</span>
          <h2 id="final-conversion-title" className="mt-4 text-3xl font-black leading-[1.4] tracking-tight md:text-5xl md:leading-[1.35]">
            {finalConversionCopy.titleLead}،
            <em className="block font-black not-italic text-champagne">{finalConversionCopy.titleTail}</em>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-8 text-foreground/65">{finalConversionCopy.subtitle}</p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground transition-colors hover:bg-champagne-light"
            >
              مشاهده محصولات <ArrowLeft className="size-4" />
            </Link>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <Link href="#store-experience" className="inline-flex items-center gap-1 text-xs font-bold text-foreground/70 hover:text-champagne">
                فروشگاه حضوری <ArrowLeft className="size-3.5" />
              </Link>
              <Link href="/partners" className="inline-flex items-center gap-1 text-xs font-bold text-foreground/70 hover:text-champagne">
                همکاری با ما <ArrowLeft className="size-3.5" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Fixed bottom dock — mobile only, mirrors the reference's mobile-shop-dock. */
export function MobileDock() {
  const items = [
    { href: "/", label: "خانه", Icon: House, active: true },
    { href: "/shop", label: "فروشگاه", Icon: Store },
    { href: "/partners", label: "همکاری", Icon: UserRound },
    { href: "#contact", label: "تماس", Icon: Phone },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-champagne/20 bg-wine-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="ناوبری سریع فروشگاه">
      {items.map(({ href, label, Icon, active }) => (
        <Link
          key={label}
          href={href}
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-bold ${active ? "text-champagne" : "text-foreground/60"}`}
          aria-current={active ? "page" : undefined}
        >
          <Icon className="size-[18px]" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}


