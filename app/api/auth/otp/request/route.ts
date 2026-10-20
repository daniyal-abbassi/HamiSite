import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ApiError, ok, parseJsonBody, withErrorHandling } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security/csrf";
import { prisma } from "@/lib/prisma";
import { otpRequestSchema } from "@/lib/schemas/otp";
import { digestOtpCode, generateOtpCode } from "@/lib/otp";
import { OtpRateLimitError, markOtpChallengeFailed, markOtpChallengeSent, reserveOtpChallenge } from "@/lib/otp-rate-limit";
import { sendSmsIrVerification } from "@/lib/sms-ir";

function maskPhone(phone: string) { return `${phone.slice(0, 5)}••••${phone.slice(-2)}`; }

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    assertSameOrigin(request);
    const input = await parseJsonBody(request, otpRequestSchema);
    const user = input.purpose === "LOGIN" ? await prisma.user.findUnique({ where: { phoneNumber: input.phoneNumber } }) : null;
    const code = generateOtpCode();
    const publicId = randomUUID();
    let challenge;
    try {
      challenge = await reserveOtpChallenge({ request, publicId, phoneNumber: input.phoneNumber, purpose: input.purpose, codeDigest: digestOtpCode({ code, challengeId: publicId, phoneNumber: input.phoneNumber, purpose: input.purpose }), userId: user?.id ?? null });
    } catch (error) {
      if (error instanceof OtpRateLimitError) {
        const response = NextResponse.json({ success: false, error: { code: "OTP_RATE_LIMITED", message: "درخواست‌های پیاپی؛ کمی بعد دوباره تلاش کنید.", details: { retryAfterSeconds: error.retryAfterSeconds } } }, { status: 429 });
        response.headers.set("Retry-After", String(error.retryAfterSeconds));
        return response;
      }
      throw error;
    }
    try {
      const receipt = await sendSmsIrVerification(input.phoneNumber, code);
      await markOtpChallengeSent(challenge.id, receipt.messageId);
    } catch {
      await markOtpChallengeFailed(challenge.id);
      throw ApiError.coded(503, "OTP_DELIVERY_FAILED", "Verification message unavailable");
    }
    return ok({ challengeId: publicId, maskedPhone: maskPhone(input.phoneNumber), expiresInSeconds: 300, resendAfterSeconds: 60 });
  });
}
