import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpLeft, Phone, ShieldCheck } from "lucide-react";
import { categoryLinks } from "@/lib/content/home";
import { storeWarranty } from "@/lib/content/verified-facts";
import { storeContact } from "@/lib/content/contact";

export function ShopBanner() {
  return (
    <section className="shop-editorial-hero" aria-labelledby="shop-title">
      <div className="shop-wrap">
        <nav className="shop-breadcrumb" aria-label="مسیر صفحه"><Link href="/">حامی همراه</Link><span aria-hidden="true">/</span><span aria-current="page">فروشگاه</span></nav>
        <div className="shop-hero-grid">
          <div className="shop-hero-copy">
            <p className="shop-kicker"><span aria-hidden="true" />موبایل و زندگی دیجیتال</p>
            <h1 id="shop-title">انتخاب شما،<br /><span>همراهِ هر روز.</span></h1>
            <p className="shop-hero-intro">از گوشی بعدی‌تان تا جزئیاتی که روزتان را بهتر می‌کنند؛ محصولات را ببینید و با حامی همراه انتخاب کنید.</p>
            <a href="#shop-catalog" className="shop-hero-link">کاوش در محصولات<ArrowDown size={18} aria-hidden="true" /></a>
          </div>
          <Link href={categoryLinks.mobile} className="shop-hero-vitrine" aria-label="دیدن مجموعه گوشی‌های موبایل">
            <div className="shop-vitrine-cap"><span>در ویترین حامی همراه</span><ArrowUpLeft size={23} aria-hidden="true" /></div>
            <Image src="/images/banners/iphone.png" alt="" width={500} height={500} priority sizes="(max-width: 767px) 150px, 440px" className="shop-vitrine-image" />
            <div className="shop-vitrine-caption"><span>یک انتخاب شخصی.</span><span>مجموعهٔ موبایل<ArrowUpLeft size={16} aria-hidden="true" /></span></div>
          </Link>
        </div>
        <div className="shop-trust-line"><span><ShieldCheck size={17} strokeWidth={1.4} aria-hidden="true" />{storeWarranty.label}</span><span className="shop-trust-store">فروش آنلاین و حضوری در مشهد</span><a href={storeContact.phoneHref}>برای انتخاب، گفتگو کنیم<Phone size={15} aria-hidden="true" /></a></div>
      </div>
    </section>
  );
}
