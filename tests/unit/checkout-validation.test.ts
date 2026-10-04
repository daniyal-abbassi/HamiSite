import { describe, expect, it } from "vitest";
import { checkoutAddressError, type CheckoutAddressFields } from "@/lib/checkout-validation";

const validAddress: CheckoutAddressFields = {
  city: "مشهد",
  addressText: "خیابان اصلی، پلاک ۱",
  phone: "+989120000103",
  postalCode: "",
};

describe("checkout address validation", () => {
  it("requires a city of at least two non-whitespace characters", () => {
    expect(checkoutAddressError("new", null, { ...validAddress, city: " x " })).toBe("شهر را وارد کنید.");
  });

  it("requires an address of at least five characters after trimming", () => {
    expect(checkoutAddressError("new", null, { ...validAddress, addressText: " abcd " })).toBe("نشانی کامل را وارد کنید.");
  });

  it("requires a phone of at least five characters after trimming", () => {
    expect(checkoutAddressError("new", null, { ...validAddress, phone: " 1234 " })).toBe("شماره تماس را وارد کنید.");
  });

  it("rejects a non-empty invalid postal code", () => {
    expect(checkoutAddressError("new", null, { ...validAddress, postalCode: "12345" })).toBe("کد پستی باید ۱۰ رقم باشد.");
  });

  it("allows an empty postal code when the other fields are valid", () => {
    expect(checkoutAddressError("new", null, validAddress)).toBeNull();
  });

  it("requires a selected saved address", () => {
    expect(checkoutAddressError("saved", null, validAddress)).toBe("یک آدرس انتخاب کنید.");
    expect(checkoutAddressError("saved", 42, validAddress)).toBeNull();
  });
});
