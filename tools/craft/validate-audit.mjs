import fs from "node:fs";

/**
 * Validates a CraftAuditReport object against contracts/craft-rules-schema.json.
 *
 * @param {Object} report
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAuditReport(report) {
  const errors = [];

  if (!report || typeof report !== "object") {
    return { valid: false, errors: ["Report must be a non-null object"] };
  }

  for (const field of ["timestamp", "scanned_files_count", "violations", "passed", "summary"]) {
    if (report[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (typeof report.scanned_files_count !== "number" || report.scanned_files_count < 0) {
    errors.push("scanned_files_count must be a non-negative number");
  }

  if (!Array.isArray(report.violations)) {
    errors.push("violations must be an array");
  } else {
    report.violations.forEach((v, idx) => {
      const prefix = `Violation[${idx}]:`;
      for (const req of ["rule_id", "file_path", "line_number", "severity", "snippet", "suggested_fix"]) {
        if (!v[req]) {
          errors.push(`${prefix} missing required field '${req}'`);
        }
      }
      if (v.severity && !["error", "warning"].includes(v.severity)) {
        errors.push(`${prefix} invalid severity '${v.severity}'`);
      }
    });
  }

  if (!report.summary || typeof report.summary !== "object") {
    errors.push("summary must be an object");
  } else {
    if (typeof report.summary.errors_count !== "number") errors.push("summary.errors_count must be a number");
    if (typeof report.summary.warnings_count !== "number") errors.push("summary.warnings_count must be a number");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// CLI usage
if (process.argv[1]?.endsWith("validate-audit.mjs")) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: node validate-audit.mjs <path-to-report.json>");
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  const result = validateAuditReport(data);

  if (result.valid) {
    console.log("✓ Audit report data conforms to contracts/craft-rules-schema.json");
    process.exit(0);
  } else {
    console.error("✗ Schema validation failed with errors:");
    result.errors.forEach((e) => console.error(" - " + e));
    process.exit(1);
  }
}

