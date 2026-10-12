import { Role } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { bundleInclude, serializePartnerBundle } from "@/lib/bundles";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { updateBundleInputSchema } from "@/lib/schemas/admin-bundles";

interface RouteParams {
  id: string;
}

export const GET = withAuth<RouteParams>(
  async (_request, { params }) =>
    withErrorHandling(async () => {
      const bundleId = parseInt(params.id, 10);
      if (isNaN(bundleId)) throw new ApiError(400, "شناسه سبد نامعتبر است");

      const bundle = await prisma.partnerBundle.findUnique({
        where: { id: bundleId },
        include: bundleInclude(),
      });

      if (!bundle) {
        throw new ApiError(404, "سبد مورد نظر یافت نشد");
      }

      return ok(serializePartnerBundle(bundle));
    }),
  { roles: [Role.ADMIN] }
);

export const PATCH = withAuth<RouteParams>(
  async (request, { params }) =>
    withErrorHandling(async () => {
      const bundleId = parseInt(params.id, 10);
      if (isNaN(bundleId)) throw new ApiError(400, "شناسه سبد نامعتبر است");

      const existing = await prisma.partnerBundle.findUnique({
        where: { id: bundleId },
        include: { items: true },
      });

      if (!existing) {
        throw new ApiError(404, "سبد مورد نظر یافت نشد");
      }

      const body = await request.json();
      const parsed = updateBundleInputSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError(400, "اطلاعات ارسالی نامعتبر است", parsed.error.flatten());
      }

      const input = parsed.data;

      const updated = await prisma.$transaction(async (tx) => {
        // If items were provided, validate and replace them
        if (input.items && input.items.length > 0) {
          const productIds = [...new Set(input.items.map((i) => i.productId))];
          const found = await tx.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true },
          });
          if (found.length !== productIds.length) {
            throw new ApiError(400, "برخی از کالاهای انتخابی در سیستم یافت نشدند");
          }

          await tx.partnerBundleItem.deleteMany({ where: { bundleId } });
          await tx.partnerBundleItem.createMany({
            data: input.items.map((item, index) => ({
              bundleId,
              productId: item.productId,
              variantId: item.variantId ?? null,
              quantity: item.quantity,
              order: index,
            })),
          });
        }

        return tx.partnerBundle.update({
          where: { id: bundleId },
          data: {
            title: input.title ?? undefined,
            slug: input.slug ?? undefined,
            description: input.description !== undefined ? input.description : undefined,
            price: input.price !== undefined ? input.price : undefined,
            compareAtPrice: input.compareAtPrice !== undefined ? input.compareAtPrice : undefined,
            stock: input.stock !== undefined ? input.stock : undefined,
            isActive: input.isActive !== undefined ? input.isActive : undefined,
            imageUrl: input.imageUrl !== undefined ? input.imageUrl : undefined,
          },
          include: bundleInclude(),
        });
      });

      return ok(serializePartnerBundle(updated), { message: "سبد همکار با موفقیت ویرایش شد" });
    }),
  { roles: [Role.ADMIN] }
);

export const DELETE = withAuth<RouteParams>(
  async (_request, { params }) =>
    withErrorHandling(async () => {
      const bundleId = parseInt(params.id, 10);
      if (isNaN(bundleId)) throw new ApiError(400, "شناسه سبد نامعتبر است");

      const existing = await prisma.partnerBundle.findUnique({
        where: { id: bundleId },
      });

      if (!existing) {
        throw new ApiError(404, "سبد مورد نظر یافت نشد");
      }

      await prisma.partnerBundle.delete({ where: { id: bundleId } });

      return ok({ success: true }, { message: "سبد همکار با موفقیت حذف شد" });
    }),
  { roles: [Role.ADMIN] }
);

