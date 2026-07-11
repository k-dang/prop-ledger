import "server-only";

import { AwsClient, AwsV4Signer } from "aws4fetch";

import {
  type EvidenceFileDeclaration,
  evidenceObjectKeyFromStorageUrl,
  evidenceStorageUrl,
  type StoredEvidenceObject,
} from "@/lib/evidence-upload-policy";

const PRESIGNED_UPLOAD_EXPIRY_SECONDS = 600;

export async function createPresignedEvidenceUploadUrl(
  objectKey: string,
  declaration: EvidenceFileDeclaration,
) {
  const config = getEvidenceStorageConfig();
  const url = evidenceObjectApiUrl(config, objectKey);
  url.searchParams.set(
    "X-Amz-Expires",
    String(PRESIGNED_UPLOAD_EXPIRY_SECONDS),
  );

  const signer = new AwsV4Signer({
    method: "PUT",
    url: url.toString(),
    // aws4fetch treats content-type and content-length as unsignable unless
    // allHeaders is set; pinning them is the point — R2 rejects a PUT whose
    // bytes don't match the declaration.
    headers: {
      "Content-Type": declaration.contentType,
      "Content-Length": String(declaration.size),
    },
    allHeaders: true,
    signQuery: true,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: "s3",
    region: "auto",
  });

  const signed = await signer.sign();

  return signed.url.toString();
}

export async function headEvidenceObject(
  objectKey: string,
): Promise<StoredEvidenceObject | null> {
  const config = getEvidenceStorageConfig();
  const client = evidenceStorageClient(config);

  const response = await client.fetch(
    evidenceObjectApiUrl(config, objectKey).toString(),
    { method: "HEAD" },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Evidence object HEAD failed with status ${response.status}`,
    );
  }

  return {
    contentType: response.headers.get("content-type") ?? undefined,
    size: Number(response.headers.get("content-length")),
  };
}

export function evidenceObjectStorageUrl(objectKey: string) {
  return evidenceStorageUrl(
    getEvidenceStorageConfig().evidenceBaseUrl,
    objectKey,
  );
}

export async function deleteEvidenceObjectBestEffort(
  storageUrl: string | null,
) {
  if (storageUrl === null) {
    return;
  }

  try {
    const config = getEvidenceStorageConfig();
    const objectKey = evidenceObjectKeyFromStorageUrl(
      config.evidenceBaseUrl,
      storageUrl,
    );

    if (objectKey === null) {
      return;
    }

    const client = evidenceStorageClient(config);
    const response = await client.fetch(
      evidenceObjectApiUrl(config, objectKey).toString(),
      { method: "DELETE" },
    );

    if (!response.ok && response.status !== 404) {
      throw new Error(
        `Evidence object DELETE failed with status ${response.status}`,
      );
    }
  } catch (error) {
    console.error("Evidence object cleanup failed", error);
  }
}

type EvidenceStorageConfig = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  evidenceBaseUrl: string;
};

function getEvidenceStorageConfig(): EvidenceStorageConfig {
  const values = {
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: process.env.R2_BUCKET,
    EVIDENCE_BASE_URL: process.env.EVIDENCE_BASE_URL,
  };
  const missing = Object.entries(values)
    .filter(([, value]) => value === undefined || value === "")
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `Evidence storage is not configured: missing ${missing.join(", ")}. Set them in .env.local (see ADR 0002).`,
    );
  }

  return {
    accountId: values.R2_ACCOUNT_ID as string,
    accessKeyId: values.R2_ACCESS_KEY_ID as string,
    secretAccessKey: values.R2_SECRET_ACCESS_KEY as string,
    bucket: values.R2_BUCKET as string,
    evidenceBaseUrl: values.EVIDENCE_BASE_URL as string,
  };
}

function evidenceStorageClient(config: EvidenceStorageConfig) {
  return new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: "s3",
    region: "auto",
  });
}

function evidenceObjectApiUrl(
  config: EvidenceStorageConfig,
  objectKey: string,
) {
  return new URL(
    `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${objectKey}`,
  );
}
