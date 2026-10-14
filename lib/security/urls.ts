const DUMMY_ORIGIN = "https://hami.invalid";

/**
 * Validates that an arbitrary string is a safe HTTP or HTTPS URL.
 * Rejects javascript:, data:, vbscript:, blob:, and malformed strings.
 */
export function safeHttpUrl(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * Validates a redirect or return path.
 * Strictly requires a single leading slash, rejecting protocol-relative URLs (`//`),
 * backslash tricks (`/\`), external origins, and control characters.
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw || typeof raw !== "string") return fallback;

  if (
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    raw.startsWith("/\\") ||
    raw.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(raw)
  ) {
    return fallback;
  }

  try {
    const url = new URL(raw, DUMMY_ORIGIN);
    if (url.origin !== DUMMY_ORIGIN) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
