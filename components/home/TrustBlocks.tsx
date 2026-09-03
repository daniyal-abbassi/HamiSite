import Link from "next/link";
import { ArrowLeft, BadgeCheck, House, Phone, Store, UserRound } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import { customerContentNote, customerJourney, customerTrustSignals, finalConversionCopy } from "@/lib/content/home";
import { toFaDigits } from "@/lib/utils";

export function CustomerTrust() {
  return (
    <section id="customer-trust" className="wrap py-20" aria-labelledby="customer-trust-title">
      <div className="container">
      <Reveal>
        <span className="eyebrow"><i /> اعتماد مشتری</span>
        <div className="mt-4 max-w-2xl">
          <h2 id="customer-trust-title" className="text-3xl font-black tracking-tight md:text-4xl">
            اعتماد، با <span className="grad">واقعیت</span> ساخته می‌شود.
          </h2>
          <p className="mt-3 text-sm leading-7 text-foreground/60">
            تجربه‌ها و محتوای مشتریان فقط پس از تأیید منبع و دریافت اجازه، در این فضا منتشر می‌شوند.
          </p>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-5 md:grid-cols-3" aria-label="فضای شفاف اعتماد مشتری">
        <Reveal>
          <article className="glass h-full rounded-2xl p-6">
            <span className="font-mono text-[9px] tracking-[0.12em] text-primary/70">VERIFIED COMMUNITY / PENDING</span>
            <BadgeCheck className="mt-4 size-7 text-primary" strokeWidth={1.45} aria-hidden="true" />
            <h3 className="mt-3 text-sm font-black">جای تجربه‌های واقعی مشتریان</h3>
            <p className="mt-2 text-xs leading-6 text-foreground/60">{customerContentNote.message}</p>
            <small className="mt-2 block text-[11px] leading-5 text-foreground/60">{customerContentNote.helper}</small>
          </article>
        </Reveal>

        <Reveal delay={80}>
          <article className="glass h-full rounded-2xl p-6">
            <span className="font-mono text-[9px] tracking-[0.12em] text-primary/70">CUSTOMER JOURNEY</span>
            <h3 className="mt-4 text-sm font-black">ارتباط بعد از خرید تمام نمی‌شود.</h3>
            <ol className="m-0 mt-4 list-none space-y-3 p-0">
              {customerJourney.map((step, index) => (
                <li key={step} className="flex items-center gap-3 text-xs">
                  <b className="font-mono font-medium text-primary">{toFaDigits(String(index + 1).padStart(2, "0"))}</b>
                  <i className="h-px flex-1 bg-line" aria-hidden="true" />
                  {step}
                </li>
              ))}
            </ol>
          </article>
        </Reveal>

        <Reveal delay={140}>
          <article className="glass h-full rounded-2xl p-6" aria-label="جایگاه محتوای اجتماعی پس از تأیید منبع">
            <div className="flex gap-2" aria-hidden="true">
              <i className="h-14 flex-1 rounded-2xl border border-primary/25 bg-primary/5" />
              <i className="h-14 flex-1 rounded-2xl border border-primary/25 bg-primary/5" />
              <i className="h-14 flex-1 rounded-2xl border border-primary/25 bg-primary/5" />
            </div>
            <span className="mt-4 block font-mono text-[9px] tracking-[0.12em] text-primary/70">SOCIAL CONTENT / AWAITING VERIFIED SOURCE</span>
            <p className="mt-2 text-xs leading-6 text-foreground/60">
              گالری و پیوند اجتماعی پس از تأیید حساب رسمی و دریافت محتوای مجاز فعال می‌شود.
            </p>
          </article>
        </Reveal>
      </div>

      <Reveal delay={160}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="m-0 font-mono text-[10px] tracking-[0.12em] text-primary/70">TRUST SIGNALS</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {customerTrustSignals.map((signal) => (
              <span key={signal.label} className="flex items-center gap-2 text-xs text-foreground/70">
                <BadgeCheck className="size-3.5 text-primary" aria-hidden="true" />
                <Link href={signal.href} className="hover:text-gold">{signal.label}</Link>
              </span>
            ))}
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="m-0 text-sm text-foreground/60">برای شروع انتخاب، مسیر فروشگاه در دسترس است.</p>
          <Link href="/shop" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow-gold transition-transform hover:-translate-y-0.5">
            شروع خرید <ArrowLeft className="size-4" />
          </Link>
        </div>
      </Reveal>
      </div>
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
          <span className="font-mono text-[10px] tracking-[0.14em] text-gold/80">{finalConversionCopy.eyebrow}</span>
          <h2 id="final-conversion-title" className="mt-4 text-3xl font-black leading-[1.4] tracking-tight md:text-5xl md:leading-[1.35]">
            {finalConversionCopy.titleLead}،
            <em className="block font-black not-italic text-gold">{finalConversionCopy.titleTail}</em>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-8 text-foreground/65">{finalConversionCopy.subtitle}</p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground shadow-glow-gold transition-transform hover:-translate-y-0.5"
            >
              مشاهده محصولات <ArrowLeft className="size-4" />
            </Link>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <Link href="#store-experience" className="inline-flex items-center gap-1 text-xs font-bold text-foreground/70 hover:text-gold">
                فروشگاه حضوری <ArrowLeft className="size-3.5" />
              </Link>
              <Link href="/partners" className="inline-flex items-center gap-1 text-xs font-bold text-foreground/70 hover:text-gold">
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
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-gold/20 bg-ink-2/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="ناوبری سریع فروشگاه">
      {items.map(({ href, label, Icon, active }) => (
        <Link
          key={label}
          href={href}
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-bold ${active ? "text-gold" : "text-foreground/60"}`}
          aria-current={active ? "page" : undefined}
        >
          <Icon className="size-[18px]" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}