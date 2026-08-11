import { z } from "zod";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const updateAddressSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  province: z.string().optional(),
  city: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isDefault: z.boolean().optional(),
});

function parseId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "Invalid address id");
  }
  return id;
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const id = parseId(params.id);

    const address = await prisma.address.findUnique({ where: { id } });
    if (!address) {
      throw new ApiError(404, "Address not found");
    }

    return ok(address);
  });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const id = parseId(params.id);
    const body = await request.json();
    const parsed = updateAddressSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, "Invalid request body", parsed.error.flatten());
    }

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, "Address not found");
    }

    const input = parsed.data;

    const address = await prisma.$transaction(async (tx) => {
      if (input.isDefault === true) {
        await tx.address.updateMany({
          where: { userId: existing.userId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          phoneNumber: input.phoneNumber,
          province: input.province,
          city: input.city,
          address: input.address,
          postalCode: input.postalCode,
          latitude: input.latitude,
          longitude: input.longitude,
          isDefault: input.isDefault,
        },
      });
    });

    return ok(address, { message: "Address updated" });
  });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const id = parseId(params.id);

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, "Address not found");
    }

    await prisma.address.delete({ where: { id } });

    if (existing.isDefault) {
      // Promote the most recently created remaining address to default so
      // the user always has one, if possible.
      const nextDefault = await prisma.address.findFirst({
        where: { userId: existing.userId },
        orderBy: { createdAt: "desc" },
      });

      if (nextDefault) {
        await prisma.address.update({ where: { id: nextDefault.id }, data: { isDefault: true } });
      }
    }

    return ok({ id }, { message: "Address deleted" });
  });
}
