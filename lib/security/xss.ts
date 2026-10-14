/**
 * Serializes and escapes structured data for safe inclusion in <script type="application/ld+json">
 * or serialized inline script blocks, escaping `<` characters to prevent script breakouts (`</script>`).
 */
export function escapeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

