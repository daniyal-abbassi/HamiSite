import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { GET as getPartnerDocument } from "@/app/api/admin/partners/[id]/documents/[docType]/route";
import { PARTNER_UPLOAD_DIR } from "@/lib/partner-uploads";
import { prisma } from "@/lib/prisma";
import { ctx, getRequest, loginAs } from "../helpers/request";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;
let adminCookie: string;
let retailCookie: string;

beforeEach(async () => {
  seed = await seedMinimal();
  adminCookie = await loginAs(seed.admin);
  retailCookie = await loginAs(seed.retail);
});

describe("admin partner documents route security", () => {
  it("rejects guest requests with 401", async () => {
    const res = await getPartnerDocument(
      getRequest("http://localhost/api/admin/partners/1/documents/leaseDocument"),
      ctx({ id: "1", docType: "leaseDocument" }),
    );
    expect(res.status).toBe(401);
  });

  it("rejects non-admin users with 403", async () => {
    const res = await getPartnerDocument(
      getRequest("http://localhost/api/admin/partners/1/documents/leaseDocument", retailCookie),
      ctx({ id: "1", docType: "leaseDocument" }),
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid docType", async () => {
    const res = await getPartnerDocument(
      getRequest("http://localhost/api/admin/partners/1/documents/invalidType", adminCookie),
      ctx({ id: "1", docType: "invalidType" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent partner application", async () => {
    const res = await getPartnerDocument(
      getRequest("http://localhost/api/admin/partners/999999/documents/leaseDocument", adminCookie),
      ctx({ id: "999999", docType: "leaseDocument" }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 when application exists but requested document is not attached", async () => {
    const app = await prisma.partnerApplication.create({
      data: {
        entityType: "INDIVIDUAL",
        fullName: "علی تستی",
        mobile: `+98912${Math.floor(1000000 + Math.random() * 9000000)}`,
        nationalCode: "0012345678",
        shopName: "فروشگاه نمونه",
        shopAddress: "خیابان ولیعصر",
        postalCode: "1234567890",
        shopPhone: "02188888888",
        status: "PENDING",
      },
    });

    const res = await getPartnerDocument(
      getRequest(`http://localhost/api/admin/partners/${app.id}/documents/leaseDocument`, adminCookie),
      ctx({ id: String(app.id), docType: "leaseDocument" }),
    );
    expect(res.status).toBe(404);
  });

  it("streams document with security headers for authorized admin", async () => {
    await mkdir(PARTNER_UPLOAD_DIR, { recursive: true });
    const fakeFilename = "leaseDocument-test-security-doc.png";
    const fakeFilePath = path.join(PARTNER_UPLOAD_DIR, fakeFilename);
    const fakeBytes = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    );
    await writeFile(fakeFilePath, fakeBytes);

    try {
      const app = await prisma.partnerApplication.create({
        data: {
          entityType: "INDIVIDUAL",
          fullName: "محمد پارسا",
          mobile: `+98912${Math.floor(1000000 + Math.random() * 9000000)}`,
          nationalCode: "0012345678",
          shopName: "فروشگاه پارس",
          shopAddress: "خیابان ولیعصر",
          postalCode: "1234567890",
          shopPhone: "02188888888",
          leaseDocumentPath: fakeFilename,
          status: "PENDING",
        },
      });

      const res = await getPartnerDocument(
        getRequest(`http://localhost/api/admin/partners/${app.id}/documents/leaseDocument`, adminCookie),
        ctx({ id: String(app.id), docType: "leaseDocument" }),
      );

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("image/png");
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res.headers.get("Cache-Control")).toBe("private, no-cache");
    } finally {
      await rm(fakeFilePath, { force: true });
    }
  });
});
