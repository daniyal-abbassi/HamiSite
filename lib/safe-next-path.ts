import { safeRedirectPath } from "@/lib/security/urls";

/**
 * Keep post-auth redirects on this site, with `/` as the safe default.
 * Harmonized with lib/security/urls.ts safeRedirectPath.
 */
export function safeNextPath(candidate: string | null | undefined): string {
  return safeRedirectPath(candidate, "/");
}
