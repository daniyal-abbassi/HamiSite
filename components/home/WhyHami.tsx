import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import { brandWall, whyHamiProofs, whyHamiQuote, whyHamiTrustStrip } from "@/lib/content/home";

function ProofMedia({ media }: { media: string }) {
  if (media === "store-photo-pending") {
    return (
      <div className="store-architecture text-center" aria-hidden="true">
        <i /><i /><i />
        <span className="mt-3 block font-mono text-[9px] tracking-[0.12em] text-primary/70">PHYSICAL PRESENCE</span>
        <b className="mt-1 block text-xs font-bold text-foreground/70">تصویر واقعی فروشگاه در انتظار افزودن</b>
      </div>
    );
  }
  if (media === "product-composition") {
    return (
      <div className="product-composition text-center" aria-hidden="true">
        <b>CURATED</b>
        <b>PRODUCTS</b>
        <span className="mt-2 block font-mono text-[9px] tracking-[0.12em] text-primary/70">SELECTED WITH CARE</span>
      </div>
    );
  }
  if (media === "brand-composition") {
    return (
      <div className="brand-composition" aria-hidden="true">
        {brandWall.slice(0, 5).map((brand) => <b key={brand.name}>{brand.name}</b>)}
        <span className="mt-2 block font-mono text-[9px] tracking-[0.12em] text-primary/70">MULTI / BRAND</span>
      </div>
    );
  }
  return (
    <div className="b2b-route" aria-hidden="true">
      <div>
        <span className="font-mono text-[10px] tracking-[0.12em] text-primary/80">PARTNER</span>
        <i />
        <b className="block font-mono text-sm tracking-[0.1em] text-foreground/85">ROUTE</b>
      </div>
      <small>REGISTER — VERIFY — ORDER</small>
    </div>
  );
}

export function WhyHami() {
  return (
    <section id="why-hami" className="wrap py-20" aria-labelledby="why-hami-title">
      <div className="container">
      <Reveal>
        <span className="eyebrow"><i /> چرا حامی همراه</span>
        <div className="mt-4 grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-end">
          <div>
            <h2 id="why-hami-title" className="text-3xl font-black tracking-tight md:text-4xl">
              فقط یک <span className="grad">فروشگاه</span> نیستیم.
            </h2>
          </div>
          <p className="text-sm leading-8 text-foreground/60">
            تجربه‌ای که از انتخاب محصول شروع می‌شود و به خرید مطمئن و همکاری بلندمدت می‌رسد.
          </p>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-5 sm:grid-cols-2" aria-label="شواهد تجربه حامی همراه">
        {whyHamiProofs.map((proof, index) => (
          <Reveal key={proof.key} delay={index * 65}>
            <article className="glass flex h-full flex-col overflow-hidden rounded-2xl">
              <div className="proof-media">
                <ProofMedia media={proof.media} />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <span className="font-mono text-[9px] tracking-[0.12em] text-primary">{proof.eyebrow}</span>
                <h3 className="mt-2 text-base font-black">{proof.title}</h3>
                <p className="mt-2 text-[13px] leading-7 text-foreground/65">{proof.description}</p>
                <small className="mt-1 text-[11px] text-foreground/60">{proof.mediaNote}</small>
                <Link href={proof.href} className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-bold text-primary hover:underline">
                  {proof.cta} <ArrowLeft className="size-3.5" />
                </Link>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120}>
        <blockquote className="mx-auto mt-14 max-w-2xl border-s-2 border-primary/60 ps-6 text-center">
          <p className="m-0 text-lg font-bold leading-9 text-foreground/85 md:text-xl">{whyHamiQuote}</p>
        </blockquote>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2" aria-label="امضای خدمات حامی همراه">
          {whyHamiTrustStrip.map((item, index) => (
            <span key={item} className="flex items-center gap-3 text-[11px] text-foreground/55">
              {index > 0 && <i className="size-1 rounded-full bg-primary/60" aria-hidden="true" />}
              {item}
            </span>
          ))}
        </div>
      </Reveal>
      </div>
    </section>
  );
}