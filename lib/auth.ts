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
  return Object.fromEntries(
    header.split(";").map((pair) => {
      const [key, ...rest] = pair.trim().split("=");
      return [key, decodeURIComponent(rest.join("="))];
    }),
  );
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

async function resolveSessionUser(request: Request): Promise<User | null> {
  const cookies = parseCookies(request.headers.get("cookie"));
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findUnique({ where: { tokenHash }, include: { user: true } });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });

  return session.user;
}

/** Requires a valid session; callers should treat a null return as "not authenticated". */
export async function getSessionUser(request: Request): Promise<User | null> {
  return resolveSessionUser(request);
}

/** Same resolution as getSessionUser but named for call sites where auth is optional (e.g. coupon validation). */
export async function getOptionalSessionUser(request: Request): Promise<User | null> {
  return resolveSessionUser(request);
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
      const user = await getSessionUser(request);
      if (!user) {
        throw new ApiError(401, "Authentication required");
      }
      if (!user.isActive) {
        throw new ApiError(403, "Account deactivated");
      }
      if (options?.roles && !options.roles.includes(user.role)) {
        throw new ApiError(403, "Forbidden");
      }

      return handler(request, { user, params: routeCtx?.params as Params });
    });
  };
}
