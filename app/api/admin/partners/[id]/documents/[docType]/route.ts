import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { ApiError, withErrorHandling } from "@/lib/http";
import { getPartnerDocumentStreamInfo } from "@/lib/partner-documents";
import { prisma } from "@/lib/prisma";
import { adminDocTypeSchema } from "@/lib/schemas/admin-partners";

interface RouteParams {
  id: string;
  docType: string;
}

export const GET = withAuth<RouteParams>(
  async (_request, { params }) =>
    withErrorHandling(async () => {
      const id = parseInt(params.id, 10);
      if (isNaN(id) || id <= 0) {
        throw ApiError.coded(400, "BAD_REQUEST", "شناسه درخواست نامعتبر است");
      }

      const parsedDocType = adminDocTypeSchema.safeParse(params.docType);
      if (!parsedDocType.success) {
        throw ApiError.coded(400, "BAD_REQUEST", "نوع مدرک نامعتبر است");
      }

      const docType = parsedDocType.data;

      const app = await prisma.partnerApplication.findUnique({
        where: { id },
        select: {
          id: true,
          leaseDocumentPath: true,
          businessLicensePath: true,
          registrationNoticePath: true,
        },
      });

      if (!app) {
        throw ApiError.coded(404, "NOT_FOUND", "درخواست همکاری یافت نشد");
      }

      let storedFilename: string | null = null;
      if (docType === "leaseDocument") {
        storedFilename = app.leaseDocumentPath;
      } else if (docType === "businessLicense") {
        storedFilename = app.businessLicensePath;
      } else if (docType === "registrationNotice") {
        storedFilename = app.registrationNoticePath;
      }

      if (!storedFilename) {
        throw ApiError.coded(404, "NOT_FOUND", "فایل مدرک درخواست‌شده برای این متقاضی ثبت نشده است");
      }

      const info = await getPartnerDocumentStreamInfo(storedFilename);
      const bytes = await readFile(info.filePath);

      return new NextResponse(bytes, {
        headers: {
          "Content-Type": info.mimeType,
          "Content-Length": info.size.toString(),
          "Content-Disposition": `inline; filename="${info.filename}"`,
          "Cache-Control": "private, no-cache",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }),
  { roles: [Role.ADMIN] }
);

