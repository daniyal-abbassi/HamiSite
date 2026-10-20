import fs from "node:fs";
import path from "node:path";
import { CRAFT_RULES } from "./rules.mjs";

/**
 * Recursively retrieves all .tsx and .jsx files in a directory.
 */
export function getComponentFiles(dirPath) {
  const results = [];
  if (!fs.existsSync(dirPath)) return results;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name !== "node_modules" &&
        entry.name !== ".next" &&
        entry.name !== "coverage" &&
        entry.name !== ".git" &&
        entry.name !== "admin"
      ) {
        results.push(...getComponentFiles(fullPath));
      }
    } else if (/\.(tsx|jsx)$/.test(entry.name) && !entry.name.includes(".test.")) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Computes line number from character index in a file.
 */
function getLineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

/**
 * Scans a single file against all craft rules.
 *
 * @param {string} filePath
 * @param {typeof CRAFT_RULES} [rules]
 * @returns {Array<import('./rules.mjs').CraftViolation>}
 */
export function scanFile(filePath, rules = CRAFT_RULES) {
  const content = fs.readFileSync(filePath, "utf8");
  const violations = [];
  const relativePath = path.relative(process.cwd(), filePath);

  for (const rule of rules) {
    if (!rule.pattern) continue;

    // Reset regex index
    rule.pattern.lastIndex = 0;
    let match;

    while ((match = rule.pattern.exec(content)) !== null) {
      const matchIndex = match.index;
      const lineNumber = getLineNumber(content, matchIndex);

      // If rule defines a custom validator function, test it
      if (rule.validator && !rule.validator(match[0], match[1] || match[0], content, matchIndex)) {
        continue;
      }

      const snippet = match[0].trim();
      const fix = rule.suggestedFix
        ? rule.suggestedFix(match[0], match[1], match[2])
        : "Follow design system guidelines";

      violations.push({
        rule_id: rule.id,
        file_path: relativePath,
        line_number: lineNumber,
        severity: rule.severity,
        snippet,
        suggested_fix: fix
      });
    }
  }

  return violations;
}

/**
 * Scans a list of files or directories and returns a full audit report data.
 *
 * @param {string[]} paths
 * @param {Object} [options]
 * @returns {Object}
 */
export function scanDirectories(paths, options = {}) {
  const allFiles = [];
  for (const p of paths) {
    const resolved = path.resolve(process.cwd(), p);
    if (fs.existsSync(resolved)) {
      const stat = fs.statSync(resolved);
      if (stat.isDirectory()) {
        allFiles.push(...getComponentFiles(resolved));
      } else if (/\.(tsx|jsx)$/.test(resolved)) {
        allFiles.push(resolved);
      }
    }
  }

  const uniqueFiles = [...new Set(allFiles)];
  const allViolations = [];

  for (const file of uniqueFiles) {
    const fileViolations = scanFile(file);
    allViolations.push(...fileViolations);
  }

  const errors = allViolations.filter((v) => v.severity === "error");
  const warnings = allViolations.filter((v) => v.severity === "warning");

  return {
    timestamp: new Date().toISOString(),
    scanned_files_count: uniqueFiles.length,
    passed: errors.length === 0,
    violations: allViolations,
    summary: {
      errors_count: errors.length,
      warnings_count: warnings.length
    }
  };
}
