import { randomBytes } from "node:crypto";
import { Prisma, Role } from "@prisma/client";
import { generateSessionToken, hashPassword, hashSessionToken, sanitizeUser, SESSION_TTL_MS, setSessionCookie } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { normalizeIranianMobile } from "@/lib/phone";
import { parsePartnerApplication, partnerApplicationData, storedDocumentNames, storePartnerDocuments } from "@/lib/partner-application-input";
import { deletePartnerDocuments } from "@/lib/partner-uploads";
import { prisma } from "@/lib/prisma";
import { claimRegistrationProof, clearRegistrationProofCookie, lockRegistrationProof, registrationProofHash } from "@/lib/registration-proof";
import { assertSameOrigin } from "@/lib/security/csrf";
import type { RegisterPartnerResponse } from "@/types/auth";

const duplicateApplication = () => ApiError.coded(409, "CONFLICT", "این شماره موبایل قبلاً درخواست همکاری ثبت کرده است.");
const duplicateAccount = () => ApiError.coded(409, "DUPLICATE_ACCOUNT", "Account already exists");

/**
 * POST /api/auth/register/partner — a customer account and a pending partner application
 * from one multipart request, in the shape of POST /api/partners.
 *
 * The account stays RETAIL until an administrator approves the application; wholesale
 * access has no other way in. Disk cannot join the transaction, so documents are written
 * first and removed again if the commit fails. See docs/api/auth.md.
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    assertSameOrigin(request);
    const tokenHash = registrationProofHash(request);
    // Read here to refuse before buffering uploads; the commit below locks it again.
    const { proof } = await prisma.$transaction((tx) => lockRegistrationProof(tx, tokenHash));

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw ApiError.coded(400, "MALFORMED_JSON", "درخواست باید multipart/form-data باشد");
    }

    // The verified number, whatever the request claims.
    const mobile = normalizeIranianMobile(proof.phoneNumber);
    const { input, files } = parsePartnerApplication(formData, { mobile });

    // Refused before anything is written, so these leave the proof usable.
    if (await prisma.partnerApplication.findUnique({ where: { mobile: input.mobile }, select: { id: true } })) throw duplicateApplication();
    if (await prisma.user.findFirst({ where: { phoneNumber: { in: [proof.phoneNumber, input.mobile] } }, select: { id: true } })) throw duplicateAccount();

    const passwordHash = await hashPassword(randomBytes(48).toString("base64url"));
    const sessionToken = generateSessionToken();
    const documents = await storePartnerDocuments(input, files);

    let created;
    try {
      created = await prisma.$transaction(async (tx) => {
        const { proof: lockedProof, now } = await lockRegistrationProof(tx, tokenHash);
        await claimRegistrationProof(tx, lockedProof.id, now);
        const [firstName = "", ...familyName] = input.fullName.split(/\s+/);
        const user = await tx.user.create({ data: { username: `partner_${input.mobile.replace(/\D/g, "")}`, passwordHash, role: Role.RETAIL, firstName, lastName: familyName.join(" ") || undefined, phoneNumber: lockedProof.phoneNumber, phoneVerified: true, phoneVerifiedAt: now, shopName: input.shopName, nationalNumber: input.nationalCode, creationMethod: "otp" } });
        const application = await tx.partnerApplication.create({ data: partnerApplicationData(input, documents, request), select: { id: true, entityType: true, status: true } });
        const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
        await tx.session.create({ data: { userId: user.id, tokenHash: hashSessionToken(sessionToken), userAgent: request.headers.get("user-agent"), expiresAt } });
        return { user, application, expiresAt };
      });
    } catch (error) {
      await deletePartnerDocuments(storedDocumentNames(documents));
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const target = error.meta?.target;
        throw Array.isArray(target) && target.includes("mobile") ? duplicateApplication() : duplicateAccount();
      }
      throw error;
    }

    const response = ok<RegisterPartnerResponse>({ user: sanitizeUser(created.user), application: created.application }, { message: "Application submitted" });
    setSessionCookie(response, sessionToken, created.expiresAt);
    clearRegistrationProofCookie(response);
    return response;
  });
}
