import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { Role, User } from "@prisma/client";
import { toNumber } from "@/lib/serializers";
import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ApiError, withErrorHandling } from "@/lib/http";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export const SESSION_COOKIE_NAME = "session_token";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function generateSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Strips sensitive fields (passwordHash, etc.) before a User is ever
 * returned from an API route.
 */
export function sanitizeUser(user: User) {
  return {
    id: user.id,
    role: user.role,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    phoneVerified: user.phoneVerified,
    nationalNumber: user.nationalNumber,
    city: user.city,
    shopName: user.shopName,
    businessLicenseNumber: user.businessLicenseNumber,
    businessVerified: user.businessVerified,
    creditLimit: toNumber(user.creditLimit),
    creditUsed: toNumber(user.creditUsed),
    agentId: user.agentId,
    isActive: user.isActive,
    receiveNewsletters: user.receiveNewsletters,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};

  const cookies: Record<string, string> = {};
  for (const pair of header.split(";")) {
    const trimmed = pair.trim();
    if (!trimmed) continue;

    const eq = trimmed.indexOf("=");
    if (eq < 1) continue; // no name, or a bare flag with no "=" — skip it

    const name = trimmed.slice(0, eq);
    const raw = trimmed.slice(eq + 1);

    // decodeURIComponent throws URIError on a malformed escape (e.g. "%zz").
    // A junk THIRD-PARTY cookie must never be able to 500 an authenticated
    // request, so fall back to the raw value instead of propagating.
    let value: string;
    try {
      value = decodeURIComponent(raw);
    } catch {
      value = raw;
    }

    cookies[name] = value; // last-wins, matching the previous Object.fromEntries behaviour
  }

  return cookies;
}

/** Extracts the raw session token from a request's `Cookie` header, using the
 * same anchored parsing as session resolution (never a substring regex match). */
export function getSessionTokenFromRequest(request: Request): string | null {
  const cookies = parseCookies(request.headers.get("cookie"));
  return cookies[SESSION_COOKIE_NAME] ?? null;
}

const SESSION_COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/** Sets (or refreshes) the session cookie on an outgoing response. Always use
 * this instead of a hand-rolled `response.cookies.set(...)` call so every
 * route agrees on cookie attributes (path in particular — see clearSessionCookie). */
export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    ...SESSION_COOKIE_BASE_OPTIONS,
    expires: expiresAt,
  });
}

/** Clears the session cookie on an outgoing response. Uses the string-overload-free
 * `.set()` form with matching attributes (notably `path: "/"`) so the clearing
 * `Set-Cookie` header actually matches the cookie the browser is holding —
 * `response.cookies.delete(name)` omits `Path`, which scopes the delete to the
 * current route path and leaves the real, `/`-scoped cookie in place. */
export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...SESSION_COOKIE_BASE_OPTIONS,
    expires: new Date(0),
  });
}

export async function createSession(userId: number, userAgent?: string | null) {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const session = await prisma.session.create({
    data: { userId, tokenHash, userAgent: userAgent ?? null, expiresAt },
  });

  return { token, session };
}

type ResolvedSession = { user: User; token: string; expiresAt: Date };

/** Resolves the request's session cookie to its user, bumping the session's
 * `expiresAt` in the DB (sliding expiry) along the way. Returns the raw token
 * and the new expiry too, so callers (namely `withAuth`) can also refresh the
 * cookie sent back to the browser to match. */
async function resolveSession(request: Request): Promise<ResolvedSession | null> {
  const token = getSessionTokenFromRequest(request);
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findUnique({ where: { tokenHash }, include: { user: true } });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  const updated = await prisma.session.update({
    where: { id: session.id },
    data: { expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });

  return { user: session.user, token, expiresAt: updated.expiresAt };
}

/** Requires a valid session; callers should treat a null return as "not authenticated". */
export async function getSessionUser(request: Request): Promise<User | null> {
  const resolved = await resolveSession(request);
  return resolved?.user ?? null;
}

/** Same resolution as getSessionUser but named for call sites where auth is optional (e.g. coupon validation). */
export async function getOptionalSessionUser(request: Request): Promise<User | null> {
  return getSessionUser(request);
}

type AuthedHandler<Params> = (
  request: Request,
  ctx: { user: User; params: Params },
) => Promise<NextResponse>;

export function withAuth<Params = undefined>(
  handler: AuthedHandler<Params>,
  options?: { roles?: Role[] },
) {
  return async (request: Request, routeCtx?: { params: Params }) => {
    return withErrorHandling(async () => {
      const resolved = await resolveSession(request);
      if (!resolved) {
        throw ApiError.coded(401, "AUTH_REQUIRED", "Authentication required");
      }
      const { user, token, expiresAt } = resolved;
      if (!user.isActive) {
        throw ApiError.coded(403, "ACCOUNT_DEACTIVATED", "Account deactivated");
      }
      if (options?.roles && !options.roles.includes(user.role)) {
        throw ApiError.coded(403, "FORBIDDEN_ROLE", "Forbidden");
      }

      const response = await handler(request, { user, params: routeCtx?.params as Params });
      // Sliding expiry: every successful authenticated request refreshes the
      // cookie's expiry to match the DB row's just-bumped expiresAt — unless
      // the handler itself already set the session cookie on this response
      // (e.g. logout's clearSessionCookie), in which case that decision wins.
      if (!response.cookies.get(SESSION_COOKIE_NAME)) {
        setSessionCookie(response, token, expiresAt);
      }
      return response;
    });
  };
}
