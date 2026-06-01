/**
 * gRPC client wrapper for notification-service verification module.
 */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, ClientGrpc, Transport } from '@nestjs/microservices';
import { join } from 'path';
import {
  SendOtpRequest,
  SendOtpResponse,
  ValidateVerificationTokenRequest,
  ValidateVerificationTokenResponse,
  VERIFICATION_SERVICE_NAME,
  VerificationGrpcClient,
  VerificationGrpcErrorResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
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
  private sendOtpRpc!: (request: SendOtpRequest) => ReturnType<VerificationGrpcClient['sendOtp']>;
  private verifyOtpRpc!: (request: VerifyOtpRequest) => ReturnType<VerificationGrpcClient['verifyOtp']>;
  private validateVerificationTokenRpc!: (
    request: ValidateVerificationTokenRequest,
  ) => ReturnType<VerificationGrpcClient['validateVerificationToken']>;

  onModuleInit(): void {
    this.verificationService = this.client.getService<VerificationGrpcClient>(VERIFICATION_SERVICE_NAME);
    const stub = this.verificationService as unknown as Record<string, unknown>;
    this.sendOtpRpc = resolveGrpcMethod(stub, 'sendOtp', 'SendOtp');
    this.verifyOtpRpc = resolveGrpcMethod(stub, 'verifyOtp', 'VerifyOtp');
    this.validateVerificationTokenRpc = resolveGrpcMethod(
      stub,
      'validateVerificationToken',
      'ValidateVerificationToken',
    );
  }

  sendOtp(data: SendOtpRequest): Promise<SendOtpResponse | VerificationGrpcErrorResponse> {
    return grpcClientCall(this.sendOtpRpc(data));
  }

  verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse | VerificationGrpcErrorResponse> {
    return grpcClientCall(this.verifyOtpRpc(data));
  }

  validateVerificationToken(
    data: ValidateVerificationTokenRequest,
  ): Promise<ValidateVerificationTokenResponse | VerificationGrpcErrorResponse> {
    return grpcClientCall(this.validateVerificationTokenRpc(data));
  }
}
