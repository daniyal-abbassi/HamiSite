import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyAdminSession } from "@/lib/admin-access";
import { hashSessionToken, SESSION_COOKIE_NAME } from "@/lib/session-token";
import { applyCsp } from "@/lib/security/csp";

/**
 * Middleware handling:
 * 1. Per-request Content-Security-Policy with cryptographic nonces across HTML routes.
 * 2. Admin access control for /admin routes before RSC payloads are rendered.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Admin route access guard
  if (pathname.startsWith("/admin")) {
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

    if (access === "guest") return redirectGuest(request);
    if (access !== "admin") return NextResponse.redirect(new URL("/", request.url));
  }

  // 2. Apply CSP with cryptographic nonce and framing controls
  const { response } = applyCsp(request);
  return response;
}

function redirectGuest(request: NextRequest) {
  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
  runtime: "nodejs",
};
