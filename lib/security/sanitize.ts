import DOMPurify from "isomorphic-dompurify";

export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  allowedSchemes?: RegExp;
}

const DEFAULT_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "ul",
  "ol",
  "li",
  "a",
  "code",
  "pre",
  "span",
];

const DEFAULT_ALLOWED_ATTR = ["href", "title", "target", "rel", "class"];

/**
 * Sanitizes an untrusted HTML string using isomorphic DOMPurify with an allowlist.
 * Ensures dangerous tags (script, iframe, object, form) and inline event handlers (onload, onerror)
 * are completely stripped.
 */
export function sanitizeHtml(dirty: string | null | undefined, options?: SanitizeOptions): string {
  if (!dirty || typeof dirty !== "string") return "";

  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: options?.allowedTags ?? DEFAULT_ALLOWED_TAGS,
    ALLOWED_ATTR: options?.allowedAttributes ?? DEFAULT_ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: options?.allowedSchemes ?? /^(?:https?:|mailto:|\/(?!\/))/i,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });

  return String(clean);
}

