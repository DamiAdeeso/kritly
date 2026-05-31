import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { basename } from 'path';
import {
  UPLOAD_MAX_BYTES,
  UPLOAD_PURPOSE_MIME_TYPES,
  UPLOAD_PURPOSES,
  UploadPurpose,
} from '@kritly/common';

export interface PresignedUploadResult {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
  expiresAt: number;
}

@Injectable()
export class StorageService {
  private readonly s3: S3Client | null;

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('storage.accessKeyId');
    const secretAccessKey = this.configService.get<string>('storage.secretAccessKey');
    const endpoint = this.configService.get<string>('storage.endpoint');
    const region = this.configService.get<string>('storage.region') || 'auto';

    this.s3 =
      accessKeyId && secretAccessKey
        ? new S3Client({
            region,
            endpoint,
            credentials: { accessKeyId, secretAccessKey },
            forcePathStyle: Boolean(endpoint),
          })
        : null;
  }

  async createPresignedUpload(input: {
    userId: string;
    purpose: string;
    contentType: string;
    fileName: string;
  }): Promise<PresignedUploadResult> {
    this.assertStorageConfigured();
    this.validateUpload(input);

    const bucket = this.configService.get<string>('storage.bucket')!;
    const ttl = this.configService.get<number>('storage.presignedUrlTtlSeconds') ?? 900;
    const fileKey = this.buildObjectKey(input.userId, input.purpose, input.fileName);
    const expiresAt = Math.floor(Date.now() / 1000) + ttl;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: input.contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3!, command, { expiresIn: ttl });
    const publicUrl = this.buildPublicUrl(bucket, fileKey);

    return { uploadUrl, fileKey, publicUrl, expiresAt };
  }

  private assertStorageConfigured(): void {
    if (!this.s3) {
      throw new BadRequestException(
        'Upload storage is not configured. Set S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.',
      );
    }
  }

  private validateUpload(input: {
    userId: string;
    purpose: string;
    contentType: string;
    fileName: string;
  }): void {
    if (!input.userId?.trim()) {
      throw new BadRequestException('userId is required');
    }

    if (!UPLOAD_PURPOSES.includes(input.purpose as UploadPurpose)) {
      throw new BadRequestException(`Invalid upload purpose: ${input.purpose}`);
    }

    const purpose = input.purpose as UploadPurpose;
    const allowedMimeTypes = UPLOAD_PURPOSE_MIME_TYPES[purpose];

    if (!allowedMimeTypes.includes(input.contentType)) {
      throw new BadRequestException(
        `Content type ${input.contentType} is not allowed for ${purpose}`,
      );
    }

    const sanitizedName = this.sanitizeFileName(input.fileName);
    if (!sanitizedName) {
      throw new BadRequestException('Invalid file name');
    }

    const maxBytes = UPLOAD_MAX_BYTES[purpose];
    if (maxBytes <= 0) {
      throw new BadRequestException('Upload size limit misconfigured');
    }
  }

  buildObjectKey(userId: string, purpose: string, fileName: string): string {
    const sanitizedName = this.sanitizeFileName(fileName);
    return `${purpose}/${userId}/${randomUUID()}-${sanitizedName}`;
  }

  sanitizeFileName(fileName: string): string {
    const baseName = basename(fileName).replace(/[^\w.\-]+/g, '-').replace(/-+/g, '-');
    return baseName.replace(/^\.+/, '').slice(0, 120);
  }

  buildPublicUrl(bucket: string, fileKey: string): string {
    const publicUrlBase = this.configService.get<string>('storage.publicUrlBase');
    if (publicUrlBase) {
      return `${publicUrlBase.replace(/\/$/, '')}/${fileKey}`;
    }

    const endpoint = this.configService.get<string>('storage.endpoint');
    if (endpoint) {
      return `${endpoint.replace(/\/$/, '')}/${bucket}/${fileKey}`;
    }

    const region = this.configService.get<string>('storage.region') || 'us-east-1';
    return `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`;
  }
}
