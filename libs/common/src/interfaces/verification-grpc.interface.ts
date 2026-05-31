import type {
  SendOtpRequest,
  SendOtpResponse,
  ValidateVerificationTokenRequest,
  ValidateVerificationTokenResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '../generated/verification';
import type { ServiceResponse } from '../dto/common.dto';

export type {
  SendOtpData,
  SendOtpRequest,
  SendOtpResponse,
  ValidateVerificationTokenData,
  ValidateVerificationTokenRequest,
  ValidateVerificationTokenResponse,
  VerifyOtpData,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '../generated/verification';

export const VERIFICATION_SERVICE_NAME = 'VerificationService';

export type VerificationGrpcErrorResponse = ServiceResponse<null>;

export interface VerificationServiceClient {
  sendOtp(request: SendOtpRequest): Promise<SendOtpResponse>;
  verifyOtp(request: VerifyOtpRequest): Promise<VerifyOtpResponse>;
  validateVerificationToken(
    request: ValidateVerificationTokenRequest,
  ): Promise<ValidateVerificationTokenResponse>;
}

export type VerificationGrpcClient = VerificationServiceClient;
