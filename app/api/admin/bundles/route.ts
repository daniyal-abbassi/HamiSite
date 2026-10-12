import { Role } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import {
  bundleInclude,
  serializePartnerBundle,
  slugifyBundleTitle,
} from "@/lib/bundles";
import { ApiError, ok, parsePagination, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { createBundleInputSchema } from "@/lib/schemas/admin-bundles";

export const GET = withAuth(
  async (request) =>
    withErrorHandling(async () => {
      const { searchParams } = new URL(request.url);
      const pagination = parsePagination(searchParams);
      const q = searchParams.get("q")?.trim() || undefined;
      const isActiveParam = searchParams.get("isActive");
      const isActive =
        isActiveParam === "true" ? true : isActiveParam === "false" ? false : undefined;

      const where = {
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" as const } },
                { description: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      };

      const [total, bundles] = await Promise.all([
        prisma.partnerBundle.count({ where }),
        prisma.partnerBundle.findMany({
          where,
          include: bundleInclude(),
          orderBy: { createdAt: "desc" },
          skip: (pagination.page - 1) * pagination.pageSize,
          take: pagination.pageSize,
        }),
      ]);

      const data = bundles.map(serializePartnerBundle);

      return ok(data, {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        hasNextPage: pagination.page * pagination.pageSize < total,
      });
    }),
  { roles: [Role.ADMIN] }
);

export const POST = withAuth(
  async (request) =>
    withErrorHandling(async () => {
      const body = await request.json();
      const parsed = createBundleInputSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError(400, "اطلاعات ارسالی نامعتبر است", parsed.error.flatten());
      }

      const input = parsed.data;

      // Validate all constituent products and variants exist
      const productIds = [...new Set(input.items.map((i) => i.productId))];
      const existingProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, available: true },
      });

      if (existingProducts.length !== productIds.length) {
        throw new ApiError(400, "برخی از کالاهای انتخابی در سیستم یافت نشدند");
      }

      const baseSlug = input.slug || slugifyBundleTitle(input.title) || `bundle-${Date.now()}`;
      let uniqueSlug = baseSlug;
      let counter = 1;
      while (await prisma.partnerBundle.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      const created = await prisma.partnerBundle.create({
        data: {
          title: input.title,
          slug: uniqueSlug,
          description: input.description ?? null,
          price: input.price,
          compareAtPrice: input.compareAtPrice ?? null,
          stock: input.stock,
          isActive: input.isActive ?? true,
          imageUrl: input.imageUrl ?? null,
          items: {
            create: input.items.map((item, index) => ({
              productId: item.productId,
              variantId: item.variantId ?? null,
              quantity: item.quantity,
              order: index,
            })),
          },
        },
        include: bundleInclude(),
      });

      return ok(serializePartnerBundle(created), { message: "سبد همکار با موفقیت ایجاد شد" });
    }),
  { roles: [Role.ADMIN] }
);

