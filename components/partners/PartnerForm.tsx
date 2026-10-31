"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { ArrowUpLeft, Building2, Check, FileCheck2, Loader2, Store, UploadCloud } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toFaDigits } from "@/lib/utils";
import { partnerEntityOptions, partnerFieldLabel, partnerFileTypesNote, partnerIndividualFields, partnerLegalFields, partnerSharedFields, type PartnerEntity } from "@/lib/content/partners";
import { buildPartnerFormData, clientValidate, EMPTY_VALUES, formatFileSize, PARTNER_FILE_ACCEPT, selectedFileError, type FormErrors, type FormFiles, type FormValues } from "@/lib/partner-form-validation";

function Field({ id, label, required, error, children }: {
  id: string; label: string; required: boolean; error?: string; children: ReactNode;
}) {
  return (
    <div className="partner-field">
      <label htmlFor={id}>{label}{required && <span className="partner-required" aria-hidden="true">*</span>}</label>
      {children}
      {error && <p id={`${id}-error`} className="partner-field-error" role="alert">{error}</p>}
    </div>
  );
}

type ConfigTextField = { key: string; label: string; required: boolean; placeholder?: string; dir?: "ltr"; span?: "full" };
type ConfigFileField = { key: string; label: string; required: boolean; kind: "file" };
type BranchFieldConfig = ConfigTextField | ConfigFileField;
type SubmitStatus = { kind: "idle" } | { kind: "submitting" } | { kind: "success"; id: number | null } | { kind: "error"; message: string };

function FileField({ id, name, label, required, error, file, onSelect, onClear, noteId }: {
  id: string; name: string; label: string; required: boolean; error?: string; file?: File | null;
  onSelect: (file: File) => void; onClear: () => void; noteId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <Field id={id} label={label} required={required} error={error}>
      <div className="partner-file">
        <input ref={inputRef} id={id} name={name} type="file" accept={PARTNER_FILE_ACCEPT} required={required}
          aria-invalid={!!error} aria-describedby={error ? `${noteId} ${id}-error` : noteId} className="sr-only"
          onChange={(event) => { const selected = event.target.files?.[0]; if (selected) onSelect(selected); }} />
        <label htmlFor={id}>
          {file && !error ? <FileCheck2 aria-hidden="true" /> : <UploadCloud aria-hidden="true" />}
          <span className="partner-file-copy">
            <span className="partner-file-name">{file ? file.name : "انتخاب تصویر یا فایل"}</span>
            <span className="partner-file-size">{file ? formatFileSize(file.size) : "حداکثر ۱۰ مگابایت"}</span>
          </span>
        </label>
        {file && <button type="button" aria-label={`حذف فایل ${label}`} onClick={() => {
          onClear();
          if (inputRef.current) { inputRef.current.value = ""; inputRef.current.focus(); }
        }}>حذف</button>}
      </div>
    </Field>
  );
}

export function PartnerForm() {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);
  const [entity, setEntity] = useState<PartnerEntity>("INDIVIDUAL");
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [files, setFiles] = useState<FormFiles>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmitStatus>({ kind: "idle" });
  const branchIsIndividual = entity === "INDIVIDUAL";
  const branchFields = (branchIsIndividual ? partnerIndividualFields : partnerLegalFields) as readonly BranchFieldConfig[];
  const branchTextFields = branchFields.filter((field): field is ConfigTextField => !("kind" in field));
  const branchFileFields = branchFields.filter((field): field is ConfigFileField => "kind" in field);

  function focusFirstError() {
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus());
  }

  function setValue(key: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => { const next = { ...current }; delete next[key]; return next; });
  }

  function onSelectFile(key: string, file: File) {
    setFiles((current) => ({ ...current, [key]: file }));
    const error = selectedFileError(file);
    setErrors((current) => { const next = { ...current }; if (error) next[key] = error; else delete next[key]; return next; });
  }

  function onClearFile(key: string) {
    setFiles((current) => { const next = { ...current }; delete next[key]; return next; });
    setErrors((current) => { const next = { ...current }; delete next[key]; return next; });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    const nextErrors = clientValidate(values, files, entity);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) { focusFirstError(); return; }
    submittingRef.current = true;
    setStatus({ kind: "submitting" });
    try {
      const formData = buildPartnerFormData(values, files, entity, branchFields);
      const response = await fetch("/api/partners", { method: "POST", body: formData });
      const body = (await response.json()) as {
        success: boolean; data?: { id: number };
        error?: { message: string; details?: { fieldErrors?: Record<string, string[]>; field?: string } };
      };
      if (!response.ok || !body.success) {
        const serverErrors: FormErrors = {};
        for (const [key, messages] of Object.entries(body.error?.details?.fieldErrors ?? {})) {
          if (messages?.[0]) serverErrors[key] = messages[0];
        }
        const fileKey = body.error?.details?.field;
        if (fileKey && branchFileFields.some((field) => field.key === fileKey)) {
          serverErrors[fileKey] = "فایل پذیرفته نشد؛ فرمت و حجم آن را بررسی کنید.";
        }
        setErrors(serverErrors);
        setStatus({ kind: "error", message: body.error?.message ?? "ارسال درخواست با خطا مواجه شد؛ دوباره تلاش کنید." });
        if (Object.keys(serverErrors).length) focusFirstError();
        return;
      }
      setStatus({ kind: "success", id: body.data?.id ?? null });
    } catch {
      setStatus({ kind: "error", message: "ارتباط برقرار نشد. اطلاعات شما حفظ شده؛ دوباره تلاش کنید." });
    } finally {
      submittingRef.current = false;
    }
  }

  function renderTextField(field: ConfigTextField) {
    const key = field.key as keyof FormValues;
    const id = `${uid}-${key}`;
    const label = partnerFieldLabel(field, entity);
    const autoComplete = key === "fullName" ? "name" : key === "mobile" ? "tel" : key === "companyName" ? "organization" : "off";
    const isPhone = key === "mobile" || key === "shopPhone";
    return (
      <div key={key} className={field.span === "full" ? "partner-field-full" : undefined}>
        <Field id={id} label={label} required={field.required} error={errors[key]}>
          {/* phone inputs and numeric codes enforce dir="ltr" */}
          <Input id={id} name={key} value={values[key]} required={field.required} dir={isPhone || field.dir === "ltr" ? "ltr" : undefined}
            autoComplete={autoComplete} inputMode={isPhone ? "tel" : field.dir === "ltr" ? "numeric" : "text"}
            aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${id}-error` : undefined}
            onChange={(event) => setValue(key, event.target.value)} placeholder={field.placeholder} />
        </Field>
      </div>
    );
  }

  if (status.kind === "success") {
    return (
      <div className="partner-success" role="status" tabIndex={-1} ref={(node) => node?.focus()}>
        <Check size={48} strokeWidth={1.2} aria-hidden="true" />
        <h3>درخواست شما ثبت شد.</h3>
        <p>از آشنایی با کسب‌وکارتان خوشحالیم. کارشناسان حامی همراه برای تکمیل مراحل همکاری با شما تماس می‌گیرند.</p>
        {status.id !== null && <span className="partner-success-code">شماره درخواست: {toFaDigits(status.id)}</span>}
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="partner-form" aria-labelledby="partner-form-title" aria-busy={status.kind === "submitting"}>
      <div className="partner-form-heading">
        <div><h3 id="partner-form-title">فرم ثبت درخواست همکاری</h3><p>فیلدهای ستاره‌دار برای بررسی درخواست شما ضروری‌اند.</p></div>
        <ArrowUpLeft size={24} strokeWidth={1.3} aria-hidden="true" />
      </div>
      {status.kind === "error" && <p className="partner-submit-error" role="alert">{status.message}</p>}
      <fieldset className="partner-form-controls" disabled={status.kind === "submitting"}>
        <legend className="sr-only">اطلاعات درخواست همکاری</legend>
        <fieldset className="partner-entity-group">
          <legend className="sr-only">نوع کسب‌وکار</legend>
          <div className="partner-entity-options">
            {partnerEntityOptions.map((option) => {
              const Icon = option.key === "INDIVIDUAL" ? Store : Building2;
              return (
                <label key={option.key} className="partner-entity">
                  <input type="radio" name="entityType" value={option.key} checked={entity === option.key}
                    onChange={() => { setEntity(option.key); setErrors({}); setStatus({ kind: "idle" }); }} />
                  <Icon aria-hidden="true" /><span><strong>{option.label}</strong><small>{option.hint}</small></span><span className="partner-radio-dot" aria-hidden="true" />
                </label>
              );
            })}
          </div>
        </fieldset>
        <fieldset className="partner-form-section">
          <legend><span>۰۱</span>{branchIsIndividual ? "اطلاعات شما و فروشگاه" : "اطلاعات نماینده و فروشگاه"}</legend>
          <div className="partner-fields">{(partnerSharedFields as readonly ConfigTextField[]).map(renderTextField)}</div>
        </fieldset>
        <fieldset className="partner-form-section">
          <legend><span>۰۲</span>{branchIsIndividual ? "راه‌های ارتباط با فروشگاه" : "مشخصات شرکت"}</legend>
          <div className="partner-fields">{branchTextFields.map(renderTextField)}</div>
        </fieldset>
        <fieldset className="partner-form-section">
          <legend><span>۰۳</span>مدارک کسب‌وکار</legend>
          <p className="partner-file-note" id={`${uid}-file-note`}>{partnerFileTypesNote}</p>
          <div className="partner-fields">
            {branchFileFields.map((field) => (
              <FileField key={field.key} id={`${uid}-${field.key}`} name={field.key} label={field.label}
                required={field.required} error={errors[field.key]} file={files[field.key]} noteId={`${uid}-file-note`}
                onSelect={(file) => onSelectFile(field.key, file)} onClear={() => onClearFile(field.key)} />
            ))}
          </div>
        </fieldset>
        <div className="partner-submit-row">
          <button className="partners-button" type="submit" disabled={status.kind === "submitting"}>
            {status.kind === "submitting" ? <>در حال ارسال…<Loader2 className="animate-spin" size={19} aria-hidden="true" /></> : <>ثبت درخواست همکاری<ArrowUpLeft size={19} aria-hidden="true" /></>}
          </button>
          <p>ثبت درخواست، آغاز آشنایی ماست؛<br />فعال‌سازی حساب به تأیید مدارک نیاز دارد.</p>
        </div>
      </fieldset>
    </form>
  );
}
