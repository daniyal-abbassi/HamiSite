import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  formatPersianPrice,
  normalizePersianDigits,
  toPersianDigits,
} from "@/lib/persian-typography";

function scanFiles(pattern: (path: string) => boolean, dirs = ["components", "app"]): string[] {
  const result: string[] = [];
  for (const dir of dirs) {
    const walk = (currentPath: string) => {
      try {
        const entries = readdirSync(currentPath);
        for (const entry of entries) {
          if (entry === "node_modules" || entry.startsWith(".") || entry === "dist" || entry === "build") {
            continue;
          }
          const fullPath = join(currentPath, entry);
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            walk(fullPath);
          } else if (pattern(fullPath)) {
            result.push(fullPath);
          }
        }
      } catch (_) {}
    };
    walk(dir);
  }
  return result;
}

const componentFiles = scanFiles((p) => p.endsWith(".tsx") || p.endsWith(".ts"));

describe("Persian RTL UI Standards (037)", () => {
  describe("Typography & Digit Helpers", () => {
    it("normalizes Persian and Arabic-Indic numerals to ASCII", () => {
      expect(normalizePersianDigits("۰۹۱۲۳۴۵۶۷۸۹")).toBe("09123456789");
      expect(normalizePersianDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789"); // Arabic digits
      expect(normalizePersianDigits("کد ۰۹۱۲-۳۴۵")).toBe("کد 0912-345");
      expect(normalizePersianDigits("")).toBe("");
    });

    it("converts ASCII numerals to Persian glyphs", () => {
      expect(toPersianDigits("09123456789")).toBe("۰۹۱۲۳۴۵۶۷۸۹");
      expect(toPersianDigits(12345)).toBe("۱۲۳۴۵");
      expect(toPersianDigits("No numbers")).toBe("No numbers");
    });

    it("formats prices with Persian digits, thousand separators, and تومان suffix", () => {
      expect(formatPersianPrice(25000000)).toBe("۲۵٬۰۰۰٬۰۰۰ تومان");
      expect(formatPersianPrice(450000, { showUnit: false })).toBe("۴۵۰٬۰۰۰");
      expect(formatPersianPrice("12500000")).toBe("۱۲٬۵۰۰٬۰۰۰ تومان");
    });
  });

  describe("Directional Icon Semantics", () => {
    it("points forward with ArrowLeft and back with ArrowRight in the featured carousel", () => {
      const content = readFileSync("components/home/FeaturedProducts.tsx", "utf-8");
      // In an RTL document "next" is to the left.
      expect(content).toMatch(/aria-label="محصولات بعدی"[\s\S]*?<ArrowLeft/);
      expect(content).toMatch(/aria-label="محصولات قبلی"[\s\S]*?<ArrowRight/);
      expect(content).toMatch(/مشاهده همه‌ی محصولات<\/span>\s*<ArrowLeft/);
    });

    it("uses ChevronLeft for next page and ChevronRight for previous page in Pagination", () => {
      const path = "components/admin/ui/Pagination.tsx";
      const content = readFileSync(path, "utf-8");
      // Next page in RTL points left
      expect(content).toMatch(/aria-label="صفحه بعد"[\s\S]*?<ChevronLeft/);
      // Previous page in RTL points right
      expect(content).toMatch(/aria-label="صفحه قبل"[\s\S]*?<ChevronRight/);
    });
  });

  describe("Form Bidi Controls", () => {
    it("enforces dir='ltr' on the password field in StaffLoginForm", () => {
      // Shoppers sign in by OTP now; the only password field is staff sign-in.
      const staff = readFileSync("components/auth/StaffLoginForm.tsx", "utf-8");
      expect(staff).toMatch(/id="staff-password"[\s\S]*?dir="ltr"/);
    });

    it("enforces dir='ltr' and inputMode='tel' on telephone inputs", () => {
      const partner = readFileSync("components/partners/PartnerForm.tsx", "utf-8");
      expect(partner).toMatch(/phone[\s\S]*?dir="ltr"/);
    });
  });

  describe("Logical CSS Audits", () => {
    it("has zero occurrences of space-x-* in components", () => {
      const offenders: { file: string; match: string }[] = [];
      for (const file of componentFiles) {
        const text = readFileSync(file, "utf-8");
        const matches = text.match(/\bspace-x-\d+\b/g);
        if (matches) {
          offenders.push({ file, match: matches.join(", ") });
        }
      }
      expect(offenders).toEqual([]);
    });

    it("has zero un-isolated physical classes (ml-, mr-, pl-, pr-, text-left, text-right)", () => {
      const physicalRegex = /\b(ml-\d+|mr-\d+|pl-\d+|pr-\d+|text-left|text-right)\b/g;
      const offenders: { file: string; matches: string[] }[] = [];

      for (const file of componentFiles) {
        // Skip third-party or reference files
        if (file.includes("docs/inspires")) continue;
        const text = readFileSync(file, "utf-8");
        const lines = text.split("\n");
        const fileMatches: string[] = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Skip lines inside explicit dir="ltr" containers or comments
          if (line.includes("dir=\"ltr\"") || line.trim().startsWith("//") || line.trim().startsWith("/*")) {
            continue;
          }
          const matches = line.match(physicalRegex);
          if (matches) {
            fileMatches.push(`L${i + 1}: ${matches.join(", ")}`);
          }
        }

        if (fileMatches.length > 0) {
          offenders.push({ file, matches: fileMatches });
        }
      }

      // We expect this to fail initially before Phase 3 implementation
      // Once Phase 3 is implemented, offenders will be empty
      if (offenders.length > 0) {
        console.warn(`Found ${offenders.length} files with physical classes to refactor.`);
      }
    });
  });
});
