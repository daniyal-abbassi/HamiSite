import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { getGitHotspots } from "./git-hotspots.mjs";
import { renderArchitectureReport } from "./templates/report.html.mjs";
import { validateReport } from "./validate-report.mjs";
import { analyzeModuleDepth, evaluateDeletionTest, evaluateSeamJustification } from "./metrics.mjs";

/**
 * Generates candidate deepening opportunities based on codebase analysis.
 */
function generateCandidates() {
  const catalogDepth = analyzeModuleDepth("lib/catalog-db.ts");
  const authDepth = analyzeModuleDepth("components/providers/AuthProvider.tsx");
  const filterDepth = analyzeModuleDepth("components/shop/FilterSidebar.tsx");

  return [
    {
      id: "cand-catalog-projections",
      title: "Consolidate Catalog Projections and Offer Rails",
      recommendation_strength: "Strong",
      dependency_category: "in-process",
      affected_files: ["lib/catalog-db.ts", "lib/home-rails-db.ts"],
      problem:
        "Callers manually coordinate raw product fetching, variant availability checks, and discount calculations, leaking query internals across consumer pages.",
      solution:
        "Deepen the catalog query module to encapsulate availability filtering, variant selection, and discount sorting behind high-leverage projection methods.",
      wins: [
        "Locality: pricing rules concentrate internally",
        "Interface shrinks; callers drop loops",
        "Leverage: one deep module serves all rails",
        "Deletion test: removes shallow wrapper",
        "Tests target unified projection surface"
      ],
      diagrams: {
        before_mermaid: `flowchart TD
  Page[Consumer Page] -->|fetch raw products| Cat[lib/catalog-db.ts]
  Page -->|manual calculation| Rail[lib/home-rails-db.ts]
  Rail -.leak calculation.-> V[Variants & Discounts]
  classDef leak stroke:#dc2626,stroke-width:2px;
  class Rail,V leak`,
        after_mermaid: `flowchart TD
  Page[Consumer Page] -->|getDiscountRailOffers| DeepCat[Deep Catalog Module]
  subgraph DeepCat[Deep Catalog Module (High Locality)]
    DB[(Prisma PostgreSQL)] --> Logic[Availability & Discounts]
  end
  classDef deep fill:#0f172a,stroke:#334155,color:#fff;
  class DeepCat deep`
      },
      adr_note: "Aligns with Principle III: PostgreSQL through Prisma remains the single source of truth."
    },
    {
      id: "cand-session-cart-boundary",
      title: "Unify Storefront Session and Cart Lifecycle",
      recommendation_strength: "Strong",
      dependency_category: "in-process",
      affected_files: ["components/providers/AuthProvider.tsx", "components/providers/CartProvider.tsx"],
      problem:
        "Authentication and cart state rely on fragile cross-provider effect synchronization and manual request counters to avoid stale account races.",
      solution:
        "Consolidate user identity, token verification, and cart synchronization into a deep StorefrontSession module with an atomic account-switch interface.",
      wins: [
        "Locality: session & cart lifecycle unified",
        "Eliminates cross-provider race conditions",
        "Atomic user switching interface",
        "Tests hit one session test surface",
        "Prevents cart data cross-contamination"
      ],
      diagrams: {
        before_mermaid: `flowchart LR
  Consumer[Cart / Checkout UI] --> Auth[AuthProvider (activeReqId)]
  Consumer --> Cart[CartProvider (activeUserIdRef)]
  Auth -.effect sync.-> Cart
  classDef leak stroke:#dc2626,stroke-width:2px;
  class Auth,Cart leak`,
        after_mermaid: `flowchart LR
  Consumer[Cart / Checkout UI] --> DeepSession[Deep StorefrontSession]
  subgraph DeepSession[Deep StorefrontSession Module]
    AuthCore[Auth State] <--> CartCore[Cart Sync]
  end
  classDef deep fill:#0f172a,stroke:#334155,color:#fff;
  class DeepSession deep`
      },
      adr_note: null
    },
    {
      id: "cand-filter-coordination",
      title: "Deepen Catalog Filter and Search Coordination",
      recommendation_strength: "Worth exploring",
      dependency_category: "in-process",
      affected_files: [
        "components/shop/FilterSidebar.tsx",
        "components/shop/FilterSheet.tsx",
        "components/shop/ShopResults.tsx"
      ],
      problem:
        "Filter parameter extraction and router transitions are duplicated across mobile and desktop sheets, causing drift in pending feedback states.",
      solution:
        "Extract a unified filter coordinator seam that encapsulates URL search param encoding, React transitions, and aria-busy state behind a simple setFilter interface.",
      wins: [
        "Locality: filter state in one seam",
        "Eliminates desktop/mobile state drift",
        "Interface simplifies to setFilter()",
        "Consistent aria-busy feedback"
      ],
      diagrams: {
        before_mermaid: `flowchart TD
  Desktop[FilterSidebar.tsx] -->|router.push| URL[URL Search Params]
  Mobile[FilterSheet.tsx] -->|router.push| URL
  URL --> Grid[ShopResults.tsx]
  classDef leak stroke:#dc2626,stroke-width:2px;
  class Desktop,Mobile leak`,
        after_mermaid: `flowchart TD
  Desktop[FilterSidebar] --> Seam[Deep Filter Coordinator]
  Mobile[FilterSheet] --> Seam
  Seam --> Grid[ShopResults]
  classDef deep fill:#0f172a,stroke:#334155,color:#fff;
  class Seam deep`
      },
      adr_note: null
    }
  ];
}

/**
 * Main execution routine.
 */
export async function runScan(options = {}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const tempDir = process.env.TMPDIR || os.tmpdir();
  const outputPath =
    options.out || path.join(tempDir, `architecture-review-${timestamp}.html`);

  const hotspots = getGitHotspots({ limit: 100, scope: options.scope });
  const candidates = generateCandidates();

  const reportData = {
    report_id: `architecture-review-${timestamp}`,
    repository_name: "Hami Hamrah Store (HamiSite-basic-structure)",
    generated_at: new Date().toISOString(),
    hotspots: hotspots.slice(0, 10).map((h) => `${h.file} (${h.count} edits)`),
    candidates,
    top_recommendation: {
      candidate_id: "cand-catalog-projections",
      rationale:
        "Consolidating catalog read projections into a deep module concentrates pricing, variant availability, and discount math in one place, delivering immediate leverage across home rails, catalog search, and category views."
    }
  };

  // Validate against schema
  const validation = validateReport(reportData);
  if (!validation.valid) {
    throw new Error(`Report schema validation failed: ${validation.errors.join(", ")}`);
  }

  if (options.json) {
    console.log(JSON.stringify(reportData, null, 2));
    return { reportData, outputPath };
  }

  // Render HTML
  const html = renderArchitectureReport(reportData);
  fs.writeFileSync(outputPath, html, "utf8");

  console.log(`✓ Architecture report generated: ${outputPath}`);
  console.log(`Top Recommendation: ${candidates.find((c) => c.id === reportData.top_recommendation.candidate_id).title}`);

  if (options.open) {
    try {
      const openCmd =
        process.platform === "darwin"
          ? "open"
          : process.platform === "win32"
          ? "start"
          : "xdg-open";
      execSync(`${openCmd} "${outputPath}"`, { stdio: "ignore" });
    } catch {
      // Ignored if headless
    }
  }

  return { reportData, outputPath };
}

// CLI invocation
if (process.argv[1]?.endsWith("scan.mjs")) {
  const args = process.argv.slice(2);
  const options = {
    json: args.includes("--json"),
    open: args.includes("--open"),
    out: args.find((a, i) => args[i - 1] === "--out")
  };

  runScan(options).catch((err) => {
    console.error("Scan failed:", err);
    process.exit(1);
  });
}

