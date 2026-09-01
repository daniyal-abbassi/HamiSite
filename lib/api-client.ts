import type { ApiResponse } from "@/types/api";

/**
 * Thin same-origin REST client for browser components.
 * Unwraps the API envelope and branches on `error.code`, per docs/api/auth.md.
 */
export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function unwrap<T>(response: Response): Promise<T> {
  let body: ApiResponse<T>;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError("INTERNAL_ERROR", response.status, "پاسخ سرور قابل خواندن نبود.");
  }

  if (!body.success) {
    throw new ApiClientError(body.error.code, response.status, body.error.message, body.error.details);
  }
  return body.data;
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...init,
  });
  return unwrap<T>(response);
}

/** Extract the first usable image URL from the product serializer's `images`. */
export function firstProductImage(images: unknown): string | null {
  if (Array.isArray(images)) {
    for (const entry of images) {
      if (typeof entry === "string" && entry.length > 0) return entry;
      if (entry && typeof entry === "object") {
        const url = (entry as { url?: unknown; src?: unknown }).url ?? (entry as { src?: unknown }).src;
        if (typeof url === "string" && url.length > 0) return url;
      }
    }
  }
  return null;
}
