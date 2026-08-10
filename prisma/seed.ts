/**
 * Seed script for the Mixin B2C + B2B (mobile phone distribution) platform.
 *
 * Populates:
 *  - Default ADMIN user, a test WHOLESALE partner, a distribution AGENT and a
 *    RETAIL customer.
 *  - Top brands (Apple, Samsung, Xiaomi) and a hierarchical category tree.
 *  - Products with variants (iPhone 17 Pro, Galaxy S26 Ultra, Xiaomi 15 Ultra),
 *    each with realistic stock types, guarantees and IMEI-style identifiers.
 *  - Active B2B PriceTier brackets (1-9 / 10-49 / 50+ units) for CASH and
 *    CREDIT_60_DAYS payment terms.
 *  - A sample coupon, a sample order + order items + payment, and a
 *    ProductHistory audit entry to demonstrate the revert-capable log.
 *
 * Safe to re-run: every record is created with `upsert` keyed on a unique
 * field, so `npm run db:seed` never duplicates data.
 */

import { PrismaClient, Role, StockType, B2BPaymentTerm, OrderStatus, PaymentStatus, CouponType, HistoryAction } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function seedUsers() {
  const adminPasswordHash = await hash("Admin@12345");
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@mixin-shop.example",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      firstName: "Platform",
      lastName: "Admin",
      phoneNumber: "+989120000001",
      phoneVerified: true,
      businessVerified: true,
      isActive: true,
    },
  });

  const agentPasswordHash = await hash("Agent@12345");
  const agent = await prisma.user.upsert({
    where: { username: "agent.tehran" },
    update: {},
    create: {
      username: "agent.tehran",
      email: "agent.tehran@mixin-shop.example",
      passwordHash: agentPasswordHash,
      role: Role.AGENT,
      firstName: "Reza",
      lastName: "Karimi",
      phoneNumber: "+989120000002",
      phoneVerified: true,
      city: "Tehran",
      businessVerified: true,
      isActive: true,
    },
  });

  const wholesalePasswordHash = await hash("Wholesale@12345");
  const wholesale = await prisma.user.upsert({
    where: { username: "wholesale.digikala_mobile" },
    update: {},
    create: {
      username: "wholesale.digikala_mobile",
      email: "purchasing@digikala-mobile.example",
      passwordHash: wholesalePasswordHash,
      role: Role.WHOLESALE,
      firstName: "Sara",
      lastName: "Ahmadi",
      phoneNumber: "+989120000003",
      phoneVerified: true,
      city: "Tehran",
      shopName: "Digikala Mobile Distribution Co.",
      businessLicenseNumber: "IR-BIZ-4471829",
      businessVerified: true,
      businessVerifiedAt: new Date(),
      creditLimit: 5_000_000_000, // 5,000,000,000 Toman credit ceiling
      creditUsed: 0,
      agentId: agent.id,
      isActive: true,
    },
  });

  const retailPasswordHash = await hash("Retail@12345");
  const retail = await prisma.user.upsert({
    where: { username: "retail.john_doe" },
    update: {},
    create: {
      username: "retail.john_doe",
      email: "john.doe@example.com",
      passwordHash: retailPasswordHash,
      role: Role.RETAIL,
      firstName: "John",
      lastName: "Doe",
      phoneNumber: "+989120000004",
      phoneVerified: true,
      city: "Isfahan",
      receiveNewsletters: true,
      isActive: true,
    },
  });

  const existingAddress = await prisma.address.findFirst({ where: { userId: retail.id, isDefault: true } });
  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userId: retail.id,
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "+989120000004",
        province: "Isfahan",
        city: "Isfahan",
        address: "Chahar Bagh Ave, No. 12, Unit 3",
        postalCode: "8134567890",
        isDefault: true,
      },
    });
  }

  return { admin, agent, wholesale, retail };
}

async function seedBrands() {
  const brandData = [
    { name: "Apple", slug: "apple", seoTitle: "Apple Smartphones & Accessories" },
    { name: "Samsung", slug: "samsung", seoTitle: "Samsung Galaxy Smartphones & Accessories" },
    { name: "Xiaomi", slug: "xiaomi", seoTitle: "Xiaomi Smartphones & Accessories" },
  ];

  const brands: Record<string, Awaited<ReturnType<typeof prisma.brand.upsert>>> = {};
  for (const b of brandData) {
    brands[b.slug] = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: {
        name: b.name,
        slug: b.slug,
        seoTitle: b.seoTitle,
        seoDescription: `Buy genuine ${b.name} mobile phones at retail and wholesale prices.`,
        isActive: true,
      },
    });
  }
  return brands;
}

async function seedCategories() {
  const mobilePhones = await prisma.category.upsert({
    where: { slug: "mobile-phones" },
    update: {},
    create: {
      name: "Mobile Phones",
      slug: "mobile-phones",
      description: "Smartphones for retail and wholesale distribution.",
      available: true,
      categoriesMenuShow: true,
      topMenuSeparateShow: true,
      level: 0,
      order: 1,
    },
  });

  const smartphones = await prisma.category.upsert({
    where: { slug: "smartphones" },
    update: {},
    create: {
      name: "Smartphones",
      slug: "smartphones",
      description: "Flagship and mid-range smartphones.",
      parentId: mobilePhones.id,
      available: true,
      categoriesMenuShow: true,
      level: 1,
      order: 1,
    },
  });

  const accessories = await prisma.category.upsert({
    where: { slug: "mobile-accessories" },
    update: {},
    create: {
      name: "Mobile Accessories",
      slug: "mobile-accessories",
      description: "Cases, chargers and other mobile accessories.",
      parentId: mobilePhones.id,
      available: true,
      categoriesMenuShow: true,
      level: 1,
      order: 2,
    },
  });

  return { mobilePhones, smartphones, accessories };
}

type PriceTierSpec = {
  minQuantity: number;
  maxQuantity: number | null;
  paymentMethod: B2BPaymentTerm;
  discountPercent: number;
  calculatedPrice: number;
};

function buildTiersForBasePrice(basePrice: number): PriceTierSpec[] {
  const brackets: Omit<PriceTierSpec, "calculatedPrice">[] = [
    { minQuantity: 1, maxQuantity: 9, paymentMethod: B2BPaymentTerm.CASH, discountPercent: 0 },
    { minQuantity: 1, maxQuantity: 9, paymentMethod: B2BPaymentTerm.CREDIT_60_DAYS, discountPercent: -1.5 }, // credit surcharge
    { minQuantity: 10, maxQuantity: 49, paymentMethod: B2BPaymentTerm.CASH, discountPercent: 3 },
    { minQuantity: 10, maxQuantity: 49, paymentMethod: B2BPaymentTerm.CREDIT_60_DAYS, discountPercent: 1.5 },
    { minQuantity: 50, maxQuantity: null, paymentMethod: B2BPaymentTerm.CASH, discountPercent: 6 },
    { minQuantity: 50, maxQuantity: null, paymentMethod: B2BPaymentTerm.CREDIT_60_DAYS, discountPercent: 4 },
  ];

  return brackets.map((tier) => ({
    ...tier,
    calculatedPrice: Math.round(basePrice * (1 - tier.discountPercent / 100)),
  }));
}

async function upsertVariantPriceTiers(variantId: number, basePrice: number) {
  const tiers = buildTiersForBasePrice(basePrice);

  for (const tier of tiers) {
    const existing = await prisma.priceTier.findFirst({
      where: {
        variantId,
        minQuantity: tier.minQuantity,
        maxQuantity: tier.maxQuantity,
        paymentMethod: tier.paymentMethod,
      },
    });

    if (existing) {
      await prisma.priceTier.update({
        where: { id: existing.id },
        data: {
          discountPercent: tier.discountPercent,
          calculatedPrice: tier.calculatedPrice,
          isActive: true,
        },
      });
    } else {
      await prisma.priceTier.create({
        data: {
          variantId,
          minQuantity: tier.minQuantity,
          maxQuantity: tier.maxQuantity,
          paymentMethod: tier.paymentMethod,
          discountPercent: tier.discountPercent,
          calculatedPrice: tier.calculatedPrice,
          isActive: true,
        },
      });
    }
  }
}

async function seedProducts(brands: Record<string, { id: number }>, categories: { smartphones: { id: number } }) {
  // ---------------------------------------------------------------------
  // iPhone 17 Pro (Apple)
  // ---------------------------------------------------------------------
  const iphone = await prisma.product.upsert({
    where: { slug: "iphone-17-pro" },
    update: {},
    create: {
      name: "آیفون 17 پرو",
      englishName: "iPhone 17 Pro",
      slug: "iphone-17-pro",
      description: "Apple iPhone 17 Pro with A19 Pro chip, titanium frame and pro camera system.",
      mainCategoryId: categories.smartphones.id,
      brandId: brands.apple.id,
      isDigital: false,
      price: 95_000_000,
      compareAtPrice: 102_000_000,
      specialOffer: true,
      specialOfferEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      hasVariants: true,
      available: true,
      showPrice: true,
      stock: 0, // authoritative stock lives on variants once hasVariants = true
      stockType: StockType.LIMITED,
      guarantee: "18 Months Official Warranty",
      seoTitle: "Buy iPhone 17 Pro - Retail & Wholesale Prices",
      seoDescription: "iPhone 17 Pro available for retail purchase and bulk wholesale distribution.",
      tags: {
        create: [{ value: "flagship" }, { value: "5g" }, { value: "ios" }],
      },
    },
  });

  const iphoneVariantSpecs = [
    { color: "Titanium Black", storage: "256GB", price: 95_000_000, stock: 40, identifierPrefix: "IMEI-IP17P-BLK-256" },
    { color: "Titanium Black", storage: "512GB", price: 108_000_000, stock: 25, identifierPrefix: "IMEI-IP17P-BLK-512" },
    { color: "Desert Titanium", storage: "256GB", price: 96_500_000, stock: 30, identifierPrefix: "IMEI-IP17P-DST-256" },
  ];

  const iphoneVariants = [];
  for (const [idx, spec] of iphoneVariantSpecs.entries()) {
    const variant = await prisma.productVariant.upsert({
      where: { productIdentifier: `${spec.identifierPrefix}-0001` },
      update: {},
      create: {
        productId: iphone.id,
        color: spec.color,
        storage: spec.storage,
        guarantee: "18 Months Official Warranty",
        price: spec.price,
        compareAtPrice: Math.round(spec.price * 1.07),
        stock: spec.stock,
        stockType: spec.stock > 0 ? StockType.LIMITED : StockType.OUT_OF_STOCK,
        barcode: `6941234${567800 + idx}`,
        productIdentifier: `${spec.identifierPrefix}-0001`,
        isDefault: idx === 0,
      },
    });
    iphoneVariants.push(variant);
    await upsertVariantPriceTiers(variant.id, spec.price);
  }

  // ---------------------------------------------------------------------
  // Samsung Galaxy S26 Ultra
  // ---------------------------------------------------------------------
  const galaxy = await prisma.product.upsert({
    where: { slug: "galaxy-s26-ultra" },
    update: {},
    create: {
      name: "سامسونگ گلکسی S26 اولترا",
      englishName: "Samsung Galaxy S26 Ultra",
      slug: "galaxy-s26-ultra",
      description: "Samsung Galaxy S26 Ultra with Snapdragon flagship chip, S-Pen and 200MP camera.",
      mainCategoryId: categories.smartphones.id,
      brandId: brands.samsung.id,
      isDigital: false,
      price: 88_000_000,
      compareAtPrice: 94_000_000,
      specialOffer: false,
      hasVariants: true,
      available: true,
      showPrice: true,
      stock: 0,
      stockType: StockType.LIMITED,
      guarantee: "24 Months Official Warranty",
      seoTitle: "Buy Samsung Galaxy S26 Ultra - Retail & Wholesale",
      seoDescription: "Samsung Galaxy S26 Ultra available for retail purchase and bulk wholesale distribution.",
      tags: {
        create: [{ value: "flagship" }, { value: "5g" }, { value: "android" }, { value: "s-pen" }],
      },
    },
  });

  const galaxyVariantSpecs = [
    { color: "Titanium Gray", storage: "256GB", price: 88_000_000, stock: 60, identifierPrefix: "IMEI-S26U-GRY-256" },
    { color: "Titanium Gray", storage: "512GB", price: 97_000_000, stock: 35, identifierPrefix: "IMEI-S26U-GRY-512" },
    { color: "Titanium Violet", storage: "256GB", price: 89_500_000, stock: 0, identifierPrefix: "IMEI-S26U-VLT-256" },
  ];

  const galaxyVariants = [];
  for (const [idx, spec] of galaxyVariantSpecs.entries()) {
    const variant = await prisma.productVariant.upsert({
      where: { productIdentifier: `${spec.identifierPrefix}-0001` },
      update: {},
      create: {
        productId: galaxy.id,
        color: spec.color,
        storage: spec.storage,
        guarantee: "24 Months Official Warranty",
        price: spec.price,
        compareAtPrice: Math.round(spec.price * 1.06),
        stock: spec.stock,
        stockType: spec.stock > 0 ? StockType.LIMITED : StockType.CALL,
        barcode: `8801234${567800 + idx}`,
        productIdentifier: `${spec.identifierPrefix}-0001`,
        isDefault: idx === 0,
      },
    });
    galaxyVariants.push(variant);
    await upsertVariantPriceTiers(variant.id, spec.price);
  }

  // ---------------------------------------------------------------------
  // Xiaomi 15 Ultra
  // ---------------------------------------------------------------------
  const xiaomi = await prisma.product.upsert({
    where: { slug: "xiaomi-15-ultra" },
    update: {},
    create: {
      name: "شیائومی 15 اولترا",
      englishName: "Xiaomi 15 Ultra",
      slug: "xiaomi-15-ultra",
      description: "Xiaomi 15 Ultra with Leica optics and flagship performance at a competitive price.",
      mainCategoryId: categories.smartphones.id,
      brandId: brands.xiaomi.id,
      isDigital: false,
      price: 52_000_000,
      compareAtPrice: 56_000_000,
      specialOffer: true,
      specialOfferEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      hasVariants: true,
      available: true,
      showPrice: true,
      stock: 0,
      stockType: StockType.UNLIMITED,
      guarantee: "18 Months Official Warranty",
      seoTitle: "Buy Xiaomi 15 Ultra - Retail & Wholesale",
      seoDescription: "Xiaomi 15 Ultra available for retail purchase and bulk wholesale distribution.",
      tags: {
        create: [{ value: "flagship" }, { value: "5g" }, { value: "android" }, { value: "leica" }],
      },
    },
  });

  const xiaomiVariantSpecs = [
    { color: "Black", storage: "256GB", price: 52_000_000, stock: 100, identifierPrefix: "IMEI-XM15U-BLK-256" },
    { color: "White", storage: "512GB", price: 58_000_000, stock: 70, identifierPrefix: "IMEI-XM15U-WHT-512" },
  ];

  const xiaomiVariants = [];
  for (const [idx, spec] of xiaomiVariantSpecs.entries()) {
    const variant = await prisma.productVariant.upsert({
      where: { productIdentifier: `${spec.identifierPrefix}-0001` },
      update: {},
      create: {
        productId: xiaomi.id,
        color: spec.color,
        storage: spec.storage,
        guarantee: "18 Months Official Warranty",
        price: spec.price,
        compareAtPrice: Math.round(spec.price * 1.08),
        stock: spec.stock,
        stockType: StockType.UNLIMITED,
        barcode: `6934567${100 + idx}`,
        productIdentifier: `${spec.identifierPrefix}-0001`,
        isDefault: idx === 0,
      },
    });
    xiaomiVariants.push(variant);
    await upsertVariantPriceTiers(variant.id, spec.price);
  }

  return { iphone, iphoneVariants, galaxy, galaxyVariants, xiaomi, xiaomiVariants };
}

async function seedCoupons(brands: Record<string, { id: number }>) {
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      name: "Welcome 10% Off",
      code: "WELCOME10",
      type: CouponType.PERCENT_BASED,
      amount: 10,
      usageLimitPerCoupon: 1000,
      usageLimitPerUser: 1,
      onlyFirstOrder: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      maxDiscountAmount: 5_000_000,
      minCartPrice: 10_000_000,
      isActive: true,
      brands: { connect: [{ id: brands.apple.id }, { id: brands.samsung.id }, { id: brands.xiaomi.id }] },
    },
  });

  await prisma.coupon.upsert({
    where: { code: "FREESHIP" },
    update: {},
    create: {
      name: "Free Shipping",
      code: "FREESHIP",
      type: CouponType.SHIPPING_PRICE,
      usageLimitPerUser: 3,
      minCartPrice: 5_000_000,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: "BULK500K" },
    update: {},
    create: {
      name: "Wholesale Flat 500,000 Toman Off",
      code: "BULK500K",
      type: CouponType.AMOUNT_BASED,
      amount: 500_000,
      usageLimitPerCoupon: 200,
      minCartPrice: 50_000_000,
      isActive: true,
    },
  });
}

async function seedSampleOrder(
  retailUserId: number,
  addressId: number | null,
  product: { id: number; englishName: string | null; name: string },
  variant: { id: number; color: string | null; storage: string | null; price: unknown }
) {
  const orderNumber = "ORD-100001";
  const existing = await prisma.order.findUnique({ where: { orderNumber } });
  if (existing) return existing;

  const unitPrice = Number(variant.price);
  const shippingPrice = 350_000;
  const subtotal = unitPrice * 1;
  const totalAmount = subtotal + shippingPrice;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: retailUserId,
      addressId: addressId ?? undefined,
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.COMPLETED,
      paymentMethod: "card",
      firstName: "John",
      lastName: "Doe",
      phone: "+989120000004",
      province: "Isfahan",
      city: "Isfahan",
      addressText: "Chahar Bagh Ave, No. 12, Unit 3",
      postalCode: "8134567890",
      shippingMethodName: "Express Courier",
      shippingPrice,
      trackingCode: "TRACK-IR-0001",
      subtotal,
      totalAmount,
      items: {
        create: [
          {
            productId: product.id,
            variantId: variant.id,
            productName: product.englishName ?? product.name,
            variantName: [variant.color, variant.storage].filter(Boolean).join(" / "),
            quantity: 1,
            price: unitPrice,
            lineTotal: unitPrice,
          },
        ],
      },
      payments: {
        create: [
          {
            userId: retailUserId,
            transactionNumber: "TXN-100001",
            amount: totalAmount,
            method: "card",
            methodDisplay: "Credit/Debit Card",
            psp: "zarinpal",
            pspDisplay: "ZarinPal",
            status: PaymentStatus.COMPLETED,
          },
        ],
      },
    },
  });

  return order;
}

async function seedProductHistory(productId: number, variantId: number, actorUserId: number) {
  const already = await prisma.productHistory.findFirst({ where: { productId, field: "price" } });
  if (already) return;

  await prisma.productHistory.create({
    data: {
      productId,
      variantId,
      action: HistoryAction.UPDATED,
      field: "price",
      oldValue: { price: 99_000_000 },
      newValue: { price: 95_000_000 },
      changedById: actorUserId,
    },
  });
}

async function main() {
  console.log("Seeding users...");
  const { admin, wholesale, retail } = await seedUsers();

  console.log("Seeding brands...");
  const brands = await seedBrands();

  console.log("Seeding categories...");
  const categories = await seedCategories();

  console.log("Seeding products, variants & price tiers...");
  const { iphone, iphoneVariants } = await seedProducts(brands, categories);

  console.log("Seeding coupons...");
  await seedCoupons(brands);

  console.log("Seeding sample order & payment...");
  const retailAddress = await prisma.address.findFirst({ where: { userId: retail.id, isDefault: true } });
  await seedSampleOrder(retail.id, retailAddress?.id ?? null, iphone, iphoneVariants[0]);

  console.log("Seeding product history sample...");
  await seedProductHistory(iphone.id, iphoneVariants[0].id, admin.id);

  console.log("\nSeed complete.");
  console.log("---------------------------------------------------------");
  console.log(`Admin login:      username=admin           password=Admin@12345`);
  console.log(`Agent login:      username=agent.tehran     password=Agent@12345`);
  console.log(`Wholesale login:  username=${wholesale.username}  password=Wholesale@12345`);
  console.log(`Retail login:     username=retail.john_doe  password=Retail@12345`);
  console.log("---------------------------------------------------------");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
