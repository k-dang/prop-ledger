import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const evidenceUploadDirectory = path.join(
  process.cwd(),
  "public",
  "uploads",
  "evidence",
);
const evidenceUploadPathPrefix = "/uploads/evidence/";

export type StoredEvidenceFile = {
  storageUrl: string;
  absolutePath: string;
};

export function isSupportedEvidenceFile(file: File) {
  return file.type === "application/pdf" || file.type.startsWith("image/");
}

export async function saveEvidenceFile(
  file: File,
): Promise<StoredEvidenceFile> {
  const storedFileName = `${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const absolutePath = path.join(evidenceUploadDirectory, storedFileName);

  await mkdir(evidenceUploadDirectory, { recursive: true });
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  return {
    absolutePath,
    storageUrl: `${evidenceUploadPathPrefix}${storedFileName}`,
  };
}

export async function deleteEvidenceFile(storageUrl: string | null) {
  const absolutePath = getEvidenceFilePath(storageUrl);

  if (absolutePath === null) {
    return;
  }

  try {
    await unlink(absolutePath);
  } catch (error) {
    if (isMissingFileError(error)) {
      return;
    }

    throw error;
  }
}

export async function deleteEvidenceFileBestEffort(storageUrl: string | null) {
  try {
    await deleteEvidenceFile(storageUrl);
  } catch (error) {
    console.error("Evidence file cleanup failed", error);
  }
}

async function deleteAbsoluteEvidenceFile(absolutePath: string) {
  try {
    await unlink(absolutePath);
  } catch (error) {
    if (isMissingFileError(error)) {
      return;
    }

    throw error;
  }
}

export async function cleanupStoredEvidenceFile(file: StoredEvidenceFile) {
  await deleteAbsoluteEvidenceFile(file.absolutePath);
}

function getEvidenceFilePath(storageUrl: string | null) {
  if (storageUrl === null || !storageUrl.startsWith(evidenceUploadPathPrefix)) {
    return null;
  }

  const fileName = storageUrl.slice(evidenceUploadPathPrefix.length);
  const resolvedDirectory = path.resolve(evidenceUploadDirectory);
  const absolutePath = path.resolve(resolvedDirectory, fileName);

  if (!absolutePath.startsWith(`${resolvedDirectory}${path.sep}`)) {
    return null;
  }

  return absolutePath;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function isMissingFileError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
