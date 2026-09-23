import { toLatinDigits } from "@/lib/validators";

/** Iranian mobile numbers to E.164. Deliberately duplicates the logic in
 * prisma/legacy-import/normalize.ts rather than importing it — `app/` must not
 * depend on `prisma/legacy-import/`, which is a dev-seed-only pipeline.
 *
 * Anything that isn't recognisably an Iranian mobile is returned untouched, so
 * this is safe to run over a login identifier that might be a username. */
export function normalizeIranianMobile(raw: string): string {
  // FR-062: fold the digit shapes first, because the site displays Persian digits and a
  // shopper pastes back what they saw, and accept the `0098` trunk-dial form for the
  // same reason — it is what a number looks like when it comes out of a contact card.
  const trimmed = toLatinDigits(raw).replace(/[\s-]/g, "");
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("0098")) return `+${trimmed.slice(2)}`;
  if (/^09\d{9}$/.test(trimmed)) return `+98${trimmed.slice(1)}`;
  if (/^9\d{9}$/.test(trimmed)) return `+98${trimmed}`;
  return trimmed;
}
