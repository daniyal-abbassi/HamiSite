/** Stable, machine-readable failure codes. NEVER remove or repurpose a member —
 * frontends branch on these. Adding a member is backwards-compatible. */
export type ApiErrorCode =
  // 400
  | "BAD_REQUEST"
  | "VALIDATION_FAILED"
  | "MALFORMED_JSON"
  | "INVALID_CURRENT_PASSWORD"
  // 401
  | "AUTH_REQUIRED"
  | "INVALID_CREDENTIALS"
  // 403
  | "FORBIDDEN"
  | "FORBIDDEN_ROLE"
  | "ACCOUNT_DEACTIVATED"
  // 404 / 409
  | "NOT_FOUND"
  | "CONFLICT"
  | "DUPLICATE_ACCOUNT"
  // 5xx
  | "INTERNAL_ERROR";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiFailure = {
  success: false;
  error: {
    message: string;
    /** Always present. Branch on this, never on `message`. */
    code: ApiErrorCode;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
