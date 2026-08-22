import { Prisma, Role } from "@prisma/client";
import { createSession, hashPassword, sanitizeUser, setSessionCookie } from "@/lib/auth";
import { ApiError, ok, parseJsonBody, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/schemas/auth";
import type { RegisterResponse } from "@/types/auth";

/** Prisma reports the violated unique index in `meta.target`; on Postgres that's
 * an array of COLUMN names. username/email/phoneNumber have no @map, so column
 * names equal field names. Defensive about the shape anyway. */
function duplicateFieldFrom(error: Prisma.PrismaClientKnownRequestError): string {
  const target = (error.meta as { target?: unknown } | undefined)?.target;
  const first = Array.isArray(target) ? target[0] : target;
  return typeof first === "string" ? first : "account";
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const input = await parseJsonBody(request, registerSchema);
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
      throw ApiError.coded(409, "DUPLICATE_ACCOUNT", `An account with this ${field} already exists`);
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

    let user;
    try {
      user = await prisma.user.create({
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
    } catch (error) {
      // The pre-check above is best-effort: two concurrent registrations can
      // both pass it. The unique index is what actually prevents the duplicate;
      // this turns its violation into the same 409 instead of a 500.
      // (A transaction would NOT help — at READ COMMITTED both txns read
      // "no existing user" and both insert.)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw ApiError.coded(
          409,
          "DUPLICATE_ACCOUNT",
          `An account with this ${duplicateFieldFrom(error)} already exists`,
        );
      }
      throw error;
    }

    const { token, session } = await createSession(user.id, request.headers.get("user-agent"));
    const response = ok<RegisterResponse>(sanitizeUser(user), { message: "Account created" });
    setSessionCookie(response, token, session.expiresAt);

    return response;
  });
}
