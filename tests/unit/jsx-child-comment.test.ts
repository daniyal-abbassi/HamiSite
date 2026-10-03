import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A `/* … *\/` block written as a JSX **child** is not a comment.
 *
 * Inside a JSX element's children, `/* … *\/` is an expression-less text node: React renders it. Only
 * `{/* … *\/}` is a comment. The difference is one character, and when it is missing the source code
 * becomes page copy — raw English, on a Persian storefront, in front of every shopper.
 *
 * This caught the homepage twice in one day, both times invisible to every other check in the suite:
 *
 *  - `CategoryCarousel.tsx` rendered an eleven-line note about why the panels have no click handler,
 *    **once per department panel**, and the chapter was 482px taller at 360 because of it.
 *  - `StoreExperience.tsx` rendered the note explaining why the AI-lit photograph was removed — which
 *    is the worst possible thing to say, printed under the heading it is about.
 *
 * Both were found by a probe that scores every rendered text node for contrast, and both **passed** the
 * accessibility question: the leaked text was ink on paper at 17.82:1. Nothing in the toolchain objected
 * until something looked at what the page actually says. This test is that look, made permanent.
 *
 * The detector is deliberately narrow: a line that opens a block comment whose previous non-blank line
 * closes a tag. That is child position. It will not fire on a JSDoc above a function (previous line is
 * blank or a declaration) or on a trailing `*\/`.
 */

function tsxFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === "node_modules" || entry === ".next") continue;
    const st = statSync(full);
    if (st.isDirectory()) tsxFiles(full, acc);
    else if (entry.endsWith(".tsx")) acc.push(full);
  }
  return acc;
}

/** The rule itself, over source text so it can be tested against a known leak. */
function leakedChildren(source: string, at = "<source>"): string[] {
  const lines = source.split("\n");
  const found: string[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    if (!/^\s*\/\*/.test(lines[i])) continue;
    let prev = i - 1;
    while (prev >= 0 && lines[prev].trim() === "") prev -= 1;
    if (prev < 0) continue;
    const before = lines[prev].trimEnd();
    // A tag close, or a JSX expression close, immediately above: the comment is a child.
    if (/>\s*$/.test(before) && !/-->$/.test(before)) {
      // Quote the first body line, not the `/*` opener — the point of this message is that a
      // human can tell which sentence leaked onto the page without opening the file.
      const body = (lines[i].replace(/^\s*\/\*\s*/, "").trim() || lines[i + 1]?.replace(/^\s*\*?\s*/, "").trim() || "").slice(0, 60);
      found.push(`${at}:${i + 1}  «${body}» after «${before.slice(-30)}»`);
    }
  }
  return found;
}

function leakedBlockComments(file: string): string[] {
  return leakedChildren(readFileSync(file, "utf8"), file);
}

describe("JSX child position is not a comment", () => {
  const offenders = [...tsxFiles("components"), ...tsxFiles("app")]
    .flatMap(leakedBlockComments)
    .sort();

  it("finds no block comment written as a JSX child", () => {
    expect(offenders).toEqual([]);
  });

  it("still catches the shape that leaked, if it comes back", () => {
    // A gate that cannot fail is not a gate. This is the text that actually reached the page,
    // run through the same detector that missed it.
    const leaked = [
      '      <li className="cat-slide">',
      "        >",
      "        /*",
      "         * Every panel is a destination.",
      "         */",
      "        <Link href=\"/x\" />",
      "      </li>",
    ].join("\n");
    expect(leakedChildren(leaked)).toHaveLength(1);
    expect(leakedChildren(leaked)[0]).toContain("Every panel is a destination");

    // The fixed form — `{/* … */}` — and a JSDoc above a function must both stay quiet.
    const fixed = leaked.replace("        /*", "        {/*").replace("         */", "         */}");
    expect(leakedChildren(fixed)).toEqual([]);
    expect(leakedChildren(["/**", " * JSDoc.", " */", "export function f() {}"].join("\n"))).toEqual([]);
  });
});
