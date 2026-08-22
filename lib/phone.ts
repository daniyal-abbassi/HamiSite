/** Iranian mobile numbers to E.164. Deliberately duplicates the logic in
 * prisma/legacy-import/normalize.ts rather than importing it — `app/` must not
 * depend on `prisma/legacy-import/`, which is a dev-seed-only pipeline.
 *
 * Anything that isn't recognisably an Iranian mobile is returned untouched, so
 * this is safe to run over a login identifier that might be a username. */
export function normalizeIranianMobile(raw: string): string {
  const trimmed = raw.replace(/[\s-]/g, "");
  if (trimmed.startsWith("+")) return trimmed;
  if (/^09\d{9}$/.test(trimmed)) return `+98${trimmed.slice(1)}`;
  if (/^9\d{9}$/.test(trimmed)) return `+98${trimmed}`;
  return trimmed;
}
