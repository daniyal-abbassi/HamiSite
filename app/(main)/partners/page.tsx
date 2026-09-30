import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpLeft, Check, Phone } from "lucide-react";
import { PartnerForm } from "@/components/partners/PartnerForm";
import { Reveal } from "@/components/home/Reveal";
import { partnerPageCopy } from "@/lib/content/partners";
import { storeContact } from "@/lib/content/contact";
import "@/components/partners/partners.css";

export const metadata: Metadata = {
  title: "همکاری عمده",
  description: "آغاز همکاری با حامی همراه؛ ویژه فروشگاه‌ها و شرکت‌های فعال در بازار موبایل و لوازم جانبی. شرایط و مدارک را ببینید و درخواست همکاری ثبت کنید.",
};

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
              <p className="partners-hero-intro">{partnerPageCopy.intro}</p>
              <div className="partners-hero-actions">
                <a className="partners-button" href="#partner-application">شروع همکاری<ArrowUpLeft size={20} aria-hidden="true" /></a>
                <a className="partners-text-link" href="#partnership-path">مسیر همکاری<ArrowDown size={16} aria-hidden="true" /></a>
              </div>
              <div className="partners-hero-note"><span className="partners-note-line" aria-hidden="true" /><p>از بازار موبایل مشهد،<br /><strong>برای همکاران این بازار.</strong></p></div>
            </div>
            <div className="partners-editorial">
              <figure className="partners-store-photo">
                <Image src="/store/shop-upright.jpg" alt="فروشگاه حامی همراه در مشهد؛ نشان حامی همراه روی دیوار زرشکی و محصولات موبایل روی پیشخوان" fill priority sizes="(min-width: 1024px) 42vw, (min-width: 768px) 60vw, 94vw" />
                <figcaption><span>حامی همراه</span><span>مشهد، ایران</span></figcaption>
              </figure>
              <a className="partners-invitation" href="#partner-application">
                <div className="partners-invitation-mark"><Image src="/brand/hami-mark-alpha.png" alt="" width={38} height={58} /></div>
                <div><span className="partners-invitation-label">دعوت به یک همکاری ماندگار</span><p>کنار هم، در مسیر کسب‌وکار.</p></div>
                <ArrowUpLeft aria-hidden="true" size={25} />
              </a>
            </div>
          </div>
          <div className="partners-hero-footer">
            <p><strong>۲۰ سال</strong><span>سابقه در بازار موبایل مشهد</span></p>
            <span className="partners-footer-note">ویژهٔ فروشگاه‌ها و شرکت‌های فعال در حوزهٔ موبایل</span>
            <a href="#partner-application" aria-label="رفتن به فرم درخواست همکاری"><ArrowDown size={20} aria-hidden="true" /></a>
          </div>
        </div>
      </section>
      <section id="partnership-path" className="partners-path partners-paper" data-ground="paper" aria-labelledby="partners-path-title">
        <div className="partners-wrap">
          <Reveal className="partners-section-heading">
            <div><p className="partners-kicker">یک مسیر روشن</p><h2 id="partners-path-title">شروع یک همراهی،<br /><span>در سه قدم.</span></h2></div>
            <p>از معرفی کسب‌وکارتان تا فعال‌سازی حساب همکاری؛ هر مرحله مشخص است.</p>
          </Reveal>
          <ol className="partners-steps" aria-label="مراحل همکاری">
            {partnerPageCopy.steps.map((step) => (
              <li key={step.index}><span className="partners-step-index">{step.index}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></li>
            ))}
          </ol>
        </div>
      </section>
      <section id="partner-application" className="partners-application partners-paper" data-ground="paper" aria-labelledby="partners-application-title">
        <div className="partners-wrap">
          <div className="partners-application-heading"><p className="partners-kicker">درخواست همکاری</p><h2 id="partners-application-title">آشنایی ما، از اینجا شروع می‌شود.</h2></div>
          <div className="partners-application-grid">
            <PartnerForm />
            <aside className="partners-guide" aria-label="راهنمای ثبت درخواست">
              <div className="partners-guide-top"><span>پیش از شروع</span><span aria-hidden="true">۰۱ — ۰۳</span></div>
              <h3>مدارک را آماده کنید،<br /><span>بعد شروع کنیم.</span></h3>
              <p className="partners-guide-intro">متناسب با نوع کسب‌وکارتان، تصویر خوانای این مدارک را همراه داشته باشید.</p>
              <div className="partners-document-group"><h4>فروشگاه شخصی · حقیقی</h4><p><Check size={15} aria-hidden="true" />اجاره‌نامه و جواز کسب</p></div>
              <div className="partners-document-group"><h4>شرکت · حقوقی</h4><p><Check size={15} aria-hidden="true" />اجاره‌نامه و آگهی تغییرات</p></div>
              <div className="partners-contact">
                <span>قبل از ثبت درخواست، گفتگو کنیم.</span>
                <a href={storeContact.phoneHref}><bdi>{storeContact.phoneDisplay}</bdi><Phone size={20} aria-hidden="true" /></a>
                <p>{storeContact.hours}</p>
              </div>
              <Image className="partners-guide-watermark" src="/brand/hami-mark-alpha.png" alt="" width={150} height={220} />
            </aside>
          </div>
        </div>
      </section>
      <div className="partners-closing"><div className="partners-wrap"><p>حامی همراه<span>همراهِ کسب‌وکار شما.</span></p><Link href="/shop">دیدن محصولات<ArrowUpLeft size={19} aria-hidden="true" /></Link></div></div>
    </div>
  );
}
