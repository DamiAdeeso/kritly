import type {
  AuthResponse,
  ChangePasswordRequest,
  CheckEmailRequest,
  EmailAvailabilityResponse,
  LoginRequest,
  LogoutRequest,
  LogoutResponse,
  RefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
  SocialLoginRequest,
  UpdateProfileResponse,
  ValidateTokenRequest,
  ValidateTokenResponse,
} from '../generated/auth';
import type { ServiceResponse } from '../dto/common.dto';

export type {
  AuthData,
  AuthResponse,
  ChangePasswordRequest,
  CheckEmailRequest,
  EmailAvailabilityData,
  EmailAvailabilityResponse,
  EmptyData,
  LoginRequest,
  LogoutRequest,
  LogoutResponse,
  RefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
  SocialLoginRequest,
  UpdateProfileResponse,
  ValidateTokenData,
  ValidateTokenRequest,
  ValidateTokenResponse,
} from '../generated/auth';

export const AUTH_SERVICE_NAME = 'AuthService';

/** Application-level gRPC error envelope (same shape as success responses) */
export type GrpcErrorResponse = ServiceResponse<null>;

/** Nest ClientGrpc.getService('AuthService') contract */
export interface AuthServiceClient {
  register(request: RegisterRequest): Promise<AuthResponse>;
  login(request: LoginRequest): Promise<AuthResponse>;
  socialLogin(request: SocialLoginRequest): Promise<AuthResponse>;
  refreshToken(request: RefreshTokenRequest): Promise<AuthResponse>;
  logout(request: LogoutRequest): Promise<LogoutResponse>;
  validateToken(request: ValidateTokenRequest): Promise<ValidateTokenResponse>;
  resetPassword(request: ResetPasswordRequest): Promise<UpdateProfileResponse>;
  changePassword(request: ChangePasswordRequest): Promise<UpdateProfileResponse>;
  checkEmailAvailability(request: CheckEmailRequest): Promise<EmailAvailabilityResponse>;
}

export type AuthGrpcClient = AuthServiceClient;

export type EmailAvailabilityServiceResponse = ServiceResponse<{ isAvailable: boolean }>;
