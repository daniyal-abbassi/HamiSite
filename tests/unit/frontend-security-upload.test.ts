import { describe, expect, it } from "vitest";
import { validateUploadFile } from "@/lib/security/upload-validation";

describe("Client File Upload Pre-Validation", () => {
  it("rejects empty or missing file", () => {
    const result = validateUploadFile(null, "catalog-image");
    expect(result.valid).toBe(false);
    expect(result.code).toBe("EMPTY_FILE");
    expect(result.error).toContain("فایلی انتخاب نشده است");
  });

  it("blocks dangerous active script and SVG files", () => {
    const svgFile = new File(["<svg><script>alert(1)</script></svg>"], "malicious.svg", {
      type: "image/svg+xml",
    });
    const svgResult = validateUploadFile(svgFile, "catalog-image");
    expect(svgResult.valid).toBe(false);
    expect(svgResult.code).toBe("DISALLOWED_ACTIVE_CONTENT");

    const htmlFile = new File(["<h1>Phishing</h1>"], "phish.html", {
      type: "text/html",
    });
    const htmlResult = validateUploadFile(htmlFile, "partner-document");
    expect(htmlResult.valid).toBe(false);
    expect(htmlResult.code).toBe("DISALLOWED_ACTIVE_CONTENT");

    const exeFile = new File(["binary"], "tool.exe", {
      type: "application/x-msdownload",
    });
    const exeResult = validateUploadFile(exeFile, "partner-document");
    expect(exeResult.valid).toBe(false);
    expect(exeResult.code).toBe("DISALLOWED_ACTIVE_CONTENT");
  });

  it("enforces catalog image size limits (5MB)", () => {
    const validFile = new File(["a".repeat(1024 * 1024)], "phone.jpg", { type: "image/jpeg" });
    const validResult = validateUploadFile(validFile, "catalog-image");
    expect(validResult.valid).toBe(true);

    const oversizedFile = new File(["a".repeat(6 * 1024 * 1024)], "huge.jpg", {
      type: "image/jpeg",
    });
    const oversizedResult = validateUploadFile(oversizedFile, "catalog-image");
    expect(oversizedResult.valid).toBe(false);
    expect(oversizedResult.code).toBe("TOO_LARGE");
    expect(oversizedResult.error).toContain("۵ مگابایت");
  });

  it("enforces partner document size limits (10MB)", () => {
    const validPdf = new File(["pdf content"], "license.pdf", { type: "application/pdf" });
    const validResult = validateUploadFile(validPdf, "partner-document");
    expect(validResult.valid).toBe(true);

    const oversizedPdf = new File(["a".repeat(11 * 1024 * 1024)], "license.pdf", {
      type: "application/pdf",
    });
    const oversizedResult = validateUploadFile(oversizedPdf, "partner-document");
    expect(oversizedResult.valid).toBe(false);
    expect(oversizedResult.code).toBe("TOO_LARGE");
    expect(oversizedResult.error).toContain("۱۰ مگابایت");
  });

  it("enforces allowed MIME types", () => {
    const textFile = new File(["hello"], "notes.txt", { type: "text/plain" });
    const textResult = validateUploadFile(textFile, "catalog-image");
    expect(textResult.valid).toBe(false);
    expect(textResult.code).toBe("INVALID_TYPE");
  });
});

