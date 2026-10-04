import { beforeEach, describe, expect, it } from "vitest";
import { PATCH as updateImage, POST as uploadImage } from "@/app/api/admin/catalog-images/route";
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

describe("admin catalog image actions", () => {
  it("rejects non-admin uploads before processing the file", async () => {
    const form = new FormData();
    form.set("file", new File(["not an image"], "image.svg", { type: "image/svg+xml" }));
    form.set("entity", "product");
    form.set("id", String(seed.product.id));
    form.set("role", "primary");
    const response = await uploadImage(new Request("http://localhost/api/admin/catalog-images", {
      method: "POST", headers: { cookie: retailCookie }, body: form,
    }), ctx());
    expect(response.status).toBe(403);
  });

  it("rejects unsupported image formats and unsafe stored URLs", async () => {
    const form = new FormData();
    form.set("file", new File(["not an image"], "image.svg", { type: "image/svg+xml" }));
    form.set("entity", "product");
    form.set("id", String(seed.product.id));
    form.set("role", "primary");
    const upload = await uploadImage(new Request("http://localhost/api/admin/catalog-images", {
      method: "POST", headers: { cookie: adminCookie }, body: form,
    }), ctx());
    expect(upload.status).toBe(400);

    const patch = await updateImage(jsonRequest("http://localhost/api/admin/catalog-images", "PATCH", {
      entity: "product", id: seed.product.id, action: "remove", url: "/api/catalog-images/../../outside.svg",
    }, adminCookie), ctx());
    expect(patch.status).toBe(400);
  });
});
