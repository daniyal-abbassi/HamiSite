import bcrypt from "bcryptjs";
import { User } from "@prisma/client";
import { toNumber } from "@/lib/serializers";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
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
