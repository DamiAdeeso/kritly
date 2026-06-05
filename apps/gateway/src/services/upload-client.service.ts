/**
 * nice-grpc client for upload-service.
 */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  CreatePresignedUploadRequest,
  GrpcClientConfigService,
  NiceGrpcConnection,
  HttpClientErrorResponse,
  PresignedUploadData,
  UploadServiceClient,
  UploadServiceDefinition,
} from '@kritly/common';

@Injectable()
export class UploadClientService implements OnModuleInit, OnModuleDestroy {
  private connection!: NiceGrpcConnection<UploadServiceClient>;

  constructor(private readonly grpcClientConfig: GrpcClientConfigService) {}

  onModuleInit(): void {
    this.connection = this.grpcClientConfig.connect(UploadServiceDefinition, 'upload');
  }

  onModuleDestroy(): void {
    this.connection.channel.close();
  }

  createPresignedUpload(
    data: CreatePresignedUploadRequest,
  ): Promise<PresignedUploadData | HttpClientErrorResponse> {
    return this.connection.client.createPresignedUpload(data);
  }
}
