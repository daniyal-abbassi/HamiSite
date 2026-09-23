import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "ورود",
  description: "ورود به حساب کاربری فروشگاه حامی همراه.",
};

/**
 * T083: this page used to be a centred card on an empty ground with no heading at all — the only two
 * shopper routes in the site that never said where you were. The header carries nothing the form does not
 * already do: order tracking is the one thing an account genuinely buys here, and `orders/page.tsx` is
 * behind this login.
 */
export default function LoginPage() {
  return (
    <div className="container py-12 md:py-16">
      <PageHeader
        page="login"
        eyebrow="حساب کاربری"
        title="ورود به"
        accent="حامی همراه."
        description="برای دیدن سفارش‌های ثبت‌شده و پیگیری وضعیت آن‌ها وارد حساب خود شوید."
      />
      <div className="flex justify-center">
        {/* useSearchParams inside LoginForm requires a Suspense boundary */}
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
