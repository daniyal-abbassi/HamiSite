import Image from "next/image";
import Link from "next/link";
import storePhoto from "@/public/store/shop.jpg";
import { ArrowLeft, Headphones, ShieldCheck, Smartphone } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import { storeExperiencePoints, storeExperienceSlots, storeExperienceStatement } from "@/lib/content/home";

const pointIcons = [Smartphone, Headphones, ShieldCheck];

export function StoreExperience() {
  return (
    <section id="store-experience" className="wrap py-14" aria-labelledby="store-experience-title">
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

      {/* The real store, wide. This was a "REAL PHOTO SLOT" placeholder sitting
          in the darkest, emptiest stretch of the page — the single dullest
          screen a visitor scrolled through. The photograph exists (see
          public/store/), so the slot is filled rather than styled.

          Cropped wide with `object-cover`: the source is portrait, and
          letterboxing it here would put the dead space straight back. */}
      <Reveal delay={80}>
        <figure className="relative mt-10 overflow-hidden rounded-3xl">
          {/* 21:9 is a cinematic ratio for a wide screen and a 390x167 sliver on a
              phone — the shop interior becomes an unreadable band. 4:3 on mobile
              gives the room enough height to actually be a photograph. */}
          <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
            <Image
              src={storePhoto}
              alt="فروشگاه حامی همراه در مشهد — نمای کلی سالن، ویترین‌ها و قفسه‌ها"
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              placeholder="blur"
              className="object-cover object-[50%_42%]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(13,5,7,0.45) 0%, transparent 34%, transparent 52%, rgba(13,5,7,0.86) 100%)",
              }}
            />
          </div>
          <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-4 sm:gap-3 sm:p-6">
            <div>
              <span className="block font-mono text-[10px] tracking-[0.14em] text-aqua/80">HAMI HAMRAH / MASHHAD</span>
              <b className="mt-1 block text-lg font-black">نمای کلی فروشگاه</b>
              <small className="mt-0.5 block text-[12px] text-foreground/70">
                نور، ویترین، قفسه‌ها و فضای واقعی مجموعه
              </small>
            </div>
          </figcaption>
        </figure>
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

      <div className="mt-5 grid gap-5 sm:grid-cols-2" aria-label="ویژگی‌های خرید حضوری">
        <Reveal>
          <div className="glass-smoked relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:border-champagne/40">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-wider text-champagne">AUTHENTIC SHOWCASE</span>
              <span className="rounded-full border border-champagne/20 bg-champagne/10 px-2.5 py-0.5 font-sans text-[10px] text-champagne">تضمین ۱۰۰٪ اصالت</span>
            </div>
            <div className="my-6">
              <h4 className="text-base font-extrabold text-foreground">ویترین رسمی برندهای برتر</h4>
              <p className="mt-2 text-xs leading-6 text-foreground/70">
                ارائه جدیدترین پرچمداران سامسونگ، اپل و شیائومی همراه با بسته‌بندی پلمپ کارخانه و گارانتی رسمی شرکتی در سالن اصلی فروشگاه.
              </p>
            </div>
            <div className="flex items-center gap-2 border-t border-champagne/10 pt-3 text-[11px] text-champagne font-bold">
              <span>مشهد • مجتمع تجاری موبایل</span>
            </div>
          </div>
        </Reveal>
        <Reveal delay={70}>
          <div className="glass-smoked relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:border-champagne/40">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-wider text-champagne">HANDS-ON EXPERIENCE</span>
              <span className="rounded-full border border-champagne/20 bg-champagne/10 px-2.5 py-0.5 font-sans text-[10px] text-champagne">میز تست صدا و کاربری</span>
            </div>
            <div className="my-6">
              <h4 className="text-base font-extrabold text-foreground">مشاوره تخصصی و تجربه مستقیم</h4>
              <p className="mt-2 text-xs leading-6 text-foreground/70">
                امکان تست و بررسی انواع هدفون، ساعت هوشمند و اکسسوری‌های اورجینال قبل از خرید با همراهی کارشناسان باسابقه حامی همراه.
              </p>
            </div>
            <div className="flex items-center gap-2 border-t border-champagne/10 pt-3 text-[11px] text-champagne font-bold">
              <span>همه‌روزه از ساعت ۹:۳۰ تا ۲۱:۳۰</span>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={120}>
        <div className="glass mt-12 flex flex-col items-center justify-between gap-6 rounded-2xl p-8 md:flex-row">
          <div>
            <span className="font-mono text-[9px] tracking-[0.12em] text-primary">HAMI / ONLINE + OFFLINE</span>
            <h3 className="mt-2 text-xl font-black">{storeExperienceStatement}</h3>
            <p className="mt-2 text-sm text-foreground/60">برای اطلاعات حضور فروشگاهی یا گفت‌وگو با ما، از مسیرهای زیر استفاده کنید.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="#contact" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow-cta transition-transform hover:-translate-y-0.5">
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