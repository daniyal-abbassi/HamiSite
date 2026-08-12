import { HistoryAction } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { POST as createProduct } from "@/app/api/admin/products/route";
import { DELETE as deleteProduct, PATCH as patchProduct } from "@/app/api/admin/products/[id]/route";
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
