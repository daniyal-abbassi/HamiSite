import { describe, expect, it } from "vitest";
import {
  adminDecisionSchema,
  adminDocTypeSchema,
  adminPartnerListQuerySchema,
} from "@/lib/schemas/admin-partners";
import { getPartnerDocumentStreamInfo } from "@/lib/partner-documents";

describe("Admin Partner Applications API Validation & Security", () => {
  describe("List Query Filters", () => {
    it("handles valid filter query parameters", () => {
      const query = {
        page: "3",
        limit: "10",
        status: "APPROVED",
        entityType: "LEGAL",
        search: "فروشگاه پارس",
      };

      const parsed = adminPartnerListQuerySchema.parse(query);
      expect(parsed.page).toBe(3);
      expect(parsed.limit).toBe(10);
      expect(parsed.status).toBe("APPROVED");
      expect(parsed.entityType).toBe("LEGAL");
      expect(parsed.search).toBe("فروشگاه پارس");
    });

    it("rejects invalid page number (< 1)", () => {
      expect(() => adminPartnerListQuerySchema.parse({ page: "0" })).toThrow();
    });

    it("rejects limit greater than 50", () => {
      expect(() => adminPartnerListQuerySchema.parse({ limit: "100" })).toThrow();
    });

    it("rejects unknown status value", () => {
      expect(() => adminPartnerListQuerySchema.parse({ status: "UNKNOWN" })).toThrow();
    });
  });

  describe("Document Types & Streamer Security", () => {
    it("accepts valid document types", () => {
      expect(adminDocTypeSchema.parse("leaseDocument")).toBe("leaseDocument");
      expect(adminDocTypeSchema.parse("businessLicense")).toBe("businessLicense");
      expect(adminDocTypeSchema.parse("registrationNotice")).toBe("registrationNotice");
    });

    it("rejects arbitrary document type", () => {
      expect(() => adminDocTypeSchema.parse("passport")).toThrow();
      expect(() => adminDocTypeSchema.parse("../../etc/passwd")).toThrow();
    });

    it("rejects path traversal attacks in document streamer", async () => {
      await expect(
        getPartnerDocumentStreamInfo("../../../etc/passwd")
      ).rejects.toThrow();
    });

    it("rejects non-existent document file", async () => {
      await expect(
        getPartnerDocumentStreamInfo("non_existent_doc_12345.pdf")
      ).rejects.toThrow();
    });
  });

  describe("Decision Actions & Rejection Notes", () => {
    it("accepts APPROVE without note", () => {
      const res = adminDecisionSchema.safeParse({ action: "APPROVE" });
      expect(res.success).toBe(true);
    });

    it("accepts APPROVE with note", () => {
      const res = adminDecisionSchema.safeParse({
        action: "APPROVE",
        note: "تأیید شد",
      });
      expect(res.success).toBe(true);
    });

    it("rejects REJECT without note", () => {
      const res = adminDecisionSchema.safeParse({ action: "REJECT" });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0]?.message).toContain("علت رد درخواست الزامی است");
      }
    });

    it("rejects invalid action name", () => {
      const res = adminDecisionSchema.safeParse({ action: "SUSPEND" });
      expect(res.success).toBe(false);
    });
  });
});

