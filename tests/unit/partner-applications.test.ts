import { describe, expect, it } from "vitest";
import { PartnerApplicationStatus, PartnerEntityType } from "@prisma/client";
import { serializeApplicationSummary } from "@/lib/partner-applications";
import { adminDecisionSchema, adminPartnerListQuerySchema } from "@/lib/schemas/admin-partners";

describe("Partner Applications — Serialization and Validation", () => {
  it("serializes partner application entity with document availability flags", () => {
    const raw = {
      id: 1,
      entityType: PartnerEntityType.INDIVIDUAL,
      status: PartnerApplicationStatus.PENDING,
      fullName: "رضا رضایی",
      mobile: "+989361234567",
      nationalCode: "0012345679",
      shopName: "فروشگاه موبایل رضایی",
      shopAddress: "مشهد، احمدآباد",
      postalCode: "9173512345",
      shopPhone: "05138401234",
      companyName: null,
      companyAddress: null,
      legalNationalId: null,
      economicCode: null,
      leaseDocumentPath: "lease-abc.png",
      businessLicensePath: "license-xyz.png",
      registrationNoticePath: null,
      notes: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date("2026-10-12T22:00:00.000Z"),
      updatedAt: new Date("2026-10-12T22:00:00.000Z"),
    };

    const serialized = serializeApplicationSummary(raw);

    expect(serialized.id).toBe(1);
    expect(serialized.hasLeaseDocument).toBe(true);
    expect(serialized.hasBusinessLicense).toBe(true);
    expect(serialized.hasRegistrationNotice).toBe(false);
    expect(serialized.status).toBe("PENDING");
    expect(serialized.createdAt).toBe("2026-10-12T22:00:00.000Z");
  });

  describe("Admin Decision Schema", () => {
    it("accepts APPROVE without note", () => {
      const parsed = adminDecisionSchema.safeParse({ action: "APPROVE" });
      expect(parsed.success).toBe(true);
    });

    it("accepts APPROVE with note", () => {
      const parsed = adminDecisionSchema.safeParse({
        action: "APPROVE",
        note: "تأیید شد",
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects REJECT without note", () => {
      const parsed = adminDecisionSchema.safeParse({ action: "REJECT" });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toContain("علت رد درخواست الزامی است");
      }
    });

    it("rejects REJECT with empty or too short note", () => {
      const parsed = adminDecisionSchema.safeParse({
        action: "REJECT",
        note: "  نه ",
      });
      expect(parsed.success).toBe(false);
    });

    it("accepts REJECT with descriptive note", () => {
      const parsed = adminDecisionSchema.safeParse({
        action: "REJECT",
        note: "تصویر ارسالی برای جواز کسب ناخوانا است.",
      });
      expect(parsed.success).toBe(true);
    });
  });

  describe("Admin List Query Schema", () => {
    it("applies defaults for page, limit, status, and entityType", () => {
      const parsed = adminPartnerListQuerySchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(20);
      expect(parsed.status).toBe("ALL");
      expect(parsed.entityType).toBe("ALL");
    });

    it("coerces string numbers to integers", () => {
      const parsed = adminPartnerListQuerySchema.parse({
        page: "2",
        limit: "15",
        status: "PENDING",
      });
      expect(parsed.page).toBe(2);
      expect(parsed.limit).toBe(15);
      expect(parsed.status).toBe("PENDING");
    });
  });
});

