import { Bell, ChevronLeft, ClipboardList, FileText, LayoutDashboard, LogOut, PackageSearch, Send, ShieldCheck, Store, Users } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const menu = [[LayoutDashboard, "نمای کلی"], [PackageSearch, "کاتالوگ همکاری"], [ClipboardList, "درخواست‌ها"], [FileText, "اسناد"], [Users, "پشتیبانی"]] as const;

const catalogueRows = [
  ["موبایل / سری پرچم‌دار", "نمایش وضعیت", "پس از اتصال داده"],
  ["موبایل / میان‌رده", "نمایش وضعیت", "پس از اتصال داده"],
  ["لوازم جانبی منتخب", "نمایش وضعیت", "پس از اتصال داده"],
];

export default function PartnerPreview() {
  const showDemoNotice = () => toast("درخواست نمایشی ثبت شد.", { description: "در این مرحله هیچ لیست قیمت یا اطلاعاتی ارسال نمی‌شود." });

  return (
    <div className="partner-preview-page">
      <aside className="partner-sidebar">
        <Link href="/" className="preview-brand"><span>ح</span><b>حامی همراه</b><i>PARTNER / PREVIEW</i></Link>
        <nav>{menu.map(([Icon, label], index) => <button className={index === 0 ? "active" : ""} key={label} onClick={() => index !== 0 && toast("نمایش نمایشی", { description: "این بخش در مرحلهٔ اتصال داده فعال می‌شود." })}><Icon size={17} />{label}{index === 0 && <i />}</button>)}</nav>
        <div className="sidebar-footer"><span>DEMO SESSION</span><b>حساب همکار نمونه</b><small>هیچ احراز هویت واقعی انجام نشده است.</small><Link href="/partners/login"><LogOut size={14} /> خروج از پیش‌نمایش</Link></div>
      </aside>

      <main className="partner-dashboard-main">
        <header className="preview-topbar"><div><span>HAMI / PARTNER SPACE</span><h1>فضای تصمیم‌گیری همکار</h1></div><div className="preview-top-actions"><button aria-label="اعلان‌ها" onClick={() => toast("اعلان نمایشی", { description: "اعلان‌های واقعی پس از اتصال عملیات فعال می‌شوند." })}><Bell size={18} /><i /></button><Link href="/partners">بازگشت به همکاری <ChevronLeft size={16} /></Link></div></header>

        <section className="preview-welcome"><div><span>وضعیت حساب</span><h2>فضای همکار برای <em>تامین دقیق‌تر</em></h2><p>این داشبورد ساختار اطلاعات، تابلوی قیمت و مسیر ثبت درخواست را به‌صورت نمایشی نشان می‌دهد.</p></div><div className="preview-status"><ShieldCheck size={21} /><span>ACCESS / PREVIEW</span><b>اطلاعات عملیاتی هنوز متصل نشده‌اند.</b><small>قیمت، موجودی و سابقه سفارش در مرحلهٔ اتصال داده فعال می‌شوند.</small></div></section>

        <section className="preview-metrics"><article><Store size={18} /><span>سطح دسترسی</span><b>همکار نمونه</b><small>سطح‌بندی واقعی بعداً تعریف می‌شود.</small></article><article><PackageSearch size={18} /><span>موجودی</span><b>در انتظار اتصال</b><small>برای نمایش انبار و رزرو کالا.</small></article><article><FileText size={18} /><span>قیمت همکاری</span><b>نمایش نمونه</b><small>بدون قیمت یا تخفیف واقعی.</small></article></section>

        <section className="preview-catalogue"><div className="preview-section-title"><div><span>CATALOGUE / UI PREVIEW</span><h2>لیست قیمت همکاری</h2></div><button className="button button-wine" onClick={showDemoNotice}><Send size={16} /> درخواست لیست قیمت</button></div><div className="preview-table"><div className="preview-table-head"><span>دسته</span><span>موجودی</span><span>قیمت همکاری</span><span>عملیات</span></div>{catalogueRows.map(([category, stock, price], index) => <div className="preview-table-row" key={category}><b><i>0{index + 1}</i>{category}</b><span>{stock}</span><span>{price}</span><button onClick={showDemoNotice}>درخواست <ChevronLeft size={14} /></button></div>)}</div><p className="preview-disclaimer">تمام ردیف‌ها، وضعیت‌ها و تعاملات این پنل برای ارزیابی طراحی رابط هستند و نمایانگر موجودی، قیمت یا شرایط تجاری واقعی نیستند.</p></section>
      </main>
    </div>
  );
}
