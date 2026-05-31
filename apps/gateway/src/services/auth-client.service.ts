/**
 * Generated gRPC client wrapper for auth-service.
 */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, Client, Transport } from '@nestjs/microservices';
import { join } from 'path';
import {
  AUTH_SERVICE_NAME,
  AuthGrpcClient,
  AuthResponse,
  GrpcErrorResponse,
  LoginRequest,
  LogoutRequest,
  LogoutResponse,
  RefreshTokenRequest,
  RegisterRequest,
  SocialLoginRequest,
  UpdateProfileResponse,
  ValidateTokenRequest,
  ValidateTokenResponse,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from '@kritly/common';
import { getGrpcCredentials } from '../config/grpc.config';

@Injectable()
export class AuthClientService implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'auth',
      protoPath: join(process.cwd(), 'libs/common/src/proto/auth.proto'),
      url: `${process.env.AUTH_SERVICE_HOST || 'localhost'}:${process.env.AUTH_SERVICE_PORT || 3001}`,
      credentials: getGrpcCredentials(),
    },
  })
  private client!: ClientGrpc;

  private authService!: AuthGrpcClient;

  onModuleInit(): void {
    this.authService = this.client.getService<AuthGrpcClient>(AUTH_SERVICE_NAME);
  }

  register(data: RegisterRequest): Promise<AuthResponse | GrpcErrorResponse> {
    return this.authService.register(data);
  }

  login(data: LoginRequest): Promise<AuthResponse | GrpcErrorResponse> {
    return this.authService.login(data);
  }

  socialLogin(data: SocialLoginRequest): Promise<AuthResponse | GrpcErrorResponse> {
    return this.authService.socialLogin(data);
  }

  refreshToken(data: RefreshTokenRequest): Promise<AuthResponse | GrpcErrorResponse> {
    return this.authService.refreshToken(data);
  }

  logout(data: LogoutRequest): Promise<LogoutResponse | GrpcErrorResponse> {
    return this.authService.logout(data);
  }

  validateToken(data: ValidateTokenRequest): Promise<ValidateTokenResponse | GrpcErrorResponse> {
    return this.authService.validateToken(data);
  }

  resetPassword(data: ResetPasswordRequest): Promise<UpdateProfileResponse | GrpcErrorResponse> {
    return this.authService.resetPassword(data);
  }

  changePassword(data: ChangePasswordRequest): Promise<UpdateProfileResponse | GrpcErrorResponse> {
    return this.authService.changePassword(data);
  }
}
