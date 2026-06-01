import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { StorageService } from './storage.service';

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: StorageService,
          useValue: {
            createPresignedUpload: jest.fn().mockResolvedValue({
              uploadUrl: 'https://storage.example.com/presigned',
              fileKey: 'avatar/user-1/key-avatar.jpg',
              publicUrl: 'https://cdn.kritly.com/avatar/user-1/key-avatar.jpg',
              expiresAt: 1_700_000_000,
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  it('returns presigned upload envelope', async () => {
    const result = await service.createPresignedUpload({
      userId: 'user-1',
      purpose: 'avatar',
      contentType: 'image/jpeg',
      fileName: 'avatar.jpg',
    });

    expect(result.statusCode).toBe(201);
    expect(result.data.publicUrl).toContain('avatar/user-1');
  });

  it('propagates storage failures', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: StorageService,
          useValue: {
            createPresignedUpload: jest.fn().mockRejectedValue(new Error('storage unavailable')),
          },
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);

    await expect(
      service.createPresignedUpload({
        userId: 'user-1',
        purpose: 'avatar',
        contentType: 'image/jpeg',
        fileName: 'avatar.jpg',
      }),
    ).rejects.toThrow('storage unavailable');
  });
});
