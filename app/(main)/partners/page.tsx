import type { Metadata } from "next";
import { PartnerForm } from "@/components/partners/PartnerForm";
import { Phone } from "lucide-react";
import { partnerPageCopy } from "@/lib/content/partners";
import { storeContact } from "@/lib/content/contact";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "همکاری عمده",
  description:
    "همکاری عمده، فروشگاه یا مجموعه فعال در حوزه موبایل و لوازم جانبی — فرم ثبت درخواست همکاری حامی همراه را تکمیل کنید.",
};

export default function PartnersPage() {
  return (
    <div className="container py-12 md:py-16">
      <PageHeader
        page="partners"
        eyebrow={partnerPageCopy.eyebrow}
        title={partnerPageCopy.titleLead}
        accent={partnerPageCopy.titleTail}
        description={partnerPageCopy.intro}
      />

      {/* Steps */}
      <ol className="mt-10 grid list-none gap-6 border-t border-line p-0 pt-8 sm:grid-cols-3" aria-label="مراحل همکاری">
        {partnerPageCopy.steps.map((step) => (
          <li key={step.index} className="flex items-start gap-4">
            <span className="font-mono text-2xl font-medium text-aqua/80">{step.index}</span>
            <div>
              <h2 className="m-0 text-sm font-extrabold">{step.title}</h2>
              <p className="mt-1 text-xs leading-6 text-foreground/55">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_320px]">
        <PartnerForm />

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start" aria-label="راهنمای همکاری">
          <div className="rounded-xl glass p-5 shadow-card">
            <h3 className="text-sm font-extrabold">بعد از ارسال</h3>
            <ul className="m-0 mt-3 list-none space-y-2.5 p-0 text-xs leading-6 text-foreground/60">
              <li className="flex gap-2.5">
                <span className="font-mono text-aqua">۰۱</span>
                بررسی اولیه مدارک توسط کارشناس
              </li>
              <li className="flex gap-2.5">
                <span className="font-mono text-aqua">۰۲</span>
                تماس برای هماهنگی و رفع موارد احتمالی
              </li>
              <li className="flex gap-2.5">
                <span className="font-mono text-aqua">۰۳</span>
                فعال‌سازی قیمت همکاری و ثبت سفارش
              </li>
            </ul>
          </div>

          <div className="rounded-xl glass p-5 shadow-card">
            <h3 className="text-sm font-extrabold">نیاز به مشاوره دارید؟</h3>
            <p className="mt-2 text-xs leading-6 text-foreground/60">
              کارشناسان همکاری در ساعت کاری فروشگاه پاسخگوی شما هستند.
            </p>
            <a
              href={storeContact.phoneHref}
              dir="ltr"
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-aqua/40 px-3 py-1.5 font-mono text-xs tracking-normal text-aqua transition-colors hover:bg-aqua/10"
            >
              <Phone className="size-3.5" aria-hidden="true" />
              {storeContact.phoneDisplay}
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}