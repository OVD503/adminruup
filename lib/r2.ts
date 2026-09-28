import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const requiredR2Variables = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
] as const;

export function assertR2Configured() {
  const missing = requiredR2Variables.filter((variable) => !process.env[variable]);

  if (missing.length > 0) {
    throw new Error(`Cloudflare R2 is not configured. Missing: ${missing.join(", ")}.`);
  }
}

let client: S3Client | null = null;

function getR2Client() {
  assertR2Configured();

  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
      }
    });
  }
  return client;
}

export async function uploadToR2(bytes: Buffer, key: string, contentType: string) {
  const r2 = getR2Client();
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: bytes,
      ContentType: contentType,
      ContentDisposition: "inline",
      CacheControl: "private, no-store"
    })
  );

  return `${process.env.R2_PUBLIC_URL!.replace(/\/+$/, "")}/${key}`;
}

export async function deleteFromR2(key: string) {
  const r2 = getR2Client();

  await r2.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key
    })
  );
}
