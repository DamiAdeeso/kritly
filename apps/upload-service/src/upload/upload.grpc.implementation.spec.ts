import { BadRequestException } from '@nestjs/common';
import { Status, wrapGrpcImplementation } from '@kritly/common';
import { UploadGrpcImplementation } from './upload.grpc.implementation';
import { UploadService } from './upload.service';

describe('UploadGrpcImplementation', () => {
  let implementation: UploadGrpcImplementation;
  let uploadService: jest.Mocked<Pick<UploadService, 'createPresignedUpload'>>;

  beforeEach(() => {
    uploadService = {
      createPresignedUpload: jest.fn(),
    };
    implementation = new UploadGrpcImplementation(uploadService as unknown as UploadService);
  });

  it('delegates createPresignedUpload to UploadService', async () => {
    uploadService.createPresignedUpload.mockResolvedValue({
      uploadUrl: 'https://storage.example.com/presigned',
      fileKey: 'avatar/user-1/key.jpg',
      publicUrl: 'https://cdn.example.com/avatar/user-1/key.jpg',
      expiresAt: 1_700_000_000,
    });

    const wrapped = wrapGrpcImplementation(implementation);
    const result = await wrapped.createPresignedUpload({
      userId: 'user-1',
      purpose: 'avatar',
      contentType: 'image/jpeg',
      fileName: 'avatar.jpg',
      fileSize: 102_400,
    });

    expect(uploadService.createPresignedUpload).toHaveBeenCalled();
    expect(result.uploadUrl).toContain('storage.example.com');
  });

  it('maps validation failures to INVALID_ARGUMENT', async () => {
    uploadService.createPresignedUpload.mockRejectedValue(
      new BadRequestException('fileSize must be a positive integer'),
    );
    const wrapped = wrapGrpcImplementation(implementation);

    await expect(
      wrapped.createPresignedUpload({
        userId: 'user-1',
        purpose: 'avatar',
        contentType: 'image/jpeg',
        fileName: 'avatar.jpg',
        fileSize: 0,
      }),
    ).rejects.toMatchObject({
      code: Status.INVALID_ARGUMENT,
      details: 'fileSize must be a positive integer',
    });
  });
});
