import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT!,
  region: "eu-west-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET_PUBLIC = process.env.S3_BUCKET_PUBLIC ?? "repair-public-readonly";
const BUCKET_PRIVATE = process.env.S3_BUCKET_PRIVATE ?? "repair-private";

export async function getPresignedUploadUrl(key: string, isPublic: boolean, contentType: string) {
  const bucket = isPublic ? BUCKET_PUBLIC : BUCKET_PRIVATE;
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  const url = await getSignedUrl(s3, command, { expiresIn: 300 });
  return { url, bucket, key };
}

export async function getPublicUrl(storageKey: string): Promise<string> {
  const cdnBase = process.env.S3_PUBLIC_ENDPOINT ?? process.env.S3_ENDPOINT;
  return `${cdnBase}/${BUCKET_PUBLIC}/${storageKey}`;
}

export async function getPresignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET_PRIVATE, Key: key });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}
