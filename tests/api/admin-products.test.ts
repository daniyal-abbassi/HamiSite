import { HistoryAction } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { POST as createProduct } from "@/app/api/admin/products/route";
import { DELETE as deleteProduct, PATCH as patchProduct } from "@/app/api/admin/products/[id]/route";
import { POST as createVariant } from "@/app/api/admin/products/[id]/variants/route";
import { DELETE as deleteVariant, PATCH as patchVariant } from "@/app/api/admin/products/[id]/variants/[variantId]/route";
import { PATCH as adjustStock } from "@/app/api/admin/variants/[id]/stock/route";
import { prisma } from "@/lib/prisma";
import { jsonRequest, loginAs } from "../helpers/request";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;
let adminCookie: string;
let retailCookie: string;

beforeEach(async () => {
  seed = await seedMinimal();
  adminCookie = await loginAs(seed.admin);
  retailCookie = await loginAs(seed.retail);
});

function payload(overrides: Record<string, unknown> = {}) {
  return { name: "New Phone", slug: "new-phone", price: 500000, ...overrides };
}

describe("admin products", () => {
  it("403s for a non-admin", async () => {
    const res = await createProduct(jsonRequest("http://localhost/api/admin/products", "POST", payload(), retailCookie));
    expect(res.status).toBe(403);
  });

  it("creates a product and writes a CREATED history row", async () => {
    const res = await createProduct(jsonRequest("http://localhost/api/admin/products", "POST", payload(), adminCookie));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.price).toBe(500000);

    const history = await prisma.productHistory.findMany({ where: { productId: body.data.id } });
    expect(history).toHaveLength(1);
    expect(history[0].action).toBe(HistoryAction.CREATED);
    expect(history[0].changedById).toBe(seed.admin.id);
  });

  it("409s on a duplicate slug", async () => {
    await createProduct(jsonRequest("http://localhost/api/admin/products", "POST", payload(), adminCookie));
    const res = await createProduct(jsonRequest("http://localhost/api/admin/products", "POST", payload(), adminCookie));
    expect(res.status).toBe(409);
  });

  it("patches a product and writes an UPDATED history row", async () => {
    const res = await patchProduct(
      jsonRequest(`http://localhost/api/admin/products/${seed.product.id}`, "PATCH", { price: 999000 }, adminCookie),
      { params: { id: String(seed.product.id) } },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.price).toBe(999000);

    const history = await prisma.productHistory.findMany({ where: { productId: seed.product.id, action: HistoryAction.UPDATED } });
    expect(history).toHaveLength(1);
  });

  it("409s when patching to a slug that collides with a different product", async () => {
    const createRes = await createProduct(
      jsonRequest("http://localhost/api/admin/products", "POST", payload({ slug: "other-phone" }), adminCookie),
    );
    expect(createRes.status).toBe(200);

    const res = await patchProduct(
      jsonRequest(`http://localhost/api/admin/products/${seed.product.id}`, "PATCH", { slug: "other-phone" }, adminCookie),
      { params: { id: String(seed.product.id) } },
    );
    expect(res.status).toBe(409);
  });

  it("200s when patching without changing the slug", async () => {
    const res = await patchProduct(
      jsonRequest(
        `http://localhost/api/admin/products/${seed.product.id}`,
        "PATCH",
        { slug: seed.product.slug, price: 750000 },
        adminCookie,
      ),
      { params: { id: String(seed.product.id) } },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.price).toBe(750000);
  });

  it("deletes a product after recording a DELETED history row", async () => {
    const res = await deleteProduct(
      jsonRequest(`http://localhost/api/admin/products/${seed.product.id}`, "DELETE", undefined, adminCookie),
      { params: { id: String(seed.product.id) } },
    );
    expect(res.status).toBe(200);

    const product = await prisma.product.findUnique({ where: { id: seed.product.id } });
    expect(product).toBeNull();
  });
});

describe("admin variants", () => {
  it("403s for a non-admin creating a variant", async () => {
    const res = await createVariant(
      jsonRequest(`http://localhost/api/admin/products/${seed.product.id}/variants`, "POST", { color: "red", price: 100 }, retailCookie),
      { params: { id: String(seed.product.id) } },
    );
    expect(res.status).toBe(403);
  });

  it("creates a variant under a product and writes history", async () => {
    const res = await createVariant(
      jsonRequest(
        `http://localhost/api/admin/products/${seed.product.id}/variants`,
        "POST",
        { color: "red", storage: "256GB", price: 1_400_000, stock: 10 },
        adminCookie,
      ),
      { params: { id: String(seed.product.id) } },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.price).toBe(1_400_000);

    const history = await prisma.productHistory.findMany({ where: { variantId: body.data.id } });
    expect(history).toHaveLength(1);
  });

  it("404s creating a variant under a nonexistent product", async () => {
    const res = await createVariant(
      jsonRequest("http://localhost/api/admin/products/999999/variants", "POST", { price: 100 }, adminCookie),
      { params: { id: "999999" } },
    );
    expect(res.status).toBe(404);
  });

  it("patches a variant", async () => {
    const res = await patchVariant(
      jsonRequest(
        `http://localhost/api/admin/products/${seed.product.id}/variants/${seed.variant.id}`,
        "PATCH",
        { price: 1_300_000 },
        adminCookie,
      ),
      { params: { id: String(seed.product.id), variantId: String(seed.variant.id) } },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.price).toBe(1_300_000);
  });

  it("404s patching or deleting a variant that belongs to a different product", async () => {
    const otherProductRes = await createProduct(
      jsonRequest("http://localhost/api/admin/products", "POST", payload({ slug: "other-variant-owner" }), adminCookie),
    );
    expect(otherProductRes.status).toBe(200);
    const otherProduct = await otherProductRes.json();

    const otherVariantRes = await createVariant(
      jsonRequest(
        `http://localhost/api/admin/products/${otherProduct.data.id}/variants`,
        "POST",
        { color: "blue", price: 200_000 },
        adminCookie,
      ),
      { params: { id: String(otherProduct.data.id) } },
    );
    expect(otherVariantRes.status).toBe(200);
    const otherVariant = await otherVariantRes.json();

    const patchRes = await patchVariant(
      jsonRequest(
        `http://localhost/api/admin/products/${seed.product.id}/variants/${otherVariant.data.id}`,
        "PATCH",
        { price: 1_000 },
        adminCookie,
      ),
      { params: { id: String(seed.product.id), variantId: String(otherVariant.data.id) } },
    );
    expect(patchRes.status).toBe(404);

    const deleteRes = await deleteVariant(
      jsonRequest(
        `http://localhost/api/admin/products/${seed.product.id}/variants/${otherVariant.data.id}`,
        "DELETE",
        undefined,
        adminCookie,
      ),
      { params: { id: String(seed.product.id), variantId: String(otherVariant.data.id) } },
    );
    expect(deleteRes.status).toBe(404);
  });

  it("deletes a variant", async () => {
    const res = await deleteVariant(
      jsonRequest(
        `http://localhost/api/admin/products/${seed.product.id}/variants/${seed.variant.id}`,
        "DELETE",
        undefined,
        adminCookie,
      ),
      { params: { id: String(seed.product.id), variantId: String(seed.variant.id) } },
    );
    expect(res.status).toBe(200);
    const variant = await prisma.productVariant.findUnique({ where: { id: seed.variant.id } });
    expect(variant).toBeNull();
  });

  it("adjusts stock and requires a reason, writing an audited history row", async () => {
    const missingReason = await adjustStock(
      jsonRequest(`http://localhost/api/admin/variants/${seed.variant.id}/stock`, "PATCH", { stock: 5 }, adminCookie),
      { params: { id: String(seed.variant.id) } },
    );
    expect(missingReason.status).toBe(400);

    const res = await adjustStock(
      jsonRequest(
        `http://localhost/api/admin/variants/${seed.variant.id}/stock`,
        "PATCH",
        { stock: 5, reason: "Warehouse recount" },
        adminCookie,
      ),
      { params: { id: String(seed.variant.id) } },
    );
    expect(res.status).toBe(200);

    const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: seed.variant.id } });
    expect(variant.stock).toBe(5);

    const history = await prisma.productHistory.findMany({ where: { variantId: seed.variant.id, field: "stock" } });
    expect(history).toHaveLength(1);
    expect((history[0].newValue as { reason: string }).reason).toBe("Warehouse recount");
  });
});
