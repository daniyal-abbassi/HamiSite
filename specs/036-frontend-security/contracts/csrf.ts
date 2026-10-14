export interface CsrfValidationContract {
  /**
   * Asserts that a state-changing mutation request originates from the same origin or allowed origin.
   * Compares the Origin and Referer headers against expected site origin and request host.
   * Throws 403 ApiError if origin mismatch is detected.
   */
  assertSameOrigin(request: Request, allowedOrigins?: string[]): void;
}

