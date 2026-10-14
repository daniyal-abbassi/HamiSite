import { beforeEach, describe, expect, it } from "vitest";
import { PATCH as updateImage, POST as uploadImage } from "@/app/api/admin/catalog-images/route";
import { GET as getCatalogImage } from "@/app/api/catalog-images/[filename]/route";
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

// Minimal valid 1x1 PNG bytes
const VALID_PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

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

  it("rejects mismatched MIME type and magic bytes", async () => {
    // Declares image/png but sends plain text bytes
    const form = new FormData();
    form.set("file", new File([Buffer.from("FAKE_PNG_HEADER_GARBAGE")], "fake.png", { type: "image/png" }));
    form.set("entity", "product");
    form.set("id", String(seed.product.id));
    form.set("role", "primary");

    const response = await uploadImage(new Request("http://localhost/api/admin/catalog-images", {
      method: "POST", headers: { cookie: adminCookie }, body: form,
    }), ctx());
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.message).toContain("فرمت تصویر");
  });

  it("rejects oversized images (>8MB)", async () => {
    const form = new FormData();
    // 9 MB buffer
    const largeBuffer = new Uint8Array(9 * 1024 * 1024);
    form.set("file", new File([largeBuffer], "huge.png", { type: "image/png" }));
    form.set("entity", "product");
    form.set("id", String(seed.product.id));
    form.set("role", "primary");

    const response = await uploadImage(new Request("http://localhost/api/admin/catalog-images", {
      method: "POST", headers: { cookie: adminCookie }, body: form,
    }), ctx());
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.message).toContain("حداکثر حجم تصویر ۸ مگابایت است");
  });

  it("rejects directory traversal and unsafe filenames on image retrieval", async () => {
    const r1 = await getCatalogImage(new Request("http://localhost/api/catalog-images/../../etc/passwd"), {
      params: Promise.resolve({ filename: "../../etc/passwd" }),
    });
    expect(r1.status).toBe(404);

    const r2 = await getCatalogImage(new Request("http://localhost/api/catalog-images/image.svg"), {
      params: Promise.resolve({ filename: "image.svg" }),
    });
    expect(r2.status).toBe(404);
  });

  it("allows valid image upload by admin and serves it with security headers", async () => {
    const form = new FormData();
    form.set("file", new File([VALID_PNG_BYTES], "valid.png", { type: "image/png" }));
    form.set("entity", "product");
    form.set("id", String(seed.product.id));
    form.set("role", "primary");

    const uploadRes = await uploadImage(new Request("http://localhost/api/admin/catalog-images", {
      method: "POST", headers: { cookie: adminCookie }, body: form,
    }), ctx());
    expect(uploadRes.status).toBe(200);
    const { url } = (await uploadRes.json()).data;
    expect(url).toMatch(/^\/api\/catalog-images\/[0-9a-f-]+\.png$/i);

    const filename = url.replace("/api/catalog-images/", "");
    const getRes = await getCatalogImage(new Request(`http://localhost${url}`), {
      params: Promise.resolve({ filename }),
    });
    expect(getRes.status).toBe(200);
    expect(getRes.headers.get("Content-Type")).toBe("image/png");
    expect(getRes.headers.get("X-Content-Type-Options")).toBe("nosniff");

    // Clean up
    const removeRes = await updateImage(jsonRequest("http://localhost/api/admin/catalog-images", "PATCH", {
      entity: "product", id: seed.product.id, action: "remove", url,
    }, adminCookie), ctx());
    expect(removeRes.status).toBe(200);
  });
});
