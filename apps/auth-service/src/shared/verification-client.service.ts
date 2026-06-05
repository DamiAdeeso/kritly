import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  GrpcClientConfigService,
  NiceGrpcConnection,
  ConsumeVerificationTokenRequest,
  HttpClientErrorResponse,
  ValidateVerificationTokenData,
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

  consumeVerificationToken(
    data: ConsumeVerificationTokenRequest,
  ): Promise<ValidateVerificationTokenData | HttpClientErrorResponse> {
    return this.connection.client.consumeVerificationToken(data);
  }
}
