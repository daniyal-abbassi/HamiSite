import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateTmaRequest } from "@/lib/tma-api-auth";
import { validateProductQuickUpdate, validateVariantQuickUpdate } from "@/lib/tma-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateTmaRequest(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ ok: false, message: "شناسه محصول نامعتبر است." }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: { take: 1, select: { url: true } },
        variants: {
          select: {
            id: true,
            color: true,
            storage: true,
            price: true,
            compareAtPrice: true,
            stock: true,
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ ok: false, message: "محصول پیدا نشد." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        available: product.available,
        stock: product.stock,
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        imageUrl: product.images[0]?.url || null,
        variants: product.variants.map((v) => ({
          id: v.id,
          color: v.color,
          storage: v.storage,
          price: Number(v.price),
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
          stock: v.stock,
        })),
      },
    });
  } catch (error) {
    console.error("TMA Product Detail Error:", error);
    return NextResponse.json({ ok: false, message: "خطا در دریافت محصول." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateTmaRequest(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ ok: false, message: "شناسه محصول نامعتبر است." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    // 1. Variant-level quick update
    if (body.variantId) {
      const validation = validateVariantQuickUpdate(body);
      if (!validation.valid) {
        return NextResponse.json({ ok: false, message: validation.error }, { status: 400 });
      }

      const updateData: any = {};
      if (validation.data?.stock !== undefined) updateData.stock = validation.data.stock;
      if (validation.data?.price !== undefined) updateData.price = validation.data.price;
      if (validation.data?.compareAtPrice !== undefined) updateData.compareAtPrice = validation.data.compareAtPrice;

      const updatedVariant = await prisma.productVariant.update({
        where: { id: body.variantId },
        data: updateData,
      });

      return NextResponse.json({
        ok: true,
        variant: {
          id: updatedVariant.id,
          stock: updatedVariant.stock,
          price: Number(updatedVariant.price),
          compareAtPrice: updatedVariant.compareAtPrice ? Number(updatedVariant.compareAtPrice) : null,
        },
        message: "تنوع محصول با موفقیت به‌روزرسانی شد.",
      });
    }

    // 2. Product-level quick update (availability, stock, price)
    const validation = validateProductQuickUpdate(body);
    if (!validation.valid) {
      return NextResponse.json({ ok: false, message: validation.error }, { status: 400 });
    }

    const updateData: any = {};
    if (validation.data?.available !== undefined) updateData.available = validation.data.available;
    if (validation.data?.stock !== undefined) updateData.stock = validation.data.stock;
    if (validation.data?.price !== undefined) updateData.price = validation.data.price;
    if (validation.data?.compareAtPrice !== undefined) updateData.compareAtPrice = validation.data.compareAtPrice;

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      select: {
        id: true,
        name: true,
        available: true,
        stock: true,
        price: true,
        compareAtPrice: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        available: updatedProduct.available,
        stock: updatedProduct.stock,
        price: Number(updatedProduct.price),
        compareAtPrice: updatedProduct.compareAtPrice ? Number(updatedProduct.compareAtPrice) : null,
      },
      message: "محصول با موفقیت به‌روزرسانی شد.",
    });
  } catch (error) {
    console.error("TMA Product Patch Error:", error);
    return NextResponse.json({ ok: false, message: "خطا در به‌روزرسانی محصول." }, { status: 500 });
  }
}

