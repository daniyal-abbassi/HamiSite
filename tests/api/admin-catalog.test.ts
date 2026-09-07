import { beforeEach, describe, expect, it } from "vitest";
import { POST as createCategory } from "@/app/api/admin/categories/route";
import { DELETE as deleteCategory, PATCH as patchCategory } from "@/app/api/admin/categories/[id]/route";
import { POST as createBrand } from "@/app/api/admin/brands/route";
import { DELETE as deleteBrand, PATCH as patchBrand } from "@/app/api/admin/brands/[id]/route";
import { prisma } from "@/lib/prisma";
import { ctx, jsonRequest, loginAs } from "../helpers/request";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;
let adminCookie: string;
let retailCookie: string;

beforeEach(async () => {
  seed = await seedMinimal();
  adminCookie = await loginAs(seed.admin);
  retailCookie = await loginAs(seed.retail);
});

describe("admin categories", () => {
  it("403s for a non-admin", async () => {
    const res = await createCategory(
      jsonRequest("http://localhost/api/admin/categories", "POST", { name: "Phones", slug: "phones" }, retailCookie), ctx());
    expect(res.status).toBe(403);
  });

  it("creates a root category at level 0", async () => {
    const res = await createCategory(
      jsonRequest("http://localhost/api/admin/categories", "POST", { name: "Phones", slug: "phones" }, adminCookie), ctx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.level).toBe(0);
  });

  it("creates a child category one level below its parent", async () => {
    const parent = await (
      await createCategory(jsonRequest("http://localhost/api/admin/categories", "POST", { name: "Phones", slug: "phones" }, adminCookie), ctx())
    ).json();

    const res = await createCategory(
      jsonRequest(
        "http://localhost/api/admin/categories",
        "POST",
        { name: "Smartphones", slug: "smartphones", parentId: parent.data.id },
        adminCookie,
      ), ctx());
    const body = await res.json();
    expect(body.data.level).toBe(1);
  });

  it("400s when parentId references a nonexistent category", async () => {
    const res = await createCategory(
      jsonRequest(
        "http://localhost/api/admin/categories",
        "POST",
        { name: "Smartphones", slug: "smartphones", parentId: 999999 },
        adminCookie,
      ), ctx());
    expect(res.status).toBe(400);
    expect(await prisma.category.findUnique({ where: { slug: "smartphones" } })).toBeNull();
  });

  it("patches and deletes a category", async () => {
    const created = await (
      await createCategory(jsonRequest("http://localhost/api/admin/categories", "POST", { name: "Phones", slug: "phones" }, adminCookie), ctx())
    ).json();

    const patchRes = await patchCategory(
      jsonRequest(`http://localhost/api/admin/categories/${created.data.id}`, "PATCH", { name: "Mobile Phones" }, adminCookie),
      ctx({ id: String(created.data.id) }),
    );
    expect(patchRes.status).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.data.name).toBe("Mobile Phones");

    const deleteRes = await deleteCategory(
      jsonRequest(`http://localhost/api/admin/categories/${created.data.id}`, "DELETE", undefined, adminCookie),
      ctx({ id: String(created.data.id) }),
    );
    expect(deleteRes.status).toBe(200);
    expect(await prisma.category.findUnique({ where: { id: created.data.id } })).toBeNull();
  });

  it("400s when patching a category with an invalid parentId", async () => {
    const created = await (
      await createCategory(jsonRequest("http://localhost/api/admin/categories", "POST", { name: "Phones", slug: "phones" }, adminCookie), ctx())
    ).json();

    const res = await patchCategory(
      jsonRequest(`http://localhost/api/admin/categories/${created.data.id}`, "PATCH", { parentId: 999999 }, adminCookie),
      ctx({ id: String(created.data.id) }),
    );
    expect(res.status).toBe(400);
  });

  it("409s when patching a category to a colliding slug", async () => {
    await createCategory(jsonRequest("http://localhost/api/admin/categories", "POST", { name: "Phones", slug: "phones" }, adminCookie), ctx());
    const other = await (
      await createCategory(jsonRequest("http://localhost/api/admin/categories", "POST", { name: "Tablets", slug: "tablets" }, adminCookie), ctx())
    ).json();

    const res = await patchCategory(
      jsonRequest(`http://localhost/api/admin/categories/${other.data.id}`, "PATCH", { slug: "phones" }, adminCookie),
      ctx({ id: String(other.data.id) }),
    );
    expect(res.status).toBe(409);
  });

  it("updates level when patching a category's parentId to a valid new parent", async () => {
    const parent = await (
      await createCategory(jsonRequest("http://localhost/api/admin/categories", "POST", { name: "Phones", slug: "phones" }, adminCookie), ctx())
    ).json();
    const child = await (
      await createCategory(
        jsonRequest("http://localhost/api/admin/categories", "POST", { name: "Tablets", slug: "tablets" }, adminCookie), ctx())
    ).json();
    expect(child.data.level).toBe(0);

    const res = await patchCategory(
      jsonRequest(
        `http://localhost/api/admin/categories/${child.data.id}`,
        "PATCH",
        { parentId: parent.data.id },
        adminCookie,
      ),
      ctx({ id: String(child.data.id) }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.level).toBe(1);

    const refetched = await prisma.category.findUnique({ where: { id: child.data.id } });
    expect(refetched?.level).toBe(1);
    expect(refetched?.parentId).toBe(parent.data.id);
  });

  it("409s deleting a category that has child categories", async () => {
    const parent = await (
      await createCategory(jsonRequest("http://localhost/api/admin/categories", "POST", { name: "Phones", slug: "phones" }, adminCookie), ctx())
    ).json();
    await createCategory(
      jsonRequest(
        "http://localhost/api/admin/categories",
        "POST",
        { name: "Smartphones", slug: "smartphones", parentId: parent.data.id },
        adminCookie,
      ), ctx());

    const res = await deleteCategory(
      jsonRequest(`http://localhost/api/admin/categories/${parent.data.id}`, "DELETE", undefined, adminCookie),
      ctx({ id: String(parent.data.id) }),
    );
    expect(res.status).toBe(409);
    expect(await prisma.category.findUnique({ where: { id: parent.data.id } })).not.toBeNull();
  });

  it("403s a non-admin patching a category", async () => {
    const created = await (
      await createCategory(jsonRequest("http://localhost/api/admin/categories", "POST", { name: "Phones", slug: "phones" }, adminCookie), ctx())
    ).json();

    const res = await patchCategory(
      jsonRequest(`http://localhost/api/admin/categories/${created.data.id}`, "PATCH", { name: "Mobile Phones" }, retailCookie),
      ctx({ id: String(created.data.id) }),
    );
    expect(res.status).toBe(403);
  });
});

describe("admin brands", () => {
  it("403s for a non-admin", async () => {
    const res = await createBrand(
      jsonRequest("http://localhost/api/admin/brands", "POST", { name: "Nokia", slug: "nokia" }, retailCookie), ctx());
    expect(res.status).toBe(403);
  });

  it("creates, patches, and deletes a brand", async () => {
    const created = await (
      await createBrand(jsonRequest("http://localhost/api/admin/brands", "POST", { name: "Nokia", slug: "nokia" }, adminCookie), ctx())
    ).json();
    expect(created.data.name).toBe("Nokia");

    const patchRes = await patchBrand(
      jsonRequest(`http://localhost/api/admin/brands/${created.data.id}`, "PATCH", { isActive: false }, adminCookie),
      ctx({ id: String(created.data.id) }),
    );
    expect(patchRes.status).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.data.isActive).toBe(false);

    const deleteRes = await deleteBrand(
      jsonRequest(`http://localhost/api/admin/brands/${created.data.id}`, "DELETE", undefined, adminCookie),
      ctx({ id: String(created.data.id) }),
    );
    expect(deleteRes.status).toBe(200);
    expect(await prisma.brand.findUnique({ where: { id: created.data.id } })).toBeNull();
  });

  it("409s on a duplicate brand name", async () => {
    await createBrand(jsonRequest("http://localhost/api/admin/brands", "POST", { name: "Nokia", slug: "nokia" }, adminCookie), ctx());
    const res = await createBrand(
      jsonRequest("http://localhost/api/admin/brands", "POST", { name: "Nokia", slug: "nokia-2" }, adminCookie), ctx());
    expect(res.status).toBe(409);
  });

  it("409s on a duplicate brand slug", async () => {
    await createBrand(jsonRequest("http://localhost/api/admin/brands", "POST", { name: "Nokia", slug: "nokia" }, adminCookie), ctx());
    const res = await createBrand(
      jsonRequest("http://localhost/api/admin/brands", "POST", { name: "Nokia Mobile", slug: "nokia" }, adminCookie), ctx());
    expect(res.status).toBe(409);
  });

  it("409s when patching a brand to a colliding name", async () => {
    await createBrand(jsonRequest("http://localhost/api/admin/brands", "POST", { name: "Nokia", slug: "nokia" }, adminCookie), ctx());
    const other = await (
      await createBrand(jsonRequest("http://localhost/api/admin/brands", "POST", { name: "Motorola", slug: "motorola" }, adminCookie), ctx())
    ).json();

    const res = await patchBrand(
      jsonRequest(`http://localhost/api/admin/brands/${other.data.id}`, "PATCH", { name: "Nokia" }, adminCookie),
      ctx({ id: String(other.data.id) }),
    );
    expect(res.status).toBe(409);
  });

  it("409s when patching a brand to a colliding slug", async () => {
    await createBrand(jsonRequest("http://localhost/api/admin/brands", "POST", { name: "Nokia", slug: "nokia" }, adminCookie), ctx());
    const other = await (
      await createBrand(jsonRequest("http://localhost/api/admin/brands", "POST", { name: "Motorola", slug: "motorola" }, adminCookie), ctx())
    ).json();

    const res = await patchBrand(
      jsonRequest(`http://localhost/api/admin/brands/${other.data.id}`, "PATCH", { slug: "nokia" }, adminCookie),
      ctx({ id: String(other.data.id) }),
    );
    expect(res.status).toBe(409);
  });

  it("403s a non-admin deleting a brand", async () => {
    const created = await (
      await createBrand(jsonRequest("http://localhost/api/admin/brands", "POST", { name: "Nokia", slug: "nokia" }, adminCookie), ctx())
    ).json();

    const res = await deleteBrand(
      jsonRequest(`http://localhost/api/admin/brands/${created.data.id}`, "DELETE", undefined, retailCookie),
      ctx({ id: String(created.data.id) }),
    );
    expect(res.status).toBe(403);
  });
});
