"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthField } from "@/components/auth/AuthField";
import { AuthShell } from "@/components/auth/AuthShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { ApiClientError, apiPost } from "@/lib/api-client";
import { safeNextPath } from "@/lib/safe-next-path";
import { isValidIranianMobile } from "@/lib/validators";
import { normalizePersianDigits } from "@/lib/persian-typography";
import type { PublicUser } from "@/types/auth";

type Role = "RETAIL" | "WHOLESALE";
type Values = {
  username: string;
  phoneNumber: string;
  fullName: string;
  city: string;
  email: string;
  shopName: string;
  businessLicenseNumber: string;
};
type FieldErrors = Partial<Record<keyof Values, string>>;

const EMPTY: Values = {
  username: "",
  phoneNumber: "",
  fullName: "",
  city: "",
  email: "",
  shopName: "",
  businessLicenseNumber: "",
};

function clientValidate(values: Values, role: Role): FieldErrors {
  const errors: FieldErrors = {};
  if (values.username.trim().length < 3) errors.username = "نام کاربری حداقل ۳ کاراکتر است.";
  if (!isValidIranianMobile(values.phoneNumber)) errors.phoneNumber = "شماره موبایل معتبر نیست.";
  if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) errors.email = "ایمیل معتبر نیست.";
  if (role === "WHOLESALE" && values.shopName.trim().length < 2) errors.shopName = "نام فروشگاه الزامی است.";
  return errors;
}

/** Field-level errors from the API's zod `details.fieldErrors`. */
function fieldErrorsFrom(cause: unknown): FieldErrors {
  if (!(cause instanceof ApiClientError) || cause.code !== "VALIDATION_FAILED") return {};
  const details = cause.details as { fieldErrors?: Record<string, string[]> } | undefined;
  const mapped: FieldErrors = {};
  for (const [key, messages] of Object.entries(details?.fieldErrors ?? {})) {
    if (!messages?.[0]) continue;
    const field = key === "firstName" || key === "lastName" ? "fullName" : key;
    mapped[field as keyof Values] = "مقدار واردشده معتبر نیست.";
  }
  return mapped;
}

const ACCOUNT_TYPES = [
  { key: "RETAIL", title: "خریدار", note: "خرید تکی با قیمت مصرف‌کننده" },
  { key: "WHOLESALE", title: "همکار عمده", note: "قیمت پلکانی و اعتبار خرید" },
] as const;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const { refresh: refreshCart } = useCart();

  const [role, setRole] = useState<Role | null>(null);
  const [values, setValues] = useState<Values>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [retryIn, setRetryIn] = useState(0);

  const nextPath = safeNextPath(searchParams.get("next"));

  useEffect(() => {
    if (!challenge || retryIn <= 0) return;
    const timer = window.setTimeout(() => setRetryIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [challenge, retryIn]);

  function setField(field: keyof Values) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!role) return;
    if (!verified) { setError("ابتدا شماره موبایل خود را تأیید کنید."); return; }
    const validation = clientValidate(values, role);
    setFieldErrors(validation);
    setError(null);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    // Optional fields are omitted (not empty strings) so the API's optional
    // schema treats them as absent.
    // The account keeps two name columns, which orders and the admin read; one field fills both.
    const [firstName = "", ...familyName] = values.fullName.trim().split(/\s+/);
    const optional = Object.fromEntries(
      Object.entries({
        firstName,
        lastName: familyName.join(" "),
        city: values.city,
        email: values.email,
        shopName: role === "WHOLESALE" ? values.shopName : "",
        businessLicenseNumber: role === "WHOLESALE" ? values.businessLicenseNumber : "",
      }).filter(([, value]) => value.trim() !== ""),
    );

    try {
      await apiPost<PublicUser>("/api/auth/register", {
        username: normalizePersianDigits(values.username.trim()),
        role,
        ...optional,
      });
      await refresh();
      void refreshCart();
      router.push(nextPath);
    } catch (cause) {
      const fromServer = fieldErrorsFrom(cause);
      if (Object.keys(fromServer).length > 0) setFieldErrors(fromServer);
      setError(apiErrorToFa(cause));
      setSubmitting(false);
    }
  }

  async function requestCode() {
    setSubmitting(true); setError(null);
    try {
      const result = await apiPost<{ challengeId: string; resendAfterSeconds: number }>("/api/auth/otp/request", { phoneNumber: normalizePersianDigits(values.phoneNumber.trim()), purpose: "REGISTER" });
      setChallenge(result.challengeId);
      setRetryIn(result.resendAfterSeconds);
    } catch (cause) { setError(apiErrorToFa(cause)); }
    finally { setSubmitting(false); }
  }

  async function verifyCode() {
    if (!challenge) return; setSubmitting(true); setError(null);
    try {
      await apiPost("/api/auth/otp/verify", { challengeId: challenge, code: normalizePersianDigits(code.trim()) });
      setVerified(true);
    } catch (cause) { setError(apiErrorToFa(cause)); }
    finally { setSubmitting(false); }
  }

  const fieldProps = (field: keyof Values) => ({
    value: values[field],
    onChange: setField(field),
    error: fieldErrors[field],
  });

  return (
    <AuthShell mode="register" nextPath={nextPath}>
      <h1 className="auth-card__title">ساخت حساب</h1>
      <p className="auth-card__lead">{role ? "اطلاعات حساب خود را وارد کنید." : "نوع حساب خود را انتخاب کنید."}</p>

      <div className="auth-choice" role="radiogroup" aria-label="نوع حساب">
        {ACCOUNT_TYPES.map((option) => (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={role === option.key}
            onClick={() => setRole(option.key)}
          >
            {role === option.key && (
              <motion.span
                layoutId="auth-choice-pill"
                className="auth-choice__pill"
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
              />
            )}
            <span>{option.title}</span>
          </button>
        ))}
      </div>
      {role && <p className="auth-card__note">{ACCOUNT_TYPES.find((option) => option.key === role)?.note}</p>}

      <AnimatePresence initial={false}>
        {role && (
          <motion.form
            onSubmit={handleSubmit}
            className="mt-2 space-y-3"
            noValidate
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <AuthField id="fullName" label="نام کامل" autoComplete="name" {...fieldProps("fullName")} />
            <AuthField id="username" label="نام کاربری" required autoComplete="username" dir="auto" {...fieldProps("username")} />
            <AuthField id="phoneNumber" label="شماره موبایل" required type="tel" inputMode="tel" autoComplete="tel" dir="ltr" disabled={Boolean(challenge)} {...fieldProps("phoneNumber")} />

            <AnimatePresence initial={false}>
              {role === "WHOLESALE" && (
                <motion.div
                  className="space-y-3 overflow-hidden"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  <AuthField id="shopName" label="نام فروشگاه" required {...fieldProps("shopName")} />
                  <AuthField id="businessLicenseNumber" label="شماره جواز کسب (اختیاری)" {...fieldProps("businessLicenseNumber")} />
                </motion.div>
              )}
            </AnimatePresence>

            <AuthField id="city" label="شهر" autoComplete="address-level2" {...fieldProps("city")} />
            <AuthField id="email" label="ایمیل (اختیاری)" type="email" autoComplete="email" {...fieldProps("email")} />

            {!verified ? (
              <div className="space-y-3">
                {!challenge ? (
                  <Button type="button" variant="oxblood" className="auth-card__action w-full" size="lg" loading={submitting} onClick={() => { if (isValidIranianMobile(values.phoneNumber)) void requestCode(); else setFieldErrors((prev) => ({ ...prev, phoneNumber: "شماره موبایل معتبر نیست." })); }}>ارسال کد تأیید موبایل</Button>
                ) : (
                  <>
                    <AuthField id="register-otp" label="کد شش‌رقمی پیامک‌شده" inputMode="numeric" autoComplete="one-time-code" dir="ltr" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
                    <Button type="button" variant="oxblood" className="auth-card__action w-full" size="lg" loading={submitting} onClick={() => void verifyCode()}>تأیید شماره موبایل</Button>
                    <button type="button" className="auth-card__link min-h-11 w-full text-sm disabled:cursor-not-allowed disabled:opacity-60" disabled={submitting || retryIn > 0} onClick={() => void requestCode()}>
                      ارسال دوباره کد{retryIn > 0 ? ` پس از ${retryIn} ثانیه` : ""}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <p className="auth-card__verified">شماره موبایل تأیید شد.</p>
            )}

            {error && (
              <p role="alert" className="rounded-xl border px-4 py-3 text-sm">
                {error}
              </p>
            )}

            {verified && (
              <Button type="submit" variant="oxblood" className="w-full" size="lg" loading={submitting}>
                <UserPlus className="size-4" />
                ایجاد حساب
              </Button>
            )}
          </motion.form>
        )}
      </AnimatePresence>
      <span className="block h-3" aria-hidden="true" />
    </AuthShell>
  );
}
