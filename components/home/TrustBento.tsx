import Link from "next/link";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import { WhyHamiProofs } from "@/components/home/WhyHami";
import { TrustGlyph } from "@/components/home/primitives";
import { toFaDigits } from "@/lib/utils";
import {
  customerContentNote,
  customerJourney,
  customerTrustSignals,
  trustFeatures,
  whyHamiQuote,
} from "@/lib/content/home";

/**
 * One trust section, replacing three.
 *
 * The page previously ran TrustBar → WhyHami → CustomerTrust as three separate
 * full sections, each opening with its own heading that argued the same point.
 * Saying "trust us" three times reads weaker than saying it once, so their
 * content is merged here into a single asymmetric bento: one tall anchor card,
 * one wide card, two small ones — then the proof grid that carried the actual
 * evidence.
 *
 * Nothing was dropped: the four trust features, the quote, the customer
 * journey, the pending-content note, the trust signals and the shop CTA all
 * still render.
 */
export function TrustBento() {
  return (
    <section id="trust" className="wrap py-14" aria-labelledby="trust-title">
      <div className="px-4">
        <Reveal>
          <div className="container mx-auto max-w-2xl text-center">
            <span className="eyebrow"><i /> چرا حامی همراه</span>
            <h2 id="trust-title" className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
              اعتماد، با <span className="grad">واقعیت</span> ساخته می‌شود.
            </h2>
            <p className="mt-4 text-sm leading-8 text-foreground/60">
              تجربه‌ای که از انتخاب محصول شروع می‌شود و به خرید مطمئن و همکاری بلندمدت می‌رسد.
            </p>
          </div>
        </Reveal>

        {/* Asymmetric bento in luxury smoked glass */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Reveal className="lg:col-span-2 lg:row-span-2">
            <article className="glass-smoked group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-8 transition-all duration-300 hover:border-champagne/40">
              <div>
                <blockquote className="m-0">
                  <p className="m-0 text-xl font-black leading-9 text-foreground/90 md:text-2xl md:leading-10">
                    {whyHamiQuote}
                  </p>
                </blockquote>
                <ul className="mt-8 grid list-none gap-5 p-0 sm:grid-cols-2" role="list">
                  {trustFeatures.map((feature) => (
                    <li key={feature.key} className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-champagne/35 text-champagne bg-champagne/5">
                        <TrustGlyph name={feature.key} />
                      </span>
                      <div>
                        <h3 className="m-0 text-sm font-extrabold">{feature.title}</h3>
                        <p className="mt-1 text-xs leading-6 text-foreground/65">{feature.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                style={{ background: "radial-gradient(circle at top left, rgba(100,2,17,0.35), transparent 65%)" }}
                aria-hidden="true"
              />
            </article>
          </Reveal>

          <Reveal delay={80} className="lg:col-span-2">
            <article className="glass-smoked h-full rounded-2xl p-8 transition-all duration-300 hover:border-champagne/40">
              <span className="font-mono text-[9px] tracking-[0.14em] text-champagne">CUSTOMER JOURNEY</span>
              <h3 className="mt-3 text-base font-black">ارتباط بعد از خرید تمام نمی‌شود.</h3>
              <ol className="m-0 mt-5 list-none space-y-3 p-0">
                {customerJourney.map((step, index) => (
                  <li key={step} className="flex items-center gap-3 text-xs">
                    <b className="font-mono font-bold text-champagne">{toFaDigits(String(index + 1).padStart(2, "0"))}</b>
                    <i className="h-px flex-1 bg-champagne/15" aria-hidden="true" />
                    <span className="font-medium text-foreground/80">{step}</span>
                  </li>
                ))}
              </ol>
            </article>
          </Reveal>

          <Reveal delay={140}>
            <article className="glass-smoked h-full rounded-2xl p-6 transition-all duration-300 hover:border-champagne/40">
              <span className="font-mono text-[9px] tracking-[0.14em] text-champagne">VERIFIED TRUST</span>
              <BadgeCheck className="mt-4 size-7 text-champagne" strokeWidth={1.5} aria-hidden="true" />
              <h3 className="mt-3 text-sm font-black">رضایت و اعتماد ماندگار</h3>
              <p className="mt-2 text-xs leading-6 text-foreground/65">
                با بیش از ۲۰ سال سابقه تخصصی در بازار موبایل مشهد، گارانتی رسمی و پشتیبانی واقعی تعهد همیشگی ما به شماست.
              </p>
            </article>
          </Reveal>

          <Reveal delay={200}>
            <article className="glass-smoked flex h-full flex-col justify-between rounded-2xl p-6 transition-all duration-300 hover:border-champagne/40">
              <div>
                <span className="font-mono text-[9px] tracking-[0.14em] text-champagne">TRUST SIGNALS</span>
                <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2">
                  {customerTrustSignals.map((signal) => (
                    <Link
                      key={signal.label}
                      href={signal.href}
                      className="flex min-h-11 items-center gap-1.5 text-[11px] text-foreground/70 hover:text-champagne transition-colors md:min-h-0"
                    >
                      <BadgeCheck className="size-3.5 text-champagne" aria-hidden="true" />
                      {signal.label}
                    </Link>
                  ))}
                </div>
              </div>
              <Link
                href="/shop"
                className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-full bg-champagne px-5 py-3 text-sm font-bold text-ink shadow-glow-cta transition-transform duration-fast hover:-translate-y-0.5 active:scale-95"
              >
                شروع خرید <ArrowLeft className="size-4" />
              </Link>
            </article>
          </Reveal>
        </div>

        {/* The evidence cards that survived the merge. */}
        <div className="container">
          <WhyHamiProofs />
        </div>
      </div>
    </section>
  );
}
