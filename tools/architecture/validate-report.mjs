import fs from "node:fs";

/**
 * Validates a report data object against contracts/report-schema.json.
 *
 * @param {Object} report
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateReport(report) {
  const errors = [];

  if (!report || typeof report !== "object") {
    return { valid: false, errors: ["Report must be a non-null object"] };
  }

  // Required top-level fields
  for (const field of ["report_id", "repository_name", "generated_at", "candidates", "top_recommendation"]) {
    if (!report[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (Array.isArray(report.candidates)) {
    if (report.candidates.length === 0) {
      errors.push("Report must contain at least one candidate");
    }

    report.candidates.forEach((cand, idx) => {
      const prefix = `Candidate[${idx}] (${cand.id || "unnamed"}):`;
      for (const req of [
        "id",
        "title",
        "recommendation_strength",
        "dependency_category",
        "affected_files",
        "problem",
        "solution",
        "wins",
        "diagrams"
      ]) {
        if (!cand[req]) {
          errors.push(`${prefix} missing required field '${req}'`);
        }
      }

      if (!["Strong", "Worth exploring", "Speculative"].includes(cand.recommendation_strength)) {
        errors.push(`${prefix} invalid recommendation_strength '${cand.recommendation_strength}'`);
      }

      if (!["in-process", "local-substitutable", "ports & adapters", "mock"].includes(cand.dependency_category)) {
        errors.push(`${prefix} invalid dependency_category '${cand.dependency_category}'`);
      }

      if (!Array.isArray(cand.affected_files) || cand.affected_files.length === 0) {
        errors.push(`${prefix} affected_files must be a non-empty array`);
      }

      if (!Array.isArray(cand.wins) || cand.wins.length === 0) {
        errors.push(`${prefix} wins must be a non-empty array`);
      }

      if (!cand.diagrams || !cand.diagrams.before_mermaid || !cand.diagrams.after_mermaid) {
        errors.push(`${prefix} diagrams must include before_mermaid and after_mermaid`);
      }
    });
  } else {
    errors.push("candidates must be an array");
  }

  if (report.top_recommendation) {
    if (!report.top_recommendation.candidate_id) {
      errors.push("top_recommendation must have candidate_id");
    }
    if (!report.top_recommendation.rationale) {
      errors.push("top_recommendation must have rationale");
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// CLI usage
if (process.argv[1]?.endsWith("validate-report.mjs")) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: node validate-report.mjs <path-to-report.json|path-to-report.html>");
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  let data;
  if (filePath.endsWith(".html") || raw.includes("<script id=\"architecture-report-data\"")) {
    const match = raw.match(/<script id="architecture-report-data" type="application\/json">\s*([\s\S]*?)\s*<\/script>/);
    if (!match) {
      console.error("✗ Failed to extract embedded JSON data from HTML report");
      process.exit(1);
    }
    data = JSON.parse(match[1]);
  } else {
    data = JSON.parse(raw);
  }

  const result = validateReport(data);

  if (result.valid) {
    console.log("✓ Report data conforms to contracts/report-schema.json");
    process.exit(0);
  } else {
    console.error("✗ Schema validation failed with errors:");
    result.errors.forEach((e) => console.error(" - " + e));
    process.exit(1);
  }
}
