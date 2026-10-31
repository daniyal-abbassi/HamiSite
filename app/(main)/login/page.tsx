import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "ورود",
  description: "ورود به حساب کاربری فروشگاه حامی همراه.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    // useSearchParams inside LoginForm requires a Suspense boundary
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
