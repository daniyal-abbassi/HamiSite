import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateTmaRequest } from "@/lib/tma-api-auth";
import { isValidOrderStatusTransition } from "@/lib/tma-service";
import { OrderStatus } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateTmaRequest(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ ok: false, message: "شناسه سفارش نامعتبر است." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                images: { take: 1, select: { url: true } },
              },
            },
            variant: {
              select: {
                color: true,
                storage: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ ok: false, message: "سفارش پیدا نشد." }, { status: 404 });
    }

    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: `${order.firstName} ${order.lastName}`.trim(),
      phone: order.phone,
      addressText: order.addressText,
      city: order.city,
      province: order.province,
      postalCode: order.postalCode,
      customerNote: order.customerNote,
      shippingMethodName: order.shippingMethodName,
      shippingPrice: Number(order.shippingPrice),
      trackingCode: order.trackingCode,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      discountAmount: Number(order.discountAmount),
      subtotal: Number(order.subtotal),
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((it) => ({
        id: it.id,
        productName: it.product?.name || "کالا",
        variantDesc: [it.variant?.color, it.variant?.storage].filter(Boolean).join(" | "),
        imageUrl: it.product?.images?.[0]?.url || null,
        quantity: it.quantity,
        unitPrice: Number(it.price),
        totalPrice: Number(it.lineTotal),
      })),
    };

    return NextResponse.json({ ok: true, order: formattedOrder });
  } catch (error) {
    console.error("TMA Order Detail Error:", error);
    return NextResponse.json({ ok: false, message: "خطا در دریافت اطلاعات سفارش." }, { status: 500 });
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
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ ok: false, message: "شناسه سفارش نامعتبر است." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { status, trackingCode } = body;

    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });

    if (!currentOrder) {
      return NextResponse.json({ ok: false, message: "سفارش پیدا نشد." }, { status: 404 });
    }

    const updateData: any = {};

    if (trackingCode !== undefined) {
      updateData.trackingCode = trackingCode;
    }

    if (status) {
      if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
        return NextResponse.json({ ok: false, message: "وضعیت جدید معتبر نیست." }, { status: 400 });
      }

      // Check transition validity unless force override
      if (
        !isValidOrderStatusTransition(currentOrder.status, status) &&
        !body.force
      ) {
        return NextResponse.json(
          {
            ok: false,
            message: `تغییر وضعیت مستقیم از ${currentOrder.status} به ${status} مجاز نیست.`,
          },
          { status: 422 }
        );
      }

      updateData.status = status as OrderStatus;
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        trackingCode: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      order: updated,
      message: "وضعیت سفارش با موفقیت به‌روزرسانی شد.",
    });
  } catch (error) {
    console.error("TMA Order Patch Error:", error);
    return NextResponse.json({ ok: false, message: "خطا در به‌روزرسانی وضعیت سفارش." }, { status: 500 });
  }
}

