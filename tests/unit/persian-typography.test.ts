import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * The typographic guard band (T084). `audits/04` found zero coverage for FR-057, FR-058 and FR-011, and
 * since the last check the «جستجو» count it recorded grew from 3 to 8 — which is the whole argument for a
 * test rather than a sweep: a hand-fixed list of strings has no way to notice the next one.
 *
 * These are source-scanning tests, deliberately. There is no DOM harness in this project (`vitest.config.ts`
 * runs in `node`), and the alternative — measuring computed `letter-spacing` in a browser — is what
 * `verification/capture-baseline.mjs` already does for the surfaces it visits. What a source pass can do is
 * look at *every* file, including the ones no probe navigates, and fail the build on the first one that
 * reintroduces the defect.
 */

const PERSIAN = /[؀-ۿ]/;

function sources(pattern: (path: string) => boolean, dirs = ["app", "components", "lib"]): string[] {
  const out: string[] = [];
  for (const dir of dirs) {
    const walk = (p: string) => {
      for (const entry of readdirSync(p)) {
        if (entry === "node_modules" || entry.startsWith(".")) continue;
        const full = join(p, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (pattern(full)) out.push(full);
      }
    };
    walk(dir);
  }
  return out;
}

const tsxFiles = sources((p) => p.endsWith(".tsx"));
const read = (p: string) => readFileSync(p, "utf8");

/**
 * Comments are prose about the code, including prose that quotes the defect being
 * fixed — the note above `destinationDescription()` says «6 محصول» out loud, to
 * explain why «6 محصول» was wrong. A guard that scans them reports a documentation
 * string as shipped copy, so they come out first.
 */
const stripComments = (text: string) =>
  text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

describe("FR-057 — tracking is not applied to Persian text", () => {
  /**
   * A `tracking-*` utility on an element whose own text node is Persian. Latin-only decorative labels are
   * exempt by the requirement's own wording, so the exemption is expressed as the test's shape: the
   * tracked element's text must contain no Persian.
   *
   * `tracking-normal` is the fix, not the defect, and is excluded.
   */
  const offenders: string[] = [];
  for (const file of tsxFiles) {
    const text = stripComments(read(file));
    for (const match of text.matchAll(/tracking-(?!normal)(?:\[[^\]]+\]|tighter|tight|wide|wider|widest)/g)) {
      const after = text.slice(match.index! + match[0].length, match.index! + match[0].length + 220);
      const ownText = after.split("<")[0];
      if (PERSIAN.test(ownText)) {
        offenders.push(`${file}:${text.slice(0, match.index!).split("\n").length} ${match[0]}`);
      }
    }
  }

  it("finds no tracked Persian string in any component or page", () => {
    expect(offenders).toEqual([]);
  });

  it("keeps the shared label classes free of letter-spacing", () => {
    for (const css of ["app/globals.css", "app/(main)/home.css"]) {
      const text = read(css);
      for (const selector of [".eyebrow", ".section-label"]) {
        const at = text.indexOf(`${selector} {`);
        if (at === -1) continue;
        const block = text.slice(at, text.indexOf("}", at));
        const declared = /letter-spacing:\s*([^;]+);/.exec(block);
        expect(declared === null || /^0(px|em)?$/.test(declared?.[1]?.trim() ?? ""), `${css} ${selector}`).toBe(true);
      }
    }
  });
});

describe("FR-058 — the ZWNJ the keyboard does not type", () => {
  /**
   * «جستجو» without the zero-width non-joiner is the word a Persian keyboard produces and the word that is
   * typographically wrong: it should read «جست‌وجو». Eight sites had it, which is three more than the
   * checklist recorded when it was last counted by hand.
   */
  const offenders: string[] = [];
  for (const file of [...tsxFiles, ...sources((p) => p.endsWith(".ts"), ["lib"])]) {
    stripComments(read(file))
      .split("\n")
      .forEach((line, index) => {
      // «جستجو» as typed, and «جستجو» only where it is the whole word — «جستجو‌ن…» forms do not occur.
      if (/جستجو/.test(line)) offenders.push(`${file}:${index + 1}`);
    });
  }

  it("finds no unwrapped «جستجو» in the shopper-facing sources", () => {
    expect([...new Set(offenders)]).toEqual([]);
  });
});

describe("FR-011 — a number a shopper reads is a Persian numeral", () => {
  /**
   * The class this catches is an interpolation that puts a raw number into Persian copy: `${total} محصول`
   * renders «6 محصول» beside a correctly folded «۶ محصول» two lines away, which is exactly what the
   * destination pages did until `destinationDescription()` existed. Anything going through `toFaDigits`,
   * `toFa` or `toLocaleString("fa-IR")` is fine; a bare `${count}` inside Persian text is not.
   */
  const offenders: string[] = [];
  for (const file of [...tsxFiles, ...sources((p) => p.endsWith(".ts"), ["lib"])]) {
    const text = stripComments(read(file));
    for (const match of text.matchAll(/\$\{([A-Za-z0-9_.?\[\]]+)\}\s*(محصول|محصولات|عدد|درصد|٪|سال|نفر|مورد)/g)) {
      offenders.push(`${file}: \${${match[1]}} ${match[2]}`);
    }
    for (const match of text.matchAll(/(^|[^a-zA-Z])([0-9]+)\s+(محصول|عدد|درصد)/gm)) {
      offenders.push(`${file}: "${match[2]} ${match[3]}"`);
    }
  }

  it("finds no raw numeric interpolation into Persian copy", () => {
    expect([...new Set(offenders)]).toEqual([]);
  });

  it("writes a display ordinal in Persian digits wherever the content module declares one", () => {
    /*
     * `index`, `number` and `ordinal` are not data — they are the numerals a shopper
     * reads next to a Persian sentence («۰۱ موبایل», «۰۲ تأیید»). The B2B steps and the
     * accessory categories carried "01", "02", "03" while the row above them carried
     * «۰۱», so the same page had two numeral systems in the same column, which is the
     * mixed-screen case SC-007 is about. A property name is the only signal that
     * survives scanning, so the rule is written against the name.
     */
    const offenders: string[] = [];
    for (const file of sources((p) => p.endsWith(".ts"), ["lib/content"])) {
      const text = stripComments(read(file));
      for (const match of text.matchAll(/\b(?:index|number|ordinal)\s*:\s*"([^"]*)"/g)) {
        if (/[0-9]/.test(match[1])) offenders.push(`${file}: ${match[1]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("folds the discount badge, the worst case in audits/02", () => {
    const card = read("components/shop/ProductCard.tsx");
    expect(card).toMatch(/toFaDigits\(off\)/);
    expect(card).not.toMatch(/−\{off\}٪/);
  });
});
