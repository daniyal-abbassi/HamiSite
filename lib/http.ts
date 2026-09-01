import { NextResponse } from "next/server";
import type { z } from "zod";
import type { ApiErrorCode } from "@/types/api";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  /** Optional stable failure code. When omitted, `withErrorHandling` derives one
   * from `status` (see STATUS_FALLBACK_CODES) — that's what lets every route
   * that doesn't opt in gain a code without a single edit. */
  code?: ApiErrorCode;

  constructor(status: number, message: string, details?: unknown, code?: ApiErrorCode) {
    super(message);
    this.status = status;
    this.details = details;
    this.code = code;
  }

  /** Ergonomic form for the common "coded, no details" case — avoids
   * `new ApiError(401, "…", undefined, "INVALID_CREDENTIALS")`. */
  static coded(status: number, code: ApiErrorCode, message: string, details?: unknown) {
    return new ApiError(status, message, details, code);
  }
}

const STATUS_FALLBACK_CODES: Record<number, ApiErrorCode> = {
  400: "BAD_REQUEST",
  401: "AUTH_REQUIRED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
};

export function codeForStatus(status: number): ApiErrorCode {
  return STATUS_FALLBACK_CODES[status] ?? (status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST");
}

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function fail(status: number, message: string, details?: unknown, code?: ApiErrorCode) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code: code ?? codeForStatus(status),
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status },
  );
}

/** Reads a JSON body, turning a malformed one into a 400 instead of the
 * SyntaxError -> 500 that a bare `await request.json()` produces.
 *
 * Deliberately NOT implemented as a `catch (SyntaxError)` inside
 * withErrorHandling: that would launder a genuine SyntaxError from anywhere
 * else in a handler into a client-facing 400 and stop it reaching console.error,
 * trading a loud server bug for a silent one. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw ApiError.coded(400, "MALFORMED_JSON", "Request body must be valid JSON");
  }
}

/** readJson + zod, collapsing the parse/throw dance every route repeats and
 * guaranteeing one VALIDATION_FAILED shape across the whole API. */
export async function parseJsonBody<S extends z.ZodTypeAny>(
  request: Request,
  schema: S,
): Promise<z.infer<S>> {
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) {
    throw ApiError.coded(400, "VALIDATION_FAILED", "Invalid request body", parsed.error.flatten());
  }
  return parsed.data;
}

export async function withErrorHandling(handler: () => Promise<NextResponse>) {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.status, error.message, error.details, error.code);
    }

    console.error("Unhandled API error", error);
    return fail(500, "Internal server error", undefined, "INTERNAL_ERROR");
  }
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSizeRaw = Number(searchParams.get("pageSize") ?? 20);
  const pageSize = Math.min(100, Math.max(1, pageSizeRaw));

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}
