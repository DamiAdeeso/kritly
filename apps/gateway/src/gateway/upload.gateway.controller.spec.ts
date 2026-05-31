import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { UploadPurpose } from '@kritly/common';
import { UploadGatewayController } from './upload.gateway.controller';
import { AuthClientService } from '../services/auth-client.service';
import { UploadClientService } from '../services/upload-client.service';

describe('UploadGatewayController', () => {
  let controller: UploadGatewayController;
  let authClient: jest.Mocked<AuthClientService>;
  let uploadClient: jest.Mocked<UploadClientService>;

  beforeEach(async () => {
    authClient = {
      validateToken: jest.fn(),
    } as unknown as jest.Mocked<AuthClientService>;

    uploadClient = {
      createPresignedUpload: jest.fn(),
    } as unknown as jest.Mocked<UploadClientService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadGatewayController],
      providers: [
        { provide: AuthClientService, useValue: authClient },
        { provide: UploadClientService, useValue: uploadClient },
      ],
    }).compile();

    controller = module.get<UploadGatewayController>(UploadGatewayController);
  });

  it('rejects requests without a bearer token', async () => {
    await expect(
      controller.createPresignedUpload(undefined, {
        purpose: UploadPurpose.AVATAR,
        contentType: 'image/jpeg',
        fileName: 'avatar.jpg',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('creates a presigned upload for authenticated users', async () => {
    authClient.validateToken.mockResolvedValue({
      statusCode: 200,
      message: 'Token validation successful',
      data: { isValid: true, userId: 'user-1', email: 'user@example.com' },
    });
    uploadClient.createPresignedUpload.mockResolvedValue({
      statusCode: 201,
      message: 'Presigned upload URL created',
      data: {
        uploadUrl: 'https://storage.example.com/presigned',
        fileKey: 'avatar/user-1/key-avatar.jpg',
        publicUrl: 'https://cdn.kritly.com/avatar/user-1/key-avatar.jpg',
        expiresAt: 1_700_000_000,
      },
    });

    const result = await controller.createPresignedUpload('Bearer token', {
      purpose: UploadPurpose.AVATAR,
      contentType: 'image/jpeg',
      fileName: 'avatar.jpg',
    });

    expect(uploadClient.createPresignedUpload).toHaveBeenCalledWith({
      userId: 'user-1',
      purpose: UploadPurpose.AVATAR,
      contentType: 'image/jpeg',
      fileName: 'avatar.jpg',
    });
    expect(result.statusCode).toBe(201);
  });
});
