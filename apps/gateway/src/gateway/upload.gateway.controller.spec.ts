import { Test, TestingModule } from '@nestjs/testing';
import { UploadPurpose } from '@kritly/common';
import { UploadGatewayController } from './upload.gateway.controller';
import { UploadClientService } from '../services/upload-client.service';
import { bypassJwtAuthGuard } from '../auth/test-auth.util';

describe('UploadGatewayController', () => {
  let controller: UploadGatewayController;
  let uploadClient: jest.Mocked<UploadClientService>;

  const user = {
    userId: 'user-1',
    email: 'user@example.com',
    role: 'USER',
  };

  beforeEach(async () => {
    uploadClient = {
      createPresignedUpload: jest.fn(),
      onModuleInit: jest.fn(),
    } as unknown as jest.Mocked<UploadClientService>;

    const module: TestingModule = await bypassJwtAuthGuard(
      Test.createTestingModule({
        controllers: [UploadGatewayController],
        providers: [{ provide: UploadClientService, useValue: uploadClient }],
      }),
    ).compile();

    controller = module.get<UploadGatewayController>(UploadGatewayController);
  });

  it('delegates presigned upload with authenticated user id', async () => {
    uploadClient.createPresignedUpload.mockResolvedValue({
      uploadUrl: 'https://s3.example.com/upload',
      fileKey: 'uploads/user-1/avatar.jpg',
      publicUrl: 'https://cdn.example.com/uploads/user-1/avatar.jpg',
      expiresAt: 1_700_000_000,
    });

    await controller.createPresignedUpload(user, {
      purpose: UploadPurpose.AVATAR,
      contentType: 'image/jpeg',
      fileName: 'avatar.jpg',
      fileSize: 1024,
    });

    expect(uploadClient.createPresignedUpload).toHaveBeenCalledWith({
      userId: 'user-1',
      purpose: UploadPurpose.AVATAR,
      contentType: 'image/jpeg',
      fileName: 'avatar.jpg',
      fileSize: 1024,
    });
  });
});
