import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, ClientGrpc, Transport } from '@nestjs/microservices';
import { join } from 'path';
import {
  ConsumeVerificationTokenRequest,
  VERIFICATION_SERVICE_NAME,
  ValidateVerificationTokenResponse,
  VerificationGrpcClient,
  VerificationGrpcErrorResponse,
  grpcClientCall,
  GRPC_PROTO_LOADER_OPTIONS,
  resolveGrpcMethod,
} from '@kritly/common';
import { getGrpcCredentials } from '../config/grpc.config';

@Injectable()
export class VerificationClientService implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'verification',
      protoPath: join(process.cwd(), 'libs/common/src/proto/verification.proto'),
      url: `${process.env.NOTIFICATION_SERVICE_HOST || 'localhost'}:${process.env.NOTIFICATION_SERVICE_GRPC_PORT || 3003}`,
      credentials: getGrpcCredentials(),
      loader: GRPC_PROTO_LOADER_OPTIONS,
    },
  })
  private client!: ClientGrpc;

  private verificationService!: VerificationGrpcClient;
  private consumeVerificationTokenRpc!: (
    request: ConsumeVerificationTokenRequest,
  ) => ReturnType<VerificationGrpcClient['consumeVerificationToken']>;

  onModuleInit(): void {
    this.verificationService = this.client.getService<VerificationGrpcClient>(VERIFICATION_SERVICE_NAME);
    const stub = this.verificationService as unknown as Record<string, unknown>;
    this.consumeVerificationTokenRpc = resolveGrpcMethod(
      stub,
      'consumeVerificationToken',
      'ConsumeVerificationToken',
    );
  }

  consumeVerificationToken(
    data: ConsumeVerificationTokenRequest,
  ): Promise<ValidateVerificationTokenResponse | VerificationGrpcErrorResponse> {
    return grpcClientCall(this.consumeVerificationTokenRpc(data));
  }
}
