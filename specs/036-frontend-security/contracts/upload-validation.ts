export type UploadContext = "catalog-image" | "partner-document";

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  code?: "TOO_LARGE" | "INVALID_TYPE" | "DISALLOWED_ACTIVE_CONTENT" | "EMPTY_FILE";
}

export interface UploadValidationContract {
  /**
   * Validates a client-selected file before network transfer.
   * Checks file size against contextual cap, verifies MIME type, and forbids active SVG/HTML/executable types.
   */
  validateUploadFile(file: File | null | undefined, context: UploadContext): FileValidationResult;
}

