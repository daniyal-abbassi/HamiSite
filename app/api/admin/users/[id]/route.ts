import { Role } from "@prisma/client";
import { z } from "zod";
import { sanitizeUser, withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const updateUserSchema = z
  .object({
    role: z.nativeEnum(Role),
    isActive: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

function parseId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "Invalid user id");
  }
  return id;
}

export const GET = withAuth<{ id: string }>(
  async (_request, { params }) => {
    return withErrorHandling(async () => {
      const id = parseId(params.id);
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new ApiError(404, "User not found");
      }
      return ok(sanitizeUser(user));
    });
  },
  { roles: [Role.ADMIN] },
);

export const PATCH = withAuth<{ id: string }>(
  async (request, { params }) => {
    return withErrorHandling(async () => {
      const id = parseId(params.id);
      const body = await request.json();
      const parsed = updateUserSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError(400, "Invalid request body", parsed.error.flatten());
      }

      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) {
        throw new ApiError(404, "User not found");
      }

      const user = await prisma.user.update({ where: { id }, data: parsed.data });

      return ok(sanitizeUser(user), { message: "User updated" });
    });
  },
  { roles: [Role.ADMIN] },
);
