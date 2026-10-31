"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Send, UserPlus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { AuthField } from "@/components/auth/AuthField";
import { AuthShell } from "@/components/auth/AuthShell";
import { partnerBranchFields, PartnerEntityChoice, PartnerRegistrationFields } from "@/components/auth/PartnerRegistrationFields";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { ApiClientError, apiPost, apiPostForm } from "@/lib/api-client";
import { partnerFieldLabel, partnerSharedFields, type PartnerEntity } from "@/lib/content/partners";
import { buildPartnerFormData, clientValidate as validatePartner, EMPTY_VALUES, selectedFileError, type FormErrors, type FormFiles, type FormValues } from "@/lib/partner-form-validation";
import { safeNextPath } from "@/lib/safe-next-path";
import { toFaDigits } from "@/lib/utils";
import { isValidIranianMobile } from "@/lib/validators";
import { normalizePersianDigits } from "@/lib/persian-typography";
import type { PublicUser, RegisterPartnerResponse } from "@/types/auth";

type Role = "RETAIL" | "WHOLESALE";
type Values = {
  username: string;
  phoneNumber: string;
  fullName: string;
  city: string;
  email: string;
};

const EMPTY: Values = {
  username: "",
  phoneNumber: "",
  fullName: "",
  city: "",
  email: "",
};

function clientValidate(values: Values): FormErrors {
  const errors: FormErrors = {};
  if (values.username.trim().length < 3) errors.username = "نام کاربری حداقل ۳ کاراکتر است.";
  if (!isValidIranianMobile(values.phoneNumber)) errors.phoneNumber = "شماره موبایل معتبر نیست.";
  if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) errors.email = "ایمیل معتبر نیست.";
  return errors;
}

/** Field-level errors from the API's zod `details.fieldErrors`. */
function fieldErrorsFrom(cause: unknown): FormErrors {
  if (!(cause instanceof ApiClientError) || cause.code !== "VALIDATION_FAILED") return {};
  const details = cause.details as { fieldErrors?: Record<string, string[]> } | undefined;
  const mapped: FormErrors = {};
  for (const [key, messages] of Object.entries(details?.fieldErrors ?? {})) {
    if (!messages?.[0]) continue;
    const field = key === "firstName" || key === "lastName" ? "fullName" : key;
    mapped[field] = "مقدار واردشده معتبر نیست.";
  }
  return mapped;
}

/** The partner endpoint words its own errors in Persian, for a field or for its one document. */
function partnerFieldErrorsFrom(cause: unknown): FormErrors {
  if (!(cause instanceof ApiClientError) || cause.code !== "VALIDATION_FAILED") return {};
  const details = cause.details as { fieldErrors?: Record<string, string[]>; field?: string } | undefined;
  const mapped: FormErrors = {};
  for (const [key, messages] of Object.entries(details?.fieldErrors ?? {})) {
    if (messages?.[0]) mapped[key] = messages[0];
  }
  if (details?.field) mapped[details.field] = cause.message;
  return mapped;
}

const ACCOUNT_TYPES = [
  { key: "RETAIL", title: "خریدار", note: "خرید تکی با قیمت مصرف‌کننده" },
  { key: "WHOLESALE", title: "همکار عمده", note: "پس از بررسی مدارک، قیمت همکاری فعال می‌شود" },
] as const;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const { refresh: refreshCart } = useCart();

  const formRef = useRef<HTMLFormElement>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [values, setValues] = useState<Values>(EMPTY);
  const [entity, setEntity] = useState<PartnerEntity>("INDIVIDUAL");
  const [partner, setPartner] = useState<FormValues>(EMPTY_VALUES);
  const [files, setFiles] = useState<FormFiles>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [retryIn, setRetryIn] = useState(0);
  const [submittedRequest, setSubmittedRequest] = useState<number | null>(null);

  const nextPath = safeNextPath(searchParams.get("next"));
  const isPartner = role === "WHOLESALE";
  const partnerValues = { ...partner, fullName: values.fullName };

  useEffect(() => {
    if (!challenge || retryIn <= 0) return;
    const timer = window.setTimeout(() => setRetryIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [challenge, retryIn]);

  function clearFieldError(field: string) {
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  }

  function setField(field: keyof Values) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      clearFieldError(field);
    };
  }

  function setPartnerValue(field: keyof FormValues, value: string) {
    setPartner((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
  }

  function selectFile(field: string, file: File) {
    setFiles((prev) => ({ ...prev, [field]: file }));
    const fileError = selectedFileError(file);
    setFieldErrors((prev) => { const next = { ...prev }; if (fileError) next[field] = fileError; else delete next[field]; return next; });
  }

  function clearFile(field: string) {
    setFiles((prev) => { const next = { ...prev }; delete next[field]; return next; });
    clearFieldError(field);
  }

  function chooseEntity(next: PartnerEntity) {
    setEntity(next);
    setFieldErrors({});
    setError(null);
  }

  function chooseRole(next: Role) {
    setRole(next);
    setFieldErrors({});
    setError(null);
  }

  function showFieldErrors(errors: FormErrors) {
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus());
  }

  /** The proof lasts ten minutes; when it runs out the typed values and files stay, and only the code is asked for again. */
  function restartVerificationIfExpired(cause: unknown) {
    if (!(cause instanceof ApiClientError) || cause.code !== "REGISTRATION_PROOF_REQUIRED") return;
    setVerified(false);
    setChallenge(null);
    setCode("");
  }

  async function submitPartner() {
    const validation = validatePartner(partnerValues, files, entity, { requireMobile: false });
    showFieldErrors(validation);
    setError(null);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      const body = buildPartnerFormData(partnerValues, files, entity, partnerBranchFields(entity));
      const { application } = await apiPostForm<RegisterPartnerResponse>("/api/auth/register/partner", body);
      await refresh();
      void refreshCart();
      setSubmittedRequest(application.id);
    } catch (cause) {
      showFieldErrors(partnerFieldErrorsFrom(cause));
      restartVerificationIfExpired(cause);
      // This code is shared with other endpoints, so only this form knows what it means here.
      setError(cause instanceof ApiClientError && cause.code === "CONFLICT" ? cause.message : apiErrorToFa(cause));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitCustomer() {
    const validation = clientValidate(values);
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
      restartVerificationIfExpired(cause);
      setError(apiErrorToFa(cause));
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!role) return;
    if (!verified) { setError("ابتدا شماره موبایل خود را تأیید کنید."); return; }
    await (isPartner ? submitPartner() : submitCustomer());
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

  /** A partner fills in everything first, because the verified code expires while documents are gathered. */
  function startVerification() {
    if (!isValidIranianMobile(values.phoneNumber)) {
      showFieldErrors({ ...fieldErrors, phoneNumber: "شماره موبایل معتبر نیست." });
      return;
    }
    if (isPartner) {
      const validation = validatePartner(partnerValues, files, entity, { requireMobile: false });
      showFieldErrors(validation);
      if (Object.keys(validation).length > 0) return;
    }
    void requestCode();
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

  if (submittedRequest !== null) {
    return (
      <AuthShell mode="register" nextPath={nextPath}>
        <div className="auth-submitted" role="status" tabIndex={-1} ref={(node) => node?.focus()}>
          <span className="auth-submitted__mark"><Check className="size-7" aria-hidden="true" /></span>
          <h1 className="auth-card__title">درخواست همکاری شما ثبت شد</h1>
          <p className="auth-card__lead">مدارک شما در دست بررسی است. تا پایان بررسی، حسابتان با قیمت مصرف‌کننده کار می‌کند و پس از تأیید، قیمت همکاری فعال می‌شود.</p>
          <p className="auth-submitted__code">شماره درخواست: {toFaDigits(submittedRequest)}</p>
          <Link href={nextPath} className={buttonVariants({ variant: "oxblood", size: "lg", className: "w-full" })}>ادامه</Link>
        </div>
        <span className="block h-3" aria-hidden="true" />
      </AuthShell>
    );
  }

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
            onClick={() => chooseRole(option.key)}
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
            ref={formRef}
            onSubmit={handleSubmit}
            className="mt-2 space-y-3"
            noValidate
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {isPartner && <PartnerEntityChoice entity={entity} onChange={chooseEntity} />}

            <AuthField
              id="fullName"
              label={isPartner ? partnerFieldLabel(partnerSharedFields[0], entity) : "نام کامل"}
              required={isPartner}
              autoComplete="name"
              {...fieldProps("fullName")}
            />
            {!isPartner && <AuthField id="username" label="نام کاربری" required autoComplete="username" dir="auto" {...fieldProps("username")} />}
            <AuthField id="phoneNumber" label="شماره موبایل" required type="tel" inputMode="tel" autoComplete="tel" dir="ltr" disabled={Boolean(challenge)} {...fieldProps("phoneNumber")} />

            <AnimatePresence initial={false}>
              {isPartner ? (
                <motion.div
                  key="partner"
                  className="-mx-1 -mt-1 space-y-3 overflow-hidden p-1"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  <PartnerRegistrationFields
                    entity={entity}
                    values={partner}
                    files={files}
                    errors={fieldErrors}
                    onValue={setPartnerValue}
                    onFile={selectFile}
                    onClearFile={clearFile}
                  />
                </motion.div>
              ) : (
                <div key="customer" className="space-y-3">
                  <AuthField id="city" label="شهر" autoComplete="address-level2" {...fieldProps("city")} />
                  <AuthField id="email" label="ایمیل (اختیاری)" type="email" autoComplete="email" {...fieldProps("email")} />
                </div>
              )}
            </AnimatePresence>

            {!verified ? (
              <div className="space-y-3">
                {!challenge ? (
                  <Button type="button" variant="oxblood" className="auth-card__action w-full" size="lg" loading={submitting} onClick={startVerification}>ارسال کد تأیید موبایل</Button>
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
                {isPartner ? <Send className="size-4" /> : <UserPlus className="size-4" />}
                {isPartner ? "ثبت درخواست همکاری" : "ایجاد حساب"}
              </Button>
            )}
          </motion.form>
        )}
      </AnimatePresence>
      <span className="block h-3" aria-hidden="true" />
    </AuthShell>
  );
}
