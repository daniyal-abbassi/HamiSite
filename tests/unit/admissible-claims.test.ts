import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * FR-001, FR-006, FR-007 and SC-004 — the copy that may reach a shopper.
 *
 * There was no test anywhere over any of the honest-interface band, which is how
 * every claim below passed CI while nothing in the data supported it: a
 * percentage nobody measured on 189 cards, a warranty naming no provider, an
 * email the merchant never supplied, an AI re-lit photograph captioned as the
 * real store. Comments are stripped first, because this repository documents its
 * removals and a comment naming a deleted claim is not the claim being back.
 */

const ROOT = process.cwd();
const SOURCES = ["app", "components", "lib"];

function files(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    if (statSync(full).isDirectory()) out.push(...files(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

/** Block comments, line comments, and nothing that looks like a `://` in a URL. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:'"\\])\/\/.*$/gm, "$1");
}

const corpus = SOURCES.flatMap((dir) => files(join(ROOT, dir))).map((path) => ({
  path: relative(ROOT, path),
  code: stripComments(readFileSync(path, "utf8")),
}));

const FORBIDDEN: Record<string, string> = {
  "گارانتی رسمی": "named no provider and no period; replaced by storeWarranty",
  "ضمانت اصالت": "an authenticity guarantee the record never carries",
  "تضمین ۱۰۰": "a percentage nobody measured",
  "۱۰۰٪": "an unmeasured superlative",
  "قیمتی بی‌رقیب": "FR-017 forbids the unspecificable comparative",
  "بهترین قیمت": "FR-017, same clause",
  "بی‌نهایت": "FR-059, a superlative with no measurement",
  "برندهای همکار": "FR-006 admits only the Redmi and TCH relationships",
  "همکاران تجاری": "an implied endorsement",
  "مجتمع تجاری موبایل": "not a verified address; FR-007",
  "info@hamihamrah": "an email the merchant never supplied; FR-007",
  "@hamihamrah": "no verified email exists in lib/content/contact.ts",
  "در انتظار افزودن": "FR-008: an empty place stays empty, it does not apologise",
  /* Wholesale *supply* is a real line of business and may be named.
     What may not be implied is a tier price: the export carries none. */
  "قیمت عمده": "no tier data exists to activate",
  "shop.jpg": "the AI re-lit store photograph, removed by owner decision 2026-09-23",
  "shop-ai-relight": "the derivative chain must not reach a render path",
};

describe("admissible claims (contracts/honest-states.md)", () => {
  it("scans the shopper-facing sources", () => {
    // A guard test that silently scanned nothing would be worse than none.
    expect(corpus.length).toBeGreaterThan(80);
  });

  for (const [needle, reason] of Object.entries(FORBIDDEN)) {
    it(`no live source contains ${needle}`, () => {
      const hits = corpus.filter((f) => f.code.includes(needle)).map((f) => f.path);
      expect(hits, `${needle} — ${reason}`).toEqual([]);
    });
  }

  it("renders contact facts from exactly one source", () => {
    const phone = "09331214000";
    const latinPhone = corpus.filter((f) => f.code.replace(/[-\s]/g, "").includes(phone) && !f.path.includes("lib/content/contact.ts"));
    expect(latinPhone.map((f) => f.path), "a phone number outside lib/content/contact.ts").toEqual([]);
  });

  it("keeps the warranty as a single sourced fact", () => {
    const facts = readFileSync(join(ROOT, "lib/content/verified-facts.ts"), "utf8");
    expect(facts).toContain("گارانتی ۱۸ ماهه شرکتی");
    // Owner-confirmed wording; if it is ever reworded it must change in one file.
    const sourcesUsingIt = corpus.filter((f) => f.code.includes("storeWarranty"));
    expect(sourcesUsingIt.length).toBeGreaterThan(0);
    expect(corpus.filter((f) => /گارانتی(?! ).{0,3}(?:۱۸|ماسه)/.test(f.code) && !f.path.includes("verified-facts")).length).toBe(0);
  });
});
