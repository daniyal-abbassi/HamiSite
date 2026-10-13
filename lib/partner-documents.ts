import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { ApiError } from "@/lib/http";
import { PARTNER_UPLOAD_DIR } from "@/lib/partner-uploads";

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

export interface PartnerDocumentStreamInfo {
  filePath: string;
  mimeType: string;
  size: number;
  filename: string;
}

/**
 * Validates filename, checks path traversal, and returns file information for streaming.
 */
export async function getPartnerDocumentStreamInfo(filename: string): Promise<PartnerDocumentStreamInfo> {
  // Prevent path traversal
  const safeFilename = path.basename(filename);
  const fullPath = path.join(PARTNER_UPLOAD_DIR, safeFilename);

  if (!fullPath.startsWith(PARTNER_UPLOAD_DIR) || !existsSync(fullPath)) {
    throw ApiError.coded(404, "NOT_FOUND", "فایل مدرک در سرور یافت نشد یا حذف شده است");
  }

  const fileStats = await stat(fullPath);
  const ext = path.extname(safeFilename).toLowerCase();
  const mimeType = MIME_MAP[ext] ?? "application/octet-stream";

  return {
    filePath: fullPath,
    mimeType,
    size: fileStats.size,
    filename: safeFilename,
  };
}

