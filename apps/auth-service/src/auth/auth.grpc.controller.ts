import { Controller, UseGuards } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { GrpcMethod } from '@nestjs/microservices';
import { plainToInstance } from 'class-transformer';
import {
  ChangePasswordRequest,
  LoginDto,
  LoginRequest,
  LogoutRequest,
  OtpPurpose,
  RefreshTokenDto,
  RefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
  CheckEmailRequest,
  RequiresVerification,
  SocialLoginRequest,
  ValidateTokenRequest,
} from '@kritly/common';
import { GrpcVerificationGuard } from '../guards/grpc-verification.guard';
import { AuthService } from './auth.service';
import { AuthRequestMapper } from './auth-request.mapper';

@Controller()
export class AuthGrpcController {
  constructor(
    private readonly authService: AuthService,
    @InjectPinoLogger(AuthGrpcController.name) private readonly logger: PinoLogger,
  ) {}

  @GrpcMethod('AuthService', 'Register')
  @UseGuards(GrpcVerificationGuard)
  @RequiresVerification(OtpPurpose.EMAIL_VERIFY)
  register(data: RegisterRequest) {
    return this.authService.register(AuthRequestMapper.toRegisterDto(data));
  }

  @GrpcMethod('AuthService', 'Login')
  login(data: LoginRequest) {
    return this.authService.login(plainToInstance(LoginDto, data));
  }

  @GrpcMethod('AuthService', 'SocialLogin')
  socialLogin(data: SocialLoginRequest) {
    return this.authService.socialLogin(AuthRequestMapper.toSocialLoginDto(data));
  }

  @GrpcMethod('AuthService', 'RefreshToken')
  refreshToken(data: RefreshTokenRequest) {
    return this.authService.refreshToken(plainToInstance(RefreshTokenDto, data));
  }

  @GrpcMethod('AuthService', 'Logout')
  logout(data: LogoutRequest) {
    return this.authService.logout(data.refreshToken);
  }

  @GrpcMethod('AuthService', 'ValidateToken')
  validateToken(data: ValidateTokenRequest) {
    return this.authService.validateToken(data.accessToken);
  }

  @GrpcMethod('AuthService', 'ResetPassword')
  @UseGuards(GrpcVerificationGuard)
  @RequiresVerification(OtpPurpose.PASSWORD_RESET)
  resetPassword(data: ResetPasswordRequest) {
    return this.authService.resetPassword(data.email, data.newPassword);
  }

  @GrpcMethod('AuthService', 'ChangePassword')
  @UseGuards(GrpcVerificationGuard)
  @RequiresVerification(OtpPurpose.SENSITIVE_ACTION)
  changePassword(data: ChangePasswordRequest) {
    return this.authService.changePassword(data.userId, data.currentPassword, data.newPassword);
  }

  @GrpcMethod('AuthService', 'CheckEmailAvailability')
  checkEmailAvailability(data: CheckEmailRequest) {
    this.logger.info({ email: data.email }, 'CheckEmailAvailability rpc');
    return this.authService.checkEmailAvailability(data.email);
  }
}
