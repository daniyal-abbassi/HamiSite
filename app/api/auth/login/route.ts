import { createSession, sanitizeUser, verifyPassword, setSessionCookie, DUMMY_PASSWORD_HASH } from "@/lib/auth";
import { ApiError, ok, parseJsonBody, withErrorHandling } from "@/lib/http";
import { normalizeIranianMobile } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/schemas/auth";
import type { LoginResponse } from "@/types/auth";

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { identifier, password } = await parseJsonBody(request, loginSchema);

    // Accept either spelling of an Iranian mobile. normalizeIranianMobile is a
    // no-op on anything that isn't one, so usernames pass through untouched.
    const normalized = normalizeIranianMobile(identifier);
    const phoneCandidates = normalized === identifier ? [identifier] : [identifier, normalized];

    const user = await prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { phoneNumber: { in: phoneCandidates } }] },
    });

    // Always run exactly one bcrypt compare, even with no matching user, so
    // response time is identical for "no such account" and "wrong password".
    // Without this, latency is a reliable user-enumeration oracle (~120ms vs ~1ms).
    const passwordMatches = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

    // Same status, message and code for both failures.
    // `!user ||` is redundant at runtime but required for TS to narrow below.
    if (!user || !passwordMatches) {
      throw ApiError.coded(401, "INVALID_CREDENTIALS", "Invalid credentials");
    }

    // Checked AFTER the password so a deactivated account isn't discoverable
    // without valid credentials.
    if (!user.isActive) {
      throw ApiError.coded(403, "ACCOUNT_DEACTIVATED", "This account has been deactivated");
    }

    const { token, session } = await createSession(user.id, request.headers.get("user-agent"));
    const response = ok<LoginResponse>(sanitizeUser(user), { message: "Login successful" });
    setSessionCookie(response, token, session.expiresAt);

    return response;
  });
}
