import { NextResponse } from "next/server";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function fail(status: number, message: string, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status },
  );
}

export async function withErrorHandling(handler: () => Promise<NextResponse>) {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.status, error.message, error.details);
    }

    console.error("Unhandled API error", error);
    return fail(500, "Internal server error");
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
