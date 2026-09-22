import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { categoryLinks } from "@/lib/content/home";

/** Decorative blob from the reference shapes, rendered via CSS (no <img>). */
function BlobDecor() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -start-16 -top-16 size-56 opacity-30"
      style={{
        backgroundImage: "url(/images/shapes/blob.svg)",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}

const sideBanners = [
  {
    src: "/images/banners/gaming-laptop.png",
    eyebrow: "SHOP / 02",
    title: "لپ‌تاپ برای کار و بازی",
    href: "/shop?sort=price-asc",
  },
  {
    src: "/images/banners/headphone.png",
    eyebrow: "SHOP / 03",
    title: "صوت، با جزئیات دقیق",
    href: categoryLinks.audio,
  },
] as const;

export function ShopBanner() {
  return (
    <section className="container pt-10" aria-label="بنرهای فروشگاه">
      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        {/* Main banner */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-xl glass p-5 shadow-card md:flex-row md:items-center md:gap-6 md:p-8">
          <BlobDecor />
          <div className="relative max-w-sm">
            <div className="section-label">
              <span>۰۰۱</span>
              <i />
              <p>گوشی‌های پرچمدار</p>
            </div>
            <h2 className="mt-4 text-xl font-black leading-9 md:text-2xl">
              پرچمداران جدید،
              <em className="block font-black not-italic text-aqua">با خیالِ راحت.</em>
            </h2>
            <p className="mt-3 text-xs leading-6 text-foreground/60">
              اصالت کالا، گارانتی رسمی و مشاوره تخصصی پیش از خرید.
            </p>
            <Link
              href={categoryLinks.mobile}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              مشاهده موبایل‌ها <ArrowLeft className="size-4" />
            </Link>
          </div>
          <div className="relative mt-4 h-32 md:mt-0 md:h-56 md:w-56 lg:w-64">
            <Image
              src="/images/banners/iphone.png"
              alt=""
              width={520}
              height={520}
              sizes="(max-width: 768px) 60vw, (max-width: 1024px) 224px, 256px"
              className="size-full object-contain"
            />
          </div>
        </div>

        {/* Side banners — hidden below md.
            This whole banner block measured 794px on a 390px screen, sitting
            between the shopper and the first product on a page whose entire job
            is browsing products. These two are secondary merchandising and the
            main banner above already carries the same message; on a phone they
            are the first thing to go. */}
        <div className="hidden gap-4 md:grid">
          {sideBanners.map((banner) => (
            <Link
              key={banner.href}
              href={banner.href}
              className="group relative flex items-center gap-4 overflow-hidden rounded-xl glass p-5 shadow-card transition-colors hover:border-aqua/50"
            >
              <div className="relative h-24 w-24 shrink-0">
                <Image src={banner.src} alt="" width={240} height={240} sizes="96px" className="size-full object-contain" />
              </div>
              <div>
                <span className="font-mono text-xs tracking-[0.1em] text-aqua/80">{banner.eyebrow}</span>
                <h3 className="mt-1.5 text-sm font-extrabold leading-6">{banner.title}</h3>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-aqua">
                  مشاهده <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
