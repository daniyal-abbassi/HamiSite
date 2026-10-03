import Link from "next/link";
import { ArrowLeft, ChevronDown, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import { SectionHead } from "@/components/home/SectionHead";
import { featuredOnlineService, onlineServiceFaqs } from "@/lib/content/home";

export function OnlineServices() {
  // T-P1: this is the page's second light chapter. It used to be `band-soft`, a
  // half-opacity darkening of the ground — which is the tonal device the owner called
  // "wayyy too boring". The band now paints its own opaque paper and inverts its own
  // tokens (see `.band-paper` in home.css); the sequence down the page is
  // dark → paper → dark → paper → dark, and this is the second paper.
  return (
    <section id="online-services" className="band-paper py-16 md:py-20" aria-labelledby="online-services-title">
      <div className="container">
      {/*
       * Heading + FAQ share the reading-start column, the service card sits opposite.
       *
       * They used to be three stacked rows — heading and card in a two-column grid, the FAQ
       * a full-width block below them. On a phone that is invisible. At 1280 the heading
       * column ended near 200px and the card near 295px, so the band carried a horizontal
       * strip of empty ivory across its middle and a dead quadrant under the card, which
       * reads as an unfinished section rather than as air.
       *
       * The fix pairs the void with content that is already here. It is deliberately not a
       * second service card: `featuredOnlineService` is one record in `lib/content/home.ts`,
       * and inventing a second to even out a grid is Constitution I's budget, not this
       * file's. `lg:items-center` then balances the two columns' unequal heights.
       */}
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div>
          <Reveal>
            <SectionHead
              variant="display"
              id="online-services-title"
              title={<>بیشتر از یک فروشگاه.</>}
              description="خدمات دیجیتال حامی همراه، برای نیازهایی که در جعبه گوشی جا نمی‌شوند."
              action={
                <Link href={featuredOnlineService.href} className="inline-flex items-center gap-1.5 text-sm font-bold text-aqua hover:underline">
                  مشاهده خدمات آنلاین <ArrowLeft className="size-4" />
                </Link>
              }
            />
          </Reveal>

          <Reveal delay={140}>
            <div className="faq mt-12 grid gap-5">
              <p className="m-0 font-mono text-xs tracking-normal text-aqua">SHORT FAQ / سؤال‌های کوتاه</p>
              <div>
                {onlineServiceFaqs.map((faq) => (
                  <details key={faq.question}>
                    <summary>
                      {faq.question}
                      <ChevronDown className="size-4 shrink-0 text-aqua" />
                    </summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={100}>
          <article className="glass rounded-2xl p-7">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-aqua">{featuredOnlineService.index}</span>
              <small className="font-mono text-xs tracking-normal text-foreground/60">{featuredOnlineService.status}</small>
            </div>
            <p className="mt-5 font-mono text-xs tracking-normal text-foreground/55">{featuredOnlineService.label}</p>
            <h3 className="mt-1 text-2xl font-black">{featuredOnlineService.title}</h3>
            <i className="my-4 block h-px w-16 bg-aqua/60" aria-hidden="true" />
            <p className="text-sm leading-8 text-foreground/70">{featuredOnlineService.description}</p>
            <Link
              href={featuredOnlineService.href}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              دریافت این خدمت <ArrowLeft className="size-3.5" />
            </Link>
            <small className="mt-4 flex items-center gap-1.5 text-xs text-foreground/55">
              <ShieldCheck className="size-3.5 text-aqua" /> {featuredOnlineService.trustCopy}
            </small>
          </article>
        </Reveal>
      </div>
      </div>
    </section>
  );
}