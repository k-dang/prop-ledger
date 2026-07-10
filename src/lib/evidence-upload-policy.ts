export const EVIDENCE_MAX_FILE_BYTES = 20 * 1024 * 1024;

export type EvidenceFileDeclaration = {
  fileName: string;
  contentType: string;
  size: number;
};

export function validateEvidenceFileDeclaration(
  declaration: EvidenceFileDeclaration,
): string | undefined {
  if (!isSupportedEvidenceContentType(declaration.contentType)) {
    return "Evidence files must be PDF or image files.";
  }

  if (declaration.size <= 0) {
    return "Choose a PDF or image file.";
  }

  if (declaration.size > EVIDENCE_MAX_FILE_BYTES) {
    return "Evidence files must be 20MB or smaller.";
  }

  return undefined;
}

const UUID_KEY_PREFIX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i;

export function createEvidenceObjectKey(fileName: string) {
  return `${crypto.randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
}

/**
 * Recovers the filename a file was uploaded under from its UUID-prefixed
 * object key. The worker imports this to set Content-Disposition, keeping
 * both deployables on the key scheme createEvidenceObjectKey defines.
 */
export function originalEvidenceFileName(objectKey: string) {
  const segment = objectKey.split("/").pop() || objectKey;
  return segment.replace(UUID_KEY_PREFIX, "");
}

export function evidenceStorageUrl(workerBaseUrl: string, objectKey: string) {
  return `${normalizeBaseUrl(workerBaseUrl)}/${objectKey}`;
}

export function evidenceObjectKeyFromStorageUrl(
  workerBaseUrl: string,
  storageUrl: string,
) {
  const prefix = `${normalizeBaseUrl(workerBaseUrl)}/`;

  if (!storageUrl.startsWith(prefix)) {
    return null;
  }

  const objectKey = storageUrl.slice(prefix.length);

  if (objectKey === "" || objectKey.includes("/")) {
    return null;
  }

  return objectKey;
}

export type StoredEvidenceObject = {
  contentType: string | undefined;
  size: number;
};

export function validateUploadedEvidenceObject(
  object: StoredEvidenceObject | null,
  declaration: EvidenceFileDeclaration,
): string | undefined {
  if (object === null) {
    return "The upload never reached storage, so nothing was attached. Try attaching the file again.";
  }

  if (
    object.contentType !== declaration.contentType ||
    object.size !== declaration.size
  ) {
    return "The uploaded file does not match what was declared, so nothing was attached. Try attaching the file again.";
  }

  return undefined;
}

function normalizeBaseUrl(workerBaseUrl: string) {
  return workerBaseUrl.replace(/\/+$/, "");
}

function isSupportedEvidenceContentType(contentType: string) {
  return contentType === "application/pdf" || contentType.startsWith("image/");
}
