import { beforeEach, describe, expect, it } from "vitest";
import { POST as createCategory } from "@/app/api/admin/categories/route";
import { DELETE as deleteCategory, PATCH as patchCategory } from "@/app/api/admin/categories/[id]/route";
import { POST as createBrand } from "@/app/api/admin/brands/route";
import { DELETE as deleteBrand, PATCH as patchBrand } from "@/app/api/admin/brands/[id]/route";
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

describe("admin categories", () => {
  it("403s for a non-admin", async () => {
    const res = await createCategory(
      jsonRequest("http://localhost/api/admin/categories", "POST", { name: "Phones", slug: "phones" }, retailCookie),
    );
    expect(res.status).toBe(403);
  });

  it("creates a root category at level 0", async () => {
    const res = await createCategory(
      jsonRequest("http://localhost/api/admin/categories", "POST", { name: "Phones", slug: "phones" }, adminCookie),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.level).toBe(0);
  });

  it("creates a child category one level below its parent", async () => {
    const parent = await (
      await createCategory(jsonRequest("http://localhost/api/admin/categories", "POST", { name: "Phones", slug: "phones" }, adminCookie))
    ).json();

    const res = await createCategory(
      jsonRequest(
        "http://localhost/api/admin/categories",
        "POST",
        { name: "Smartphones", slug: "smartphones", parentId: parent.data.id },
        adminCookie,
      ),
    );
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
      ),
    );
    expect(res.status).toBe(400);
    expect(await prisma.category.findUnique({ where: { slug: "smartphones" } })).toBeNull();
  });

  it("patches and deletes a category", async () => {
    const created = await (
      await createCategory(jsonRequest("http://localhost/api/admin/categories", "POST", { name: "Phones", slug: "phones" }, adminCookie))
    ).json();

    const patchRes = await patchCategory(
      jsonRequest(`http://localhost/api/admin/categories/${created.data.id}`, "PATCH", { name: "Mobile Phones" }, adminCookie),
      { params: { id: String(created.data.id) } },
    );
    expect(patchRes.status).toBe(200);

    const deleteRes = await deleteCategory(
      jsonRequest(`http://localhost/api/admin/categories/${created.data.id}`, "DELETE", undefined, adminCookie),
      { params: { id: String(created.data.id) } },
    );
    expect(deleteRes.status).toBe(200);
    expect(await prisma.category.findUnique({ where: { id: created.data.id } })).toBeNull();
  });

  it("403s a non-admin patching a category", async () => {
    const created = await (
      await createCategory(jsonRequest("http://localhost/api/admin/categories", "POST", { name: "Phones", slug: "phones" }, adminCookie))
    ).json();

    const res = await patchCategory(
      jsonRequest(`http://localhost/api/admin/categories/${created.data.id}`, "PATCH", { name: "Mobile Phones" }, retailCookie),
      { params: { id: String(created.data.id) } },
    );
    expect(res.status).toBe(403);
  });
});

describe("admin brands", () => {
  it("403s for a non-admin", async () => {
    const res = await createBrand(
      jsonRequest("http://localhost/api/admin/brands", "POST", { name: "Nokia", slug: "nokia" }, retailCookie),
    );
    expect(res.status).toBe(403);
  });

  it("creates, patches, and deletes a brand", async () => {
    const created = await (
      await createBrand(jsonRequest("http://localhost/api/admin/brands", "POST", { name: "Nokia", slug: "nokia" }, adminCookie))
    ).json();
    expect(created.data.name).toBe("Nokia");

    const patchRes = await patchBrand(
      jsonRequest(`http://localhost/api/admin/brands/${created.data.id}`, "PATCH", { isActive: false }, adminCookie),
      { params: { id: String(created.data.id) } },
    );
    expect(patchRes.status).toBe(200);

    const deleteRes = await deleteBrand(
      jsonRequest(`http://localhost/api/admin/brands/${created.data.id}`, "DELETE", undefined, adminCookie),
      { params: { id: String(created.data.id) } },
    );
    expect(deleteRes.status).toBe(200);
    expect(await prisma.brand.findUnique({ where: { id: created.data.id } })).toBeNull();
  });

  it("409s on a duplicate brand name", async () => {
    await createBrand(jsonRequest("http://localhost/api/admin/brands", "POST", { name: "Nokia", slug: "nokia" }, adminCookie));
    const res = await createBrand(
      jsonRequest("http://localhost/api/admin/brands", "POST", { name: "Nokia", slug: "nokia-2" }, adminCookie),
    );
    expect(res.status).toBe(409);
  });

  it("409s on a duplicate brand slug", async () => {
    await createBrand(jsonRequest("http://localhost/api/admin/brands", "POST", { name: "Nokia", slug: "nokia" }, adminCookie));
    const res = await createBrand(
      jsonRequest("http://localhost/api/admin/brands", "POST", { name: "Nokia Mobile", slug: "nokia" }, adminCookie),
    );
    expect(res.status).toBe(409);
  });

  it("403s a non-admin deleting a brand", async () => {
    const created = await (
      await createBrand(jsonRequest("http://localhost/api/admin/brands", "POST", { name: "Nokia", slug: "nokia" }, adminCookie))
    ).json();

    const res = await deleteBrand(
      jsonRequest(`http://localhost/api/admin/brands/${created.data.id}`, "DELETE", undefined, retailCookie),
      { params: { id: String(created.data.id) } },
    );
    expect(res.status).toBe(403);
  });
});
