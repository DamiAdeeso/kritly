/**
 * Thin HTTP routes for auth — edge layer only (no business logic).
 */
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthClientService } from '../services/auth-client.service';
import {
  LoginDto,
  RegisterDto,
  SocialLoginDto,
  RefreshTokenDto,
  LogoutDto,
  CheckEmailDto,
  AuthResponseDto,
  AuthWithProfileResponseDto,
  EmptyDataDto,
  LogoutResponseDto,
  EmptySuccessResponseDto,
  ResetPasswordConfirmDto,
  ChangePasswordDto,
  EmailAvailabilityResponseDto,
  HttpClientErrorResponse,
  ValidateTokenResponseDto,
  ServiceResponse,
  AuthData,
  AuthWithProfileData,
  EmailAvailabilityData,
  ValidateTokenData,
  mapGrpcToHttp,
  mapGrpcEmptyToHttp,
  mapAvailabilityToHttp,
  httpFail,
  ok,
  ApiEnvelopeErrors,
} from '@kritly/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtTokenService } from '../auth/jwt-token.service';
import { JwtUser } from '../auth/jwt-user.interface';

@ApiTags('Auth')
@ApiEnvelopeErrors(400, 401, 403, 429, 500)
@Controller('api/auth')
export class AuthGatewayController {
  constructor(
    private readonly authClient: AuthClientService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Requires x-verification-token from POST /api/verification/verify with email_verify purpose.',
  })
  @ApiHeader({
    name: 'x-verification-token',
    required: true,
    description: 'Short-lived token from POST /api/verification/verify',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: AuthResponseDto })
  async register(
    @Headers('x-verification-token') verificationToken: string | undefined,
    @Body() dto: RegisterDto,
  ): Promise<ServiceResponse<AuthData> | HttpClientErrorResponse> {
    return mapGrpcToHttp(
      await this.authClient.register({
        ...dto,
        verificationToken: verificationToken ?? '',
      }),
      'User registered successfully',
      201,
    );
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  async login(
    @Body() dto: LoginDto,
  ): Promise<ServiceResponse<AuthData> | HttpClientErrorResponse> {
    return mapGrpcToHttp(await this.authClient.login(dto), 'Login successful');
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login/session')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with email and password (includes profile)',
    description:
      'Same credentials as POST /api/auth/login. Returns tokens and profile in one response (single auth-service DB read).',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthWithProfileResponseDto })
  async loginSession(
    @Body() dto: LoginDto,
  ): Promise<ServiceResponse<AuthWithProfileData> | HttpClientErrorResponse> {
    return mapGrpcToHttp(await this.authClient.loginSession(dto), 'Login successful');
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('social-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with social provider token',
    description:
      'Send idToken for Google/Apple, accessToken for Facebook/Instagram, or authorizationCode for Apple web OAuth.',
  })
  @ApiBody({ type: SocialLoginDto })
  @ApiResponse({ status: 200, description: 'Social login successful', type: AuthResponseDto })
  async socialLogin(
    @Body() dto: SocialLoginDto,
  ): Promise<ServiceResponse<AuthData> | HttpClientErrorResponse> {
    return mapGrpcToHttp(await this.authClient.socialLogin(dto), 'Social login successful');
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully', type: AuthResponseDto })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
  ): Promise<ServiceResponse<AuthData> | HttpClientErrorResponse> {
    return mapGrpcToHttp(await this.authClient.refreshToken(dto), 'Token refreshed successfully');
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({ status: 200, description: 'Logout successful', type: LogoutResponseDto })
  async logout(
    @Body() dto: LogoutDto,
  ): Promise<ServiceResponse<EmptyDataDto> | HttpClientErrorResponse> {
    return mapGrpcEmptyToHttp(await this.authClient.logout(dto), 'Logout successful');
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('check-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check whether an email is available for registration' })
  @ApiBody({ type: CheckEmailDto })
  @ApiResponse({ status: 200, description: 'Email availability checked', type: EmailAvailabilityResponseDto })
  async checkEmail(
    @Body() dto: CheckEmailDto,
  ): Promise<ServiceResponse<EmailAvailabilityData> | HttpClientErrorResponse> {
    return mapAvailabilityToHttp(
      await this.authClient.checkEmailAvailability({ email: dto.email.trim().toLowerCase() }),
      'Email is available',
      'Email is already registered',
    );
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate access token (local JWT at gateway)',
    description: 'Does not call auth-service gRPC. Verifies the bearer JWT at the gateway edge.',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Token is valid', type: ValidateTokenResponseDto })
  async validateToken(
    @Headers('authorization') authHeader?: string,
  ): Promise<ServiceResponse<ValidateTokenData> | HttpClientErrorResponse> {
    const user = this.jwtTokenService.tryVerifyFromAuthHeader(authHeader);
    if (!user) {
      const token = this.jwtTokenService.extractBearerToken(authHeader);
      const message = token ? 'Invalid token' : 'No token provided';
      return httpFail(message, HttpStatus.UNAUTHORIZED);
    }

    return ok('Token validation successful', {
      isValid: true,
      userId: user.userId,
    });
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm password reset with OTP verification token',
    description:
      'Request an OTP via POST /api/verification/send (purpose: password_reset), verify via POST /api/verification/verify, then call this endpoint with the returned x-verification-token.',
  })
  @ApiHeader({ name: 'x-verification-token', required: true, description: 'Short-lived token from POST /api/verification/verify' })
  @ApiBody({ type: ResetPasswordConfirmDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully', type: EmptySuccessResponseDto })
  async confirmPasswordReset(
    @Headers('x-verification-token') verificationToken: string | undefined,
    @Body() dto: ResetPasswordConfirmDto,
  ): Promise<ServiceResponse<EmptyDataDto> | HttpClientErrorResponse> {
    return mapGrpcEmptyToHttp(
      await this.authClient.resetPassword({
        email: dto.email.trim().toLowerCase(),
        newPassword: dto.newPassword,
        verificationToken: verificationToken ?? '',
      }),
      'Password reset successfully',
    );
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password (requires OTP verification and current password)' })
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-verification-token', required: true, description: 'Short-lived token from POST /api/verification/verify' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully', type: EmptySuccessResponseDto })
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: JwtUser,
    @Headers('x-verification-token') verificationToken: string | undefined,
    @Body() dto: ChangePasswordDto,
  ): Promise<ServiceResponse<EmptyDataDto> | HttpClientErrorResponse> {
    return mapGrpcEmptyToHttp(
      await this.authClient.changePassword({
        userId: user.userId,
        currentPassword: dto.currentPassword,
        newPassword: dto.newPassword,
        verificationToken: verificationToken ?? '',
      }),
      'Password changed successfully',
    );
  }
}
