import { CouponType, Role, StockType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function seedMinimal() {
  const password = "Password@123";
  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.create({
    data: {
      username: "test.admin",
      phoneNumber: "+989120000101",
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const retail = await prisma.user.create({
    data: {
      username: "test.retail",
      phoneNumber: "+989120000102",
      passwordHash,
      role: Role.RETAIL,
      isActive: true,
    },
  });

  const wholesale = await prisma.user.create({
    data: {
      username: "test.wholesale",
      phoneNumber: "+989120000103",
      passwordHash,
      role: Role.WHOLESALE,
      isActive: true,
      creditLimit: 100_000_000,
    },
  });

  const product = await prisma.product.create({
    data: {
      name: "Test Phone",
      slug: "test-phone",
      price: 1_000_000,
      available: true,
      stockType: StockType.LIMITED,
      stock: 50,
      hasVariants: true,
    },
  });

  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      color: "black",
      storage: "128GB",
      price: 1_200_000,
      stock: 20,
      stockType: StockType.LIMITED,
      isDefault: true,
    },
  });

  const coupon = await prisma.coupon.create({
    data: {
      name: "Test Coupon",
      code: "TEST10",
      type: CouponType.PERCENT_BASED,
      amount: 10,
      isActive: true,
    },
  });

  return {
    admin: { id: admin.id, username: admin.username, password },
    retail: { id: retail.id, username: retail.username, password },
    wholesale: { id: wholesale.id, username: wholesale.username, password, creditLimit: 100_000_000 },
    product: { id: product.id, slug: product.slug, price: 1_000_000 },
    variant: { id: variant.id, price: 1_200_000, stock: 20 },
    coupon: { id: coupon.id, code: coupon.code },
  };
}

export type SeedResult = Awaited<ReturnType<typeof seedMinimal>>;
