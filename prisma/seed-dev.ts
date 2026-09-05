/**
 * DEV-ONLY seed for local E2E testing (prisma/seed-dev.ts).
 * Creates the admin user, a demo customer, catalog (brands/categories/
 * products/variants) and a few demo orders — all upsert-based, safe to re-run.
 * Usage: ts-node --transpile-only --compiler-options {"module":"CommonJS","moduleResolution":"node"} prisma/seed-dev.ts
 */
import { PrismaClient, Role, StockType, OrderStatus, PaymentStatus, CouponType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash("Admin@12345", 10);
  const userHash = await bcrypt.hash("Password@123", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: { passwordHash: adminHash, role: Role.ADMIN, isActive: true },
    create: {
      username: "admin",
      email: "admin@mixin-shop.example",
      passwordHash: adminHash,
      role: Role.ADMIN,
      firstName: "Platform",
      lastName: "Admin",
      phoneNumber: "+989120000001",
      phoneVerified: true,
      isActive: true,
    },
  });

  const customer = await prisma.user.upsert({
    where: { username: "reza" },
    update: { passwordHash: userHash, isActive: true },
    create: {
      username: "reza",
      email: "reza@example.com",
      passwordHash: userHash,
      role: Role.RETAIL,
      firstName: "رضا",
      lastName: "محمدی",
      phoneNumber: "+989120000002",
      phoneVerified: true,
      isActive: true,
    },
  });

  const brands = await Promise.all(
    [
      { name: "Apple", slug: "apple" },
      { name: "Samsung", slug: "samsung" },
      { name: "Xiaomi", slug: "xiaomi" },
    ].map((b) => prisma.brand.upsert({ where: { slug: b.slug }, update: {}, create: b })),
  );

  const cat = await prisma.category.upsert({
    where: { slug: "mobile" },
    update: {},
    create: { name: "موبایل", slug: "mobile", level: 0, order: 1 },
  });

  const productsData = [
    { name: "iPhone 15 Pro", slug: "iphone-15-pro", brand: 0, price: 65_000_000, stock: 12, variant: ["256GB"] },
    { name: "Galaxy S24 Ultra", slug: "galaxy-s24-ultra", brand: 1, price: 58_000_000, stock: 8, variant: ["512GB"] },
    { name: "Redmi Note 13", slug: "redmi-note-13", brand: 2, price: 12_500_000, stock: 30, variant: ["128GB", "256GB"] },
  ];

  const products = [];
  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: { price: p.price, stockType: StockType.LIMITED, stock: p.stock, mainCategoryId: cat.id, brandId: brands[p.brand].id },
      create: {
        name: p.name,
        slug: p.slug,
        price: p.price,
        available: true,
        stockType: StockType.LIMITED,
        stock: p.stock,
        hasVariants: true,
        mainCategoryId: cat.id,
        brandId: brands[p.brand].id,
        variants: {
          create: p.variant.map((storage, i) => ({
            color: "black",
            storage,
            price: p.price + i * 5_000_000,
            stock: p.stock,
            stockType: StockType.LIMITED,
            isDefault: i === 0,
          })),
        },
      },
      include: { variants: true },
    });
    products.push(product);
  }

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: { name: "خوش‌آمدگویی", code: "WELCOME10", type: CouponType.PERCENT_BASED, amount: 10, isActive: true },
  });

  // Demo orders across statuses (upsert on orderNumber keeps this re-runnable).
  const orderSpecs = [
    { number: "DEV-1001", status: OrderStatus.PENDING, pay: PaymentStatus.INITIATED, p: 0, qty: 1 },
    { number: "DEV-1002", status: OrderStatus.PROCESSING, pay: PaymentStatus.COMPLETED, p: 1, qty: 1 },
    { number: "DEV-1003", status: OrderStatus.COMPLETED, pay: PaymentStatus.COMPLETED, p: 2, qty: 2 },
  ];

  for (const o of orderSpecs) {
    const product = products[o.p];
    const variant = product.variants[0];
    const price = Number(variant.price);
    const subtotal = price * o.qty;
    const tax = Math.round(subtotal * 0.09);
    await prisma.order.upsert({
      where: { orderNumber: o.number },
      update: { status: o.status, paymentStatus: o.pay },
      create: {
        orderNumber: o.number,
        userId: customer.id,
        status: o.status,
        paymentStatus: o.pay,
        paymentMethod: "online",
        firstName: "رضا",
        lastName: "محمدی",
        phone: "+989120000002",
        city: "تهران",
        addressText: "خیابان ولیعصر، پلاک ۱۲",
        postalCode: "1234567890",
        shippingMethodName: "پست پیشتاز",
        shippingPrice: 60_000,
        subtotal,
        taxAmount: tax,
        totalAmount: subtotal + tax + 60_000,
        items: {
          create: {
            productId: product.id,
            variantId: variant.id,
            productName: product.name,
            variantName: `${variant.color} / ${variant.storage}`,
            quantity: o.qty,
            price,
            lineTotal: subtotal,
          },
        },
      },
    });
  }

  console.log("✅ dev seed done:", {
    admin: admin.username,
    customer: customer.username,
    brands: brands.length,
    products: products.length,
    orders: orderSpecs.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
