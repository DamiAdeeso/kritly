import { lastValueFrom, Observable } from 'rxjs';
import { BadRequestException } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { GrpcServiceResponseExceptionFilter } from '@kritly/common';
import { UploadGrpcController } from './upload.grpc.controller';
import { UploadService } from './upload.service';

describe('UploadGrpcController', () => {
  let controller: UploadGrpcController;
  let uploadService: jest.Mocked<Pick<UploadService, 'createPresignedUpload'>>;
  const filter = new GrpcServiceResponseExceptionFilter();
  const rpcHost = { getType: () => 'rpc' } as ArgumentsHost;

  beforeEach(() => {
    uploadService = {
      createPresignedUpload: jest.fn(),
    };
    controller = new UploadGrpcController(uploadService as unknown as UploadService);
  });

  it('delegates createPresignedUpload to UploadService', async () => {
    uploadService.createPresignedUpload.mockResolvedValue({
      statusCode: 201,
      message: 'Presigned upload URL created',
      data: {
        uploadUrl: 'https://storage.example.com/presigned',
        fileKey: 'avatar/user-1/key.jpg',
        publicUrl: 'https://cdn.kritly.com/avatar/user-1/key.jpg',
        expiresAt: 1_700_000_000,
      },
    });

    const result = await controller.createPresignedUpload({
      userId: 'user-1',
      purpose: 'avatar',
      contentType: 'image/jpeg',
      fileName: 'avatar.jpg',
    });

    expect(result.statusCode).toBe(201);
  });

  it('maps validation failures to fail envelope through the global filter contract', async () => {
    const envelope = await lastValueFrom(
      filter.catch(new BadRequestException('Unsupported content type'), rpcHost) as Observable<unknown>,
    );

    expect(envelope).toEqual({
      statusCode: 400,
      message: 'Unsupported content type',
      data: null,
    });
  });
});
