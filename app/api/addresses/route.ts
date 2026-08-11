import { z } from "zod";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const createAddressSchema = z.object({
  userId: z.number().int().positive(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  province: z.string().optional(),
  city: z.string().min(1),
  address: z.string().min(1),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");

    if (!userIdParam) {
      throw new ApiError(400, "userId query parameter is required");
    }

    const userId = Number(userIdParam);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new ApiError(400, "userId must be a positive integer");
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return ok(addresses, { total: addresses.length });
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const parsed = createAddressSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, "Invalid request body", parsed.error.flatten());
    }

    const input = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { id: true } });
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const existingCount = await prisma.address.count({ where: { userId: input.userId } });
    // The very first address for a user is always the default, regardless
    // of what the client sent.
    const shouldBeDefault = input.isDefault === true || existingCount === 0;

    const address = await prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: { userId: input.userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId: input.userId,
          firstName: input.firstName,
          lastName: input.lastName,
          phoneNumber: input.phoneNumber,
          province: input.province,
          city: input.city,
          address: input.address,
          postalCode: input.postalCode,
          latitude: input.latitude,
          longitude: input.longitude,
          isDefault: shouldBeDefault,
        },
      });
    });

    return ok(address, { message: "Address created" });
  });
}
