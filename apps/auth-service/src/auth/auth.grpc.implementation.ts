import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  AuthServiceImplementation,
  ChangePasswordRequest,
  hashSubject,
  LoginRequest,
  LogoutRequest,
  OtpPurpose,
  RefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
  CheckEmailRequest,
  SocialLoginRequest,
} from '@kritly/common';
import { AuthService } from './auth.service';
import { VerificationEnforcementService } from '../shared/verification-enforcement.service';

@Injectable()
export class AuthGrpcImplementation implements AuthServiceImplementation {
  constructor(
    private readonly authService: AuthService,
    private readonly verificationEnforcement: VerificationEnforcementService,
    @InjectPinoLogger(AuthGrpcImplementation.name) private readonly logger: PinoLogger,
  ) {}

  register(request: RegisterRequest) {
    return this.withVerification(OtpPurpose.EMAIL_VERIFY, request, () =>
      this.authService.register(request),
    );
  }

  login(request: LoginRequest) {
    return this.authService.login(request);
  }

  loginSession(request: LoginRequest) {
    return this.authService.loginSession(request);
  }

  socialLogin(request: SocialLoginRequest) {
    return this.authService.socialLogin(request);
  }

  refreshToken(request: RefreshTokenRequest) {
    return this.authService.refreshToken(request);
  }

  logout(request: LogoutRequest) {
    return this.authService.logout(request.refreshToken);
  }

  resetPassword(request: ResetPasswordRequest) {
    return this.withVerification(OtpPurpose.PASSWORD_RESET, request, () =>
      this.authService.resetPassword(request.email, request.newPassword),
    );
  }

  changePassword(request: ChangePasswordRequest) {
    return this.withVerification(OtpPurpose.SENSITIVE_ACTION, request, () =>
      this.authService.changePassword(request.userId, request.currentPassword, request.newPassword),
    );
  }

  checkEmailAvailability(request: CheckEmailRequest) {
    this.logger.info({ subjectHash: hashSubject(request.email) }, 'CheckEmailAvailability rpc');
    return this.authService.checkEmailAvailability(request.email);
  }

  private async withVerification<T>(
    purpose: OtpPurpose,
    request: { verificationToken?: string; email?: string; userId?: string },
    handler: () => Promise<T>,
  ): Promise<T> {
    await this.verificationEnforcement.requireVerificationToken({
      verificationToken: request.verificationToken ?? '',
      purpose,
      email: request.email?.trim().toLowerCase(),
      userId: request.userId,
    });
    return handler();
  }
}
