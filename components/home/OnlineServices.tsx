import Link from "next/link";
import { ArrowLeft, ChevronDown, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import { featuredOnlineService, onlineServiceFaqs } from "@/lib/content/home";

export function OnlineServices() {
  return (
    <section id="online-services" className="bg-ink/25 py-20" aria-labelledby="online-services-title">
      <div className="container">
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
        <Reveal>
          <div>
            <span className="eyebrow"><i /> خدمات دیجیتال</span>
            <h2 id="online-services-title" className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
              بیشتر از یک <span className="grad">فروشگاه.</span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-8 text-foreground/65">
              خدمات دیجیتال حامی همراه، برای نیازهایی که در جعبه گوشی جا نمی‌شوند.
            </p>
            <Link href="/shop?category=online-services" className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-gold hover:underline">
              مشاهده خدمات آنلاین <ArrowLeft className="size-4" />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <article className="glass rounded-2xl p-7">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-gold">{featuredOnlineService.index}</span>
              <small className="font-mono text-[9px] tracking-[0.1em] text-foreground/60">{featuredOnlineService.status}</small>
            </div>
            <p className="mt-5 font-mono text-[11px] tracking-[0.1em] text-foreground/55">{featuredOnlineService.label}</p>
            <h3 className="mt-1 text-2xl font-black">{featuredOnlineService.title}</h3>
            <i className="my-4 block h-px w-16 bg-gold/60" aria-hidden="true" />
            <p className="text-sm leading-8 text-foreground/70">{featuredOnlineService.description}</p>
            <Link
              href={featuredOnlineService.href}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              دریافت این خدمت <ArrowLeft className="size-3.5" />
            </Link>
            <small className="mt-4 flex items-center gap-1.5 text-[11px] text-foreground/55">
              <ShieldCheck className="size-3.5 text-gold" /> {featuredOnlineService.trustCopy}
            </small>
          </article>
        </Reveal>
      </div>

      <Reveal delay={140}>
        <div className="faq mt-12 grid gap-8 md:grid-cols-[0.6fr_1.4fr]">
          <p className="m-0 font-mono text-[10px] tracking-[0.12em] text-gold">SHORT FAQ / سؤال‌های کوتاه</p>
          <div>
            {onlineServiceFaqs.map((faq) => (
              <details key={faq.question}>
                <summary>
                  {faq.question}
                  <ChevronDown className="size-4 shrink-0 text-gold" />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </Reveal>
      </div>
    </section>
  );
}