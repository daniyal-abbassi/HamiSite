"use client";

import { useId, useState } from "react";
import { Check, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  isValidEconomicCode,
  isValidIranianMobile,
  isValidIranianNationalCode,
  isValidIranianPostalCode,
  isValidLegalNationalId,
} from "@/lib/validators";
import {
  partnerEntityOptions,
  partnerFileTypesNote,
  partnerIndividualFields,
  partnerLegalFields,
  partnerSharedFields,
  type PartnerEntity,
} from "@/lib/content/partners";

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_FILE_BYTES = 10 * 1024 * 1024;

type FormValues = {
  fullName: string;
  mobile: string;
  nationalCode: string;
  shopName: string;
  shopAddress: string;
  postalCode: string;
  shopPhone: string;
  companyName: string;
  companyAddress: string;
  legalNationalId: string;
  economicCode: string;
};

type FormFiles = Record<string, File | null>;
type FormErrors = Record<string, string>;

const EMPTY_VALUES: FormValues = {
  fullName: "",
  mobile: "",
  nationalCode: "",
  shopName: "",
  shopAddress: "",
  postalCode: "",
  shopPhone: "",
  companyName: "",
  companyAddress: "",
  legalNationalId: "",
  economicCode: "",
};

function clientValidate(values: FormValues, files: FormFiles, entity: PartnerEntity): FormErrors {
  const errors: FormErrors = {};

  if (values.fullName.trim().length < 2) errors.fullName = "نام و نام خانوادگی الزامی است";
  if (!isValidIranianMobile(values.mobile)) errors.mobile = "شماره موبایل معتبر نیست";
  if (!isValidIranianNationalCode(values.nationalCode)) errors.nationalCode = "کد ملی معتبر نیست";
  if (values.shopName.trim().length < 2) errors.shopName = "نام فروشگاه الزامی است";
  if (values.shopAddress.trim().length < 5) errors.shopAddress = "آدرس فروشگاه الزامی است";

  if (entity === "INDIVIDUAL") {
    if (!isValidIranianPostalCode(values.postalCode)) errors.postalCode = "کد پستی باید ۱۰ رقم باشد";
    if (values.shopPhone.trim().length < 7) errors.shopPhone = "تلفن فروشگاه معتبر نیست";
    if (!files.leaseDocument) errors.leaseDocument = "عکس اجاره‌نامه الزامی است";
    if (!files.businessLicense) errors.businessLicense = "عکس جواز کسب الزامی است";
  } else {
    if (values.companyName.trim().length < 2) errors.companyName = "نام شرکت الزامی است";
    if (values.companyAddress.trim().length < 5) errors.companyAddress = "آدرس شرکت الزامی است";
    if (!isValidLegalNationalId(values.legalNationalId)) errors.legalNationalId = "شناسه ملی شرکت باید ۱۱ رقم باشد";
    if (!isValidEconomicCode(values.economicCode)) errors.economicCode = "شماره اقتصادی باید ۱۲ رقم باشد";
    if (!files.leaseDocument) errors.leaseDocument = "اجاره‌نامه الزامی است";
    if (!files.registrationNotice) errors.registrationNotice = "آگهی تغییرات الزامی است";
  }

  for (const [key, file] of Object.entries(files)) {
    if (!file) continue;
    if (file.size > MAX_FILE_BYTES) {
      errors[key] = "حجم فایل نباید بیشتر از ۱۰ مگابایت باشد";
    } else if (!file.type || !ACCEPT.split(",").includes(file.type)) {
      errors[key] = "فرمت فایل مجاز نیست (JPG/PNG/WebP/PDF)";
    }
  }

  return errors;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بایت`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} کیلوبایت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`;
}

/** Editorial field wrapper with label + inline error. */
function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold text-foreground/85">
        {label}
        {required && (
          <span className="ms-1 text-gold" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="text-[11px] font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function TextField({
  id,
  label,
  required,
  error,
  value,
  onChange,
  placeholder,
  dir,
}: {
  id: string;
  label: string;
  required: boolean;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dir?: "ltr";
}) {
  return (
    <Field id={id} label={label} required={required} error={error}>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        dir={dir}
        className={cn("bg-background/40", error && "border-destructive")}
      />
    </Field>
  );
}

function FileField({
  id,
  label,
  required,
  error,
  fileName,
  fileSize,
  onSelect,
  onClear,
}: {
  id: string;
  label: string;
  required: boolean;
  error?: string;
  fileName: string | null;
  fileSize: number | null;
  onSelect: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <Field id={id} label={label} required={required} error={error}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-dashed px-4 py-3",
          error ? "border-destructive" : "border-gold/40",
        )}
      >
        <input
          id={id}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onSelect(file);
          }}
        />
        <label htmlFor={id} className="flex flex-1 cursor-pointer items-center gap-3">
          <UploadCloud className="size-5 shrink-0 text-gold" aria-hidden="true" />
          {fileName ? (
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold">{fileName}</span>
              {fileSize !== null && (
                <span className="mt-0.5 block text-[10px] text-foreground/50">{formatFileSize(fileSize)}</span>
              )}
            </span>
          ) : (
            <span className="text-xs text-foreground/60">انتخاب فایل…</span>
          )}
        </label>
        {fileName && (
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] font-bold text-foreground/50 hover:text-gold"
            aria-label={`حذف فایل ${label}`}
          >
            حذف
          </button>
        )}
      </div>
    </Field>
  );
}
type SubmitStatus = { kind: "idle" } | { kind: "submitting" } | { kind: "success"; id: number } | { kind: "error"; message: string };

/** Loose render-time config types — the `as const` content configs are structurally compatible. */
type ConfigTextField = { key: string; label: string; required: boolean; placeholder?: string; dir?: "ltr"; span?: "full" };
type ConfigFileField = { key: string; label: string; required: boolean; kind: "file" };
type BranchFieldConfig = ConfigTextField | ConfigFileField;

export function PartnerForm() {
  const uid = useId();
  const [entity, setEntity] = useState<PartnerEntity>("INDIVIDUAL");
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [files, setFiles] = useState<FormFiles>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmitStatus>({ kind: "idle" });

  function setValue(key: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function onSelectFile(key: string, file: File) {
    setFiles((current) => ({ ...current, [key]: file }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function onClearFile(key: string) {
    setFiles((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = clientValidate(values, files, entity);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus({ kind: "submitting" });
    try {
      const formData = new FormData();
      formData.set("entityType", entity);
      for (const [key, value] of Object.entries(values)) {
        if (value) formData.set(key, value);
      }
      for (const [key, file] of Object.entries(files)) {
        if (file) formData.set(key, file);
      }

      const response = await fetch("/api/partners", { method: "POST", body: formData });
      const body = (await response.json()) as { success: boolean; data?: { id: number }; error?: { message: string } };

      if (!response.ok || !body.success) {
        setStatus({ kind: "error", message: body.error?.message ?? "ارسال درخواست با خطا مواجه شد؛ دوباره تلاش کنید." });
        return;
      }
      setStatus({ kind: "success", id: body.data?.id ?? 0 });
    } catch {
      setStatus({ kind: "error", message: "ارسال درخواست با خطا مواجه شد؛ دوباره تلاش کنید." });
    }
  }

  if (status.kind === "success") {
    return (
      <div className="rounded-xl border border-gold/50 bg-card p-8 text-center shadow-card" role="status">
        <Check className="mx-auto size-10 text-gold" strokeWidth={1.5} aria-hidden="true" />
        <h2 className="mt-4 text-lg font-black">درخواست شما ثبت شد.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-foreground/65">
          پس از بررسی مدارک، کارشناسان حامی همراه برای تکمیل مراحل همکاری با شما تماس می‌گیرند.
        </p>
        <span className="mt-4 inline-block rounded-xl border border-line px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] text-gold">
          {`Track / ${status.id}`}
        </span>
      </div>
    );
  }

  const branchIsIndividual = entity === "INDIVIDUAL";
  const branchFields = (branchIsIndividual ? partnerIndividualFields : partnerLegalFields) as readonly BranchFieldConfig[];
  const branchTextFields = branchFields.filter((field): field is ConfigTextField => !("kind" in field));
  const branchFileFields = branchFields.filter((field): field is ConfigFileField => "kind" in field);

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-xl glass p-6 shadow-card md:p-8"
      aria-labelledby="partner-form-title"
    >
      <h2 id="partner-form-title" className="text-lg font-black">
        فرم ثبت درخواست همکاری
      </h2>

      {status.kind === "error" && (
        <p className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-xs font-bold text-destructive" role="alert">
          {status.message}
        </p>
      )}

      {/* Entity toggle */}
      <div className="mt-6" role="radiogroup" aria-label="نوع شخصیت حقوقی">
        <p className="mb-2 text-xs font-bold text-foreground/85">
          نوع فروشگاه <span className="ms-1 text-gold">*</span>
        </p>
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-line p-1">
          {partnerEntityOptions.map((option) => {
            const active = entity === option.key;
            return (
              <button
                key={option.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setEntity(option.key);
                  setErrors({});
                }}
                className={cn(
                  "rounded-xl px-4 py-2.5 text-sm font-bold transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground",
                )}
              >
                {option.label}
                <span className="block text-[10px] font-medium opacity-70">{option.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shared fields */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(partnerSharedFields as readonly ConfigTextField[]).map((field) => {
          const key = field.key as keyof FormValues;
          return (
            <div key={field.key} className={field.span === "full" ? "md:col-span-2" : undefined}>
              <TextField
                id={`${uid}-${field.key}`}
                label={field.label}
                required={field.required}
                dir={field.dir}
                value={values[key]}
                error={errors[field.key]}
                onChange={(value) => setValue(key, value)}
                placeholder={field.placeholder}
              />
            </div>
          );
        })}

        {/* Branch-specific fields */}
        <div className="md:col-span-2">
          <div className="border-t border-line pt-5">
            <h3 className="font-mono text-[10px] tracking-[0.08em] text-gold">
              {branchIsIndividual ? "INDIVIDUAL / حقیقی" : "LEGAL / حقوقی"}
            </h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {branchTextFields.map((field) => (
                <div key={field.key} className={field.span === "full" ? "md:col-span-2" : undefined}>
                  <TextField
                    id={`${uid}-${field.key}`}
                    label={field.label}
                    required={field.required}
                    dir={field.dir}
                    value={values[field.key as keyof FormValues] ?? ""}
                    error={errors[field.key]}
                    onChange={(value) => setValue(field.key as keyof FormValues, value)}
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
              {branchFileFields.map((field) => (
                <FileField
                  key={field.key}
                  id={`${uid}-${field.key}`}
                  label={field.label}
                  required={field.required}
                  error={errors[field.key]}
                  fileName={files[field.key]?.name ?? null}
                  fileSize={files[field.key]?.size ?? null}
                  onSelect={(file) => onSelectFile(field.key, file)}
                  onClear={() => onClearFile(field.key)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-5 text-[11px] leading-5 text-foreground/50">{partnerFileTypesNote}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <Button type="submit" size="lg" disabled={status.kind === "submitting"}>
          {status.kind === "submitting" ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" /> در حال ارسال…
            </>
          ) : (
            "ثبت درخواست همکاری"
          )}
        </Button>
        <span className="text-[11px] text-foreground/50">پس از ارسال، مدارک بررسی و با شما تماس گرفته می‌شود.</span>
      </div>
    </form>
  );
}