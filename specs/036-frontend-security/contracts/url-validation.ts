export interface UrlValidationContract {
  /**
   * Validates that a raw URL uses a safe protocol (http: or https:).
   * Rejects javascript:, data:, vbscript:, and invalid strings.
   */
  safeHttpUrl(raw: string | null | undefined): string | null;

  /**
   * Validates an internal return/next path.
   * Strictly requires a single leading slash, rejecting protocol-relative URLs (//)
   * backslash bypasses (/\), external hosts, and control characters.
   */
  safeRedirectPath(raw: string | null | undefined, fallback?: string): string;
}

