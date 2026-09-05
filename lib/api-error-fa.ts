import { ApiClientError } from "@/lib/api-client";

/**
 * Persian, plain-language errors for the storefront — branch on the machine
 * `error.code` (the contract), never on English `error.message` text.
 * Unknown codes fall back to a neutral retry message rather than leaking
 * raw English API strings into the Persian UI.
 */
export function apiErrorToFa(error: unknown, fallback = "خطایی رخ داد. لطفاً دوباره تلاش کنید."): string {
  if (!(error instanceof ApiClientError)) return fallback;

  const details = error.details as { available?: number; requested?: number } | undefined;

  switch (error.code) {
    case "AUTH_REQUIRED":
      return "برای ادامه ابتدا وارد حساب خود شوید.";
    case "INVALID_CREDENTIALS":
      return "نام کاربری یا رمز عبور اشتباه است.";
    case "ACCOUNT_DEACTIVATED":
      return "حساب شما غیرفعال شده است. با پشتیبانی تماس بگیرید.";
    case "DUPLICATE_ACCOUNT":
      return "این حساب قبلاً ثبت شده است؛ وارد شوید یا شماره/ایمیل دیگری امتحان کنید.";
    case "VALIDATION_FAILED": {
      const fieldErrors = (error.details as { formErrors?: string[]; fieldErrors?: Record<string, string[]> } | undefined);
      const first = fieldErrors?.formErrors?.[0] ?? Object.values(fieldErrors?.fieldErrors ?? {})[0]?.[0];
      return first ? "اطلاعات ارسالی معتبر نیست." : "اطلاعات ارسالی معتبر نیست.";
    }
    case "CONFLICT":
    case "NOT_FOUND":
      if (details && typeof details.available === "number") {
        return `موجودی کافی نیست — فقط ${details.available.toLocaleString("fa-IR")} عدد باقی مانده.`;
      }
      return error.status === 404 ? "موردی پیدا نشد." : "امکان انجام درخواست نیست.";
    case "FORBIDDEN":
    case "FORBIDDEN_ROLE":
      return "اجازه انجام این کار را ندارید.";
    default:
      return fallback;
  }
}
