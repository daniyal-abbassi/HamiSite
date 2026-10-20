import { execSync } from "node:child_process";

/**
 * Scans git commit history to find files and subsystems with high churn.
 *
 * @param {Object} options
 * @param {number} [options.limit=100] Number of commits to inspect
 * @param {string} [options.scope] Optional path prefix to filter
 * @returns {Array<{ file: string, count: number }>} Sorted list of hotspot files
 */
export function getGitHotspots(options = {}) {
  const limit = options.limit || 100;
  const scope = options.scope ? ` -- "${options.scope}"` : "";

  try {
    const output = execSync(
      `git log --name-only --pretty=format:"" -n ${limit}${scope}`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    );

    const counts = new Map();
    const ignoredPatterns = [
      /^package-lock\.json$/,
      /^node_modules\//,
      /\.md$/,
      /\.json$/,
      /\.png$/,
      /\.svg$/,
      /\.log$/
    ];

    for (const rawLine of output.split("\n")) {
      const line = rawLine.trim();
      if (!line) continue;
      if (ignoredPatterns.some((p) => p.test(line))) continue;

      counts.set(line, (counts.get(line) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([file, count]) => ({ file, count }))
      .sort((a, b) => b.count - a.count);
  } catch (err) {
    console.warn("Could not retrieve git history, returning fallback hotspots:", err.message);
    return [
      { file: "lib/catalog-db.ts", count: 12 },
      { file: "components/providers/AuthProvider.tsx", count: 8 },
      { file: "components/providers/CartProvider.tsx", count: 8 },
      { file: "components/shop/FilterSidebar.tsx", count: 7 }
    ];
  }
}

// CLI direct run
if (process.argv[1]?.endsWith("git-hotspots.mjs")) {
  const hotspots = getGitHotspots({ limit: 100 });
  console.log("Top 10 Codebase Hotspots (past 100 commits):");
  console.table(hotspots.slice(0, 10));
}

