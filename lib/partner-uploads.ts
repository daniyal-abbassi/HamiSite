import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { ApiError } from "@/lib/http";

/**
 * Partner document storage — the first file-upload surface in the app.
 *
 * Documents (lease agreements, business licences, registration notices) are
 * sensitive, so they are stored OUTSIDE `public/` under `data/uploads/`
 * (gitignored) and never served statically. A future admin phase can serve
 * them through a protected route once reviewing applications is built.
 *
 * Deviation from the planning note: the plan said `public/uploads/`; storing
 * legal-identity documents in a publicly-served tree would leak them on
 * filename guess. Only relative filenames are persisted in the DB.
 */

export const PARTNER_UPLOAD_DIR = path.join(process.cwd(), "data", "uploads", "partner-documents");

export const PARTNER_MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per document

/** Allowed document types and their safe on-disk extensions. */
export const PARTNER_ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

export const PARTNER_FILE_LABELS: Record<string, string> = {
  leaseDocument: "اجاره‌نامه",
  businessLicense: "جواز کسب",
  registrationNotice: "آگهی تغییرات",
};

/** Validate a single uploaded document without writing anything to disk yet. */
export function assertValidPartnerFile(file: File, fieldName: string): void {
  const label = PARTNER_FILE_LABELS[fieldName] ?? fieldName;
  if (file.size === 0) {
    throw ApiError.coded(400, "VALIDATION_FAILED", `${label} خالی است`, { field: fieldName });
  }
  if (file.size > PARTNER_MAX_FILE_BYTES) {
    throw ApiError.coded(400, "VALIDATION_FAILED", `${label} باید کوچک‌تر از ${PARTNER_MAX_FILE_BYTES / (1024 * 1024)} مگابایت باشد`, { field: fieldName });
  }
  if (!PARTNER_ALLOWED_MIME[file.type]) {
    throw ApiError.coded(400, "VALIDATION_FAILED", `${label} باید تصویر (JPG/PNG/WebP) یا PDF باشد`, { field: fieldName });
  }
}

/** Write an already-validated document to disk; returns the stored filename. */
export async function savePartnerDocument(file: File, fieldName: string): Promise<string> {
  assertValidPartnerFile(file, fieldName);
  await mkdir(PARTNER_UPLOAD_DIR, { recursive: true });
  const ext = PARTNER_ALLOWED_MIME[file.type];
  const storedName = `${fieldName}-${randomBytes(16).toString("hex")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(PARTNER_UPLOAD_DIR, storedName), buffer);
  return storedName;
}