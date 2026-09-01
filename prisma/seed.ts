/**
 * Seed script for the Mixin B2C + B2B (mobile phone distribution) platform.
 *
 * Populates:
 *  - Default ADMIN user, a test WHOLESALE partner, a distribution AGENT and a
 *    RETAIL customer.
 *  - 3 demo brands (Apple, Samsung, Xiaomi) and a small demo category tree,
 *    used only as sample data with slugs that don't collide with the legacy
 *    import below.
 *  - A few sample coupons referencing the demo brands.
 *  - The real legacy catalog/customer/order data imported from the legacy
 *    shop API (`hamihamrah-shop.com`) via `prisma/legacy-import/*`: real
 *    categories, brands, products + variants + images, customers and
 *    orders + payments.
 *
 * Re-run safety: top-level records (Category, Brand, Product, User, Order)
 * are all `upsert`ed on a unique key, so re-running never duplicates those.
 * However, each imported product's images/variants and each imported
 * order's items are hard-deleted and recreated with new ids on every run —
 * this is NOT non-destructive. Because ProductVariant cascade-deletes
 * PriceTier, CartItem, and ProductHistory rows (see `prisma/schema.prisma`
 * and the warning logged in `prisma/legacy-import/products.ts`), re-running
 * `npm run db:seed` also deletes any B2B pricing tiers, live cart items, and
 * audit history attached to previously-imported variants. Re-create that
 * data after re-running the import if you rely on it.
 */

import { PrismaClient, Role, CouponType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createLegacyClient, loadLegacyClientConfig, mapWithConcurrency } from "./legacy-import/client";
import { importCategories } from "./legacy-import/categories";
import { importBrands } from "./legacy-import/brands";
import { importProduct } from "./legacy-import/products";
import { importCustomers } from "./legacy-import/customers";
import { importOrders } from "./legacy-import/orders";
import type { LegacyCategory, LegacyBrand, LegacyProductDetail, LegacyCustomer, LegacyOrder, LegacyOrderPayment } from "./legacy-import/types";

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

async function main() {
  console.log("Seeding users...");
  const { admin, wholesale, retail } = await seedUsers();

  console.log("Seeding demo brands...");
  const brands = await seedBrands();

  console.log("Seeding demo categories...");
  await seedCategories();

  console.log("Seeding coupons...");
  await seedCoupons(brands);

  console.log("\nImporting real catalog/customer/order data from the legacy shop...");
  let legacyConfig: ReturnType<typeof loadLegacyClientConfig> | null = null;
  try {
    legacyConfig = loadLegacyClientConfig();
  } catch (err) {
    console.warn("  Skipping legacy data import: could not load legacy API credentials.");
    console.warn(
      '  Expected a gitignored file at the repo root named "actuall_old_webSite_api_token.txt" with the format:\n' +
        "    API_TOKEN=<token>\n" +
        "    WEBSITE_URL=<https://...>"
    );
    console.warn(`  (${err instanceof Error ? err.message : String(err)})`);
  }

  if (legacyConfig) {
    const client = createLegacyClient(legacyConfig);

    console.log("  categories...");
    const legacyCategories = await client.fetchAllPages<LegacyCategory>("/categories/");
    const categoryIdMap = await importCategories(prisma, legacyCategories);
    console.log(`  ${legacyCategories.length} categories imported.`);

    console.log("  brands...");
    const legacyBrands = await client.fetchAllPages<LegacyBrand>("/brands/");
    const brandIdMap = await importBrands(prisma, legacyBrands);
    console.log(`  ${legacyBrands.length} brands imported.`);

    console.log("  products (this fetches one detail call per product, ~5 at a time)...");
    const legacyProductIds = (await client.fetchAllPages<{ id: number }>("/products/")).map((p) => p.id);
    const productIdMap = new Map<number, number>();
    const variantIdMap = new Map<number, number>();
    await mapWithConcurrency(legacyProductIds, 5, async (id) => {
      const detail = await client.fetchJson<{ data: LegacyProductDetail }>(`/products/${id}/`);
      const { productId, variantIdMap: productVariantIdMap } = await importProduct(prisma, detail.data, categoryIdMap, brandIdMap);
      productIdMap.set(id, productId);
      for (const [legacyVariantId, ourVariantId] of productVariantIdMap) {
        variantIdMap.set(legacyVariantId, ourVariantId);
      }
    });
    console.log(`  ${legacyProductIds.length} products imported.`);

    console.log("  customers...");
    const legacyCustomers = await client.fetchAllPages<LegacyCustomer>("/customers/");
    const userIdMap = await importCustomers(prisma, legacyCustomers);
    console.log(`  ${legacyCustomers.length} customers imported.`);

    console.log("  orders and payments...");
    const legacyOrders = await client.fetchAllPages<LegacyOrder>("/orders/");
    const legacyPayments = await client.fetchAllPages<LegacyOrderPayment>("/order-payments/");
    await importOrders(prisma, legacyOrders, legacyPayments, userIdMap, productIdMap, variantIdMap);
    console.log(`  ${legacyOrders.length} orders and ${legacyPayments.length} payments imported.`);
  } else {
    console.log("  (legacy import phase skipped)");
  }

  console.log("\nSeed complete.");
  console.log("---------------------------------------------------------");
  console.log(`Admin login:      username=admin           password=Admin@12345`);
  console.log(`Agent login:      username=agent.tehran     password=Agent@12345`);
  console.log(`Wholesale login:  username=${wholesale.username}  password=Wholesale@12345`);
  console.log(`Retail login:     username=retail.john_doe  password=Retail@12345`);
  console.log(`Imported customers: any legacy phone number, password=Imported@12345`);
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
