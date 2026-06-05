/**
 * nice-grpc client for auth-service.
 */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  AuthData,
  AuthServiceClient,
  AuthServiceDefinition,
  ChangePasswordRequest,
  CheckEmailRequest,
  GrpcClientConfigService,
  NiceGrpcConnection,
  EmailAvailabilityData,
  HttpClientErrorResponse,
  LoginRequest,
  LoginSessionData,
  LogoutRequest,
  Empty,
  RefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
  SocialLoginRequest,
} from '@kritly/common';

@Injectable()
export class AuthClientService implements OnModuleInit, OnModuleDestroy {
  private connection!: NiceGrpcConnection<AuthServiceClient>;

  constructor(private readonly grpcClientConfig: GrpcClientConfigService) {}

  onModuleInit(): void {
    this.connection = this.grpcClientConfig.connect(AuthServiceDefinition, 'auth');
  }

  onModuleDestroy(): void {
    this.connection.channel.close();
  }

  register(data: RegisterRequest): Promise<AuthData | HttpClientErrorResponse> {
    return this.connection.client.register(data);
  }

  login(data: LoginRequest): Promise<AuthData | HttpClientErrorResponse> {
    return this.connection.client.login(data);
  }

  loginSession(data: LoginRequest): Promise<LoginSessionData | HttpClientErrorResponse> {
    return this.connection.client.loginSession(data);
  }

  socialLogin(data: SocialLoginRequest): Promise<AuthData | HttpClientErrorResponse> {
    return this.connection.client.socialLogin(data);
  }

  refreshToken(data: RefreshTokenRequest): Promise<AuthData | HttpClientErrorResponse> {
    return this.connection.client.refreshToken(data);
  }

  logout(data: LogoutRequest): Promise<Empty | HttpClientErrorResponse> {
    return this.connection.client.logout(data);
  }

  resetPassword(data: ResetPasswordRequest): Promise<Empty | HttpClientErrorResponse> {
    return this.connection.client.resetPassword(data);
  }

  changePassword(data: ChangePasswordRequest): Promise<Empty | HttpClientErrorResponse> {
    return this.connection.client.changePassword(data);
  }

  async checkEmailAvailability(
    data: CheckEmailRequest,
  ): Promise<EmailAvailabilityData | HttpClientErrorResponse> {
    return this.connection.client.checkEmailAvailability(data);
  }
}
