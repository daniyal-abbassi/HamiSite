import type { Role } from "@prisma/client";
import type { z } from "zod";
import type { sanitizeUser } from "@/lib/auth";
import type { loginSchema } from "@/lib/schemas/auth";

/** The ONLY user shape any endpoint returns. Wire types, not DB types:
 * Decimal -> number, DateTime -> ISO string. `passwordHash` is never present. */
export interface PublicUser {
  id: number;
  role: Role;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string;
  phoneVerified: boolean;
  nationalNumber: string | null;
  city: string | null;
  shopName: string | null;
  businessLicenseNumber: string | null;
  businessVerified: boolean;
  /** `number | null`, not `number`: the DB columns are non-nullable Decimals
   * defaulting to 0, but `toNumber` (lib/serializers.ts) is typed
   * `(value: unknown) => number | null`, so that is the shape actually on the
   * wire. The frontend must handle null. Do not "tighten" this to `number` —
   * the drift assertion below will fail. */
  creditLimit: number | null;
  creditUsed: number | null;
  agentId: number | null;
  isActive: boolean;
  receiveNewsletters: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- compile-time drift guard: zero runtime emit ------------------------
// sanitizeUser is an implementation detail (a field-picking function). If it
// were also the contract, any edit to it would be a silent public-API change.
// This makes `npm run typecheck` fail the moment the two disagree.
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type AssertTrue<T extends true> = T;
export type _PublicUserMatchesSanitizeUser = AssertTrue<Exact<PublicUser, ReturnType<typeof sanitizeUser>>>;

export type LoginRequest = z.infer<typeof loginSchema>;
export type LoginResponse = PublicUser;
export type MeResponse = PublicUser;
export type LogoutResponse = { loggedOut: true };
