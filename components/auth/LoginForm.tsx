"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StaffLoginForm } from "@/components/auth/StaffLoginForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { apiPost } from "@/lib/api-client";
import { safeNextPath } from "@/lib/safe-next-path";
import { normalizePersianDigits } from "@/lib/persian-typography";
import { storeContact } from "@/lib/content/contact";
import type { PublicUser } from "@/types/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const { refresh: refreshCart } = useCart();
  const [staffMode, setStaffMode] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<{ id: string; masked: string } | null>(null);
  const [retryIn, setRetryIn] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextPath = safeNextPath(searchParams.get("next"));
  const returningToProduct = nextPath.startsWith("/shop/");

  useEffect(() => {
    if (!challenge || retryIn <= 0) return;
    const timer = window.setTimeout(() => setRetryIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [challenge, retryIn]);

  async function requestCode(event: React.FormEvent) {
    event.preventDefault(); setSubmitting(true); setError(null);
    try {
      const result = await apiPost<{ challengeId: string; maskedPhone: string; resendAfterSeconds: number }>("/api/auth/otp/request", { phoneNumber: normalizePersianDigits(phone.trim()), purpose: "LOGIN" });
      setChallenge({ id: result.challengeId, masked: result.maskedPhone });
      setRetryIn(result.resendAfterSeconds);
    } catch (cause) { setError(apiErrorToFa(cause)); }
    finally { setSubmitting(false); }
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault(); if (!challenge) return; setSubmitting(true); setError(null);
    try {
      await apiPost<PublicUser>("/api/auth/otp/verify", { challengeId: challenge.id, code: normalizePersianDigits(code.trim()) });
      await refresh(); void refreshCart(); router.push(nextPath);
    } catch (cause) { setError(apiErrorToFa(cause)); }
    finally { setSubmitting(false); }
  }

  async function resendCode() {
    setSubmitting(true); setError(null);
    try {
      const result = await apiPost<{ challengeId: string; maskedPhone: string; resendAfterSeconds: number }>("/api/auth/otp/request", { phoneNumber: normalizePersianDigits(phone.trim()), purpose: "LOGIN" });
      setChallenge({ id: result.challengeId, masked: result.maskedPhone });
      setRetryIn(result.resendAfterSeconds);
      setCode("");
    } catch (cause) { setError(apiErrorToFa(cause)); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="glass w-full max-w-md rounded-2xl p-8">
      <div className="section-label"><span>ورود</span><i /></div>
      <h1 className="type-page mt-3">خوش آمدید</h1>
      <p className="type-support mt-1.5 text-muted-foreground">{returningToProduct ? "برای ادامه خرید، کد ورود را به شماره موبایل خود دریافت کنید." : "برای ورود امن، شماره موبایل خود را وارد کنید."}</p>
      <div className="mt-5 flex rounded-xl border border-border p-1" role="group" aria-label="روش ورود">
        <button type="button" className="min-h-11 flex-1 rounded-lg text-sm font-bold" aria-pressed={!staffMode} onClick={() => { setStaffMode(false); setError(null); }}>ورود مشتری با پیامک</button>
        <button type="button" className="min-h-11 flex-1 rounded-lg text-sm font-bold" aria-pressed={staffMode} onClick={() => { setStaffMode(true); setError(null); }}>ورود کارکنان</button>
      </div>
      {staffMode ? <StaffLoginForm nextPath={nextPath} /> : !challenge ? (
        <form onSubmit={requestCode} className="mt-6 space-y-4" noValidate>
          <label htmlFor="otp-phone" className="type-label mb-1.5 block font-bold">شماره موبایل</label>
          <Input id="otp-phone" name="phoneNumber" type="tel" inputMode="tel" autoComplete="tel" required dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="۰۹۱۲۱۱۱۲۲۳۳" />
          {error && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" size="lg" loading={submitting}><ShieldCheck className="size-4" />دریافت کد ورود</Button>
          <p className="type-label text-center text-muted-foreground">اگر به شماره ثبت‌شده دسترسی ندارید، برای بازیابی هویت با پشتیبانی تماس بگیرید: <a href={storeContact.phoneHref} className="font-bold text-aqua underline-offset-4 hover:underline">{storeContact.phoneDisplay}</a></p>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-6 space-y-4" noValidate>
          <p className="type-support text-muted-foreground">کد شش‌رقمی برای {challenge.masked} ارسال شد. اعتبار کد ۵ دقیقه است.</p>
          <label htmlFor="otp-code" className="type-label mb-1.5 block font-bold">کد پیامک‌شده</label>
          <Input id="otp-code" name="code" inputMode="numeric" autoComplete="one-time-code" required dir="ltr" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="۱۲۳۴۵۶" />
          {error && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" size="lg" loading={submitting}><LogIn className="size-4" />تأیید و ورود</Button>
          <button type="button" disabled={submitting || retryIn > 0} className="min-h-11 w-full text-sm font-bold text-aqua underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60" onClick={() => void resendCode()}>ارسال دوباره کد{retryIn > 0 ? ` پس از ${retryIn} ثانیه` : ""}</button>
          <button type="button" className="min-h-11 w-full text-sm font-bold text-muted-foreground underline-offset-4 hover:underline" onClick={() => { setChallenge(null); setCode(""); }}>تغییر شماره</button>
        </form>
      )}
      <p className="type-label mt-5 text-center text-muted-foreground">حساب ندارید؟ <Link href={nextPath !== "/" ? `/register?next=${encodeURIComponent(nextPath)}` : "/register"} className="font-bold text-aqua underline-offset-4 hover:underline">ثبت‌نام کنید</Link></p>
    </div>
  );
}
