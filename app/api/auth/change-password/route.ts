import {
  getSessionTokenFromRequest,
  hashPassword,
  hashSessionToken,
  verifyPassword,
  withAuth,
} from "@/lib/auth";
import { ApiError, ok, parseJsonBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/schemas/auth";
import type { ChangePasswordResponse } from "@/types/auth";

export const POST = withAuth(async (request, { user }) => {
  const { currentPassword, newPassword } = await parseJsonBody(request, changePasswordSchema);

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    // 400, NOT 401: the session is valid, only the submitted field is wrong.
    // A 401 here would trip a frontend's global "session expired -> log out"
    // interceptor and sign the user out over a typo.
    throw ApiError.coded(400, "INVALID_CURRENT_PASSWORD", "Current password is incorrect");
  }

  const passwordHash = await hashPassword(newPassword);

  // Changing your password is the ONLY session-revocation lever this API gives
  // a user (no session list, no revoke-all, no password reset), so it must
  // actually revoke: every session EXCEPT the one making this request.
  // Otherwise an attacker's stolen cookie survives its full sliding 30-day TTL,
  // extended by every request they make.
  const token = getSessionTokenFromRequest(request);
  const currentTokenHash = token ? hashSessionToken(token) : null;

  // One transaction: never leave the password changed with stale sessions alive.
  const [, revoked] = await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.session.deleteMany({
      where: {
        userId: user.id,
        // Defensive: withAuth guarantees a token, but if it were ever absent we
        // revoke EVERYTHING rather than leaving an attacker signed in.
        ...(currentTokenHash ? { NOT: { tokenHash: currentTokenHash } } : {}),
      },
    }),
  ]);

  return ok<ChangePasswordResponse>(
    { passwordChanged: true, revokedSessions: revoked.count },
    { message: "Password changed" },
  );
});
