import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyAdminSession } from "@/lib/admin-access";
import { hashSessionToken, SESSION_COOKIE_NAME } from "@/lib/session-token";

/** Check access before App Router pages or their RSC payloads are rendered. */
export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return redirectGuest(request);

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: {
      expiresAt: true,
      user: { select: { role: true, isActive: true } },
    },
  });
  const access = classifyAdminSession(session);

  if (access === "admin") return NextResponse.next();
  if (access === "guest") return redirectGuest(request);
  return NextResponse.redirect(new URL("/", request.url));
}

function redirectGuest(request: NextRequest) {
  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*"],
  runtime: "nodejs",
};
