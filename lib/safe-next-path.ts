const NEXT_PATH_ORIGIN = "https://hami.invalid";

/** Keep post-auth redirects on this site, with `/` as the safe default. */
export function safeNextPath(candidate: string | null | undefined): string {
  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(candidate)
  ) {
    return "/";
  }

  try {
    const url = new URL(candidate, NEXT_PATH_ORIGIN);
    if (url.origin !== NEXT_PATH_ORIGIN) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
