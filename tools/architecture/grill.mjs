import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { evaluateDeletionTest, evaluateSeamJustification } from "./metrics.mjs";

/**
 * Known candidates catalogue.
 */
export const CANDIDATES = [
  {
    id: "cand-catalog-projections",
    title: "Consolidate Catalog Projections and Offer Rails",
    affected_files: ["lib/catalog-db.ts", "lib/home-rails-db.ts"],
    domain_terms: [
      {
        term: "Catalog Projection",
        definition:
          "Public-safe product transformation that strips supplier-sensitive fields and encapsulates pricing & availability calculations.",
        owning_module: "lib/catalog-db.ts"
      }
    ]
  },
  {
    id: "cand-session-cart-boundary",
    title: "Unify Storefront Session and Cart Lifecycle",
    affected_files: [
      "components/providers/AuthProvider.tsx",
      "components/providers/CartProvider.tsx"
    ],
    domain_terms: [
      {
        term: "Storefront Session Seam",
        definition:
          "Unified client boundary coordinating user identity lifecycle, token persistence, and cart instance synchronization.",
        owning_module: "components/providers/AuthProvider.tsx"
      }
    ]
  },
  {
    id: "cand-filter-coordination",
    title: "Deepen Catalog Filter and Search Coordination",
    affected_files: [
      "components/shop/FilterSidebar.tsx",
      "components/shop/FilterSheet.tsx",
      "components/shop/ShopResults.tsx"
    ],
    domain_terms: [
      {
        term: "Catalog Filter Coordinator",
        definition:
          "Deep module coordinating URL query state, filter facets, and loading transitions across viewports.",
        owning_module: "components/shop/FilterSidebar.tsx"
      }
    ]
  }
];

/**
 * Updates or adds a domain concept to GLOSSARY.md.
 *
 * @param {{ term: string, definition: string, owning_module?: string }} param0
 * @returns {boolean} True if glossary was updated, false if term already present
 */
export function updateGlossary({ term, definition, owning_module }) {
  const glossaryPath = path.resolve(process.cwd(), "GLOSSARY.md");
  if (!fs.existsSync(glossaryPath)) {
    throw new Error(`GLOSSARY.md not found at ${glossaryPath}`);
  }

  const content = fs.readFileSync(glossaryPath, "utf8");
  const termHeader = `- **${term}**:`;

  if (content.includes(termHeader)) {
    // Term already exists, check if updated
    return false;
  }

  // Append under Business Domain Vocabulary
  const entry = `- **${term}**: ${definition}${owning_module ? ` *(Owning Module: \`${owning_module}\`)*` : ""}\n`;
  const domainHeader = "## 2. Business Domain Vocabulary";

  if (content.includes(domainHeader)) {
    const parts = content.split(domainHeader);
    const updated = parts[0] + domainHeader + "\n\n" + entry + parts[1].replace(/^\n+/, "");
    fs.writeFileSync(glossaryPath, updated, "utf8");
  } else {
    fs.writeFileSync(glossaryPath, content + "\n\n" + entry, "utf8");
  }

  return true;
}

/**
 * Generates an Architectural Decision Record (ADR) in docs/adr/.
 *
 * @param {Object} options
 * @returns {string} Path to the created ADR file
 */
export function generateADR({ title, candidate_id, context, decision, consequences }) {
  const adrDir = path.resolve(process.cwd(), "docs/adr");
  if (!fs.existsSync(adrDir)) {
    fs.mkdirSync(adrDir, { recursive: true });
  }

  const existingFiles = fs.readdirSync(adrDir).filter((f) => f.endsWith(".md"));
  const nextNum = String(existingFiles.length + 1).padStart(3, "0");
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const fileName = `${nextNum}-${slug}.md`;
  const filePath = path.join(adrDir, fileName);

  const adrContent = `# ${nextNum}. ${title}

- **Date**: ${new Date().toISOString().split("T")[0]}
- **Status**: Rejected / Permanent Decision
- **Candidate ID**: ${candidate_id || "N/A"}

## Context
${context || "Evaluated through architecture grilling workflow."}

## Decision
${decision || "Rejected proposal to avoid premature abstraction or unnecessary seams."}

## Consequences
${consequences || "Preserve direct module structure; avoid adding pass-through adapters."}
`;

  fs.writeFileSync(filePath, adrContent, "utf8");
  return filePath;
}

/**
 * Prompts user on readline interface.
 */
function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

/**
 * Interactive / CLI grilling runner.
 */
export async function runGrill(args = {}) {
  const candidateId = args.candidate || "cand-catalog-projections";
  const candidate = CANDIDATES.find((c) => c.id === candidateId);

  if (!candidate) {
    console.error(`Unknown candidate ID: ${candidateId}`);
    console.error(`Available candidates: ${CANDIDATES.map((c) => c.id).join(", ")}`);
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(`  ARCHITECTURAL GRILLING: ${candidate.title}`);
  console.log(`  Candidate ID: ${candidate.id}`);
  console.log(`  Affected Files: ${candidate.affected_files.join(", ")}`);
  console.log(`======================================================\n`);

  let deletionOutcome = args["deletion-test"];
  let adapterCount = args.adapters ? parseInt(args.adapters, 10) : null;
  let decision = args.decision; // "approved" | "rejected"

  const isInteractive = Boolean(process.stdin.isTTY && !args.nonInteractive && !args.approve && !args.reject);

  if (isInteractive) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(`[Step 1: Deletion Test]`);
    console.log(`Question: "If this shallow layer / wrapper is deleted, does complexity concentrate or scatter?"`);
    const delAns = (await ask(rl, `Choose [concentrates / scatters] (default: concentrates): `)).trim().toLowerCase();
    deletionOutcome = delAns === "scatters" ? "scatters_complexity" : "concentrates_complexity";

    console.log(`\n[Step 2: Seam & Adapter Verification]`);
    console.log(`Question: "How many concrete adapters exist or are actively required for this seam?"`);
    const adaptAns = (await ask(rl, `Number of adapters (default: 2): `)).trim();
    adapterCount = adaptAns ? parseInt(adaptAns, 10) : 2;

    console.log(`\n[Step 3: Ratification Decision]`);
    const decAns = (await ask(rl, `Ratify this candidate for deepening? [Y/n]: `)).trim().toLowerCase();
    decision = decAns === "n" || decAns === "no" ? "rejected" : "approved";

    rl.close();
  } else {
    // Non-interactive fallback or programmatic flags
    if (args.reject) decision = "rejected";
    else if (args.approve) decision = "approved";
    else decision = decision || "approved";

    deletionOutcome = deletionOutcome || "concentrates_complexity";
    adapterCount = adapterCount ?? 2;
  }

  const deletionEvaluation = evaluateDeletionTest({
    callersCount: 4,
    isPassThrough: deletionOutcome === "concentrates_complexity"
  });

  const seamEvaluation = evaluateSeamJustification(
    Array.from({ length: adapterCount }, (_, i) => `Adapter_${i + 1}`)
  );

  console.log(`\n--- Evaluation Summary ---`);
  console.log(`Deletion Test: ${deletionOutcome} (${deletionEvaluation.recommendation})`);
  console.log(`Seam Justification: ${seamEvaluation.status} (${seamEvaluation.adapterCount} adapters)`);

  if (decision === "approved") {
    console.log(`\n✓ CANDIDATE APPROVED FOR DEEPENING`);
    if (candidate.domain_terms && candidate.domain_terms.length > 0) {
      for (const dt of candidate.domain_terms) {
        const updated = updateGlossary(dt);
        if (updated) {
          console.log(`✓ Updated GLOSSARY.md with domain concept: "${dt.term}"`);
        } else {
          console.log(`ℹ GLOSSARY.md already includes: "${dt.term}"`);
        }
      }
    }
    return {
      status: "approved",
      candidate,
      deletionEvaluation,
      seamEvaluation
    };
  } else {
    console.log(`\n✗ CANDIDATE REJECTED / SHALLOW SEAM AVOIDED`);
    const adrPath = generateADR({
      title: `Reject premature seam for ${candidate.title}`,
      candidate_id: candidate.id,
      context: `Candidate evaluated during architectural review. Deletion outcome: ${deletionOutcome}. Adapters: ${adapterCount}.`,
      decision: `Do not extract a new abstraction layer; retain direct in-process callers to prevent shallow wrapper proliferation.`,
      consequences: `Maintains low module indirection. Revisit only if 2+ distinct production adapters emerge.`
    });
    console.log(`✓ Recorded permanent architectural decision in: ${adrPath}`);
    return {
      status: "rejected",
      candidate,
      adrPath,
      deletionEvaluation,
      seamEvaluation
    };
  }
}

// CLI execution
if (process.argv[1]?.endsWith("grill.mjs")) {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--candidate" && args[i + 1]) {
      parsed.candidate = args[++i];
    } else if (args[i] === "--approve") {
      parsed.approve = true;
    } else if (args[i] === "--reject") {
      parsed.reject = true;
    } else if (args[i] === "--non-interactive") {
      parsed.nonInteractive = true;
    } else if (args[i] === "--deletion-test" && args[i + 1]) {
      parsed["deletion-test"] = args[++i];
    } else if (args[i] === "--adapters" && args[i + 1]) {
      parsed.adapters = args[++i];
    }
  }

  runGrill(parsed).catch((err) => {
    console.error("Grilling failed:", err);
    process.exit(1);
  });
}

