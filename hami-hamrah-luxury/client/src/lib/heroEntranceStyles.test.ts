import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const stylesheetPath = fileURLToPath(new URL("../index.css", import.meta.url));
const stylesheet = readFileSync(stylesheetPath, "utf8");

describe("Hero Entrance Motion", () => {
  it("keeps Hero typography sharp throughout the cinematic entrance", () => {
    const entranceRule = stylesheet.match(
      /\.hami-home \.hero-eyebrow,[\s\S]*?will-change: opacity, transform; \}/,
    )?.[0];
    const keyframes = stylesheet.match(
      /@keyframes hh-cinematic-enter \{[\s\S]*?\n?\}/,
    )?.[0];

    expect(entranceRule).toBeDefined();
    expect(keyframes).toBeDefined();
    expect(entranceRule).not.toContain("filter: blur(");
    expect(keyframes).not.toContain("filter: blur(");
    expect(keyframes).not.toContain("translate3d(0, -");
  });
});
