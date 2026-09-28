import { describe, it, expect } from "vitest";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { ApiClientError } from "@/lib/api-client";

describe("apiErrorToFa", () => {
  it("returns specific field error message when validation fails with details", () => {
    const error = new ApiClientError(
      "VALIDATION_FAILED",
      400,
      "Validation failed",
      { fieldErrors: { phone: ["شماره موبایل نامعتبر است."] } }
    );
    expect(apiErrorToFa(error)).toBe("شماره موبایل نامعتبر است.");
  });

  it("returns fallback message when validation fails without specific field errors", () => {
    const error = new ApiClientError(
      "VALIDATION_FAILED",
      400,
      "Validation failed",
      {}
    );
    expect(apiErrorToFa(error)).toBe("اطلاعات ارسالی معتبر نیست.");
  });
});
