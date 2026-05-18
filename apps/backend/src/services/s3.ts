import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET || 'fitcheck-media';
const CDN_URL = process.env.CDN_URL || `https://${BUCKET}.s3.amazonaws.com`;

export class S3Service {
  static async generatePresignedUploadUrl(
    userId: string,
    contentType: string,
    folder: 'wardrobe' | 'avatar' | 'outfit-logs' = 'wardrobe'
  ): Promise<{ uploadUrl: string; publicUrl: string; s3Key: string }> {
    const ext = contentType.split('/')[1] || 'jpg';
    const s3Key = `${folder}/${userId}/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      ContentType: contentType,
      Metadata: { userId },
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const publicUrl = `${CDN_URL}/${s3Key}`;

    return { uploadUrl, publicUrl, s3Key };
  }

  static async deleteObject(s3Key: string): Promise<void> {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: s3Key }));
  }

  static getPublicUrl(s3Key: string): string {
    return `${CDN_URL}/${s3Key}`;
  }
}
