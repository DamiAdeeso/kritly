jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://storage.example.com/presigned'),
}));

import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, unknown> = {
          'storage.bucket': 'kritly-uploads',
          'storage.region': 'auto',
          'storage.endpoint': 'https://s3.example.com',
          'storage.accessKeyId': 'test-key',
          'storage.secretAccessKey': 'test-secret',
          'storage.publicUrlBase': 'https://cdn.kritly.com',
          'storage.presignedUrlTtlSeconds': 900,
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    service = new StorageService(configService);
  });

  it('sanitizes file names', () => {
    expect(service.sanitizeFileName('../../evil name.jpg')).toBe('evil-name.jpg');
  });

  it('builds object keys with purpose and user id', () => {
    const key = service.buildObjectKey('user-1', 'avatar', 'photo.jpg');
    expect(key).toMatch(/^avatar\/user-1\/[0-9a-f-]+-photo\.jpg$/);
  });

  it('rejects unsupported mime types', async () => {
    await expect(
      service.createPresignedUpload({
        userId: 'user-1',
        purpose: 'avatar',
        contentType: 'application/pdf',
        fileName: 'doc.pdf',
        fileSize: 102_400,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates presigned upload metadata', async () => {
    const result = await service.createPresignedUpload({
      userId: 'user-1',
      purpose: 'avatar',
      contentType: 'image/jpeg',
      fileName: 'avatar.jpg',
      fileSize: 102_400,
    });

    expect(result.uploadUrl).toBe('https://storage.example.com/presigned');
    expect(result.publicUrl).toContain('https://cdn.kritly.com/avatar/user-1/');
    expect(result.fileKey).toContain('avatar/user-1/');
    expect(result.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('rejects files exceeding the purpose size limit', async () => {
    await expect(
      service.createPresignedUpload({
        userId: 'user-1',
        purpose: 'avatar',
        contentType: 'image/jpeg',
        fileName: 'avatar.jpg',
        fileSize: 6 * 1024 * 1024,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects non-positive file sizes', async () => {
    await expect(
      service.createPresignedUpload({
        userId: 'user-1',
        purpose: 'avatar',
        contentType: 'image/jpeg',
        fileName: 'avatar.jpg',
        fileSize: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts gRPC int64 file sizes sent as strings', async () => {
    const result = await service.createPresignedUpload({
      userId: 'user-1',
      purpose: 'avatar',
      contentType: 'image/jpeg',
      fileName: 'avatar.jpg',
      fileSize: '102400',
    });

    expect(result.uploadUrl).toBe('https://storage.example.com/presigned');
  });

  it('rejects invalid upload purpose', async () => {
    await expect(
      service.createPresignedUpload({
        userId: 'user-1',
        purpose: 'invalid' as 'avatar',
        contentType: 'image/jpeg',
        fileName: 'avatar.jpg',
        fileSize: 102_400,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
