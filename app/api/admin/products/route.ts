import { HistoryAction, Role, StockType } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { recordProductHistory } from "@/lib/productHistory";
import { serializeAdminProduct } from "@/lib/serializers";

const createProductSchema = z.object({
  name: z.string().min(1),
  englishName: z.string().optional(),
  slug: z.string().min(1),
  description: z.string().optional(),
  analysis: z.string().optional(),
  mainCategoryId: z.number().int().positive().optional(),
  brandId: z.number().int().positive().optional(),
  isDigital: z.boolean().optional(),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(),
  specialOffer: z.boolean().optional(),
  specialOfferEnd: z.string().datetime().optional(),
  costPerItem: z.number().min(0).optional(),
  batchSize: z.number().int().positive().optional(),
  available: z.boolean().optional(),
  showPrice: z.boolean().optional(),
  hasVariants: z.boolean().optional(),
  stock: z.number().int().min(0).optional(),
  stockType: z.nativeEnum(StockType).optional(),
  minOrderQuantity: z.number().int().positive().optional(),
  maxOrderQuantity: z.number().int().positive().optional(),
  guarantee: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export const POST = withAuth(
  async (request, { user }) => {
    return withErrorHandling(async () => {
      const body = await request.json();
      const parsed = createProductSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError(400, "Invalid request body", parsed.error.flatten());
      }

      const input = parsed.data;

      const existing = await prisma.product.findUnique({ where: { slug: input.slug }, select: { id: true } });
      if (existing) {
        throw new ApiError(409, `A product with slug "${input.slug}" already exists`);
      }

      const product = await prisma.product.create({
        data: {
          ...input,
          specialOfferEnd: input.specialOfferEnd ? new Date(input.specialOfferEnd) : undefined,
        },
      });

      await recordProductHistory({
        productId: product.id,
        action: HistoryAction.CREATED,
        field: "product",
        newValue: serializeAdminProduct(product),
        changedById: user.id,
      });

      return ok(serializeAdminProduct(product), { message: "Product created" });
    });
  },
  { roles: [Role.ADMIN] },
);
