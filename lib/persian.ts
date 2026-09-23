/**
 * Persian text folding for search and comparison.
 *
 * A shopper does not type the way a database stores. Three differences between
 * the keyboard and the catalogue made real searches return nothing, each measured
 * against the export before this file existed:
 *
 *   `سیستم‌عامل` → 2 results   vs   `سیستم عامل` (plain space) → 0
 *   `۱۰۵`        → 0 results   vs   `105` (Latin digits)      → 2
 *   `موبايل`      → 0 results   vs   `موبایل`                   → 133
 *
 * The second pair is the one that makes this a correctness issue rather than a
 * nicety: FR-011 *requires* the interface to display Persian digits, so the site
 * shows a form of a name its own search box cannot match.
 *
 * Deliberately no dependency. The whole rule set is four character classes and one
 * Unicode normal form, and `lib/validators.ts:12-17` already does the same digit
 * folding for phone input — this is that precedent, generalised.
 */

const ARABIC_LETTERS: ReadonlyArray<[RegExp, string]> = [
  [/ي/g, "ی"], // ي  Arabic ya → Persian ی
  [/ك/g, "ک"], // ك  Arabic kaf → Persian ک
  [/٤/g, "۴"], [/٥/g, "۵"], [/٦/g, "۶"], [/٧/g, "۷"],
  [/٨/g, "۸"], [/٩/g, "۹"], [/٠/g, "۰"], [/١/g, "۱"],
  [/٢/g, "۲"], [/٣/g, "۳"],
];

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** ZWNJ, the Arabic letter variants, and every digit shape collapsed onto Latin. */
export function foldPersian(value: string): string {
  /*
   * ZWNJ is removed and then *all* spacing is dropped, in that order. Doing only
   * the first leaves «سیستم‌عامل» folding to «سیستمعامل» while a shopper typing a
   * plain space sends «سیستم عامل» — still two different strings, which is how the
   * first version of this function measured: `سیستم‌عامل` → 2 results,
   * `سیستم عامل` → 0. Word boundaries in this catalogue are not meaningfully
   * carried by spaces (Persian compounds them constantly), so trading
   * space-sensitivity for the ability to find the thing at all is the right way
   * round. It does mean «کابل» also matches inside a longer run of letters; for a
   * substring search over 189 product names that is the smaller error.
   */
  let text = value.normalize("NFKC").replace(/\u200C/g, "").toLowerCase();
  text = text.replace(/\s+/g, "");
  for (const [pattern, replacement] of ARABIC_LETTERS) text = text.replace(pattern, replacement);
  return text.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
}

/** Both sides of a comparison go through here, so neither can be forgotten. */
export function persianIncludes(haystack: string, needle: string): boolean {
  const n = foldPersian(needle);
  return n.length > 0 && foldPersian(haystack).includes(n);
}
