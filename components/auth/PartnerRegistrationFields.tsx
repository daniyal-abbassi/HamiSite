import { motion } from "motion/react";
import { AuthField } from "@/components/auth/AuthField";
import { AuthFileField } from "@/components/auth/AuthFileField";
import { partnerEntityOptions, partnerFieldLabel, partnerFileTypesNote, partnerIndividualFields, partnerLegalFields, partnerSharedFields, type PartnerEntity } from "@/lib/content/partners";
import type { FormErrors, FormFiles, FormValues } from "@/lib/partner-form-validation";

type ConfigField = { key: string; label: string; required: boolean; dir?: "ltr"; kind?: "file" };

/** Name and mobile sit in the account form above, which verifies the mobile. */
const FIELDS_ABOVE = new Set(["fullName", "mobile"]);

/** The fields of one business type, in the order the partners page validates them. */
export function partnerBranchFields(entity: PartnerEntity) {
  return (entity === "INDIVIDUAL" ? partnerIndividualFields : partnerLegalFields) as readonly ConfigField[];
}

export function PartnerEntityChoice({ entity, onChange }: { entity: PartnerEntity; onChange: (entity: PartnerEntity) => void }) {
  return (
    <div className="auth-choice auth-choice--entity" role="radiogroup" aria-label="نوع کسب‌وکار">
      {partnerEntityOptions.map((option) => (
        <button key={option.key} type="button" role="radio" aria-checked={entity === option.key} onClick={() => onChange(option.key)}>
          {entity === option.key && (
            <motion.span layoutId="auth-entity-pill" className="auth-choice__pill" transition={{ type: "spring", stiffness: 420, damping: 36 }} />
          )}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

/** The partners page's business fields and documents, in the auth card's style. */
export function PartnerRegistrationFields({ entity, values, files, errors, onValue, onFile, onClearFile }: {
  entity: PartnerEntity;
  values: FormValues;
  files: FormFiles;
  errors: FormErrors;
  onValue: (key: keyof FormValues, value: string) => void;
  onFile: (key: string, file: File) => void;
  onClearFile: (key: string) => void;
}) {
  const branch = partnerBranchFields(entity);
  const textFields = [...(partnerSharedFields as readonly ConfigField[]), ...branch].filter((field) => !field.kind && !FIELDS_ABOVE.has(field.key));

  return (
    <>
      {textFields.map((field) => {
        const key = field.key as keyof FormValues;
        const isPhone = key === "shopPhone";
        return (
          <AuthField
            key={key}
            id={key}
            label={partnerFieldLabel(field, entity)}
            required={field.required}
            dir={field.dir}
            type={isPhone ? "tel" : undefined}
            inputMode={isPhone ? "tel" : field.dir === "ltr" ? "numeric" : "text"}
            autoComplete={key === "companyName" ? "organization" : "off"}
            value={values[key]}
            error={errors[key]}
            onChange={(event) => onValue(key, event.target.value)}
          />
        );
      })}

      <p className="auth-card__note auth-file-note" id="partner-file-note">{partnerFileTypesNote}</p>
      {branch.filter((field) => field.kind === "file").map((field) => (
        <AuthFileField
          key={field.key}
          id={field.key}
          label={field.label}
          required={field.required}
          error={errors[field.key]}
          file={files[field.key]}
          describedBy="partner-file-note"
          onSelect={(file) => onFile(field.key, file)}
          onClear={() => onClearFile(field.key)}
        />
      ))}
    </>
  );
}
