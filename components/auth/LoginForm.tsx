"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { ApiClientError, apiPost } from "@/lib/api-client";
import { safeNextPath } from "@/lib/safe-next-path";
import { normalizePersianDigits } from "@/lib/persian-typography";
import type { PublicUser } from "@/types/auth";

type FieldErrors = Record<string, string>;

/** Field-level errors from the API's zod `details.fieldErrors`, mapped onto
 * the Persian labels this form renders. */
function fieldErrorsFrom(cause: unknown): FieldErrors {
  if (!(cause instanceof ApiClientError) || cause.code !== "VALIDATION_FAILED") return {};
  const details = cause.details as { fieldErrors?: Record<string, string[]> } | undefined;
  const mapped: FieldErrors = {};
  for (const [key, messages] of Object.entries(details?.fieldErrors ?? {})) {
    if (messages?.[0]) mapped[key] = "مقدار واردشده معتبر نیست.";
  }
  return mapped;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const { refresh: refreshCart } = useCart();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const nextPath = safeNextPath(searchParams.get("next"));
  const returningToProduct = nextPath.startsWith("/shop/");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      await apiPost<PublicUser>("/api/auth/login", {
        identifier: normalizePersianDigits(identifier.trim()),
        password,
      });
      await refresh();
      void refreshCart();
      router.push(nextPath);
    } catch (cause) {
      const fieldErrors = fieldErrorsFrom(cause);
      if (Object.keys(fieldErrors).length > 0) setFieldErrors(fieldErrors);
      setError(apiErrorToFa(cause));
      setSubmitting(false);
    }
  }

  return (
    <div className="glass w-full max-w-md rounded-2xl p-8">
      <div className="section-label">
        <span>ورود</span>
        <i />
      </div>
      <h1 className="type-page mt-3">خوش آمدید</h1>
      <p className="type-support mt-1.5 text-muted-foreground">
        {returningToProduct
          ? "برای ادامه خرید، وارد حساب خود شوید. پس از ورود به همین صفحه برمی‌گردید تا افزودن به سبد را انتخاب کنید."
          : "با نام کاربری یا شماره موبایل وارد شوید."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="identifier" className="type-label mb-1.5 block font-bold text-foreground/85">
            نام کاربری یا شماره موبایل
          </label>
          <Input
            id="identifier"
            name="identifier"
            autoComplete="username"
            required
            dir="auto"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            aria-invalid={Boolean(fieldErrors.identifier)}
            placeholder="مثلاً ۰۹۱۲۱۱۱۲۲۳۳"
          />
          {fieldErrors.identifier && <p className="type-label mt-1 text-destructive">{fieldErrors.identifier}</p>}
        </div>

        <div>
          <label htmlFor="password" className="type-label mb-1.5 block font-bold text-foreground/85">
            رمز عبور
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            dir="ltr"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
          />
          {fieldErrors.password && <p className="type-label mt-1 text-destructive">{fieldErrors.password}</p>}
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" loading={submitting}>
          <LogIn className="size-4" />
          ورود به حساب
        </Button>
      </form>

      <p className="type-label mt-5 text-center text-muted-foreground">
        حساب ندارید؟{" "}
        <Link
          href={nextPath !== "/" ? `/register?next=${encodeURIComponent(nextPath)}` : "/register"}
          className="font-bold text-aqua underline-offset-4 hover:underline"
        >
          ثبت‌نام کنید
        </Link>
      </p>
    </div>
  );
}
