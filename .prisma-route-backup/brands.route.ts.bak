import { prisma } from "@/lib/prisma";
import { ok, withErrorHandling } from "@/lib/http";

export async function GET() {
  return withErrorHandling(async () => {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        imageAlt: true,
        iconUrl: true,
        seoTitle: true,
        seoDescription: true,
      },
    });

    return ok(brands, { total: brands.length });
  });
}
