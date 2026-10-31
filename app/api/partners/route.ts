import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parsePartnerApplication, partnerApplicationData, storePartnerDocuments } from "@/lib/partner-application-input";

/**
 * POST /api/partners — B2B partnership application (multipart/form-data).
 *
 * Body fields (shared): entityType, fullName, mobile, nationalCode, shopName, shopAddress
 * INDIVIDUAL: leaseDocument (file, required), businessLicense (file, required), postalCode, shopPhone
 * LEGAL:      leaseDocument (file, required), registrationNotice (file, required),
 *             companyName, companyAddress, legalNationalId, economicCode
 */

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw ApiError.coded(400, "MALFORMED_JSON", "درخواست باید multipart/form-data باشد");
    }

    const { input, files } = parsePartnerApplication(formData);

    // One pending application per mobile at a time.
    const existing = await prisma.partnerApplication.findUnique({ where: { mobile: input.mobile } });
    if (existing) {
      throw ApiError.coded(409, "CONFLICT", "این شماره موبایل قبلاً درخواست همکاری ثبت کرده است.");
    }

    // Persist documents (validated above, so no partial writes on validation errors).
    const documents = await storePartnerDocuments(input, files);

    const application = await prisma.partnerApplication.create({
      data: partnerApplicationData(input, documents, request),
      select: { id: true, entityType: true, status: true, createdAt: true },
    });

    return ok({
      id: application.id,
      entityType: application.entityType,
      status: application.status,
    });
  });
}
