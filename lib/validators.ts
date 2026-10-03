/**
 * Pure validity checks shared by the /partners form (client) and the
 * /api/partners route (server). All accept both Latin and Persian/Arabic
 * digits — users type Persian digits daily, and the server must normalise
 * them the same way the client does.
 */

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Convert Persian/Arabic digits to Latin and strip separators. */
export function toLatinDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[-\s]/g, "");
}

/** Iranian national code (شماره ملی): 10 digits + Luhn checksum. */
export function isValidIranianNationalCode(input: string): boolean {
  const code = toLatinDigits(input);
  if (!/^\d{10}$/.test(code)) return false;
  if (/^(\d)\1{9}$/.test(code)) return false;
  const digits = code.split("").map(Number);
  const checksum = digits[9];
  const sum = digits.slice(0, 9).reduce((acc, d, i) => acc + d * (10 - i), 0);
  const mod = sum % 11;
  const expected = mod < 2 ? mod : 11 - mod;
  return expected === checksum;
}

/** Iranian postal code: exactly 10 digits. */
export function isValidIranianPostalCode(input: string): boolean {
  return /^\d{10}$/.test(toLatinDigits(input));
}

/** Legal entity national ID (شناسه ملی اشخاص حقوقی): exactly 11 digits. */
export function isValidLegalNationalId(input: string): boolean {
  return /^\d{11}$/.test(toLatinDigits(input));
}

/** Economic code (کد اقتصادی): exactly 12 digits. */
export function isValidEconomicCode(input: string): boolean {
  return /^\d{12}$/.test(toLatinDigits(input));
}

/** Iranian mobile (accepts 09…, 9…, +989…) → E.164 validity check. */
export function isValidIranianMobile(input: string): boolean {
  const digits = toLatinDigits(input);
  if (/^09\d{9}$/.test(digits)) return true;
  if (/^9\d{9}$/.test(digits)) return true;
  if (/^\+989\d{9}$/.test(digits)) return true;
  return false;
}
/**
 * FR-063: the shop phone a partner submits is a landline more often than a mobile,
 * and until now nothing in the repo said what a landline is — `min(7).max(20)` with no
 * shape accepts "1", "abcdefgh" and a US number alike.
 *
 * The shape is the national one: trunk prefix `0`, a two-digit area code, then a 7- or
 * 8-digit subscriber number. `+98`/`0098` forms are read as the same number, and a
 * `09…` line is rejected because that is a mobile and `isValidIranianMobile` covers it.
 */
export function isValidIranianLandline(input: string): boolean {
  const digits = toLatinDigits(input).replace(/[\s()-]/g, "");
  let national: string;
  if (digits.startsWith("+98")) national = digits.slice(3);
  else if (digits.startsWith("0098")) national = digits.slice(4);
  else if (digits.startsWith("0")) national = digits.slice(1);
  else return false;
  if (!/^[1-8]\d\d{7,8}$/.test(national)) return false;
  return !national.startsWith("9");
}
