import bcrypt from "bcryptjs";
import { User } from "@prisma/client";
import { toNumber } from "@/lib/serializers";
import { randomBytes, createHash } from "node:crypto";

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
