import { randomBytes } from "node:crypto";
import { Prisma, Role } from "@prisma/client";
import { generateSessionToken, hashPassword, hashSessionToken, sanitizeUser, SESSION_TTL_MS, setSessionCookie } from "@/lib/auth";
import { ApiError, ok, parseJsonBody, withErrorHandling } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security/csrf";
import { prisma } from "@/lib/prisma";
import { claimRegistrationProof, clearRegistrationProofCookie, lockRegistrationProof, registrationProofHash } from "@/lib/registration-proof";
import { registerSchema } from "@/lib/schemas/auth";
import type { RegisterResponse } from "@/types/auth";

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    assertSameOrigin(request);
    const input = await parseJsonBody(request, registerSchema);
    const tokenHash = registrationProofHash(request);
    const passwordHash = await hashPassword(randomBytes(48).toString("base64url"));
    const sessionToken = generateSessionToken();
    let user;
    try {
      user = await prisma.$transaction(async (tx) => {
        const { proof, now } = await lockRegistrationProof(tx, tokenHash);
        const existing = await tx.user.findFirst({ where: { OR: [{ phoneNumber: proof.phoneNumber }, { username: input.username }, ...(input.email ? [{ email: input.email }] : [])] }, select: { id: true } });
        if (existing) throw ApiError.coded(409, "DUPLICATE_ACCOUNT", "Account already exists");
        await claimRegistrationProof(tx, proof.id, now);
        const created = await tx.user.create({ data: { username: input.username, email: input.email, passwordHash, role: Role.RETAIL, firstName: input.firstName, lastName: input.lastName, phoneNumber: proof.phoneNumber, phoneVerified: true, phoneVerifiedAt: now, city: input.city, nationalNumber: input.nationalNumber, referer: input.referer, creationMethod: "otp" } });
        const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
        await tx.session.create({ data: { userId: created.id, tokenHash: hashSessionToken(sessionToken), userAgent: request.headers.get("user-agent"), expiresAt } });
        return { user: created, expiresAt };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw ApiError.coded(409, "DUPLICATE_ACCOUNT", "Account already exists");
      throw error;
    }
    const response = ok<RegisterResponse>(sanitizeUser(user.user), { message: "Account created" });
    setSessionCookie(response, sessionToken, user.expiresAt);
    clearRegistrationProofCookie(response);
    return response;
  });
}
