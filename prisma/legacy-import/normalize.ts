// Shared "legacy data needs normalizing before it touches our schema" helpers,
// used by multiple legacy-import modules (products, customers, orders).

export function normalizeUniqueText(value: string | null | undefined): string | null {
  return value ? value : null;
}

export function normalizePhoneNumber(raw: string): string {
  if (raw.startsWith("+")) return raw;
  return `+98${raw.replace(/^0/, "")}`;
}
