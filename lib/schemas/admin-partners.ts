import { z } from "zod";

export const adminDecisionSchema = z
  .object({
    action: z.enum(["APPROVE", "REJECT"]),
    note: z.string().trim().max(1000, "یادداشت نباید بیش از ۱۰۰۰ کاراکتر باشد").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === "REJECT") {
      if (!data.note || data.note.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["note"],
          message: "ذکر علت رد درخواست الزامی است (حداقل ۳ حرف)",
        });
      }
    }
  });

export type AdminDecisionInput = z.infer<typeof adminDecisionSchema>;

export const adminPartnerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(["ALL", "PENDING", "APPROVED", "REJECTED"]).default("ALL"),
  entityType: z.enum(["ALL", "INDIVIDUAL", "LEGAL"]).default("ALL"),
  search: z.string().trim().max(100).optional(),
});

export type AdminPartnerListQuery = z.infer<typeof adminPartnerListQuerySchema>;

export const adminDocTypeSchema = z.enum(["leaseDocument", "businessLicense", "registrationNotice"]);
export type AdminDocType = z.infer<typeof adminDocTypeSchema>;
