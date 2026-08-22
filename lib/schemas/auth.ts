import { Role } from "@prisma/client";
import { z } from "zod";
import { normalizeIranianMobile } from "@/lib/phone";

export const loginSchema = z.object({
  /** Username OR phone number. Trimmed — mobile keyboards love a trailing space. */
  identifier: z.string().trim().min(3).max(50),
  password: z.string().min(1).max(100),
});

export const registerSchema = z.object({
  username: z.string().trim().min(3).max(50),
  password: z.string().min(6).max(100),
  // .transform runs before the uniqueness pre-check and the create, so both see
  // the canonical form and 0912…/+98912… can never become two accounts.
  phoneNumber: z.string().trim().min(5).max(20).transform(normalizeIranianMobile),
  email: z.string().trim().email().max(255).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  // AGENT and ADMIN are provisioned out-of-band (seed script / admin API).
  // AGENT is a B2B sales-rep principal, not a self-service storefront role.
  role: z.enum([Role.RETAIL, Role.WHOLESALE]).optional(),
  shopName: z.string().max(200).optional(),
  businessLicenseNumber: z.string().max(100).optional(),
  nationalNumber: z.string().max(50).optional(),
  agentId: z.number().int().positive().optional(),
  referer: z.string().max(200).optional(),
});
