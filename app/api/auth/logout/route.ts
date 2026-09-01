import { clearSessionCookie, getSessionTokenFromRequest, hashSessionToken, withAuth } from "@/lib/auth";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import type { LogoutResponse } from "@/types/auth";

export const POST = withAuth(async (request) => {
  const token = getSessionTokenFromRequest(request);

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }

  const response = ok<LogoutResponse>({ loggedOut: true });
  clearSessionCookie(response);
  return response;
});
