import { describe, expect, it } from "vitest";

import {
  createEvidenceObjectKey,
  EVIDENCE_MAX_FILE_BYTES,
  type EvidenceFileDeclaration,
  evidenceObjectKeyFromStorageUrl,
  evidenceStorageUrl,
  originalEvidenceFileName,
  validateEvidenceFileDeclaration,
  validateUploadedEvidenceObject,
} from "./evidence-upload-policy";

const UUID_PREFIX_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/;

function makeDeclaration(declaration: Partial<EvidenceFileDeclaration>) {
  return {
    fileName: "receipt.pdf",
    contentType: "application/pdf",
    size: 1024,
    ...declaration,
  };
}

describe("evidence file acceptance", () => {
  it("accepts a PDF declaration", () => {
    expect(
      validateEvidenceFileDeclaration(makeDeclaration({})),
    ).toBeUndefined();
  });

  it("accepts any image content type", () => {
    expect(
      validateEvidenceFileDeclaration(
        makeDeclaration({
          fileName: "receipt.heic",
          contentType: "image/heic",
        }),
      ),
    ).toBeUndefined();
  });

  it("rejects a non-PDF, non-image content type", () => {
    expect(
      validateEvidenceFileDeclaration(
        makeDeclaration({ contentType: "application/zip" }),
      ),
    ).toBe("Evidence files must be PDF or image files.");
  });

  it("accepts a file exactly at the size cap", () => {
    expect(
      validateEvidenceFileDeclaration(
        makeDeclaration({ size: EVIDENCE_MAX_FILE_BYTES }),
      ),
    ).toBeUndefined();
  });

  it("rejects a file over the size cap", () => {
    expect(
      validateEvidenceFileDeclaration(
        makeDeclaration({ size: EVIDENCE_MAX_FILE_BYTES + 1 }),
      ),
    ).toBe("Evidence files must be 20MB or smaller.");
  });

  it("rejects an empty file", () => {
    expect(validateEvidenceFileDeclaration(makeDeclaration({ size: 0 }))).toBe(
      "Choose a PDF or image file.",
    );
  });
});

describe("evidence object keys", () => {
  it("prefixes the sanitized filename with a UUID", () => {
    const key = createEvidenceObjectKey("roof-invoice.pdf");

    expect(key).toMatch(UUID_PREFIX_PATTERN);
    expect(key.replace(UUID_PREFIX_PATTERN, "")).toBe("roof-invoice.pdf");
  });

  it("replaces characters outside the safe set", () => {
    const key = createEvidenceObjectKey("receipt (juillet) était/10%.pdf");

    expect(key.replace(UUID_PREFIX_PATTERN, "")).toBe(
      "receipt__juillet___tait_10_.pdf",
    );
  });

  it("generates a distinct key per upload of the same filename", () => {
    expect(createEvidenceObjectKey("receipt.pdf")).not.toBe(
      createEvidenceObjectKey("receipt.pdf"),
    );
  });

  it("recovers the original filename from a minted key", () => {
    expect(
      originalEvidenceFileName(createEvidenceObjectKey("roof-invoice.pdf")),
    ).toBe("roof-invoice.pdf");
  });
});

describe("storage URL and object key derivation", () => {
  const baseUrl = "https://evidence.example.com";
  const objectKey = "5f0f0c1a-9d3e-4b7a-8f6d-2f1e3a4b5c6d-roof-invoice.pdf";

  it("builds the worker URL for an object key", () => {
    expect(evidenceStorageUrl(baseUrl, objectKey)).toBe(
      `${baseUrl}/${objectKey}`,
    );
  });

  it("ignores a trailing slash on the base URL", () => {
    expect(evidenceStorageUrl(`${baseUrl}/`, objectKey)).toBe(
      `${baseUrl}/${objectKey}`,
    );
  });

  it("round-trips a storage URL back to its object key", () => {
    expect(
      evidenceObjectKeyFromStorageUrl(
        baseUrl,
        evidenceStorageUrl(baseUrl, objectKey),
      ),
    ).toBe(objectKey);
  });

  it("rejects a URL outside the worker prefix", () => {
    expect(
      evidenceObjectKeyFromStorageUrl(
        baseUrl,
        "https://elsewhere.example.com/receipt.pdf",
      ),
    ).toBeNull();
  });

  it("rejects a legacy local-disk URL", () => {
    expect(
      evidenceObjectKeyFromStorageUrl(baseUrl, "/uploads/evidence/receipt.pdf"),
    ).toBeNull();
  });

  it("rejects a worker URL with a nested path", () => {
    expect(
      evidenceObjectKeyFromStorageUrl(
        baseUrl,
        `${baseUrl}/nested/${objectKey}`,
      ),
    ).toBeNull();
  });

  it("rejects the bare worker base URL", () => {
    expect(evidenceObjectKeyFromStorageUrl(baseUrl, `${baseUrl}/`)).toBeNull();
  });
});

describe("uploaded object validation against the declaration", () => {
  const declaration = makeDeclaration({});

  it("accepts an object matching the declared type and size", () => {
    expect(
      validateUploadedEvidenceObject(
        { contentType: "application/pdf", size: 1024 },
        declaration,
      ),
    ).toBeUndefined();
  });

  it("rejects a missing object", () => {
    expect(validateUploadedEvidenceObject(null, declaration)).toBe(
      "The upload never reached storage, so nothing was attached. Try attaching the file again.",
    );
  });

  it("rejects an object whose content type differs from the declaration", () => {
    expect(
      validateUploadedEvidenceObject(
        { contentType: "image/png", size: 1024 },
        declaration,
      ),
    ).toBe(
      "The uploaded file does not match what was declared, so nothing was attached. Try attaching the file again.",
    );
  });

  it("rejects an object whose size differs from the declaration", () => {
    expect(
      validateUploadedEvidenceObject(
        { contentType: "application/pdf", size: 2048 },
        declaration,
      ),
    ).toBe(
      "The uploaded file does not match what was declared, so nothing was attached. Try attaching the file again.",
    );
  });
});
