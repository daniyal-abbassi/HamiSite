import { isValidIranianPostalCode } from "@/lib/validators";

export type CheckoutAddressFields = {
  city: string;
  addressText: string;
  phone: string;
  postalCode: string;
};

/** Return the checkout address error shown before an order request is sent. */
export function checkoutAddressError(
  addressMode: "saved" | "new",
  selectedAddressId: number | null,
  address: CheckoutAddressFields,
): string | null {
  if (addressMode === "saved") return selectedAddressId === null ? "یک آدرس انتخاب کنید." : null;
  if (address.city.trim().length < 2) return "شهر را وارد کنید.";
  if (address.addressText.trim().length < 5) return "نشانی کامل را وارد کنید.";
  if (address.phone.trim().length < 5) return "شماره تماس را وارد کنید.";
  if (address.postalCode.trim() && !isValidIranianPostalCode(address.postalCode)) {
    return "کد پستی باید ۱۰ رقم باشد.";
  }
  return null;
}
