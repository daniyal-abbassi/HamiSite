import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Fingerprint,
  MessageCircle,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import { SectionHead } from "@/components/home/SectionHead";
import { categoryLinks } from "@/lib/content/home";

const digitalServices = [
  { index: "۰۱", title: "Apple ID", caption: "حساب اپل", icon: Fingerprint },
  { index: "۰۲", title: "رجیستری", caption: "ثبت و فعال‌سازی گوشی", icon: ScanLine },
  { index: "۰۳", title: "VPN", caption: "اتصال امن", icon: ShieldCheck },
  { index: "۰۴", title: "پیام‌رسان‌ها", caption: "ارتباط و حساب کاربری", icon: MessageCircle },
] as const;

export function OnlineServices() {
  return (
    <section id="online-services" className="home-section-ground home-section-ground--paper band-paper py-16 md:py-20" aria-labelledby="online-services-title">
      <div className="container">
        <div className="grid items-center gap-9 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <Reveal>
            <div className="online-services-copy">
              <SectionHead
                variant="display"
                className="online-services-heading"
                id="online-services-title"
                title={<>خدمات دیجیتال،<br />یک نگاه.</>}
                description="حساب اپل، رجیستری، اتصال امن و پیام‌رسان‌ها؛ خدمات آنلاین حامی همراه."
                action={
                  <Link href={categoryLinks.services} className="inline-flex items-center gap-2 text-sm font-bold text-aqua transition-colors hover:text-primary">
                    مشاهده خدمات آنلاین <ArrowLeft className="size-4" />
                  </Link>
                }
              />
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="online-services-visual" role="group" aria-label="دسته‌های خدمات دیجیتال حامی همراه">
              <Image
                className="online-services-visual__image"
                src="/images/shapes/online-services-digital-studio.webp"
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                priority={false}
              />
              <div className="online-services-visual__wash" aria-hidden="true" />
              <div className="online-services-visual__header">
                <span>HAMI DIGITAL</span>
                <span className="online-services-visual__status"><i aria-hidden="true" /> خدمات آنلاین</span>
              </div>
              <div className="online-services-tiles">
                {digitalServices.map(({ index, title, caption, icon: Icon }) => (
                  <Link className="online-services-tile" href={categoryLinks.services} key={title}>
                    <span className="online-services-tile__icon"><Icon aria-hidden="true" /></span>
                    <span className="online-services-tile__copy">
                      <strong>{title}</strong>
                      <small>{caption}</small>
                    </span>
                    <span className="online-services-tile__index" aria-hidden="true">{index}</span>
                  </Link>
                ))}
              </div>
              <Link href={categoryLinks.services} className="online-services-visual__footer">
                <span>خدمات دیجیتال حامی همراه</span>
                <ArrowLeft aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
