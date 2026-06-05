/**
 * nice-grpc client for verification (notification-service).
 */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  GrpcClientConfigService,
  NiceGrpcConnection,
  HttpClientErrorResponse,
  SendOtpRequest,
  VerifyOtpRequest,
  SendOtpData,
  VerifyOtpData,
  VerificationServiceClient,
  VerificationServiceDefinition,
} from '@kritly/common';

@Injectable()
export class VerificationClientService implements OnModuleInit, OnModuleDestroy {
  private connection!: NiceGrpcConnection<VerificationServiceClient>;

  constructor(private readonly grpcClientConfig: GrpcClientConfigService) {}

  onModuleInit(): void {
    this.connection = this.grpcClientConfig.connect(VerificationServiceDefinition, 'notification');
  }

  onModuleDestroy(): void {
    this.connection.channel.close();
  }

  sendOtp(data: SendOtpRequest): Promise<SendOtpData | HttpClientErrorResponse> {
    return this.connection.client.sendOtp(data);
  }

  verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpData | HttpClientErrorResponse> {
    return this.connection.client.verifyOtp(data);
  }
}
