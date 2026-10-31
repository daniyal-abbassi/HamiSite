import { PartnerEntityType, type Prisma } from "@prisma/client";
import { z } from "zod";
import { partnerRequestTextFields } from "@/lib/content/partners";
import { ApiError } from "@/lib/http";
import { normalizeIranianMobile } from "@/lib/phone";
import { assertValidPartnerFile, deletePartnerDocuments, savePartnerDocument } from "@/lib/partner-uploads";
import { isValidEconomicCode, isValidIranianMobile, isValidIranianNationalCode, isValidIranianPostalCode, isValidLegalNationalId, toLatinDigits, isValidIranianLandline } from "@/lib/validators";

/**
 * The server's one definition of a partner application, shared by the partners page and
 * registration so the two intakes cannot ask for different things.
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
    // FR-063. The client says the same thing; a shape check on one side only is a
    // shape check that can be walked around by anyone who does not use the form.
    shopPhone: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || isValidIranianMobile(value) || isValidIranianLandline(value), {
        message: "تلفن فروشگاه معتبر نیست",
      }),
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

export type PartnerApplicationInput = z.output<typeof textSchema>;

type PartnerDocuments = Pick<
  Prisma.PartnerApplicationCreateInput,
  "leaseDocumentPath" | "businessLicensePath" | "registrationNoticePath"
>;

/**
 * Validates a multipart application. Nothing is written to disk yet.
 * Registration passes the verified `mobile`, which replaces whatever the client sent.
 */
export function parsePartnerApplication(formData: FormData, overrides: { mobile?: string } = {}) {
  const rawText: Record<string, string> = {};
  for (const field of partnerRequestTextFields) {
    const value = formData.get(field);
    if (typeof value === "string") rawText[field] = value;
  }
  if (overrides.mobile) rawText.mobile = overrides.mobile;

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

  return { input, files };
}

/** Persists an application's documents; a failure part-way leaves none of them behind. */
export async function storePartnerDocuments(
  input: PartnerApplicationInput,
  files: Record<string, File>,
): Promise<PartnerDocuments> {
  const stored: string[] = [];
  const save = async (field: string) => {
    const name = await savePartnerDocument(files[field], field);
    stored.push(name);
    return name;
  };

  try {
    const leaseDocumentPath = await save("leaseDocument");
    return input.entityType === PartnerEntityType.INDIVIDUAL
      ? { leaseDocumentPath, businessLicensePath: await save("businessLicense") }
      : { leaseDocumentPath, registrationNoticePath: await save("registrationNotice") };
  } catch (error) {
    await deletePartnerDocuments(stored);
    throw error;
  }
}

/** The stored filenames of a set of documents, for removal after a failed commit. */
export function storedDocumentNames(documents: PartnerDocuments): string[] {
  return Object.values(documents).filter((name): name is string => typeof name === "string");
}

/** The `PartnerApplication` row for validated input and stored documents. */
export function partnerApplicationData(
  input: PartnerApplicationInput,
  documents: PartnerDocuments,
  request: Request,
): Prisma.PartnerApplicationCreateInput {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    (xForwardedFor ? xForwardedFor.split(",")[0].trim() : null) ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent");

  return {
    entityType: input.entityType,
    fullName: input.fullName,
    mobile: input.mobile,
    nationalCode: input.nationalCode,
    shopName: input.shopName,
    shopAddress: input.shopAddress,
    ...documents,
    ...(input.entityType === PartnerEntityType.INDIVIDUAL
      ? { postalCode: input.postalCode, shopPhone: input.shopPhone }
      : {
          companyName: input.companyName,
          companyAddress: input.companyAddress,
          legalNationalId: input.legalNationalId,
          economicCode: input.economicCode,
        }),
    ipAddress,
    userAgent,
  };
}
