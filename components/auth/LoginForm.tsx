"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthField } from "@/components/auth/AuthField";
import { AuthShell } from "@/components/auth/AuthShell";
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
    <AuthShell mode="login" nextPath={nextPath}>
      <h1 className="auth-card__title">خوش آمدید</h1>
      <p className="auth-card__lead">{staffMode ? "با حساب کارکنان وارد شوید." : challenge ? `کد شش‌رقمی به ${challenge.masked} ارسال شد.` : returningToProduct ? "برای ادامه خرید، کد ورود را دریافت کنید." : "برای ورود، شماره موبایل خود را وارد کنید."}</p>
      {staffMode ? <StaffLoginForm nextPath={nextPath} /> : !challenge ? (
        <form onSubmit={requestCode} className="mt-4 space-y-3" noValidate>
          <AuthField id="otp-phone" name="phoneNumber" label="شماره موبایل" type="tel" inputMode="tel" autoComplete="tel" required dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {error && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
          <Button type="submit" variant="oxblood" className="w-full" size="lg" loading={submitting}><ShieldCheck className="size-4" />دریافت کد ورود</Button>
          <p className="auth-card__help">اگر به شماره ثبت‌شده دسترسی ندارید، با پشتیبانی تماس بگیرید: <a href={storeContact.phoneHref} className="auth-card__link whitespace-nowrap" dir="ltr">{storeContact.phoneDisplay}</a></p>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-4 space-y-3" noValidate>
          <AuthField id="otp-code" name="code" label="کد پیامک‌شده" inputMode="numeric" autoComplete="one-time-code" required dir="ltr" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
          {error && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
          <Button type="submit" variant="oxblood" className="w-full" size="lg" loading={submitting}><LogIn className="size-4" />تأیید و ورود</Button>
          <button type="button" disabled={submitting || retryIn > 0} className="auth-card__link min-h-11 w-full text-sm disabled:cursor-not-allowed disabled:opacity-60" onClick={() => void resendCode()}>ارسال دوباره کد{retryIn > 0 ? ` پس از ${retryIn} ثانیه` : ""}</button>
          <button type="button" className="min-h-11 w-full text-sm font-bold text-muted-foreground underline-offset-4 hover:underline" onClick={() => { setChallenge(null); setCode(""); }}>تغییر شماره</button>
        </form>
      )}
      {/* Staff sign in with a password; this is their only route into the admin panel. */}
      <button type="button" className="auth-card__staff" onClick={() => { setStaffMode((value) => !value); setError(null); }}>
        {staffMode ? "ورود با پیامک" : "ورود کارکنان"}
      </button>
    </AuthShell>
  );
}
