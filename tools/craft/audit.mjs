import fs from "node:fs";
import path from "node:path";
import { scanDirectories } from "./scanner.mjs";
import { validateAuditReport } from "./validate-audit.mjs";

/**
 * Main execution routine for the UI Craft Audit CLI.
 */
export async function runAudit(options = {}) {
  const defaultScopes = ["components", "app"];
  const scopes = options.scope ? [options.scope] : defaultScopes;

  const report = scanDirectories(scopes, options);

  // Validate report structure against JSON schema contract
  const validation = validateAuditReport(report);
  if (!validation.valid) {
    throw new Error(`Report schema validation failed: ${validation.errors.join(", ")}`);
  }

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    if (options.failOnError && !report.passed) {
      process.exit(1);
    }
    return report;
  }

  console.log(`\n======================================================`);
  console.log(`  UI CRAFT AUDIT SCANNER (farsiui.ir/skills/ui-craft-rules)`);
  console.log(`  Scanned: ${report.scanned_files_count} components across ${scopes.join(", ")}`);
  console.log(`======================================================\n`);

  if (report.violations.length === 0) {
    console.log(`✓ 0 craft violations detected. Visual craft and token discipline verified!`);
    return report;
  }

  for (const v of report.violations) {
    const badge = v.severity === "error" ? "✗ [ERROR]" : "⚠ [WARN]";
    console.log(`${badge} ${v.rule_id}`);
    console.log(`  File: ${v.file_path}:${v.line_number}`);
    console.log(`  Snippet: ${v.snippet}`);
    console.log(`  Fix: ${v.suggested_fix}\n`);
  }

  console.log(`--- Summary ---`);
  console.log(`Total Violations: ${report.violations.length}`);
  console.log(`Errors: ${report.summary.errors_count} (must be 0 to pass)`);
  console.log(`Warnings: ${report.summary.warnings_count}`);
  console.log(`Status: ${report.passed ? "PASSED" : "FAILED"}\n`);

  if (options.failOnError && !report.passed) {
    process.exit(1);
  }

  return report;
}

// CLI entry point
if (process.argv[1]?.endsWith("audit.mjs")) {
  const args = process.argv.slice(2);
  const options = {
    json: args.includes("--json"),
    failOnError: args.includes("--fail-on-error"),
    scope: args.find((a, i) => args[i - 1] === "--scope")
  };

  runAudit(options).catch((err) => {
    console.error("Audit failed:", err);
    process.exit(1);
  });
}

