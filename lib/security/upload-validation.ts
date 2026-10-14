export type UploadContext = "catalog-image" | "partner-document";

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  code?: "EMPTY_FILE" | "TOO_LARGE" | "INVALID_TYPE" | "DISALLOWED_ACTIVE_CONTENT";
}

const CATALOG_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const PARTNER_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const CATALOG_ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const PARTNER_ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const DISALLOWED_EXTENSIONS = [
  ".svg",
  ".html",
  ".htm",
  ".xhtml",
  ".xml",
  ".exe",
  ".sh",
  ".bat",
  ".cmd",
  ".js",
  ".mjs",
  ".vbs",
  ".php",
];

/**
 * Validates a client-selected file before network upload.
 * Enforces size limits, permitted MIME types, and blocks active content like SVG and scripts.
 */
export function validateUploadFile(
  file: File | null | undefined,
  context: UploadContext,
): FileValidationResult {
  if (!file) {
    return { valid: false, code: "EMPTY_FILE", error: "فایلی انتخاب نشده است." };
  }

  const nameLower = file.name.toLowerCase();
  for (const ext of DISALLOWED_EXTENSIONS) {
    if (nameLower.endsWith(ext)) {
      return {
        valid: false,
        code: "DISALLOWED_ACTIVE_CONTENT",
        error: "فایل‌های اسکریپتی، اجرایی و SVG به دلایل امنیتی مجاز نیستند.",
      };
    }
  }

  if (file.type === "image/svg+xml" || file.type.includes("javascript") || file.type.includes("html")) {
    return {
      valid: false,
      code: "DISALLOWED_ACTIVE_CONTENT",
      error: "نوع محتوای فایل به دلایل امنیتی مجاز نیست.",
    };
  }

  if (context === "catalog-image") {
    if (file.size > CATALOG_MAX_BYTES) {
      return {
        valid: false,
        code: "TOO_LARGE",
        error: "حجم تصویر نباید بیشتر از ۵ مگابایت باشد.",
      };
    }
    if (file.type && !CATALOG_ALLOWED_MIME.has(file.type)) {
      return {
        valid: false,
        code: "INVALID_TYPE",
        error: "فرمت تصویر مجاز نیست. لطفاً از فرمت‌های JPG، PNG، WebP یا AVIF استفاده کنید.",
      };
    }
  } else if (context === "partner-document") {
    if (file.size > PARTNER_MAX_BYTES) {
      return {
        valid: false,
        code: "TOO_LARGE",
        error: "حجم مدرک نباید بیشتر از ۱۰ مگابایت باشد.",
      };
    }
    if (file.type && !PARTNER_ALLOWED_MIME.has(file.type)) {
      return {
        valid: false,
        code: "INVALID_TYPE",
        error: "فرمت مدرک مجاز نیست. فرمت‌های مجاز: JPG، PNG، WebP و PDF.",
      };
    }
  }

  return { valid: true };
}

