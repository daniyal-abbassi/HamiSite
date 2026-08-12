import { clearSessionCookie, getSessionTokenFromRequest, hashSessionToken, withAuth } from "@/lib/auth";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const POST = withAuth(async (request) => {
  const token = getSessionTokenFromRequest(request);

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }

  const response = ok({ loggedOut: true });
  clearSessionCookie(response);
  return response;
});
