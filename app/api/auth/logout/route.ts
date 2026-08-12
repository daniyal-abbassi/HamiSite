import { hashSessionToken, SESSION_COOKIE_NAME, withAuth } from "@/lib/auth";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const POST = withAuth(async (request) => {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  const token = match ? decodeURIComponent(match[1]) : null;

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }

  const response = ok({ loggedOut: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
});
