import fs from "node:fs";

/**
 * Analyzes a TypeScript/JavaScript file for module interface depth.
 * Deep modules have few exports (small interface) relative to implementation size.
 * Shallow modules have many exports or exports that mirror internal functions directly.
 *
 * @param {string} filePath
 * @returns {{ lineCount: number, exportCount: number, depthRatio: number, isShallow: boolean }}
 */
export function analyzeModuleDepth(filePath) {
  if (!fs.existsSync(filePath)) {
    return { lineCount: 0, exportCount: 0, depthRatio: 1, isShallow: false };
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  const lineCount = lines.length;

  const exportMatches = content.match(/export\s+(const|function|class|type|interface|default|async\s+function)/g) || [];
  const exportCount = exportMatches.length;

  // Depth ratio = implementation lines per exported entity
  const depthRatio = exportCount > 0 ? lineCount / exportCount : lineCount;
  // A module is considered shallow if it has high export density (< 20 lines per export)
  const isShallow = exportCount >= 3 && depthRatio < 25;

  return {
    lineCount,
    exportCount,
    depthRatio: Math.round(depthRatio * 10) / 10,
    isShallow
  };
}

/**
 * Evaluates whether an abstraction seam is justified by existing adapters.
 * Rule: "One adapter = hypothetical seam; two = real seam."
 *
 * @param {string[]} adapters List of adapter names or implementations
 * @returns {{ adapterCount: number, isJustified: boolean, status: string }}
 */
export function evaluateSeamJustification(adapters) {
  const adapterCount = adapters.length;
  const isJustified = adapterCount >= 2;
  const status =
    adapterCount >= 2
      ? "Real seam (multi-adapter)"
      : adapterCount === 1
      ? "Hypothetical seam (single adapter)"
      : "Leaking / No adapter";

  return {
    adapterCount,
    isJustified,
    status
  };
}

/**
 * Simulates the deletion test on a module.
 *
 * @param {Object} moduleDetails
 * @param {number} moduleDetails.callersCount Number of call sites
 * @param {boolean} moduleDetails.isPassThrough Whether module mostly forwards arguments
 * @returns {{ outcome: "concentrates_complexity" | "scatters_complexity", recommendation: string }}
 */
export function evaluateDeletionTest({ callersCount, isPassThrough }) {
  if (isPassThrough) {
    return {
      outcome: "concentrates_complexity",
      recommendation: "Collapsing or deleting this module concentrates logic directly into callers/deep module."
    };
  }

  if (callersCount > 5) {
    return {
      outcome: "scatters_complexity",
      recommendation: "Retain module: deleting would scatter common logic across callers."
    };
  }

  return {
    outcome: "concentrates_complexity",
    recommendation: "Candidate for consolidation."
  };
}

