import type { Metadata } from "next";
import { AccountClient } from "@/components/account/AccountClient";

export const metadata: Metadata = { title: "حساب کاربری" };

export default function AccountPage() {
  return (
    <main className="container min-h-[65vh] py-10 md:py-16">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow"><i /> تنظیمات حساب</p>
        <h1 className="mt-3 text-2xl font-black md:text-3xl">حساب کاربری</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">اطلاعات تماس و گذرواژه حساب خود را مدیریت کنید.</p>
        <AccountClient />
      </div>
    </main>
  );
}
