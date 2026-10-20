import { createHash, randomBytes } from "node:crypto";
import { OtpChallengeStatus, OtpPurpose, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { generateSessionToken, hashSessionToken, sanitizeUser, SESSION_TTL_MS, setSessionCookie } from "@/lib/auth";
import { ApiError, ok, parseJsonBody, withErrorHandling } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security/csrf";
import { prisma } from "@/lib/prisma";
import { otpVerifySchema } from "@/lib/schemas/otp";
import { verifyOtpCode } from "@/lib/otp";

const PROOF_COOKIE = "registration_proof";
const COOKIE_OPTIONS = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    assertSameOrigin(request);
    const { challengeId, code } = await parseJsonBody(request, otpVerifySchema);
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "otp_codes" WHERE "publicId" = ${challengeId} FOR UPDATE`;
      const [{ now: databaseNow }] = await tx.$queryRaw<Array<{ now: Date }>>`SELECT timezone('UTC', clock_timestamp()) AS now`;
      const challenge = await tx.otpCode.findUnique({ where: { publicId: challengeId } });
      if (!challenge || challenge.status !== OtpChallengeStatus.SENT || challenge.expiresAt <= databaseNow) throw ApiError.coded(400, "OTP_INVALID", "Invalid verification code");
      if (challenge.attemptCount >= 5) throw ApiError.coded(429, "OTP_ATTEMPTS_EXCEEDED", "Too many attempts");
      const matches = verifyOtpCode({ code, challengeId, phoneNumber: challenge.phoneNumber, purpose: challenge.purpose as "LOGIN" | "REGISTER", expectedDigest: challenge.codeDigest });
      if (!matches) {
        const attempts = challenge.attemptCount + 1;
        await tx.otpCode.updateMany({ where: { id: challenge.id, status: OtpChallengeStatus.SENT, attemptCount: challenge.attemptCount }, data: { attemptCount: attempts, ...(attempts >= 5 ? { status: OtpChallengeStatus.LOCKED } : {}) } });
        return { kind: "invalid" as const, locked: attempts >= 5 };
      }
      const consumed = await tx.$executeRaw`UPDATE "otp_codes" SET "status" = 'CONSUMED'::"OtpChallengeStatus", "attemptCount" = "attemptCount" + 1 WHERE "id" = ${challenge.id} AND "status" = 'SENT'::"OtpChallengeStatus" AND "attemptCount" = ${challenge.attemptCount} AND "expiresAt" > timezone('UTC', clock_timestamp())`;
      if (consumed !== 1) return { kind: "invalid" as const, locked: false };
      if (challenge.purpose === OtpPurpose.REGISTER) {
        const token = randomBytes(32).toString("hex");
        await tx.registrationProof.create({ data: { tokenHash: createHash("sha256").update(token).digest("hex"), phoneNumber: challenge.phoneNumber, expiresAt: new Date(databaseNow.getTime() + 10 * 60_000) } });
        return { kind: "register" as const, token, phone: challenge.phoneNumber };
      }
      const user = challenge.userId ? await tx.user.findUnique({ where: { id: challenge.userId } }) : null;
      if (!user || user.phoneNumber !== challenge.phoneNumber || !user.isActive || (user.role !== Role.RETAIL && user.role !== Role.WHOLESALE)) return { kind: "invalid" as const, locked: false };
      const updated = await tx.user.update({ where: { id: user.id }, data: { phoneVerified: true, phoneVerifiedAt: databaseNow } });
      const token = generateSessionToken();
      const expiresAt = new Date(databaseNow.getTime() + SESSION_TTL_MS);
      await tx.session.create({ data: { userId: user.id, tokenHash: hashSessionToken(token), userAgent: request.headers.get("user-agent"), expiresAt } });
      return { kind: "login" as const, token, expiresAt, user: updated };
    });
    if (result.kind === "invalid") throw ApiError.coded(result.locked ? 429 : 400, result.locked ? "OTP_ATTEMPTS_EXCEEDED" : "OTP_INVALID", "Invalid verification code");
    if (result.kind === "register") {
      const response = ok({ maskedPhone: `${result.phone.slice(0, 5)}••••${result.phone.slice(-2)}`, expiresInSeconds: 600 });
      response.cookies.set(PROOF_COOKIE, result.token, { ...COOKIE_OPTIONS, expires: new Date(Date.now() + 10 * 60_000) });
      return response;
    }
    const response = ok(sanitizeUser(result.user), { message: "Login successful" });
    setSessionCookie(response, result.token, result.expiresAt);
    return response;
  });
}
