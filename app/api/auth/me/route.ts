import { Prisma } from "@prisma/client";
import { sanitizeUser, withAuth } from "@/lib/auth";
import { ApiError, ok, parseJsonBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/schemas/auth";
import type { MeResponse, UpdateProfileResponse } from "@/types/auth";

export const GET = withAuth(async (_request, { user }) => {
  return ok<MeResponse>(sanitizeUser(user));
});

// No inner withErrorHandling: withAuth already wraps the handler in it
// (lib/auth.ts), matching the sibling GET and logout routes.
export const PATCH = withAuth(async (request, { user }) => {
  const data = await parseJsonBody(request, updateProfileSchema);

  // Re-submitting your OWN current email must be a no-op, not a 409 — hence
  // the NOT clause rather than a bare `{ email }` lookup.
  if (data.email) {
    const clash = await prisma.user.findFirst({
      where: { email: data.email, NOT: { id: user.id } },
      select: { id: true },
    });
    if (clash) {
      throw ApiError.coded(409, "DUPLICATE_ACCOUNT", "An account with this email already exists");
    }
  }

  let updated;
  try {
    updated = await prisma.user.update({
      where: { id: user.id },
      // Explicit whitelist. zod already strips unknown keys, but spreading
      // parsed data into a Prisma update is one schema edit away from letting
      // `role` through — belt and braces on a privilege boundary.
      data: {
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.city !== undefined ? { city: data.city } : {}),
        ...(data.receiveNewsletters !== undefined ? { receiveNewsletters: data.receiveNewsletters } : {}),
      },
    });
  } catch (error) {
    // Backstop for the check-then-update race, same as register.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw ApiError.coded(409, "DUPLICATE_ACCOUNT", "An account with this email already exists");
    }
    throw error;
  }

  return ok<UpdateProfileResponse>(sanitizeUser(updated), { message: "Profile updated" });
});
