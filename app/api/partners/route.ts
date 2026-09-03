import { PartnerEntityType } from "@prisma/client";
import { z } from "zod";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { normalizeIranianMobile } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { partnerRequestTextFields } from "@/lib/content/partners";
import { assertValidPartnerFile, savePartnerDocument } from "@/lib/partner-uploads";
import {
  isValidEconomicCode,
  isValidIranianMobile,
  isValidIranianNationalCode,
  isValidIranianPostalCode,
  isValidLegalNationalId,
  toLatinDigits,
} from "@/lib/validators";

/**
 * POST /api/partners — B2B partnership application (multipart/form-data).
 *
 * Body fields (shared): entityType, fullName, mobile, nationalCode, shopName, shopAddress
 * INDIVIDUAL: leaseDocument (file, required), businessLicense (file, required), postalCode, shopPhone
 * LEGAL:      leaseDocument (file, required), registrationNotice (file, required),
 *             companyName, companyAddress, legalNationalId, economicCode
 */

const textSchema = z
  .object({
    entityType: z.enum(["INDIVIDUAL", "LEGAL"]),
    fullName: z.string().trim().min(2, { message: "نام و نام خانوادگی الزامی است" }).max(150),
    mobile: z
      .string()
      .trim()
      .transform((v) => normalizeIranianMobile(toLatinDigits(v)))
      .refine(isValidIranianMobile, { message: "شماره موبایل معتبر نیست" }),
    nationalCode: z
      .string()
      .trim()
      .transform(toLatinDigits)
      .refine(isValidIranianNationalCode, { message: "کد ملی معتبر نیست" }),
    shopName: z.string().trim().min(2, { message: "نام فروشگاه الزامی است" }).max(200),
    shopAddress: z.string().trim().min(5, { message: "آدرس فروشگاه الزامی است" }).max(500),
    // INDIVIDUAL
    postalCode: z.string().trim().transform(toLatinDigits).optional(),
    shopPhone: z.string().trim().min(7, { message: "تلفن فروشگاه معتبر نیست" }).max(20).optional(),
    // LEGAL
    companyName: z.string().trim().max(200).optional(),
    companyAddress: z.string().trim().max(500).optional(),
    legalNationalId: z.string().trim().transform(toLatinDigits).optional(),
    economicCode: z.string().trim().transform(toLatinDigits).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.entityType === "INDIVIDUAL") {
      if (!data.postalCode || !isValidIranianPostalCode(data.postalCode)) {
        ctx.addIssue({ code: "custom", path: ["postalCode"], message: "کد پستی باید ۱۰ رقم باشد" });
      }
      if (!data.shopPhone) {
        ctx.addIssue({ code: "custom", path: ["shopPhone"], message: "تلفن فروشگاه الزامی است" });
      }
      return;
    }

    if (!data.companyName) {
      ctx.addIssue({ code: "custom", path: ["companyName"], message: "نام شرکت الزامی است" });
    }
    if (!data.companyAddress) {
      ctx.addIssue({ code: "custom", path: ["companyAddress"], message: "آدرس شرکت الزامی است" });
    }
    if (!data.legalNationalId || !isValidLegalNationalId(data.legalNationalId)) {
      ctx.addIssue({ code: "custom", path: ["legalNationalId"], message: "شناسه ملی شرکت باید ۱۱ رقم باشد" });
    }
    if (!data.economicCode || !isValidEconomicCode(data.economicCode)) {
      ctx.addIssue({ code: "custom", path: ["economicCode"], message: "شماره اقتصادی باید ۱۲ رقم باشد" });
    }
  });
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw ApiError.coded(400, "MALFORMED_JSON", "درخواست باید multipart/form-data باشد");
    }

    const rawText: Record<string, string> = {};
    for (const field of partnerRequestTextFields) {
      const value = formData.get(field);
      if (typeof value === "string") rawText[field] = value;
    }

    const parsed = textSchema.safeParse(rawText);
    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      throw ApiError.coded(400, "VALIDATION_FAILED", "اطلاعات واردشده معتبر نیست", flattened);
    }
    const input = parsed.data;

    // File presence rules per entity type (validation only — nothing on disk yet).
    const fileFields =
      input.entityType === PartnerEntityType.INDIVIDUAL
        ? (["leaseDocument", "businessLicense"] as const)
        : (["leaseDocument", "registrationNotice"] as const);

    const files: Record<string, File> = {};
    for (const field of fileFields) {
      const file = formData.get(field);
      if (!(file instanceof File)) {
        throw ApiError.coded(400, "VALIDATION_FAILED", `فایل ${field} ارسال نشده است`, { field });
      }
      assertValidPartnerFile(file, field);
      files[field] = file;
    }

    // One pending application per mobile at a time.
    const existing = await prisma.partnerApplication.findUnique({ where: { mobile: input.mobile } });
    if (existing) {
      throw ApiError.coded(409, "CONFLICT", "این شماره موبایل قبلاً درخواست همکاری ثبت کرده است.");
    }

    // Persist documents (validated above, so no partial writes on validation errors).
    const leaseDocumentPath = await savePartnerDocument(files.leaseDocument, "leaseDocument");
    const businessLicensePath =
      input.entityType === PartnerEntityType.INDIVIDUAL
        ? await savePartnerDocument(files.businessLicense, "businessLicense")
        : null;
    const registrationNoticePath =
      input.entityType === PartnerEntityType.LEGAL
        ? await savePartnerDocument(files.registrationNotice, "registrationNotice")
        : null;

    const xForwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress =
      (xForwardedFor ? xForwardedFor.split(",")[0].trim() : null) ??
      request.headers.get("x-real-ip") ??
      null;
    const userAgent = request.headers.get("user-agent");

    const application = await prisma.partnerApplication.create({
      data: {
        entityType: input.entityType,
        fullName: input.fullName,
        mobile: input.mobile,
        nationalCode: input.nationalCode,
        shopName: input.shopName,
        shopAddress: input.shopAddress,
        ...(input.entityType === PartnerEntityType.INDIVIDUAL
          ? {
              leaseDocumentPath,
              businessLicensePath,
              postalCode: input.postalCode,
              shopPhone: input.shopPhone,
            }
          : {
              leaseDocumentPath,
              registrationNoticePath,
              companyName: input.companyName,
              companyAddress: input.companyAddress,
              legalNationalId: input.legalNationalId,
              economicCode: input.economicCode,
            }),
        ipAddress,
        userAgent,
      },
      select: { id: true, entityType: true, status: true, createdAt: true },
    });

    return ok({
      id: application.id,
      entityType: application.entityType,
      status: application.status,
    });
  });
}