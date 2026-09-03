import Link from "next/link";
import { ArrowLeft, Headphones, ShieldCheck, Smartphone } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import { storeExperiencePoints, storeExperienceSlots, storeExperienceStatement } from "@/lib/content/home";

const pointIcons = [Smartphone, Headphones, ShieldCheck];

export function StoreExperience() {
  return (
    <section id="store-experience" className="wrap py-20" aria-labelledby="store-experience-title">
      <div className="container">
      <Reveal>
        <div className="text-center">
          <span className="eyebrow"><i /> تجربه حضوری</span>
          <h2 id="store-experience-title" className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
            خرید را <span className="grad">لمس کنید.</span>
          </h2>
          <p className="mt-3 text-sm text-foreground/60">از انتخاب محصول تا دریافت مشاوره، حامی همراه در کنار شماست.</p>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="store-slot mt-10 min-h-56 rounded-2xl" aria-label="جایگاه عکس واقعی: نمای کلی فروشگاه">
          <div aria-hidden="true">
            <i /><span /><i />
          </div>
          <div className="absolute bottom-4 text-center">
            <span className="block font-mono text-[9px] tracking-[0.12em] text-primary/70">REAL PHOTO SLOT / WIDE STORE</span>
            <b className="mt-1 block text-xs font-bold text-foreground/75">نمای کلی فروشگاه</b>
            <small className="mt-0.5 block text-[11px] text-foreground/60">نور، ویترین، قفسه‌ها و فضای واقعی مجموعه</small>
          </div>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-5 sm:grid-cols-3" aria-label="اجزای تجربه خرید حضوری">
        {storeExperiencePoints.map((point, index) => {
          const Icon = pointIcons[index] ?? ShieldCheck;
          return (
            <Reveal key={point.index} delay={index * 70}>
              <article className="glass h-full rounded-2xl p-6">
                <span className="font-mono text-[10px] text-primary">{point.index}</span>
                <Icon className="mt-3 size-5 text-primary" strokeWidth={1.45} aria-hidden="true" />
                <h3 className="mt-2 text-sm font-extrabold">{point.title}</h3>
                <p className="mt-1 text-xs leading-6 text-foreground/55">{point.description}</p>
              </article>
            </Reveal>
          );
        })}
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2" aria-label="جایگاه تصاویر تجربه حضوری">
        {storeExperienceSlots.map((slot) => (
          <Reveal key={slot.key}>
            <div className="store-slot min-h-44 rounded-2xl" aria-label={`جایگاه عکس واقعی: ${slot.label}`}>
              <div aria-hidden="true">
                <i /><span />
              </div>
              <div className="absolute bottom-3 text-center">
                <p className="m-0 font-mono text-[8px] tracking-[0.12em] text-primary/60">REAL PHOTO SLOT</p>
                <b className="mt-0.5 block text-xs font-bold text-foreground/75">{slot.label}</b>
                <small className="mt-0.5 block text-[11px] text-foreground/60">{slot.intendedUse}</small>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120}>
        <div className="glass mt-12 flex flex-col items-center justify-between gap-6 rounded-2xl p-8 md:flex-row">
          <div>
            <span className="font-mono text-[9px] tracking-[0.12em] text-primary">HAMI / ONLINE + OFFLINE</span>
            <h3 className="mt-2 text-xl font-black">{storeExperienceStatement}</h3>
            <p className="mt-2 text-sm text-foreground/60">برای اطلاعات حضور فروشگاهی یا گفت‌وگو با ما، از مسیرهای زیر استفاده کنید.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="#contact" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow-gold transition-transform hover:-translate-y-0.5">
              اطلاعات فروشگاه <ArrowLeft className="size-4" />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 px-5 py-2.5 text-sm font-bold text-primary transition-colors duration-fast hover:bg-primary/10">
              تماس با ما <ArrowLeft className="size-4" />
            </Link>
          </div>
        </div>
      </Reveal>
      </div>
    </section>
  );
}