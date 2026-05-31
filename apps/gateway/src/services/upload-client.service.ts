/**
 * Generated gRPC client wrapper for upload-service.
 */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, Client, Transport } from '@nestjs/microservices';
import { join } from 'path';
import {
  CreatePresignedUploadRequest,
  CreatePresignedUploadResponse,
  UPLOAD_SERVICE_NAME,
  UploadGrpcClient,
  UploadGrpcErrorResponse,
} from '@kritly/common';
import { getGrpcCredentials } from '../config/grpc.config';

@Injectable()
export class UploadClientService implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'upload',
      protoPath: join(process.cwd(), 'libs/common/src/proto/upload.proto'),
      url: `${process.env.UPLOAD_SERVICE_HOST || 'localhost'}:${process.env.UPLOAD_SERVICE_PORT || 3002}`,
      credentials: getGrpcCredentials(),
    },
  })
  private client!: ClientGrpc;

  private uploadService!: UploadGrpcClient;

  onModuleInit(): void {
    this.uploadService = this.client.getService<UploadGrpcClient>(UPLOAD_SERVICE_NAME);
  }

  createPresignedUpload(
    data: CreatePresignedUploadRequest,
  ): Promise<CreatePresignedUploadResponse | UploadGrpcErrorResponse> {
    return this.uploadService.createPresignedUpload(data);
  }
}
