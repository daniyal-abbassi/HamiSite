import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "ثبت‌نام",
  description: "ساخت حساب کاربری در فروشگاه حامی همراه — خرید خرد و عمده.",
};

export default function RegisterPage() {
  return (
    <div className="container flex justify-center py-14 md:py-20">
      {/* useSearchParams inside RegisterForm requires a Suspense boundary */}
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
