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
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates presigned upload metadata', async () => {
    const result = await service.createPresignedUpload({
      userId: 'user-1',
      purpose: 'avatar',
      contentType: 'image/jpeg',
      fileName: 'avatar.jpg',
    });

    expect(result.uploadUrl).toBe('https://storage.example.com/presigned');
    expect(result.publicUrl).toContain('https://cdn.kritly.com/avatar/user-1/');
    expect(result.fileKey).toContain('avatar/user-1/');
    expect(result.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});
