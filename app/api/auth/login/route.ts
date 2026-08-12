import { z } from "zod";
import { createSession, sanitizeUser, verifyPassword, SESSION_COOKIE_NAME } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  // Accepts either the username or the phone number as the identifier.
  identifier: z.string().min(3),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, "Invalid request body", parsed.error.flatten());
    }

    const { identifier, password } = parsed.data;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { phoneNumber: identifier }],
      },
    });

    // Same error for "not found" and "wrong password" to avoid leaking
    // which accounts exist.
    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      throw new ApiError(401, "Invalid credentials");
    }

    if (!user.isActive) {
      throw new ApiError(403, "This account has been deactivated");
    }

    const { token, session } = await createSession(user.id, request.headers.get("user-agent"));
    const response = ok(sanitizeUser(user), { message: "Login successful" });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: session.expiresAt,
    });

    return response;
  });
}
