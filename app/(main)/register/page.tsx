import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "ثبت‌نام",
  description: "ساخت حساب کاربری در فروشگاه حامی همراه — خرید خرد و عمده.",
};

/** See `login/page.tsx` — same fix, same grammar. */
export default function RegisterPage() {
  return (
    <div className="container py-12 md:py-16">
      <PageHeader
        page="register"
        eyebrow="حساب کاربری"
        title="ساخت حساب در"
        accent="حامی همراه."
        description="با حساب خود می‌توانید سفارش‌های ثبت‌شده را ببینید و وضعیت آن‌ها را پیگیری کنید."
      />
      <div className="flex justify-center">
        {/* useSearchParams inside RegisterForm requires a Suspense boundary */}
        <Suspense fallback={null}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
