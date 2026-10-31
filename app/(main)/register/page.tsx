import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "ثبت‌نام",
  description: "ساخت حساب کاربری در فروشگاه حامی همراه — خرید خرد و عمده.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    // useSearchParams inside RegisterForm requires a Suspense boundary
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
