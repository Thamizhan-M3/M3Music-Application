import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  GetObjectCommand
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import path from "path";

dotenv.config();

// ✅ ONLY REQUIRED ENV VARS NOW
const AWS_REGION = process.env.AWS_REGION;
const S3_BUCKET = process.env.S3_BUCKET_NAME;
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL;

// ✅ Validation
if (!AWS_REGION || !S3_BUCKET) {
  console.warn(
    "Missing AWS config. Check AWS_REGION and S3_BUCKET_NAME."
  );
}

/*
✅ IMPORTANT:
- NO credentials here
- Uses IAM Role automatically (EC2 / ECS / Lambda)
- Automatically routes via VPC endpoint if configured
*/
const s3 = new S3Client({
  region: AWS_REGION
});

// ✅ Multer (unchanged)
export const upload = multer({ storage: multer.memoryStorage() });

// ✅ Upload file buffer
export const uploadFileBuffer = async (
  buffer,
  originalName = "file",
  folder = "audio"
) => {
  const ext = path.extname(originalName) || "";
  const key = `${folder}/${uuidv4()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: getContentType(ext)
  });

  await s3.send(command);

  const url = S3_PUBLIC_URL
    ? `${S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`
    : key; // fallback (private mode)

  return { key, url };
};

// ✅ Upload artwork
export const uploadFromBuffer = async (
  buffer,
  originalName = "artwork.jpg",
  folder = "artwork"
) => {
  return await uploadFileBuffer(buffer, originalName, folder);
};

// ✅ List files
export const getCloudinaryFiles = async (folder = "audio") => {
  const prefix = folder.replace(/\/$/, "") + "/";
  const files = [];
  let ContinuationToken;

  do {
    const cmd = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: prefix,
      ContinuationToken
    });

    const res = await s3.send(cmd);

    if (res.Contents) {
      for (const obj of res.Contents) {
        const key = obj.Key;

        files.push({
          public_id: key,
          secure_url: S3_PUBLIC_URL
            ? `${S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`
            : key,
          bytes: obj.Size || 0,
          format: path.extname(key).replace(".", ""),
          created_at: obj.LastModified
        });
      }
    }

    ContinuationToken = res.IsTruncated
      ? res.NextContinuationToken
      : undefined;

  } while (ContinuationToken);

  return files;
};

// ✅ Delete file
export const deleteCloudinaryFile = async (publicId) => {
  const cmd = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: publicId
  });

  return await s3.send(cmd);
};

// ✅ Signed URL (BEST for private buckets)
export const getSignedUrlFor = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key
  });

  return await getSignedUrl(s3, command, { expiresIn });
};

// ✅ MIME helper
const getContentType = (ext) => {
  switch (ext.toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".mp4":
      return "video/mp4";
    default:
      return "application/octet-stream";
  }
};

export { s3 };