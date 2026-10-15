/**
 * Persian typography and bidirectional layout primitives.
 *
 * Implements the VibeFarsi / Persian RTL UI guidelines:
 * - Digit normalization (Persian/Arabic-Indic -> ASCII for form submissions & API)
 * - Persian numeral display formatting (ASCII -> Persian digits)
 * - Persian price formatting (Persian numerals with «٬» thousand separator + «تومان» suffix)
 * - Bidi text isolation helpers
 */

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const ARABIC_INDIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/**
 * Normalizes any Persian (۰-۹) or Arabic-Indic (٠-٩) digits to standard ASCII (0-9).
 * Preserves all other characters, letters, spaces, and punctuation.
 */
export function normalizePersianDigits(input: string): string {
  if (!input) return "";
  let result = input;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(PERSIAN_DIGITS[i], "g"), String(i));
    result = result.replace(new RegExp(ARABIC_INDIC_DIGITS[i], "g"), String(i));
  }
  return result;
}

/**
 * Converts ASCII digits (0-9) in a string or number to Persian numerals (۰-۹).
 */
export function toPersianDigits(input: string | number): string {
  if (input === null || input === undefined) return "";
  const str = String(input);
  return str.replace(/[0-9]/g, (char) => PERSIAN_DIGITS[Number(char)] ?? char);
}

export interface FormatPersianPriceOptions {
  /** Whether to append the unit «تومان» (defaults to true) */
  showUnit?: boolean;
}

/**
 * Formats a numeric price into Persian numerals with Persian thousands separator («٬»)
 * and appends «تومان» strictly after the number.
 *
 * Example:
 *   formatPersianPrice(25400000) => "۲۵٬۴۰۰٬۰۰۰ تومان"
 *   formatPersianPrice(25400000, { showUnit: false }) => "۲۵٬۴۰۰٬۰۰۰"
 */
export function formatPersianPrice(
  amount: number | string,
  options: FormatPersianPriceOptions = {},
): string {
  const { showUnit = true } = options;
  const num = typeof amount === "string" ? Number(normalizePersianDigits(amount)) : amount;
  if (isNaN(num)) return "";

  // Format with standard thousand separator
  const parts = Math.round(num).toString().split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "٬");
  const formattedInt = toPersianDigits(intPart);

  return showUnit ? `${formattedInt} تومان` : formattedInt;
}

/**
 * Isolates Latin runs, SKUs, or codes in a Persian string using Unicode Left-to-Right Embedding.
 */
export function isolateLatinRun(code: string): string {
  if (!code) return "";
  return `\u202A${code}\u202C`;
}
