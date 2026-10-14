# Data Model: Frontend Security Hardening

**Feature**: [spec.md](spec.md) | **Branch**: `036-frontend-security` | **Persistence**: No database schema change required.

## Entity Definitions & Type Contracts

This feature operates at the HTTP boundary, browser runtime, and client component interfaces. It introduces typed security structures without altering PostgreSQL tables.

### 1. Security Headers & CSP Configuration

```typescript
export interface CspOptions {
  nonce: string;
  isDev: boolean;
  isTma: boolean;
}

export interface SecurityHeaderEntry {
  key: string;
  value: string;
}

export interface SecurityPolicyConfig {
  csp: string;
  nonce: string;
  headers: Record<string, string>;
}
```

### 2. URL and Redirect Targets

```typescript
export interface SafeRedirectResult {
  path: string;
  isValid: boolean;
  fallbackUsed: boolean;
}

export interface SafeUrlResult {
  url: string | null;
  protocol: "http:" | "https:" | "mailto:" | null;
  isSafe: boolean;
}
```

### 3. File Upload Constraints & Validation Results

```typescript
export type UploadCategory = "catalog-image" | "partner-document";

export interface UploadConstraints {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  disallowedExtensions: string[];
  category: UploadCategory;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string; // Persian localized error message
  code?: "TOO_LARGE" | "INVALID_TYPE" | "DISALLOWED_ACTIVE_CONTENT" | "EMPTY_FILE";
}
```

### 4. HTML & Content Sanitization

```typescript
export interface SanitizeHtmlOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  allowedUriRegExp?: RegExp;
}
```

