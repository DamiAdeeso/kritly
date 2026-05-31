import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  bucket: process.env.S3_BUCKET || 'kritly-uploads',
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT,
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  publicUrlBase: process.env.S3_PUBLIC_URL_BASE,
  presignedUrlTtlSeconds: Number(process.env.UPLOAD_PRESIGNED_URL_TTL || 900),
}));
