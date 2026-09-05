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

/** Like `apiGet`, but also surfaces the envelope's `meta` (pagination, totals…). */
export async function apiGetWithMeta<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; meta: Record<string, unknown> | undefined }> {
  const response = await fetch(path, { credentials: "same-origin", ...init });
  let body: ApiResponse<T>;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError("INTERNAL_ERROR", response.status, "پاسخ سرور قابل خواندن نبود.");
  }
  if (!body.success) {
    throw new ApiClientError(body.error.code, response.status, body.error.message, body.error.details);
  }
  return { data: body.data, meta: body.meta };
}

/** JSON body mutation helper — POST/PATCH/PUT/DELETE with the same envelope
 * unwrapping as `apiGet`. `credentials: "same-origin"` keeps the httpOnly
 * session cookie flowing (the only auth mechanism — no header/token exists). */
export async function apiMutate<T>(
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    ...(body !== undefined
      ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      : {}),
  });
  return unwrap<T>(response);
}

export const apiPost = <T,>(path: string, body?: unknown) => apiMutate<T>("POST", path, body);
export const apiPatch = <T,>(path: string, body?: unknown) => apiMutate<T>("PATCH", path, body);
export const apiDelete = <T,>(path: string) => apiMutate<T>("DELETE", path);
