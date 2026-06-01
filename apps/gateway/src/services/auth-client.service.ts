/**
 * Generated gRPC client wrapper for auth-service.
 */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, Client, Transport } from '@nestjs/microservices';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { join } from 'path';
import {
  AUTH_SERVICE_NAME,
  AuthGrpcClient,
  AuthResponse,
  CheckEmailRequest,
  EmailAvailabilityResponse,
  grpcClientCall,
  GrpcErrorResponse,
  GRPC_PROTO_LOADER_OPTIONS,
  LoginRequest,
  LogoutRequest,
  LogoutResponse,
  RefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  resolveGrpcMethod,
  SocialLoginRequest,
  UpdateProfileResponse,
  ValidateTokenRequest,
  ValidateTokenResponse,
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
      loader: GRPC_PROTO_LOADER_OPTIONS,
    },
  })
  private client!: ClientGrpc;

  private authService!: AuthGrpcClient;
  private registerRpc!: (request: RegisterRequest) => ReturnType<AuthGrpcClient['register']>;
  private loginRpc!: (request: LoginRequest) => ReturnType<AuthGrpcClient['login']>;
  private socialLoginRpc!: (request: SocialLoginRequest) => ReturnType<AuthGrpcClient['socialLogin']>;
  private refreshTokenRpc!: (request: RefreshTokenRequest) => ReturnType<AuthGrpcClient['refreshToken']>;
  private logoutRpc!: (request: LogoutRequest) => ReturnType<AuthGrpcClient['logout']>;
  private validateTokenRpc!: (request: ValidateTokenRequest) => ReturnType<AuthGrpcClient['validateToken']>;
  private resetPasswordRpc!: (request: ResetPasswordRequest) => ReturnType<AuthGrpcClient['resetPassword']>;
  private changePasswordRpc!: (request: ChangePasswordRequest) => ReturnType<AuthGrpcClient['changePassword']>;
  private checkEmailAvailabilityRpc!: (
    request: CheckEmailRequest,
  ) => ReturnType<AuthGrpcClient['checkEmailAvailability']>;

  constructor(@InjectPinoLogger(AuthClientService.name) private readonly logger: PinoLogger) {}

  onModuleInit(): void {
    this.authService = this.client.getService<AuthGrpcClient>(AUTH_SERVICE_NAME);
    const stub = this.authService as unknown as Record<string, unknown>;
    this.registerRpc = resolveGrpcMethod(stub, 'register', 'Register');
    this.loginRpc = resolveGrpcMethod(stub, 'login', 'Login');
    this.socialLoginRpc = resolveGrpcMethod(stub, 'socialLogin', 'SocialLogin');
    this.refreshTokenRpc = resolveGrpcMethod(stub, 'refreshToken', 'RefreshToken');
    this.logoutRpc = resolveGrpcMethod(stub, 'logout', 'Logout');
    this.validateTokenRpc = resolveGrpcMethod(stub, 'validateToken', 'ValidateToken');
    this.resetPasswordRpc = resolveGrpcMethod(stub, 'resetPassword', 'ResetPassword');
    this.changePasswordRpc = resolveGrpcMethod(stub, 'changePassword', 'ChangePassword');
    this.checkEmailAvailabilityRpc = resolveGrpcMethod(
      stub,
      'checkEmailAvailability',
      'CheckEmailAvailability',
    );
  }

  register(data: RegisterRequest): Promise<AuthResponse | GrpcErrorResponse> {
    return grpcClientCall(this.registerRpc(data));
  }

  login(data: LoginRequest): Promise<AuthResponse | GrpcErrorResponse> {
    return grpcClientCall(this.loginRpc(data));
  }

  socialLogin(data: SocialLoginRequest): Promise<AuthResponse | GrpcErrorResponse> {
    return grpcClientCall(this.socialLoginRpc(data));
  }

  refreshToken(data: RefreshTokenRequest): Promise<AuthResponse | GrpcErrorResponse> {
    return grpcClientCall(this.refreshTokenRpc(data));
  }

  logout(data: LogoutRequest): Promise<LogoutResponse | GrpcErrorResponse> {
    return grpcClientCall(this.logoutRpc(data));
  }

  validateToken(data: ValidateTokenRequest): Promise<ValidateTokenResponse | GrpcErrorResponse> {
    return grpcClientCall(this.validateTokenRpc(data));
  }

  resetPassword(data: ResetPasswordRequest): Promise<UpdateProfileResponse | GrpcErrorResponse> {
    return grpcClientCall(this.resetPasswordRpc(data));
  }

  changePassword(data: ChangePasswordRequest): Promise<UpdateProfileResponse | GrpcErrorResponse> {
    return grpcClientCall(this.changePasswordRpc(data));
  }

  async checkEmailAvailability(
    data: CheckEmailRequest,
  ): Promise<EmailAvailabilityResponse | GrpcErrorResponse> {
    this.logger.info({ email: data.email }, 'checkEmailAvailability gRPC call');
    const response = await grpcClientCall(this.checkEmailAvailabilityRpc(data));
    this.logger.info({ email: data.email, response }, 'checkEmailAvailability gRPC response');
    return response;
  }
}
