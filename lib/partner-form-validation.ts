import { partnerSharedFields, type PartnerEntity } from "@/lib/content/partners";
import { normalizePersianDigits } from "@/lib/persian-typography";
import { validateUploadFile } from "@/lib/security/upload-validation";
import { toFaDigits } from "@/lib/utils";
import { isValidEconomicCode, isValidIranianMobile, isValidIranianNationalCode, isValidIranianPostalCode, isValidLegalNationalId, isValidIranianLandline } from "@/lib/validators";

/** The browser's one definition of a partner application; the server's is `lib/partner-application-input.ts`. */

export const PARTNER_FILE_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export type FormValues = {
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

export type FormFiles = Record<string, File | null>;
export type FormErrors = Record<string, string>;

export const EMPTY_VALUES: FormValues = {
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

/** Registration verifies the mobile by itself, so it passes `requireMobile: false`. */
export function clientValidate(
  values: FormValues,
  files: FormFiles,
  entity: PartnerEntity,
  { requireMobile = true }: { requireMobile?: boolean } = {},
): FormErrors {
  const errors: FormErrors = {};

  if (values.fullName.trim().length < 2) errors.fullName = "نام و نام خانوادگی الزامی است";
  if (requireMobile && !isValidIranianMobile(values.mobile)) errors.mobile = "شماره موبایل معتبر نیست";
  if (!isValidIranianNationalCode(values.nationalCode)) errors.nationalCode = "کد ملی معتبر نیست";
  if (values.shopName.trim().length < 2) errors.shopName = "نام فروشگاه الزامی است";
  if (values.shopAddress.trim().length < 5) errors.shopAddress = "آدرس فروشگاه الزامی است";

  if (entity === "INDIVIDUAL") {
    if (!isValidIranianPostalCode(values.postalCode)) errors.postalCode = "کد پستی باید ۱۰ رقم باشد";
    // A shop line is a landline more often than a mobile, and `length < 7` accepted
    // either by accident and a great deal else besides. FR-063.
    if (!values.shopPhone.trim()) errors.shopPhone = "تلفن فروشگاه الزامی است";
    else if (!isValidIranianMobile(values.shopPhone) && !isValidIranianLandline(values.shopPhone)) {
      errors.shopPhone = "تلفن فروشگاه را با پیش‌شماره وارد کنید (مثلاً ۰۵۱۳۱۲۳۴۵۶۷)";
    }
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

  const activeFileKeys = entity === "INDIVIDUAL" ? ["leaseDocument", "businessLicense"] : ["leaseDocument", "registrationNotice"];
  for (const key of activeFileKeys) {
    const file = files[key];
    if (!file) continue;
    const validation = validateUploadFile(file, "partner-document");
    if (!validation.valid) {
      errors[key] = validation.error ?? "فرمت فایل یا حجم آن معتبر نیست.";
    }
  }

  return errors;
}

/** The message for a file the moment it is chosen, or null when it can be kept. */
export function selectedFileError(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) return "حجم فایل نباید بیشتر از ۱۰ مگابایت باشد";
  return PARTNER_FILE_ACCEPT.split(",").includes(file.type) ? null : "فرمت فایل مجاز نیست (JPG/PNG/WebP/PDF)";
}

export function formatFileSize(bytes: number): string {
  // FR-011: the unit is Persian, so the quantity beside it cannot be Latin.
  if (bytes < 1024) return `${toFaDigits(bytes)} بایت`;
  if (bytes < 1024 * 1024) return `${toFaDigits(Math.round(bytes / 1024))} کیلوبایت`;
  return `${toFaDigits((bytes / (1024 * 1024)).toFixed(1))} مگابایت`;
}

type PartnerFormField = { key: string; dir?: "ltr"; kind?: "file" };

/** The multipart body for the shared fields plus one business type's text and file fields. */
export function buildPartnerFormData(
  values: FormValues,
  files: FormFiles,
  entity: PartnerEntity,
  branchFields: readonly PartnerFormField[],
): FormData {
  const formData = new FormData();
  formData.set("entityType", entity);
  for (const field of [...(partnerSharedFields as readonly PartnerFormField[]), ...branchFields]) {
    if (field.kind === "file") {
      const file = files[field.key];
      if (file) formData.set(field.key, file);
      continue;
    }
    let value = values[field.key as keyof FormValues];
    if (value) {
      if (field.dir === "ltr" || field.key === "mobile" || field.key === "shopPhone") {
        value = normalizePersianDigits(value.trim());
      }
      formData.set(field.key, value);
    }
  }
  return formData;
}
