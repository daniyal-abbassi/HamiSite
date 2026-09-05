import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "ورود",
  description: "ورود به حساب کاربری فروشگاه حامی همراه.",
};

export default function LoginPage() {
  return (
    <div className="container flex justify-center py-14 md:py-20">
      {/* useSearchParams inside LoginForm requires a Suspense boundary */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
