import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateTmaRequest } from "@/lib/tma-api-auth";
import { OrderStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const auth = authenticateTmaRequest(req);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const query = searchParams.get("q")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (statusParam && statusParam !== "ALL") {
      if (Object.values(OrderStatus).includes(statusParam as OrderStatus)) {
        where.status = statusParam as OrderStatus;
      }
    }

    if (query) {
      where.OR = [
        { orderNumber: { contains: query, mode: "insensitive" } },
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          firstName: true,
          lastName: true,
          phone: true,
          city: true,
          province: true,
          totalAmount: true,
          status: true,
          paymentStatus: true,
          shippingMethodName: true,
          createdAt: true,
          items: {
            select: {
              id: true,
              quantity: true,
              price: true,
              product: {
                select: {
                  name: true,
                },
              },
              variant: {
                select: {
                  color: true,
                  storage: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const formattedOrders = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: `${o.firstName} ${o.lastName}`.trim(),
      phone: o.phone,
      city: o.city,
      province: o.province,
      totalAmount: Number(o.totalAmount),
      status: o.status,
      paymentStatus: o.paymentStatus,
      shippingMethodName: o.shippingMethodName,
      createdAt: o.createdAt.toISOString(),
      itemCount: o.items.reduce((acc, it) => acc + it.quantity, 0),
      itemsSummary: o.items.map((it) => ({
        name: it.product?.name || "کالا",
        variant: [it.variant?.color, it.variant?.storage].filter(Boolean).join(" / "),
        quantity: it.quantity,
        unitPrice: Number(it.price),
      })),
    }));

    return NextResponse.json({
      ok: true,
      orders: formattedOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("TMA Orders List API Error:", error);
    return NextResponse.json(
      { ok: false, error: "ORDERS_ERROR", message: "خطا در دریافت لیست سفارش‌ها." },
      { status: 500 }
    );
  }
}

