import { describe, expect, it } from "vitest";
import { normalizeIranianMobile } from "@/lib/phone";
import { isValidEconomicCode, isValidIranianMobile, isValidIranianNationalCode, isValidIranianPostalCode, isValidLegalNationalId, toLatinDigits, isValidIranianLandline } from "@/lib/validators";

describe("toLatinDigits", () => {
  it("converts Persian and Arabic digits to Latin", () => {
    expect(toLatinDigits("۰۹۱۲۳۴۵۶۷۸۹")).toBe("09123456789");
    expect(toLatinDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
  });

  it("strips separators (spaces and hyphens)", () => {
    expect(toLatinDigits("۰۹۱۲ - ۳۴۵۶۷۸۹")).toBe("09123456789");
  });
});

describe("isValidIranianNationalCode", () => {
  it("accepts a real checksum-valid code (Persian digits too)", () => {
    // 1234567891 is checksum-valid (verified: weighted sum 210, 210 % 11 = 1 → check digit 1).
    expect(isValidIranianNationalCode("1234567891")).toBe(true);
    expect(isValidIranianNationalCode("۱۲۳۴۵۶۷۸۹۱")).toBe(true);
  });

  it("rejects repeated digit sequences", () => {
    expect(isValidIranianNationalCode("0000000000")).toBe(false);
    expect(isValidIranianNationalCode("1111111111")).toBe(false);
  });

  it("rejects wrong lengths and wrong checksums", () => {
    expect(isValidIranianNationalCode("12345")).toBe(false);
    expect(isValidIranianNationalCode("1234567890")).toBe(false);
  });
});

describe("isValidIranianMobile", () => {
  it("accepts 09…, 9…, and +989… formats", () => {
    expect(isValidIranianMobile("09123456789")).toBe(true);
    expect(isValidIranianMobile("9123456789")).toBe(true);
    expect(isValidIranianMobile("+989123456789")).toBe(true);
    expect(isValidIranianMobile("۰۹۱۲۳۴۵۶۷۸۹")).toBe(true);
  });

  it("rejects landlines and short numbers", () => {
    expect(isValidIranianMobile("02112345678")).toBe(false);
    expect(isValidIranianMobile("09123")).toBe(false);
  });
});

describe("Iranian location/legal identifiers", () => {
  it("validates 10-digit postal codes", () => {
    expect(isValidIranianPostalCode("1234567890")).toBe(true);
    expect(isValidIranianPostalCode("۱۲۳۴۵۶۷۸۹۰")).toBe(true);
    expect(isValidIranianPostalCode("12345")).toBe(false);
  });

  it("validates 11-digit legal national IDs", () => {
    expect(isValidLegalNationalId("10100489116")).toBe(true);
    expect(isValidLegalNationalId("۱۰۱۰۰۴۸۹۱۱۶")).toBe(true);
    expect(isValidLegalNationalId("12345")).toBe(false);
  });

  it("validates 12-digit economic codes", () => {
    expect(isValidEconomicCode("411111111111")).toBe(true);
    expect(isValidEconomicCode("۴۱۱۱۱۱۱۱۱۱۱۱")).toBe(true);
    expect(isValidEconomicCode("411111")).toBe(false);
  });
});
describe("FR-063 — isValidIranianLandline", () => {
  it("accepts a geographic number with its area code", () => {
    expect(isValidIranianLandline("05131234567")).toBe(true);
    expect(isValidIranianLandline("02112345678")).toBe(true);
  });

  it("accepts the separators and digit shapes a person actually types", () => {
    expect(isValidIranianLandline("051 3123 4567")).toBe(true);
    expect(isValidIranianLandline("۰۵۱۳۱۲۳۴۵۶۷")).toBe(true);
    expect(isValidIranianLandline("+98 51 3123 4567")).toBe(true);
    expect(isValidIranianLandline("00985131234567")).toBe(true);
  });

  it("rejects a mobile, a short number and a non-Iranian country code", () => {
    expect(isValidIranianLandline("09121234567")).toBe(false);
    expect(isValidIranianLandline("0513123")).toBe(false);
    expect(isValidIranianLandline("+15131234567")).toBe(false);
    expect(isValidIranianLandline("")).toBe(false);
  });
});

describe("FR-062 — normalizeIranianMobile accepts what shoppers paste", () => {
  it("folds the 0098 trunk-dial form, which the old rule returned untouched", () => {
    expect(normalizeIranianMobile("00989121234567")).toBe("+989121234567");
    expect(normalizeIranianMobile("۰۰۹۸۹۱۲۱۲۳۴۵۶۷")).toBe("+989121234567");
  });

  it("keeps the forms it already handled", () => {
    expect(normalizeIranianMobile("09121234567")).toBe("+989121234567");
    expect(normalizeIranianMobile("+989121234567")).toBe("+989121234567");
    expect(normalizeIranianMobile(" ۰۹۱۲۱۲۳۴۵۶۷ ")).toBe("+989121234567");
  });

  it("still leaves a non-mobile identifier alone", () => {
    expect(normalizeIranianMobile("daniyal")).toBe("daniyal");
  });
});
