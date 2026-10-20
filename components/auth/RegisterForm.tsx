"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { ApiClientError, apiPost } from "@/lib/api-client";
import { safeNextPath } from "@/lib/safe-next-path";
import { isValidIranianMobile } from "@/lib/validators";
import { normalizePersianDigits } from "@/lib/persian-typography";
import { cn } from "@/lib/utils";
import type { PublicUser } from "@/types/auth";

type Role = "RETAIL" | "WHOLESALE";
type Values = {
  username: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  city: string;
  email: string;
  shopName: string;
  businessLicenseNumber: string;
};
type FieldErrors = Partial<Record<keyof Values, string>>;

const EMPTY: Values = {
  username: "",
  phoneNumber: "",
  firstName: "",
  lastName: "",
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
    if (messages?.[0]) mapped[key as keyof Values] = "مقدار واردشده معتبر نیست.";
  }
  return mapped;
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const { refresh: refreshCart } = useCart();

  const [role, setRole] = useState<Role>("RETAIL");
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
    if (!verified) { setError("ابتدا شماره موبایل خود را تأیید کنید."); return; }
    const validation = clientValidate(values, role);
    setFieldErrors(validation);
    setError(null);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    // Optional fields are omitted (not empty strings) so the API's optional
    // schema treats them as absent.
    const optional = Object.fromEntries(
      Object.entries({
        firstName: values.firstName,
        lastName: values.lastName,
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

  function Field({
    id,
    label,
    field,
    type = "text",
    autoComplete,
    required = false,
    placeholder,
    dir,
  }: {
    id: string;
    label: string;
    field: keyof Values;
    type?: string;
    autoComplete?: string;
    required?: boolean;
    placeholder?: string;
    dir?: "ltr" | "rtl" | "auto";
  }) {
    return (
      <div>
        <label htmlFor={id} className="type-label mb-1.5 block font-bold text-foreground/85">
          {label}
          {required && <span className="ms-1 text-aqua">*</span>}
        </label>
        <Input
          id={id}
          name={id}
          type={type}
          autoComplete={autoComplete}
          required={required}
          disabled={field === "phoneNumber" && Boolean(challenge)}
          placeholder={placeholder}
          dir={dir}
          inputMode={type === "tel" || id === "phoneNumber" ? "tel" : undefined}
          value={values[field]}
          onChange={setField(field)}
          aria-invalid={Boolean(fieldErrors[field])}
        />
        {fieldErrors[field] && <p className="type-label mt-1 text-destructive">{fieldErrors[field]}</p>}
      </div>
    );
  }

  return (
    <div className="glass w-full max-w-xl rounded-2xl p-8">
      <div className="section-label">
        <span>ثبت‌نام</span>
        <i />
      </div>
      <h1 className="type-page mt-3">ساخت حساب کاربری</h1>
      <p className="type-support mt-1.5 text-muted-foreground">
        خرید خرد یا عمده — حساب کاربری هر دو را پوشش می‌دهد.
      </p>

      {/* Role toggle */}
      <div className="mt-6 grid grid-cols-2 gap-2" role="radiogroup" aria-label="نوع حساب">
        {(
          [
            { key: "RETAIL", title: "خریدار (B2C)", note: "خرید تکی با قیمت مصرف‌کننده" },
            { key: "WHOLESALE", title: "همکار عمده (B2B)", note: "قیمت پلکانی و اعتبار خرید" },
          ] as const
        ).map((option) => (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={role === option.key}
            onClick={() => setRole(option.key)}
            className={cn(
              "rounded-xl border p-3.5 text-start transition-all duration-fast",
              role === option.key
                ? "border-aqua bg-aqua/10 shadow-glow-cta"
                : "border-line bg-foreground/5 hover:border-aqua/40",
            )}
          >
            <span className={cn("block text-sm font-black", role === option.key && "text-aqua")}>{option.title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{option.note}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="username" label="نام کاربری" field="username" required autoComplete="username" dir="auto" />
          <Field id="phoneNumber" label="شماره موبایل" field="phoneNumber" required type="tel" autoComplete="tel" placeholder="۰۹۱۲…" dir="ltr" />
          <Field id="firstName" label="نام" field="firstName" autoComplete="given-name" />
          <Field id="lastName" label="نام خانوادگی" field="lastName" autoComplete="family-name" />
          <Field id="city" label="شهر" field="city" autoComplete="address-level2" />
          {role === "WHOLESALE" && (
            <>
              <Field id="shopName" label="نام فروشگاه" field="shopName" required />
              <Field id="businessLicenseNumber" label="شماره جواز کسب (اختیاری)" field="businessLicenseNumber" />
            </>
          )}
        </div>
        <Field id="email" label="ایمیل (اختیاری)" field="email" type="email" autoComplete="email" />

        {!verified ? <div className="space-y-3 rounded-xl border border-border p-4">
          {!challenge ? <Button type="button" className="w-full" size="lg" loading={submitting} onClick={() => { if (isValidIranianMobile(values.phoneNumber)) void requestCode(); else setFieldErrors((prev) => ({ ...prev, phoneNumber: "شماره موبایل معتبر نیست." })); }}>ارسال کد تأیید موبایل</Button> : <>
            <label htmlFor="register-otp" className="type-label mb-1.5 block font-bold">کد شش‌رقمی پیامک‌شده</label>
            <Input id="register-otp" inputMode="numeric" autoComplete="one-time-code" dir="ltr" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
            <Button type="button" className="w-full" size="lg" loading={submitting} onClick={() => void verifyCode()}>تأیید شماره موبایل</Button>
            <Button type="button" variant="ghost" className="w-full" disabled={submitting || retryIn > 0} onClick={() => void requestCode()}>
              ارسال دوباره کد{retryIn > 0 ? ` پس از ${retryIn} ثانیه` : ""}
            </Button>
          </>}
        </div> : <p className="rounded-xl border border-aqua/40 bg-aqua/10 px-4 py-3 text-sm font-bold text-aqua">شماره موبایل تأیید شد.</p>}

        {error && (
          <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" loading={submitting} disabled={!verified}>
          <UserPlus className="size-4" />
          ایجاد حساب
        </Button>
      </form>

      <p className="type-label mt-5 text-center text-muted-foreground">
        قبلاً ثبت‌نام کرده‌اید؟{" "}
        <Link
          href={nextPath !== "/" ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}
          className="font-bold text-aqua underline-offset-4 hover:underline"
        >
          وارد شوید
        </Link>
      </p>
    </div>
  );
}
