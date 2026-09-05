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

  const nextPath = searchParams.get("next") ?? "/";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      await apiPost<PublicUser>("/api/auth/login", { identifier, password });
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
      <h1 className="mt-3 text-xl font-black">خوش آمدید 👋</h1>
      <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">
        با نام کاربری یا شماره موبایل وارد شوید.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="identifier" className="mb-1.5 block text-xs font-bold text-foreground/85">
            نام کاربری یا شماره موبایل
          </label>
          <Input
            id="identifier"
            name="identifier"
            autoComplete="username"
            required
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            aria-invalid={Boolean(fieldErrors.identifier)}
            placeholder="مثلاً ۰۹۱۲۱۱۱۲۲۳۳"
          />
          {fieldErrors.identifier && <p className="mt-1 text-[11px] text-destructive">{fieldErrors.identifier}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-bold text-foreground/85">
            رمز عبور
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
          />
          {fieldErrors.password && <p className="mt-1 text-[11px] text-destructive">{fieldErrors.password}</p>}
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

      <p className="mt-5 text-center text-[13px] text-muted-foreground">
        حساب ندارید؟{" "}
        <Link
          href={nextPath !== "/" ? `/register?next=${encodeURIComponent(nextPath)}` : "/register"}
          className="font-bold text-gold underline-offset-4 hover:underline"
        >
          ثبت‌نام کنید
        </Link>
      </p>
    </div>
  );
}
