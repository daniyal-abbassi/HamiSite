"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { ApiClientError, apiPost } from "@/lib/api-client";
import { isValidIranianMobile } from "@/lib/validators";
import { cn } from "@/lib/utils";
import type { PublicUser } from "@/types/auth";

type Role = "RETAIL" | "WHOLESALE";
type Values = {
  username: string;
  password: string;
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
  password: "",
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
  if (values.password.length < 6) errors.password = "رمز عبور حداقل ۶ کاراکتر است.";
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

  const nextPath = searchParams.get("next") ?? "/";

  function setField(field: keyof Values) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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
      // Register sets the session cookie server-side — the user is signed in
      // immediately, matching the storefront's no-friction flow.
      await apiPost<PublicUser>("/api/auth/register", {
        username: values.username.trim(),
        password: values.password,
        phoneNumber: values.phoneNumber.trim(),
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

  function Field({
    id,
    label,
    field,
    type = "text",
    autoComplete,
    required = false,
    placeholder,
  }: {
    id: string;
    label: string;
    field: keyof Values;
    type?: string;
    autoComplete?: string;
    required?: boolean;
    placeholder?: string;
  }) {
    return (
      <div>
        <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-foreground/85">
          {label}
          {required && <span className="ms-1 text-gold">*</span>}
        </label>
        <Input
          id={id}
          name={id}
          type={type}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          value={values[field]}
          onChange={setField(field)}
          aria-invalid={Boolean(fieldErrors[field])}
        />
        {fieldErrors[field] && <p className="mt-1 text-[11px] text-destructive">{fieldErrors[field]}</p>}
      </div>
    );
  }

  return (
    <div className="glass w-full max-w-xl rounded-2xl p-8">
      <div className="section-label">
        <span>ثبت‌نام</span>
        <i />
      </div>
      <h1 className="mt-3 text-xl font-black">ساخت حساب کاربری</h1>
      <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">
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
                ? "border-gold bg-gold/10 shadow-glow-gold"
                : "border-line bg-foreground/5 hover:border-gold/40",
            )}
          >
            <span className={cn("block text-sm font-black", role === option.key && "text-gold")}>{option.title}</span>
            <span className="mt-1 block text-[11px] text-muted-foreground">{option.note}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="username" label="نام کاربری" field="username" required autoComplete="username" />
          <Field id="phoneNumber" label="شماره موبایل" field="phoneNumber" required type="tel" autoComplete="tel" placeholder="۰۹۱۲…" />
          <Field id="password" label="رمز عبور" field="password" required type="password" autoComplete="new-password" />
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

        {error && (
          <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" loading={submitting}>
          <UserPlus className="size-4" />
          ایجاد حساب
        </Button>
      </form>

      <p className="mt-5 text-center text-[13px] text-muted-foreground">
        قبلاً ثبت‌نام کرده‌اید؟{" "}
        <Link
          href={nextPath !== "/" ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}
          className="font-bold text-gold underline-offset-4 hover:underline"
        >
          وارد شوید
        </Link>
      </p>
    </div>
  );
}
