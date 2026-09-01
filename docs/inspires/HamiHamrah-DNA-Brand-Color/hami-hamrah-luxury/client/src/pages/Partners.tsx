import { ArrowUpLeft, Check, Clock3, FileCheck2, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

const steps = [
  ["01", "اطلاعات مجموعه", "نوع فعالیت و ظرفیت تقریبی خود را مشخص می‌کنید."],
  ["02", "بررسی همکاری", "در مرحلهٔ واقعی، تیم فروش شرایط و مسیر مناسب را بررسی می‌کند."],
  ["03", "دسترسی هدفمند", "فضای قیمت، موجودی و ثبت سفارش برای همکار تاییدشده فعال می‌شود."],
];

export default function Partners() {
  const [submitting, setSubmitting] = useState(false);

  const submitDemo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    window.setTimeout(() => {
      event.currentTarget.reset();
      setSubmitting(false);
      toast("درخواست نمایشی ثبت شد.", { description: "در این مرحله اطلاعاتی ذخیره یا ارسال نمی‌شود؛ این فقط رفتار فرم را نمایش می‌دهد." });
    }, 600);
  };

  return (
    <div className="partners-page">
      <header className="shop-header partner-header"><Link href="/" className="shop-wordmark"><span>ح</span><b>حامی همراه</b><i>HAMI / PARTNERS</i></Link><nav><Link href="/shop">فروشگاه</Link><Link href="/">خانه</Link></nav><Link className="partner-header-link" href="/partners/login">ورود همکار</Link></header>
      <main>
        <section className="partner-hero" data-reveal="scale">
          <div className="partner-hero-copy"><span>۰۱ / B2B EXPERIENCE</span><h1>همکاری عمده،<br /><em>با یک مسیر شفاف.</em></h1><p>این صفحه، تجربهٔ درخواست همکاری و فضای تعامل همکاران را به‌صورت نمایشی نشان می‌دهد؛ بدون ارسال اطلاعات واقعی یا نمایش قیمت عمده.</p><div className="partner-status"><Clock3 size={17} /><span>نسخهٔ نمایشی فرانت‌اند</span><i>DATA CONNECTION: PENDING</i></div></div>
          <div className="partner-hero-card"><span>HAMI / DISTRIBUTION</span><b>یک نقطهٔ ورود روشن برای فروشگاه‌هایی که به تامین مطمئن فکر می‌کنند.</b><div><i /><p>قیمت، موجودی و اعتبارسنجی همکاری در فاز اتصال داده و عملیات فعال خواهد شد.</p></div></div>
        </section>

        <section className="partner-process" data-reveal><div className="partner-section-title"><span>۰۲ / FLOW</span><h2>سه لایه برای یک گفت‌وگوی حرفه‌ای.</h2><Link className="partner-preview-link" href="/partners/preview">پیش‌نمایش پنل همکار <ArrowUpLeft size={15} /></Link></div><div className="partner-step-list">{steps.map(([index, title, description]) => <article key={index}><span>{index}</span><h3>{title}</h3><p>{description}</p><Check size={15} /></article>)}</div></section>

        <section className="partner-request" data-reveal="scale"><div className="partner-request-aside"><FileCheck2 size={26} /><span>DEMO / REQUEST</span><h2>شروع همکاری، از یک فرم دقیق.</h2><p>فرم در این مرحله برای ارزیابی تجربهٔ کاربری فعال است و هیچ داده‌ای ارسال نمی‌کند.</p><div><ShieldCheck size={15} /> حریم اطلاعات در مرحلهٔ عملیاتی تعریف می‌شود.</div></div><form onSubmit={submitDemo}><span>درخواست همکاری</span><label>نام و نام خانوادگی<input required placeholder="نام شما" /></label><label>نام فروشگاه<input required placeholder="نام مجموعه" /></label><label>نوع فعالیت<select defaultValue="retailer"><option value="retailer">خرده‌فروشی موبایل</option><option value="wholesaler">عمده‌فروشی</option><option value="distributor">پخش منطقه‌ای</option></select></label><label>شهر<input required placeholder="مثلاً مشهد" /></label><button className="button button-wine" disabled={submitting} type="submit">{submitting ? "در حال نمایش…" : "نمایش ثبت درخواست"}<ArrowUpLeft size={17} /></button><small>تمام محتوا و تعاملات این فرم نمایشی هستند.</small></form></section>
      </main>
    </div>
  );
}
