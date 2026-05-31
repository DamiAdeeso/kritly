import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { plainToInstance } from 'class-transformer';
import {
  ChangePasswordRequest,
  LoginDto,
  LoginRequest,
  LogoutRequest,
  RefreshTokenDto,
  RefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
  SocialLoginRequest,
  ValidateTokenRequest,
} from '@kritly/common';
import { AuthService } from './auth.service';
import { AuthRequestMapper } from './auth-request.mapper';
import { toGrpcResponse } from '../shared/grpc-error.util';

@Controller()
export class AuthGrpcController {
  constructor(private readonly authService: AuthService) {}

  @GrpcMethod('AuthService', 'Register')
  register(data: RegisterRequest) {
    return toGrpcResponse(
      () => this.authService.register(AuthRequestMapper.toRegisterDto(data)),
      'Registration failed',
    );
  }

  @GrpcMethod('AuthService', 'Login')
  login(data: LoginRequest) {
    return toGrpcResponse(
      () => this.authService.login(plainToInstance(LoginDto, data)),
      'Login failed',
      401,
    );
  }

  @GrpcMethod('AuthService', 'SocialLogin')
  socialLogin(data: SocialLoginRequest) {
    return toGrpcResponse(
      () => this.authService.socialLogin(AuthRequestMapper.toSocialLoginDto(data)),
      'Social login failed',
      401,
    );
  }

  @GrpcMethod('AuthService', 'RefreshToken')
  refreshToken(data: RefreshTokenRequest) {
    return toGrpcResponse(
      () => this.authService.refreshToken(plainToInstance(RefreshTokenDto, data)),
      'Token refresh failed',
      401,
    );
  }

  @GrpcMethod('AuthService', 'Logout')
  logout(data: LogoutRequest) {
    return toGrpcResponse(
      () => this.authService.logout(data.refreshToken),
      'Logout failed',
    );
  }

  @GrpcMethod('AuthService', 'ValidateToken')
  validateToken(data: ValidateTokenRequest) {
    return toGrpcResponse(
      () => this.authService.validateToken(data.accessToken),
      'Token validation failed',
      401,
    );
  }

  @GrpcMethod('AuthService', 'ResetPassword')
  resetPassword(data: ResetPasswordRequest) {
    return toGrpcResponse(
      () => this.authService.resetPassword(data.email, data.newPassword),
      'Password reset failed',
    );
  }

  @GrpcMethod('AuthService', 'ChangePassword')
  changePassword(data: ChangePasswordRequest) {
    return toGrpcResponse(
      () =>
        this.authService.changePassword(data.userId, data.currentPassword, data.newPassword),
      'Password change failed',
    );
  }
}
