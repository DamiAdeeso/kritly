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
    },
  })
  private client!: ClientGrpc;

  private verificationService!: VerificationGrpcClient;

  onModuleInit(): void {
    this.verificationService = this.client.getService<VerificationGrpcClient>(VERIFICATION_SERVICE_NAME);
  }

  sendOtp(data: SendOtpRequest): Promise<SendOtpResponse | VerificationGrpcErrorResponse> {
    return this.verificationService.sendOtp(data);
  }

  verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse | VerificationGrpcErrorResponse> {
    return this.verificationService.verifyOtp(data);
  }

  validateVerificationToken(
    data: ValidateVerificationTokenRequest,
  ): Promise<ValidateVerificationTokenResponse | VerificationGrpcErrorResponse> {
    return this.verificationService.validateVerificationToken(data);
  }
}
