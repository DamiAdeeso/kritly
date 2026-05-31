/**
 * Thin HTTP routes for auth — edge layer only (no business logic).
 *
 * New endpoint template:
 * @Post('auth/foo')
 * @Throttle({ default: { limit: N, ttl: 60_000 } }) // if needed
 * async foo(@Body(ValidationPipe) dto: FooDto) {
 *   return this.authClient.foo(dto);
 * }
 */
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Headers,
  Req,
  UseGuards,
  ValidationPipe,
  UnauthorizedException,
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
import { VerificationClientService } from '../services/verification-client.service';
import { VerificationGuard } from '../guards/verification.guard';
import { PasswordResetGuard } from '../guards/password-reset.guard';
import {
  LoginDto,
  RegisterDto,
  SocialLoginDto,
  RefreshTokenDto,
  LogoutDto,
  AuthResponse,
  AuthResponseDto,
  UpdateProfileResponseDto,
  PasswordResetRequestDto,
  ResetPasswordConfirmDto,
  ChangePasswordDto,
  GrpcErrorResponse,
  LogoutResponse,
  UpdateProfileResponse,
  ValidateTokenResponse,
  RequiresVerification,
  OtpPurpose,
  OtpChannel,
  SendOtpResponse,
  VerificationGrpcErrorResponse,
} from '@kritly/common';

interface VerifiedRequest {
  verifiedUser?: { userId: string; email: string };
  passwordResetEmail?: string;
}

@ApiTags('Auth')
@Controller('api/auth')
export class AuthGatewayController {
  constructor(
    private readonly authClient: AuthClientService,
    private readonly verificationClient: VerificationClientService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body(ValidationPipe) dto: RegisterDto): Promise<AuthResponse | GrpcErrorResponse> {
    return this.authClient.register(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body(ValidationPipe) dto: LoginDto): Promise<AuthResponse | GrpcErrorResponse> {
    return this.authClient.login(dto);
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async socialLogin(@Body(ValidationPipe) dto: SocialLoginDto): Promise<AuthResponse | GrpcErrorResponse> {
    return this.authClient.socialLogin(dto);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async refreshToken(@Body(ValidationPipe) dto: RefreshTokenDto): Promise<AuthResponse | GrpcErrorResponse> {
    return this.authClient.refreshToken(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Body(ValidationPipe) dto: LogoutDto): Promise<LogoutResponse | GrpcErrorResponse> {
    return this.authClient.logout(dto);
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validate access token' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async validateToken(@Headers('authorization') authHeader?: string): Promise<ValidateTokenResponse | GrpcErrorResponse> {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    return this.authClient.validateToken({ accessToken: token });
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset OTP' })
  @ApiBody({ type: PasswordResetRequestDto })
  @ApiResponse({ status: 200, description: 'If the account exists, a verification code was sent' })
  async requestPasswordReset(
    @Body(ValidationPipe) dto: PasswordResetRequestDto,
  ): Promise<SendOtpResponse | VerificationGrpcErrorResponse | GrpcErrorResponse> {
    const email = dto.email.trim().toLowerCase();

    return this.verificationClient.sendOtp({
      subject: email,
      purpose: OtpPurpose.PASSWORD_RESET,
      channel: OtpChannel.EMAIL,
    });
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PasswordResetGuard)
  @ApiOperation({ summary: 'Confirm password reset with OTP verification token' })
  @ApiHeader({ name: 'x-verification-token', required: true, description: 'Short-lived token from POST /api/verification/verify' })
  @ApiBody({ type: ResetPasswordConfirmDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully', type: UpdateProfileResponseDto })
  @ApiResponse({ status: 403, description: 'Verification token required or invalid' })
  async confirmPasswordReset(
    @Req() request: VerifiedRequest,
    @Body(ValidationPipe) dto: ResetPasswordConfirmDto,
  ): Promise<UpdateProfileResponse | GrpcErrorResponse> {
    const email = request.passwordResetEmail ?? dto.email.trim().toLowerCase();

    return this.authClient.resetPassword({
      email,
      newPassword: dto.newPassword,
    });
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(VerificationGuard)
  @RequiresVerification(OtpPurpose.SENSITIVE_ACTION)
  @ApiOperation({ summary: 'Change password (requires OTP verification and current password)' })
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-verification-token', required: true, description: 'Short-lived token from POST /api/verification/verify' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully', type: UpdateProfileResponseDto })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  @ApiResponse({ status: 403, description: 'Verification token required or invalid' })
  async changePassword(
    @Req() request: VerifiedRequest,
    @Body(ValidationPipe) dto: ChangePasswordDto,
  ): Promise<UpdateProfileResponse | GrpcErrorResponse> {
    if (!request.verifiedUser?.userId) {
      throw new UnauthorizedException('Invalid token');
    }

    return this.authClient.changePassword({
      userId: request.verifiedUser.userId,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });
  }
}
