import { describe, expect, it } from "vitest";
import { parsePartnerApplication } from "@/lib/partner-application-input";
import { clientValidate, EMPTY_VALUES, selectedFileError } from "@/lib/partner-form-validation";
import { ApiError } from "@/lib/http";

const pdf = (name = "doc.pdf", size = 16) => new File([new Uint8Array(size)], name, { type: "application/pdf" });

const individual = {
  entityType: "INDIVIDUAL",
  fullName: "سارا احمدی",
  mobile: "09121112233",
  nationalCode: "0012345679",
  shopName: "فروشگاه سارا",
  shopAddress: "مشهد، خیابان امام رضا",
  postalCode: "9177948974",
  shopPhone: "05131234567",
};

const legal = {
  entityType: "LEGAL",
  fullName: "سارا احمدی",
  mobile: "09121112233",
  nationalCode: "0012345679",
  shopName: "فروشگاه سارا",
  shopAddress: "مشهد، خیابان امام رضا",
  companyName: "شرکت همراه",
  companyAddress: "مشهد، بلوار وکیل‌آباد",
  legalNationalId: "10101234567",
  economicCode: "411111111111",
};

function form(text: Record<string, string>, files: Record<string, File> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ ...text, ...files })) data.set(key, value);
  return data;
}

function failure(run: () => unknown) {
  try {
    run();
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error("expected the parser to refuse");
}

function fieldError(error: ApiError, field: string) {
  return (error.details as { fieldErrors: Record<string, string[]> }).fieldErrors[field]?.[0];
}

describe("parsePartnerApplication", () => {
  it("accepts a complete application of each type and normalizes the mobile", () => {
    const person = parsePartnerApplication(form(individual, { leaseDocument: pdf(), businessLicense: pdf() }));
    expect(person.input.mobile).toBe("+989121112233");
    expect(Object.keys(person.files)).toEqual(["leaseDocument", "businessLicense"]);

    const company = parsePartnerApplication(form(legal, { leaseDocument: pdf(), registrationNotice: pdf() }));
    expect(Object.keys(company.files)).toEqual(["leaseDocument", "registrationNotice"]);
  });

  it("uses the verified mobile instead of the one the client sent", () => {
    const { input } = parsePartnerApplication(
      form({ ...individual, mobile: "09350000000" }, { leaseDocument: pdf(), businessLicense: pdf() }),
      { mobile: "+989121112233" },
    );
    expect(input.mobile).toBe("+989121112233");
  });

  it("applies the partners page's text rules", () => {
    const person = failure(() => parsePartnerApplication(form({ ...individual, postalCode: "123" })));
    expect(person.code).toBe("VALIDATION_FAILED");
    expect(fieldError(person, "postalCode")).toBe("کد پستی باید ۱۰ رقم باشد");

    const company = failure(() => parsePartnerApplication(form({ ...legal, legalNationalId: "1", economicCode: "2" })));
    expect(fieldError(company, "legalNationalId")).toBe("شناسه ملی شرکت باید ۱۱ رقم باشد");
    expect(fieldError(company, "economicCode")).toBe("شماره اقتصادی باید ۱۲ رقم باشد");
  });

  it("names the document that is missing, malformed, or oversized", () => {
    const missing = failure(() => parsePartnerApplication(form(individual, { leaseDocument: pdf() })));
    expect(missing.details).toEqual({ field: "businessLicense" });

    const text = new File(["x"], "doc.txt", { type: "text/plain" });
    const wrongType = failure(() => parsePartnerApplication(form(individual, { leaseDocument: text, businessLicense: pdf() })));
    expect(wrongType.details).toEqual({ field: "leaseDocument" });

    const empty = failure(() => parsePartnerApplication(form(legal, { leaseDocument: pdf(), registrationNotice: pdf("n.pdf", 0) })));
    expect(empty.details).toEqual({ field: "registrationNotice" });

    const large = failure(() => parsePartnerApplication(form(legal, { leaseDocument: pdf("l.pdf", 10 * 1024 * 1024 + 1), registrationNotice: pdf() })));
    expect(large.details).toEqual({ field: "leaseDocument" });
  });
});

describe("client partner validation", () => {
  it("leaves the mobile to registration's own check", () => {
    const errors = clientValidate({ ...EMPTY_VALUES, mobile: "" }, {}, "INDIVIDUAL", { requireMobile: false });
    expect(errors.mobile).toBeUndefined();
    expect(errors.fullName).toBeDefined();
    expect(errors.leaseDocument).toBeDefined();
    expect(errors.businessLicense).toBeDefined();
  });

  it("still requires the mobile on the partners page", () => {
    expect(clientValidate(EMPTY_VALUES, {}, "LEGAL").mobile).toBeDefined();
  });

  it("asks each business type for its own document", () => {
    expect(clientValidate(EMPTY_VALUES, {}, "LEGAL").registrationNotice).toBeDefined();
    expect(clientValidate(EMPTY_VALUES, {}, "LEGAL").businessLicense).toBeUndefined();
  });

  it("refuses a disallowed file the moment it is chosen", () => {
    expect(selectedFileError(new File(["x"], "doc.txt", { type: "text/plain" }))).toContain("JPG/PNG/WebP/PDF");
    expect(selectedFileError(pdf("big.pdf", 10 * 1024 * 1024 + 1))).toContain("۱۰ مگابایت");
    expect(selectedFileError(pdf())).toBeNull();
  });
});
