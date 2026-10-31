import { useRef } from "react";
import { FileCheck2, UploadCloud, X } from "lucide-react";
import { formatFileSize, PARTNER_FILE_ACCEPT } from "@/lib/partner-form-validation";

/** A document upload in the auth card: the whole row picks a file, and a chosen file can be removed. */
export function AuthFileField({ id, label, required, error, file, describedBy, onSelect, onClear }: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  file?: File | null;
  describedBy?: string;
  onSelect: (file: File) => void;
  onClear: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const Icon = file && !error ? FileCheck2 : UploadCloud;

  return (
    <div>
      <div className="auth-file" data-chosen={Boolean(file)}>
        <input
          ref={input}
          id={id}
          name={id}
          type="file"
          accept={PARTNER_FILE_ACCEPT}
          required={required}
          className="sr-only"
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(event) => { const selected = event.target.files?.[0]; if (selected) onSelect(selected); }}
        />
        <label htmlFor={id}>
          <Icon className="size-5" aria-hidden="true" />
          <span className="auth-file__copy">
            <span className="auth-file__label">
              {label}
              {required && <span aria-hidden="true"> *</span>}
            </span>
            <span className="auth-file__hint">
              {file ? `${file.name} · ${formatFileSize(file.size)}` : "انتخاب تصویر یا فایل"}
            </span>
          </span>
        </label>
        {file && (
          <button
            type="button"
            aria-label={`حذف فایل ${label}`}
            onClick={() => {
              onClear();
              if (input.current) { input.current.value = ""; input.current.focus(); }
            }}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {error && <p className="auth-field__error">{error}</p>}
    </div>
  );
}
