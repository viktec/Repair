import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Client interno (server → MinIO diretto sulla rete Docker)
const s3Internal = new S3Client({
  endpoint: process.env.S3_ENDPOINT!,
  region: "eu-west-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
});

// Client pubblico (genera presigned URL con hostname raggiungibile dal browser)
const s3Public = new S3Client({
  endpoint: process.env.S3_PUBLIC_ENDPOINT!,
  region: "eu-west-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET_PUBLIC = process.env.S3_BUCKET_PUBLIC ?? "repair-public-readonly";
const BUCKET_PRIVATE = process.env.S3_BUCKET_PRIVATE ?? "repair-private";

export async function getPresignedUploadUrl(
  key: string,
  isPublic: boolean,
  contentType: string,
) {
  const bucket = isPublic ? BUCKET_PUBLIC : BUCKET_PRIVATE;
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  // URL firmata con endpoint pubblico → il browser può raggiungerla
  const url = await getSignedUrl(s3Public, command, { expiresIn: 300 });
  return { url, bucket, key };
}

export function getPublicUrl(storageKey: string): string {
  const cdnBase = (process.env.S3_PUBLIC_ENDPOINT ?? "").replace(/\/$/, "");
  return `${cdnBase}/${BUCKET_PUBLIC}/${storageKey}`;
}

export async function getPresignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET_PRIVATE, Key: key });
  return getSignedUrl(s3Public, command, { expiresIn: 86400 });
}

export async function deleteObjects(
  items: { key: string; isPublic: boolean }[],
): Promise<void> {
  if (items.length === 0) return;

  const publicKeys = items.filter((i) => i.isPublic).map((i) => i.key);
  const privateKeys = items.filter((i) => !i.isPublic).map((i) => i.key);

  const deleteFromBucket = async (bucket: string, keys: string[]) => {
    if (keys.length === 0) return;
    const command = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: keys.map((k) => ({ Key: k })) },
    });
    await s3Internal.send(command);
  };

  await Promise.all([
    deleteFromBucket(BUCKET_PUBLIC, publicKeys),
    deleteFromBucket(BUCKET_PRIVATE, privateKeys),
  ]);
}

export async function getObjectBuffer(key: string, isPublic: boolean): Promise<Buffer | null> {
  const bucket = isPublic ? BUCKET_PUBLIC : BUCKET_PRIVATE;
  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3Internal.send(command);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  } catch {
    return null;
  }
}
