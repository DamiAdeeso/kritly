import { Injectable } from '@nestjs/common';
import {
  SendOtpRequest,
  SendOtpResponse,
  ValidateVerificationTokenRequest,
  ValidateVerificationTokenResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  fail,
  VerificationGrpcErrorResponse,
} from '@kritly/common';
import { getErrorMessage, getErrorStatus } from './grpc-error.util';
import { VerificationService } from './verification.service';

@Injectable()
export class VerificationGrpcService {
  constructor(private readonly verificationService: VerificationService) {}

  async sendOtp(data: SendOtpRequest): Promise<SendOtpResponse | VerificationGrpcErrorResponse> {
    try {
      return await this.verificationService.sendOtp(data);
    } catch (error: unknown) {
      return fail(getErrorMessage(error, 'Failed to send verification code'), getErrorStatus(error));
    }
  }

  async verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse | VerificationGrpcErrorResponse> {
    try {
      return await this.verificationService.verifyOtp(data);
    } catch (error: unknown) {
      return fail(getErrorMessage(error, 'Verification failed'), getErrorStatus(error));
    }
  }

  async validateVerificationToken(
    data: ValidateVerificationTokenRequest,
  ): Promise<ValidateVerificationTokenResponse | VerificationGrpcErrorResponse> {
    try {
      return await this.verificationService.validateVerificationToken(data);
    } catch (error: unknown) {
      return fail(
        getErrorMessage(error, 'Verification token validation failed'),
        getErrorStatus(error),
      );
    }
  }
}
