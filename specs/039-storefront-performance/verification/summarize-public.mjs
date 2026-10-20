// 039 T004/T013/T024 — summarize a captured public-route phase.
//
// Reads specs/039-storefront-performance/evidence/<phase>-public.json, checks the
// sample contract (five fresh + five returning valid samples per route), and
// applies SC-001 (median content-ready <= 2500 ms) and SC-003 (median CLS <= 0.1)
// to the fresh visits. Percentiles use the data-model rule: sorted index
// ceil(0.95 * n), counted from one.
//
// Usage: node specs/039-storefront-performance/verification/summarize-public.mjs --phase baseline
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, arr) => (a.startsWith("--") ? [[a.slice(2), arr[i + 1]?.startsWith("--") ? true : arr[i + 1] ?? true]] : [])),
);
const PHASE = ["baseline", "final"].includes(args.phase) ? args.phase : "baseline";
const FEATURE = "specs/039-storefront-performance";
const src = args.file ? String(args.file) : `${FEATURE}/evidence/${PHASE}-public.json`;
if (!existsSync(src)) {
  console.error(`missing ${src} — run capture-public.mjs --phase ${PHASE} first`);
  process.exit(2);
}
const data = JSON.parse(readFileSync(src, "utf8"));

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  if (!s.length) return null;
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
const p95 = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.ceil(0.95 * s.length) - 1] : null;
};
const round = (x) => (x == null ? null : Math.round(x));

const routes = [...new Set(data.samples.map((s) => s.route_key))];
const rows = [];
const problems = [];

for (const key of routes) {
  const route = {};
  for (const visit of ["fresh", "returning"]) {
    const all = data.samples.filter((s) => s.route_key === key && s.visit_state === visit);
    const valid = all.filter((s) => s.verification_status === "valid");
    const invalid = all.filter((s) => s.verification_status !== "valid");
    if (valid.length < 5) {
      problems.push(`${key}/${visit}: only ${valid.length}/5 valid samples (${invalid.length} invalid)`);
    }
    for (const s of invalid) problems.push(`${key}/${visit}/${s.sample_id}: invalid — ${s.limitation_reason}`);
    const ready = valid.map((s) => s.content_ready_ms).filter((x) => x != null);
    const lcp = valid.map((s) => s.lcp_ms).filter((x) => x != null);
    route[visit] = {
      n: valid.length,
      content_ready_median_ms: round(median(ready)),
      content_ready_samples_ms: ready,
      lcp_median_ms: round(median(lcp)),
      cls_median: +(() => { const m = median(valid.map((s) => s.cls)); return m == null ? 0 : m.toFixed(4); })(),
      transfer_median_kb: round(median(valid.map((s) => s.transfer_bytes_total)) / 1024),
      request_failures: valid.flatMap((s) => s.request_failures),
    };
  }
  const f = route.fresh;
  const sc001 = f.content_ready_median_ms != null && f.content_ready_median_ms <= 2500;
  const sc003 = f.cls_median <= 0.1;
  rows.push({
    route: key,
    fresh_median_ms: f.content_ready_median_ms,
    fresh_lcp_ms: f.lcp_median_ms,
    fresh_cls: f.cls_median,
    fresh_kb: f.transfer_median_kb,
    returning_median_ms: route.returning.content_ready_median_ms,
    returning_kb: route.returning.transfer_median_kb,
    SC_001: sc001 ? "PASS" : "FAIL",
    SC_003: sc003 ? "PASS" : "FAIL",
    n_fresh: f.n,
    n_returning: route.returning.n,
  });
}

const pad = (s, n) => String(s ?? "-").padEnd(n);
console.log(`\nphase: ${PHASE}   build: ${data.server_build_id}   captured: ${data.captured_at}`);
console.log(`mode: mobile 390x844 DSF3, CPU 4x, 1.6 Mbps / 750 Kbps / 150 ms, fresh = empty HTTP cache\n`);
console.log(`${pad("route", 10)}${pad("fresh med", 11)}${pad("LCP med", 10)}${pad("CLS med", 9)}${pad("KB", 6)}${pad("return med", 12)}${pad("return KB", 11)}${pad("SC-001", 8)}${pad("SC-003", 8)}samples`);
for (const r of rows) {
  console.log(
    pad(r.route, 10) +
    pad(`${r.fresh_median_ms}ms`, 11) +
    pad(`${r.fresh_lcp_ms}ms`, 10) +
    pad(r.fresh_cls, 9) +
    pad(r.fresh_kb, 6) +
    pad(`${r.returning_median_ms}ms`, 12) +
    pad(r.returning_kb, 11) +
    pad(r.SC_001, 8) +
    pad(r.SC_003, 8) +
    `${r.n_fresh}/${r.n_returning}`,
  );
}
console.log(`\nSC-001: median content-ready <= 2500 ms (fresh). SC-003: median CLS <= 0.1 (five fresh visits).`);
const failing = rows.filter((r) => r.SC_001 === "FAIL");
if (failing.length) {
  console.log(`\nRoutes above the SC-001 target (these additionally owe >= 20% relative improvement, not just <= 2500 ms):`);
  for (const r of failing) console.log(`  ${r.route}: ${r.fresh_median_ms} ms`);
}
if (problems.length) {
  console.log(`\nSample-contract problems (${problems.length}):`);
  for (const p of problems) console.log(`  - ${p}`);
} else {
  console.log(`\nSample contract satisfied: 5 fresh + 5 returning valid samples for every route.`);
}

const outFile = args.out ? String(args.out) : `${FEATURE}/evidence/summary-${PHASE}.json`;
writeFileSync(outFile, JSON.stringify({ phase: PHASE, build: data.server_build_id, captured_at: data.captured_at, routes: rows, problems, p95_note: "p95 = sorted[ceil(0.95*n)-1]" }, null, 2));
console.log(`\nwrote ${outFile}`);
process.exit(problems.length ? 1 : 0);
