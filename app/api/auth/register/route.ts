import { Role } from "@prisma/client";
import { z } from "zod";
import { createSession, hashPassword, sanitizeUser, setSessionCookie } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

// Self-registration is limited to storefront/B2B roles — ADMIN accounts are
// provisioned out-of-band (seed script / internal tooling).
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  phoneNumber: z.string().min(5).max(20),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  city: z.string().optional(),
  role: z.enum([Role.RETAIL, Role.WHOLESALE, Role.AGENT]).optional(),
  shopName: z.string().optional(),
  businessLicenseNumber: z.string().optional(),
  nationalNumber: z.string().optional(),
  agentId: z.number().int().positive().optional(),
  referer: z.string().optional(),
});

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, "Invalid request body", parsed.error.flatten());
    }

    const input = parsed.data;
    const role = input.role ?? Role.RETAIL;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: input.username },
          { phoneNumber: input.phoneNumber },
          ...(input.email ? [{ email: input.email }] : []),
        ],
      },
      select: { username: true, phoneNumber: true, email: true },
    });

    if (existing) {
      const field =
        existing.username === input.username
          ? "username"
          : existing.phoneNumber === input.phoneNumber
            ? "phoneNumber"
            : "email";
      throw new ApiError(409, `An account with this ${field} already exists`);
    }

    if (input.agentId) {
      if (role !== Role.WHOLESALE) {
        throw new ApiError(400, "agentId can only be set for WHOLESALE accounts");
      }

      const agent = await prisma.user.findUnique({
        where: { id: input.agentId },
        select: { id: true, role: true, isActive: true },
      });

      if (!agent || !agent.isActive || agent.role !== Role.AGENT) {
        throw new ApiError(400, "Invalid agentId — must reference an active AGENT user");
      }
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash,
        role,
        firstName: input.firstName,
        lastName: input.lastName,
        phoneNumber: input.phoneNumber,
        city: input.city,
        shopName: role === Role.WHOLESALE ? input.shopName : undefined,
        businessLicenseNumber: role === Role.WHOLESALE ? input.businessLicenseNumber : undefined,
        nationalNumber: input.nationalNumber,
        agentId: input.agentId,
        referer: input.referer,
        creationMethod: "password",
      },
    });

    const { token, session } = await createSession(user.id, request.headers.get("user-agent"));
    const response = ok(sanitizeUser(user), { message: "Account created" });
    setSessionCookie(response, token, session.expiresAt);

    return response;
  });
}
