/**
 * Generates a self-contained visual HTML report for architectural review.
 * Follows the design specifications in HTML-REPORT.md.
 *
 * @param {import('../contracts/report-schema.json')} data
 * @returns {string} Complete HTML markup
 */
export function renderArchitectureReport(data) {
  const { repository_name, generated_at, candidates, top_recommendation } = data;

  function renderBadge(strength) {
    if (strength === "Strong") {
      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Strong</span>`;
    }
    if (strength === "Worth exploring") {
      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Worth exploring</span>`;
    }
    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">Speculative</span>`;
  }

  function renderCategoryBadge(category) {
    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200">${category}</span>`;
  }

  const candidateCards = candidates
    .map((c) => {
      const isTop = c.id === top_recommendation.candidate_id;
      return `
      <article id="${c.id}" class="rounded-xl border ${
        isTop ? "border-indigo-400 ring-2 ring-indigo-200 shadow-md" : "border-slate-200"
      } bg-white p-6 space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="space-y-1">
            <h3 class="text-xl font-bold text-slate-900">${c.title}</h3>
            <div class="flex items-center gap-2">
              ${renderBadge(c.recommendation_strength)}
              ${renderCategoryBadge(c.dependency_category)}
            </div>
          </div>
          ${
            isTop
              ? `<span class="px-3 py-1 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider rounded-md">Top Pick</span>`
              : ""
          }
        </div>

        <div>
          <h4 class="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">Involved Modules</h4>
          <ul class="flex flex-wrap gap-2">
            ${c.affected_files
              .map(
                (f) =>
                  `<li class="font-mono text-xs bg-stone-100 text-stone-700 px-2 py-1 rounded border border-stone-200">${f}</li>`
              )
              .join("")}
          </ul>
        </div>

        <!-- Before / After Side-by-Side Visuals -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="rounded-lg border border-red-200 bg-red-50/20 p-4">
            <div class="text-xs font-bold uppercase tracking-wider text-red-700 mb-2">Before: Shallow / Leaking</div>
            <pre class="mermaid">
${c.diagrams.before_mermaid}
            </pre>
          </div>
          <div class="rounded-lg border border-emerald-200 bg-emerald-50/20 p-4">
            <div class="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">After: Deepened Module</div>
            <pre class="mermaid">
${c.diagrams.after_mermaid}
            </pre>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div class="p-3 bg-stone-50 rounded border border-stone-200">
            <span class="font-semibold text-slate-800">Problem:</span> ${c.problem}
          </div>
          <div class="p-3 bg-stone-50 rounded border border-stone-200">
            <span class="font-semibold text-slate-800">Solution:</span> ${c.solution}
          </div>
        </div>

        <div>
          <h4 class="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">Architectural Wins</h4>
          <ul class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            ${c.wins
              .map(
                (w) =>
                  `<li class="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded">
                    <svg class="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    <span>${w}</span>
                  </li>`
              )
              .join("")}
          </ul>
        </div>

        ${
          c.adr_note
            ? `<div class="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded text-xs">
                <strong>ADR Note:</strong> ${c.adr_note}
               </div>`
            : ""
        }
      </article>`;
    })
    .join("\n");

  const topCandidate = candidates.find((c) => c.id === top_recommendation.candidate_id);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Architecture Review for ${repository_name}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
    <style>
      .seam { stroke-dasharray: 4 4; }
      .leak { stroke: #dc2626; stroke-width: 2px; }
      .deep { background: linear-gradient(135deg, #0f172a, #1e293b); color: #f8fafc; }
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans antialiased">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <!-- Header -->
      <header class="border-b border-slate-200 pb-8 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">
              Architecture Review: ${repository_name}
            </h1>
            <p class="text-sm text-slate-500 mt-1">Generated: ${new Date(
              generated_at
            ).toLocaleString()}</p>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex flex-wrap items-center gap-6 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
          <span class="font-semibold text-slate-800">Legend:</span>
          <span class="inline-flex items-center gap-1.5">
            <span class="w-3.5 h-3.5 border border-slate-400 bg-slate-100 rounded-sm"></span> Module
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="w-4 h-0 border-t border-dashed border-slate-500"></span> Seam
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="w-3.5 h-3.5 bg-red-100 border border-red-400 text-red-600 font-bold rounded-sm text-center leading-none">!</span> Leaking Seam
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="w-3.5 h-3.5 bg-slate-900 rounded-sm"></span> Deep Module
          </span>
        </div>
      </header>

      <!-- Top Recommendation Section -->
      ${
        topCandidate
          ? `
      <section id="top-recommendation" class="p-6 rounded-xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white space-y-3 shadow-lg">
        <div class="flex items-center justify-between">
          <span class="text-xs uppercase tracking-wider font-bold text-indigo-300">Top Architectural Recommendation</span>
          <a href="#${topCandidate.id}" class="text-xs text-indigo-200 hover:text-white underline">Jump to details &darr;</a>
        </div>
        <h2 class="text-2xl font-bold">${topCandidate.title}</h2>
        <p class="text-slate-300 text-sm leading-relaxed">${top_recommendation.rationale}</p>
      </section>`
          : ""
      }

      <!-- Candidate Deepening Cards -->
      <section id="candidates" class="space-y-10">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-slate-900">Deepening Opportunities</h2>
          <span class="text-sm text-slate-500">${candidates.length} candidates identified</span>
        </div>
        <div class="space-y-8">
          ${candidateCards}
        </div>
      </section>

      <!-- Footer -->
      <footer class="pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
        Generated with improve-codebase-architecture skill • Based on Ousterhout Design Principles
      </footer>
    </main>
    <script id="architecture-report-data" type="application/json">
${JSON.stringify(data, null, 2)}
    </script>
  </body>
</html>`;
}
