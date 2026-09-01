import { ArrowUpLeft, KeyRound, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

export default function PartnerLogin() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);

  const enterPreview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(() => setLocation("/partners/preview"), 500);
  };

  return (
    <div className="partner-login-page">
      <header className="shop-header"><Link href="/" className="shop-wordmark"><span>ح</span><b>حامی همراه</b><i>HAMI / PARTNER ACCESS</i></Link><nav><Link href="/shop">فروشگاه</Link><Link href="/partners">همکاری عمده</Link></nav></header>
      <main className="partner-login-main"><section className="partner-login-copy"><span>PARTNER / ACCESS PREVIEW</span><h1>ورود همکار،<br /><em>در یک فضای مطمئن.</em></h1><p>این صفحه صرفاً برای نمایش جریان ورود به پنل همکاری طراحی شده است. هیچ شماره، رمز یا دسترسی واقعی دریافت و ذخیره نمی‌شود.</p><div><ShieldCheck size={18} /><span>احراز هویت و سطح دسترسی در مرحلهٔ عملیاتی متصل خواهند شد.</span></div></section><section className="partner-login-card"><KeyRound size={24} /><span>ورود نمایشی همکار</span><h2>پیش‌نمایش پنل</h2><p>برای ورود به محیط طراحی‌شده، هر مقدار نمایشی را وارد کنید.</p><form onSubmit={enterPreview}><label>شمارهٔ همراه یا شناسهٔ همکار<input required placeholder="مثلاً ۰۹۱۵ ۰۰۰ ۰۰۰۰" /></label><label>رمز عبور<input required type="password" placeholder="رمز نمایشی" /></label><button className="button button-wine" disabled={loading} type="submit">{loading ? "در حال ورود…" : "ورود به پیش‌نمایش"}<ArrowUpLeft size={17} /></button></form><small>این فرم به سامانهٔ ورود یا پایگاه‌داده متصل نیست.</small></section></main>
    </div>
  );
}
