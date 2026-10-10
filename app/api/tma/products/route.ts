import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateTmaRequest } from "@/lib/tma-api-auth";

export async function GET(req: NextRequest) {
  const auth = authenticateTmaRequest(req);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();
    const stockFilter = searchParams.get("stock");
    const categoryId = searchParams.get("category");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { barcode: { contains: query } },
      ];
    }

    if (categoryId) {
      const catId = parseInt(categoryId, 10);
      if (!isNaN(catId)) {
        where.mainCategoryId = catId;
      }
    }

    if (stockFilter === "low") {
      where.OR = [
        { available: false },
        { stock: { lte: 2 } },
        {
          variants: {
            some: { stock: { lte: 2 } },
          },
        },
      ];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          compareAtPrice: true,
          stock: true,
          available: true,
          hasVariants: true,
          mainCategory: {
            select: { id: true, name: true },
          },
          images: {
            take: 1,
            select: { url: true },
          },
          variants: {
            select: {
              id: true,
              color: true,
              storage: true,
              price: true,
              compareAtPrice: true,
              stock: true,
              stockType: true,
            },
            orderBy: { id: "asc" },
          },
        },
        orderBy: [{ available: "desc" }, { updatedAt: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    const formattedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      stock: p.stock,
      available: p.available,
      hasVariants: p.hasVariants && p.variants.length > 0,
      categoryName: p.mainCategory?.name || null,
      imageUrl: p.images[0]?.url || null,
      variants: p.variants.map((v) => ({
        id: v.id,
        color: v.color,
        storage: v.storage,
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
        stock: v.stock,
      })),
    }));

    return NextResponse.json({
      ok: true,
      products: formattedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("TMA Products List Error:", error);
    return NextResponse.json(
      { ok: false, error: "PRODUCTS_ERROR", message: "خطا در دریافت لیست محصولات." },
      { status: 500 }
    );
  }
}

