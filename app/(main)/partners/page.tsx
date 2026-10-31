import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpLeft } from "lucide-react";
import { PartnerForm } from "@/components/partners/PartnerForm";
import { partnerPageCopy } from "@/lib/content/partners";
import { pageMetadata } from "@/lib/seo-metadata";
import "@/components/partners/partners.css";

export const metadata: Metadata = pageMetadata({
  title: "همکاری عمده",
  description: "آغاز همکاری عمده با حامی همراه در مشهد؛ ویژه فروشگاه‌ها و شرکت‌های فعال در بازار موبایل و لوازم جانبی. شرایط را ببینید و درخواست همکاری ثبت کنید.",
  path: "/partners",
});

export default function PartnersPage() {
  return (
    <div className="partners-page">
      <section className="partners-hero" aria-labelledby="partners-title">
        <div className="partners-wrap">
          <nav className="partners-breadcrumb" aria-label="مسیر صفحه">
            <Link href="/">حامی همراه</Link><span aria-hidden="true">/</span><span aria-current="page">امور همکاران</span>
          </nav>
          <div className="partners-hero-grid">
            <div className="partners-hero-copy">
              <p className="partners-kicker"><span aria-hidden="true" />{partnerPageCopy.eyebrow}</p>
              <h1 id="partners-title">{partnerPageCopy.titleLead}<br /><span>{partnerPageCopy.titleTail}</span></h1>
              <div className="partners-hero-actions">
                <a className="partners-button" href="#partner-application">شروع همکاری<ArrowUpLeft size={20} aria-hidden="true" /></a>
              </div>
            </div>
            <div className="partners-editorial">
              <figure className="partners-store-photo relative aspect-[4/5] overflow-hidden">
                <Image src="/store/shop-upright.jpg" alt="فروشگاه حامی همراه در مشهد؛ نشان حامی همراه روی دیوار زرشکی و محصولات موبایل روی پیشخوان" fill priority sizes="(min-width: 1024px) 42vw, (min-width: 768px) 60vw, 94vw" />
                <figcaption><span>حامی همراه</span><span>مشهد، ایران</span></figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>
      <section id="partner-application" className="partners-application partners-paper" data-ground="paper" aria-label="درخواست همکاری">
        <div className="partners-wrap">
          <div className="partners-application-grid partners-application-solo">
            <PartnerForm />
          </div>
        </div>
      </section>
    </div>
  );
}
